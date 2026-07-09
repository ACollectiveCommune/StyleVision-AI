import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, StyleOption, Gender } from '../types';
import { Icons, HAIR_STYLES_MALE, HAIR_STYLES_FEMALE, BEARD_STYLES, HAIR_COLORS, BEARD_COLORS, StyleIllustration } from '../constants';
import { generateStylePreview } from '../services/geminiService';

interface PhotoEditorProps {
  appState: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ appState, onUpdateState }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isControlsVisible, setIsControlsVisible] = useState(true);

  // Ref to track the latest request ID to prevent race conditions during retries
  const latestRequestId = useRef(0);

  // Auto-open controls when a new image is loaded or mode changes
  useEffect(() => {
    setIsControlsVisible(true);
  }, [appState.originalImage, appState.currentMode]);

  // Manual Generation Handler
  const handleGenerate = useCallback(async () => {
    if (!appState.originalImage || appState.isProcessing) return;
    
    const requestId = ++latestRequestId.current;
    onUpdateState({ isProcessing: true });
    setErrorMsg(null);
    
    try {
      const newImage = await generateStylePreview(appState);
      // Only update if this is the latest request (prevents stale overwrites)
      if (requestId === latestRequestId.current) {
        onUpdateState({ currentImage: newImage, isProcessing: false });
      }
    } catch (err) {
      if (requestId === latestRequestId.current) {
        console.error(err);
        setErrorMsg("Could not apply style. Please try again.");
        onUpdateState({ isProcessing: false });
      }
    }
  }, [appState, onUpdateState]);

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

  const downloadImage = () => {
    if (appState.currentImage) {
      const link = document.createElement('a');
      link.href = appState.currentImage;
      link.download = `StyleVision_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
        >
          <Icons.Eye />
        </button>
        <button 
          type="button"
          onClick={downloadImage}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform shadow-lg"
        >
          <Icons.Download />
        </button>
      </div>

      {/* 3. Generate Button (Floating Top Left) */}
      <div className="absolute top-24 left-4 z-30 pointer-events-auto">
        <button
            type="button"
            onClick={handleGenerate}
            disabled={appState.isProcessing}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider shadow-xl transition-all active:scale-95 border backdrop-blur-md ${
                appState.isProcessing 
                ? 'bg-black/40 text-white/50 border-white/5 cursor-not-allowed' 
                : 'bg-indigo-600/90 hover:bg-indigo-500 text-white border-indigo-400/50 shadow-indigo-900/20'
            }`}
        >
            {appState.isProcessing ? (
                 <span className="animate-pulse">Processing...</span>
            ) : (
                <>
                    <Icons.Magic />
                    <span>Generate</span>
                </>
            )}
        </button>
      </div>

      {/* 4. Editor Controls Overlay (Bottom) */}
      {isControlsVisible ? (
        <div className="absolute bottom-24 left-0 right-0 z-40 flex flex-col gap-0 pb-2 pt-2 rounded-t-3xl bg-black/60 backdrop-blur-2xl border-t border-white/10 animate-in slide-in-from-bottom duration-300 pointer-events-auto">
          
          {/* Hair Header */}
          <div className="flex items-center px-4 mb-1 mt-1">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest mr-2">Hair</span>
            <div className="h-px bg-white/10 flex-grow"></div>
          </div>

          {/* Hair Section */}
          <div className="w-full">
            {/* Hair Styles Row */}
            <div className="flex overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center mb-0.5">
              {hairStyles.map(s => (
                 <StyleButton 
                   key={s.id} 
                   item={s} 
                   isSelected={appState.selectedHairStyle?.id === s.id} 
                   onClick={() => handleSelectStyle(s)} 
                 />
              ))}
            </div>

            {/* Hair Colors Row */}
            <div className="flex overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center h-8 mb-1">
              {HAIR_COLORS.map(c => (
                <ColorButton
                  key={c.id}
                  item={c}
                  isSelected={appState.selectedHairColor?.id === c.id}
                  onClick={() => handleSelectStyle(c)}
                />
              ))}
            </div>
          </div>

          {/* Beard Section (Male only) */}
          {appState.gender === Gender.MALE && (
            <div className="w-full mt-0.5">
              <div className="flex items-center px-4 mb-0.5">
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest mr-2">Beard</span>
                <div className="h-px bg-white/10 flex-grow"></div>
              </div>
              
               {/* Beard Styles Row */}
              <div className="flex overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center mb-0.5">
                {beardOptions.map(b => (
                  <StyleButton 
                    key={b.id} 
                    item={b} 
                    isSelected={appState.selectedBeardStyle?.id === b.id} 
                    onClick={() => handleSelectStyle(b)} 
                  />
                ))}
              </div>

               {/* Beard Colors Row */}
               <div className="flex overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center h-8">
                {BEARD_COLORS.map(c => (
                   <ColorButton
                   key={c.id}
                   item={c}
                   isSelected={appState.selectedBeardColor?.id === c.id}
                   onClick={() => handleSelectStyle(c)}
                 />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Button to bring back controls (if they were somehow closed) */
        <div className="absolute bottom-28 left-0 right-0 z-40 flex justify-center pointer-events-none animate-in fade-in duration-500">
           <button
             type="button"
             onClick={() => setIsControlsVisible(true)}
             className="pointer-events-auto px-5 py-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-xl flex items-center gap-2 active:scale-95 transition-all"
           >
             <Icons.Styles />
             <span className="text-xs font-bold uppercase tracking-wider">Edit Style</span>
           </button>
        </div>
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
    match: 'linear-gradient(135deg, #333 0%, #999 100%)' 
  };
  
  const bgStyle = (item.id === 'match' || item.id === 'original')
    ? { background: colorMap[item.id] } 
    : { backgroundColor: colorMap[item.id] || '#ccc' };

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