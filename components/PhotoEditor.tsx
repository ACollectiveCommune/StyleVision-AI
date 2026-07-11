import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, StyleOption, Gender, AppMode } from '../types';
import { Icons, HAIR_STYLES_MALE, HAIR_STYLES_FEMALE, BEARD_STYLES, HAIR_COLORS, BEARD_COLORS, StyleIllustration } from '../constants';
import { generateStylePreview } from '../services/geminiService';
import { auth, saveGeneration, uploadImageToStorage, toggleFavorite } from '../services/firebase';
import { consumeCredit } from '../services/billingService';
import { purchasePremium } from '../services/iapService';
import { PaywallView } from './PaywallView';
import { triggerAppStoreReview } from '../services/rateService';
import { downloadOrShareImage } from '../services/shareService';

const compressImageBase64 = (base64Str: string, maxDim: number = 360, quality: number = 0.5): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
};

interface PhotoEditorProps {
  uid: string;
  appState: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onTriggerAd?: () => void;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ uid, appState, onUpdateState, onTriggerAd }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<'hair' | 'beard' | 'prompt'>('hair');

  // Firestore sync state
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Billing States
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // Ref to track the latest request ID to prevent race conditions during retries
  const latestRequestId = useRef(0);

  // Auto-open controls and reset sync IDs when a new image is loaded or mode changes
  useEffect(() => {
    setIsControlsVisible(true);
    setCurrentDocId(null);
    setIsFavorited(false);
  }, [appState.originalImage, appState.currentMode]);

  // Manual Generation Handler
  const handleGenerate = useCallback(async () => {
    if (!appState.originalImage || appState.isProcessing) return;
    
    const user = uid ? { uid } : null;

    // Enforce credits check
    if (appState.credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }
    
    const requestId = ++latestRequestId.current;
    onUpdateState({ isProcessing: true });
    setIsControlsVisible(false); // Auto-hide controls when generating
    setErrorMsg(null);
    setCurrentDocId(null);
    setIsFavorited(false);
    
    try {
      const newImage = await generateStylePreview(appState);
      
      if (requestId === latestRequestId.current) {
        // Consume credit in Firestore/locally
        let nextCredits = appState.credits;
        if (user) {
          try {
            nextCredits = await consumeCredit(user.uid);
          } catch (countErr) {
            console.error("Failed to consume credit:", countErr);
            nextCredits = Math.max(0, appState.credits - 1);
          }
        } else {
          nextCredits = Math.max(0, appState.credits - 1);
        }

        onUpdateState({ 
          currentImage: newImage, 
          isProcessing: false, 
          credits: nextCredits
        });
        setIsControlsVisible(true); // Restore controls on success

        // Trigger native App Store Review dialog on 2nd successful generation (high-satisfaction moment)
        try {
          const hasPromptedReview = localStorage.getItem("has_prompted_review");
          if (!hasPromptedReview && appState.generationCount >= 1) {
            localStorage.setItem("has_prompted_review", "true");
            triggerAppStoreReview();
          }
        } catch (e) {
          console.warn("Storage check failed for rate prompt:", e);
        }
        
        // Auto-save styling prediction to Firestore
        if (user && appState.originalImage) {
          setIsSaving(true);
          try {
            // 1. Upload assets to Storage
            let originalUrl = '';
            let generatedUrl = '';
            try {
              originalUrl = await uploadImageToStorage(user.uid, appState.originalImage, 'original');
              generatedUrl = await uploadImageToStorage(user.uid, newImage, 'generated');
            } catch (storageErr) {
              console.warn("Storage upload failed (possibly due to Spark/Blaze plan restrictions), falling back to compressed base64 inline strings in Firestore:", storageErr);
              originalUrl = await compressImageBase64(appState.originalImage, 360, 0.4);
              generatedUrl = await compressImageBase64(newImage, 360, 0.4);
            }
            
            // 2. Record details in Firestore
            const docId = await saveGeneration(user.uid, {
              originalImageUrl: originalUrl,
              generatedImageUrl: generatedUrl,
              hairStyle: appState.selectedHairStyle?.id || 'original',
              hairColor: appState.selectedHairColor?.id || 'original',
              beardStyle: appState.gender === Gender.MALE ? (appState.selectedBeardStyle?.id || 'original') : 'none',
              beardColor: appState.gender === Gender.MALE ? (appState.selectedBeardColor?.id || 'original') : 'none',
              gender: appState.gender,
              isFavorite: false
            });
            
            setCurrentDocId(docId);
          } catch (dbErr) {
            console.error("Failed to sync to database:", dbErr);
            // Non-blocking error, user can still see output
          } finally {
            setIsSaving(false);
          }
        }
      }
    } catch (err) {
      if (requestId === latestRequestId.current) {
        console.error(err);
        setErrorMsg("Could not apply style. Please try again.");
        onUpdateState({ isProcessing: false });
        setIsControlsVisible(true); // Restore controls on error
      }
    }
  }, [appState, onUpdateState]);

  // Toggle favorite helper
  const handleToggleFavorite = async () => {
    const user = uid ? { uid } : null;
    if (!user || !currentDocId || isSaving) return;
    try {
      const nextState = !isFavorited;
      await toggleFavorite(user.uid, currentDocId, nextState);
      setIsFavorited(nextState);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      setErrorMsg("Failed to save favorite style.");
    }
  };

  // Style Selection Handler - Updates state only, does not trigger API
  const handleSelectStyle = (option: StyleOption) => {
    if (option.category === 'hair') {
      if (option.type === 'style') onUpdateState({ selectedHairStyle: option });
      else onUpdateState({ selectedHairColor: option });
    } else {
      if (option.type === 'style') onUpdateState({ selectedBeardStyle: option });
      else onUpdateState({ selectedBeardColor: option });
    }
  };

  const downloadImage = async () => {
    if (appState.currentImage) {
      await downloadOrShareImage(appState.currentImage);
    }
  };

  const setGender = (targetGender: Gender) => {
    if (appState.gender === targetGender) return;
    const hairStylesList = targetGender === Gender.MALE ? HAIR_STYLES_MALE : HAIR_STYLES_FEMALE;
    onUpdateState({ 
      gender: targetGender,
      selectedHairStyle: hairStylesList[0],
      selectedHairColor: HAIR_COLORS[0],
      selectedBeardStyle: BEARD_STYLES[0],
      selectedBeardColor: BEARD_COLORS[0],
      customPrompt: '',
    });
  };


  const activeImage = showOriginal ? appState.originalImage : (appState.currentImage || appState.originalImage);
  const hairStyles = appState.gender === Gender.MALE ? HAIR_STYLES_MALE : HAIR_STYLES_FEMALE;
  const beardOptions = appState.gender === Gender.MALE ? BEARD_STYLES : [];

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      
      {/* 1. Main Photo Area */}
      <div className="absolute inset-0 z-0">
        {activeImage ? (
          <img 
            src={activeImage} 
            alt="Preview" 
            className="w-full h-full object-cover opacity-90 transition-opacity duration-300" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />

        {/* Global Loading Spinner (Screen Center) */}
        {appState.isProcessing && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center pointer-events-none">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 shadow-[0_0_20px_rgba(255,255,255,0.4)]"></div>
             <p className="text-white font-medium drop-shadow-md animate-pulse">Designing your look...</p>
          </div>
        )}

        {/* Error Toast */}
        {errorMsg && (
          <div className="absolute top-28 left-4 right-4 bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-center text-xs z-50 shadow-lg border border-red-400/20 animate-in fade-in slide-in-from-top-2 pointer-events-none">
            {errorMsg}
          </div>
        )}
      </div>

      {/* 2. Floating Action Controls (Top Right) */}
      <div className="absolute top-24 right-4 flex flex-col gap-3 z-30 pointer-events-auto">
        <button 
          type="button"
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform shadow-lg"
          onMouseDown={() => setShowOriginal(true)}
          onMouseUp={() => setShowOriginal(false)}
          onTouchStart={() => setShowOriginal(true)}
          onTouchEnd={() => setShowOriginal(false)}
          title="Hold to view original"
        >
          <Icons.Eye />
        </button>
        <button 
          type="button"
          onClick={handleToggleFavorite}
          disabled={!currentDocId || isSaving}
          className={`w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center border transition-all active:scale-90 shadow-lg ${
            isFavorited 
              ? 'text-red-500 border-red-500/30' 
              : 'text-white border-white/10 disabled:opacity-40'
          }`}
          title={isSaving ? "Saving to database..." : "Add to Favorites"}
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          )}
        </button>
        <button 
          type="button"
          onClick={downloadImage}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform shadow-lg"
          title="Download photo"
        >
          <Icons.Download />
        </button>
      </div>

      {/* 3. Floating Action Controls (Top Right) */}

      {/* 4. Editor Controls Overlay (Bottom) */}
      {isControlsVisible ? (
        <div className="absolute bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 flex flex-col gap-0 pb-3 pt-1 rounded-t-3xl bg-black/60 backdrop-blur-2xl border-t border-black/30 animate-in slide-in-from-bottom duration-300 pointer-events-auto">
          
          {/* Top Collapse Handle */}
          <div className="flex justify-center items-center h-5 cursor-pointer group" onClick={() => setIsControlsVisible(false)}>
            <div className="w-12 h-1 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors"></div>
          </div>

          {/* Persistent Credit Top-Up Banner */}
          {appState.credits <= 10 && (
            <div 
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2.5 mx-4 my-1.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex justify-between items-center shadow-lg cursor-pointer hover:from-indigo-500/25 hover:to-purple-500/25 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2 text-left">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Icons.Magic className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">Credit Store</span>
                  <span className="text-[9px] text-neutral-400 font-bold leading-none mt-0.5">
                    {appState.credits === 0 ? "No credits remaining" : `${appState.credits} credits remaining`}
                  </span>
                </div>
              </div>
              <div
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[9px] font-extrabold uppercase tracking-widest text-white shadow-sm transition-transform"
              >
                Top Up
              </div>
            </div>
          )}

          {/* Gender Selector Inside Editor */}
          <div className="flex justify-center mb-3">
            <div className="flex items-center bg-black/40 backdrop-blur-xl rounded-full p-0.5 border border-white/10 shadow-lg">
              <button 
                type="button"
                onClick={() => setGender(Gender.MALE)}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-200 active:scale-95 ${appState.gender === Gender.MALE ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}
              >
                Male
              </button>
              <button 
                type="button"
                onClick={() => setGender(Gender.FEMALE)}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-200 active:scale-95 ${appState.gender === Gender.FEMALE ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}
              >
                Female
              </button>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex justify-center border-b border-black/30 px-4 mb-2">
            <button
              type="button"
              onClick={() => setActiveTab('hair')}
              className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-all ${
                activeTab === 'hair' 
                  ? 'text-white border-white' 
                  : 'text-white/40 border-transparent hover:text-white/60'
              }`}
            >
              Hair Options
            </button>
            
            {appState.gender === Gender.MALE && (
              <button
                type="button"
                onClick={() => setActiveTab('beard')}
                className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'beard' 
                    ? 'text-white border-white' 
                    : 'text-white/40 border-transparent hover:text-white/60'
                }`}
              >
                Beard Options
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('prompt')}
              className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-all ${
                activeTab === 'prompt' 
                  ? 'text-white border-white' 
                  : 'text-white/40 border-transparent hover:text-white/60'
              }`}
            >
              AI Custom Look
            </button>
          </div>

          {/* Active Tab Panel */}
          {activeTab === 'hair' && (
            /* Hair Tab Panel */
            <div className="w-full animate-in fade-in duration-200">
              {/* Hair Styles Row */}
              <div className="flex overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center mb-1">
                {hairStyles.map(s => (
                   <StyleButton 
                     key={s.id} 
                     item={s} 
                     isSelected={appState.selectedHairStyle?.id === s.id && !appState.customPrompt} 
                     onClick={() => {
                       onUpdateState({ customPrompt: '' });
                       handleSelectStyle(s);
                     }} 
                   />
                ))}
              </div>

              {/* Hair Colors Row */}
              <div className="flex overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center h-8">
                {HAIR_COLORS.map(c => (
                  <ColorButton
                    key={c.id}
                    item={c}
                    isSelected={appState.selectedHairColor?.id === c.id && !appState.customPrompt}
                    onClick={() => {
                      onUpdateState({ customPrompt: '' });
                      handleSelectStyle(c);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'beard' && appState.gender === Gender.MALE && (
            /* Beard Tab Panel */
            <div className="w-full animate-in fade-in duration-200">
              {/* Beard Styles Row */}
              <div className="flex overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center mb-1">
                {beardOptions.map(b => (
                  <StyleButton 
                    key={b.id} 
                    item={b} 
                    isSelected={appState.selectedBeardStyle?.id === b.id && !appState.customPrompt} 
                    onClick={() => {
                      onUpdateState({ customPrompt: '' });
                      handleSelectStyle(b);
                    }} 
                  />
                ))}
              </div>

              {/* Beard Colors Row */}
              <div className="flex overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center h-8">
                {BEARD_COLORS.map(c => (
                   <ColorButton
                     key={c.id}
                     item={c}
                     isSelected={appState.selectedBeardColor?.id === c.id && !appState.customPrompt}
                     onClick={() => {
                       onUpdateState({ customPrompt: '' });
                       handleSelectStyle(c);
                     }}
                   />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'prompt' && (
            /* AI Custom Look / Prompt Panel */
            <div className="w-full animate-in fade-in duration-200 px-4">
              {/* Suggestion Chips */}
              <div className="flex overflow-x-auto no-scrollbar space-x-2 pb-2 pt-0.5 scroll-smooth mb-1">
                {['1970s Disco', '90s Rockstar', 'Cyberpunk Glow', 'Viking Warrior', 'Anime Spiky Hair', '1920s Gangster', 'Elven Braids', 'Neon Pink Highlights'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      onUpdateState({ customPrompt: tag });
                    }}
                    className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-wide border transition-all duration-300 active:scale-95 flex-shrink-0 ${
                      appState.customPrompt === tag
                        ? 'bg-white/20 text-white border-white/40 shadow-sm'
                        : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Text Input Bar */}
              <div className="relative flex items-center bg-white/5 rounded-xl border border-black/30 px-3 py-2 shadow-inner focus-within:border-white/20 transition-all">
                <input
                  type="text"
                  value={appState.customPrompt || ''}
                  onChange={(e) => onUpdateState({ customPrompt: e.target.value })}
                  placeholder="Describe a look (e.g. '1970s mullet with blonde highlights')"
                  className="w-full bg-transparent border-none outline-none text-white text-xs placeholder-white/25 pr-8"
                />
                {appState.customPrompt && (
                  <button
                    type="button"
                    onClick={() => onUpdateState({ customPrompt: '' })}
                    className="absolute right-3 text-white/40 hover:text-white active:scale-90 transition-transform"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
              {/* Safety Disclaimer */}
              <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider text-left pl-1 pt-1.5 leading-none">
                🔒 Safe prompt filters are active. Input must comply with EULA.
              </p>
            </div>
          )}

          {/* Generate Button */}
          <div className="px-4 mt-3 pb-1 w-full">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={appState.isProcessing}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] border flex items-center justify-center gap-2 ${
                appState.isProcessing
                  ? 'bg-white/5 text-white/30 border-white/5 cursor-not-allowed'
                  : 'bg-white/10 backdrop-blur-md hover:bg-white/15 text-white border-black/30 hover:border-black/55 shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
              }`}
            >
              {appState.isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Icons.Magic className="w-3.5 h-3.5 text-white" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 flex justify-center pointer-events-none animate-in fade-in duration-500">
           <button
             type="button"
             onClick={() => setIsControlsVisible(true)}
             className="pointer-events-auto px-4 py-1.5 rounded-full bg-black/55 backdrop-blur-xl border border-white/10 text-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.3)] flex items-center gap-1.5 active:scale-95 transition-all"
           >
             <Icons.Styles className="w-3.5 h-3.5" />
             <span className="text-[10px] font-extrabold uppercase tracking-widest">Edit Style</span>
           </button>
        </div>
      )}

      {/* 5. Consumable Credits Shop Modal */}
      {showUpgradeModal && uid && (
        <PaywallView 
          uid={uid}
          onContinueFree={() => {
            setShowUpgradeModal(false);
          }}
          onWatchAdClick={() => {
            setShowUpgradeModal(false);
            if (onTriggerAd) {
              onTriggerAd();
            }
          }}
        />
      )}

    </div>
  );
};

// --- Sub-components ---

const StyleButton = ({ item, isSelected, onClick }: { item: StyleOption, isSelected: boolean, onClick: () => void }) => (
  <button 
    type="button"
    onClick={onClick}
    className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 w-14 h-18 rounded-xl transition-all duration-200 overflow-hidden relative group py-1 ${
      isSelected 
        ? 'bg-white/20 backdrop-blur-md border-2 border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
        : 'bg-transparent border border-transparent hover:bg-white/5 opacity-80 hover:opacity-100'
    }`}
  >
    <div className="w-10 h-10 flex items-center justify-center relative">
      <StyleIllustration id={item.id} type={item.category} />
    </div>
    <span className={`text-[9px] font-bold leading-tight text-center truncate w-full px-0.5 ${isSelected ? 'text-white' : 'text-white/60'}`}>
      {item.label.split(' ')[0]}
    </span>
  </button>
);

const ColorButton = ({ item, isSelected, onClick }: { item: StyleOption, isSelected: boolean, onClick: () => void }) => {
  const colorMap: Record<string, string> = {
    original: 'linear-gradient(45deg, #000 0%, #333 100%)', 
    black: '#0f0f0f',
    darkbrown: '#2a1d17',
    brown: '#4a3023',
    lightbrown: '#8D6E63',
    blonde: '#e6c86e',
    platinum: '#f0f0e6',
    red: '#b93612', 
    auburn: '#752b2b',
    grey: '#808080',
    white: '#f5f5f5',
    blue: '#1e3a8a',
    green: '#14532d',
    pink: '#be185d',
    match: 'linear-gradient(135deg, #333 0%, #999 100%)',
    // Highlights (diagonal stripes)
    blonde_highlights: 'linear-gradient(45deg, #2a1d17 25%, #e6c86e 25%, #e6c86e 50%, #2a1d17 50%, #2a1d17 75%, #e6c86e 75%, #e6c86e 100%)',
    brown_highlights: 'linear-gradient(45deg, #0f0f0f 25%, #8D6E63 25%, #8D6E63 50%, #0f0f0f 50%, #0f0f0f 75%, #8D6E63 75%, #8D6E63 100%)',
    platinum_highlights: 'linear-gradient(45deg, #2a1d17 25%, #f0f0e6 25%, #f0f0e6 50%, #2a1d17 50%, #2a1d17 75%, #f0f0e6 75%, #f0f0e6 100%)',
    blue_highlights: 'linear-gradient(45deg, #0f0f0f 25%, #1e3a8a 25%, #1e3a8a 50%, #0f0f0f 50%, #0f0f0f 75%, #1e3a8a 75%, #1e3a8a 100%)',
    pink_highlights: 'linear-gradient(45deg, #0f0f0f 25%, #be185d 25%, #be185d 50%, #0f0f0f 50%, #0f0f0f 75%, #be185d 75%, #be185d 100%)',
    grey_highlights: 'linear-gradient(45deg, #0f0f0f 25%, #808080 25%, #808080 50%, #0f0f0f 50%, #0f0f0f 75%, #808080 75%, #808080 100%)',
    // Ombre (fade top-to-bottom)
    blonde_ombre: 'linear-gradient(to bottom, #0f0f0f 20%, #e6c86e 100%)',
    brown_ombre: 'linear-gradient(to bottom, #0f0f0f 20%, #4a3023 100%)',
    red_ombre: 'linear-gradient(to bottom, #0f0f0f 20%, #b93612 100%)',
    blue_ombre: 'linear-gradient(to bottom, #0f0f0f 20%, #1e3a8a 100%)',
    pink_ombre: 'linear-gradient(to bottom, #0f0f0f 20%, #be185d 100%)'
  };
  
  const colorValue = colorMap[item.id] || '#ccc';
  const isGradient = colorValue.includes('gradient');
  const bgStyle = isGradient
    ? { background: colorValue } 
    : { backgroundColor: colorValue };

  return (
    <button 
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
        isSelected ? 'scale-110' : 'scale-100 hover:scale-105'
      }`}
    >
      <div 
        className={`w-6 h-6 rounded-full shadow-sm ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'border border-white/20'}`} 
        style={bgStyle}
      ></div>
    </button>
  );
};