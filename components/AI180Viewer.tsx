import React, { useState, useEffect, useRef } from 'react';
import { 
  AppState, 
  AI180Scan, 
  AI180GeneratedStyle, 
  Interactive180Session 
} from '../types';
import { 
  Icons, 
  HAIR_STYLES_MALE, 
  HAIR_STYLES_FEMALE, 
  HAIR_COLORS, 
  BEARD_STYLES, 
  BEARD_COLORS, 
  OUTFIT_STYLES 
} from '../constants';
import { AI180Capture } from './AI180Capture';
import { extractAnchorFrames } from '../services/AI180ViewProcessor';
import { generateAI180Preview } from '../services/AI180GenerationService';
import { 
  saveAI180Scan, 
  getAI180Scans, 
  saveAI180Style, 
  getAI180StylesForScan 
} from '../services/AI180FirestoreService';
import { uploadImageToStorage } from '../services/firebase';

interface AI180ViewerProps {
  uid: string;
  appState: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onClose: () => void;
  onOpenOriginal180: () => void;
}

export const AI180Viewer: React.FC<AI180ViewerProps> = ({
  uid,
  appState,
  onUpdateState,
  onClose,
  onOpenOriginal180
}) => {
  const [viewState, setViewState] = useState<'intro' | 'capture' | 'customization' | 'generating' | 'viewer' | 'error'>('intro');
  const [scans, setScans] = useState<AI180Scan[]>([]);
  const [selectedScan, setSelectedScan] = useState<AI180Scan | null>(null);
  
  // Customization selection states
  const [selectedHair, setSelectedHair] = useState<string>('original');
  const [selectedColor, setSelectedColor] = useState<string>('natural');
  const [selectedBeard, setSelectedBeard] = useState<string>('beard_none');
  const [selectedBeardColor, setSelectedBeardColor] = useState<string>('natural');
  const [selectedOutfit, setSelectedOutfit] = useState<string>('original');

  // Generation progress states
  const [genProgress, setGenProgress] = useState<number>(0);
  const [genMessage, setGenMessage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Viewer states
  const [styledFrames, setStyledFrames] = useState<string[]>([]);
  const [activeFrameIdx, setActiveFrameIdx] = useState<number>(4); // Default to Front view (index 4)
  const [isPreloading, setIsPreloading] = useState<boolean>(false);

  // Drag interaction refs
  const dragStartX = useRef<number>(0);
  const startFrameIdx = useRef<number>(4);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch scans list on mount
  useEffect(() => {
    const loadScans = async () => {
      try {
        const list = await getAI180Scans(uid);
        setScans(list);
        if (list.length > 0) {
          setSelectedScan(list[0]);
        }
      } catch (err) {
        console.error('Failed to load past scans:', err);
      }
    };
    loadScans();
  }, [uid]);

  // Preload generated images for smooth scrubbing
  const preloadImages = (urls: string[]): Promise<void> => {
    setIsPreloading(true);
    let loadedCount = 0;
    return new Promise((resolve) => {
      urls.forEach(url => {
        const img = new Image();
        img.src = url;
        img.onload = img.onerror = () => {
          loadedCount++;
          if (loadedCount === urls.length) {
            setIsPreloading(false);
            resolve();
          }
        };
      });
    });
  };

  const handleCaptureComplete = async (rawFrames: string[]) => {
    setViewState('generating');
    setGenProgress(5);
    setGenMessage('Analyzing captured pose sequences...');
    
    try {
      // 1. Process and select 9 anchor views
      const anchors = await extractAnchorFrames(rawFrames);
      setGenProgress(10);
      setGenMessage('Uploading scan frames to storage...');

      // Upload frames to Firebase Storage and get public HTTPS URLs
      const uploadPromises = anchors.map((base64) => 
        uploadImageToStorage(uid, base64, 'original')
      );
      const urls = await Promise.all(uploadPromises);

      setGenProgress(15);
      setGenMessage('Saving scan metadata...');

      // 2. Save scan to Firestore (using storage URLs instead of heavy base64 strings)
      const scanId = await saveAI180Scan(uid, {
        userId: uid,
        sourceFrames: urls,
        createdAt: new Date().toISOString(),
        version: '1.0'
      });

      const newScan: AI180Scan = {
        id: scanId,
        userId: uid,
        sourceFrames: urls,
        createdAt: new Date().toISOString(),
        version: '1.0'
      };

      setScans(prev => [newScan, ...prev]);
      setSelectedScan(newScan);
      
      // Auto transition to customization
      setViewState('customization');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to process capture');
      setViewState('error');
    }
  };

  const handleStartGeneration = async () => {
    if (!selectedScan) {
      alert('Please perform a scan first!');
      return;
    }

    setViewState('generating');
    setGenProgress(0);
    setGenMessage('Initializing try-on generator...');

    const styleSnapshot = {
      hairstyleId: selectedHair,
      hairColorId: selectedColor,
      beardId: selectedBeard,
      beardColorId: selectedBeardColor,
      aesthetics: {},
      makeup: 'makeup_none',
      outfitId: selectedOutfit
    };

    try {
      // Execute 9-view generation loop
      const results = await generateAI180Preview(
        uid,
        selectedScan.id,
        selectedScan.sourceFrames,
        styleSnapshot,
        appState,
        (percent, msg) => {
          setGenProgress(percent);
          setGenMessage(msg);
        }
      );

      // Preload images into memory
      setGenMessage('Uploading styled frames to storage...');
      const uploadPromises = results.map((base64) => 
        uploadImageToStorage(uid, base64, 'generated')
      );
      const urls = await Promise.all(uploadPromises);

      setGenMessage('Preloading frames for smooth rotation...');
      await preloadImages(urls);

      // Save generated style preview metadata
      await saveAI180Style(uid, {
        userId: uid,
        scanId: selectedScan.id,
        hairstyleId: selectedHair,
        hairColorId: selectedColor,
        beardId: selectedBeard,
        beardColorId: selectedBeardColor,
        generatedFrames: urls,
        createdAt: new Date().toISOString()
      });

      setStyledFrames(urls);
      setActiveFrameIdx(4); // Reset to front view
      setViewState('viewer');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'AI generation failed');
      setViewState('error');
    }
  };

  // Drag interaction handlers
  const handleDragStart = (clientX: number) => {
    dragStartX.current = clientX;
    startFrameIdx.current = activeFrameIdx;
  };

  const handleDragMove = (clientX: number) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const diffX = clientX - dragStartX.current;
    
    // Map full container drag distance to 9 frames
    const stepSize = width / 9;
    const frameOffset = Math.floor(diffX / stepSize);
    
    // Reverse drag direction for natural rotation mirroring:
    // Dragging right rotates head left, dragging left rotates head right
    let targetIdx = startFrameIdx.current - frameOffset;
    targetIdx = Math.max(0, Math.min(8, targetIdx));
    
    setActiveFrameIdx(targetIdx);
  };

  // HTML event bridges
  const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) handleDragMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) handleDragStart(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) handleDragMove(e.touches[0].clientX);
  };

  // Abstraction layer to warp or interpolate between views
  const generateIntermediateViews = () => {
    // Currently returns anchor frame index (Version 1 frame swap).
    // Can be extended with lightweight GPU transitions or flow logic here.
    return styledFrames[activeFrameIdx];
  };

  const currentHairList = appState.gender === 'male' ? HAIR_STYLES_MALE : HAIR_STYLES_FEMALE;

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col z-50 overflow-hidden font-sans">
      
      {/* 1. Header */}
      <div className="relative flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 bg-slate-950 border-b border-white/10 z-30">
        <button 
          onClick={onClose} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-neutral-300 active:scale-95 transition-all"
        >
          Back
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
          Try AI 180° (Experimental)
        </span>
        <div className="w-12 h-6" /> {/* Spacer */}
      </div>

      {/* 2. Main Work Area */}
      <div className="flex-1 relative flex flex-col justify-between bg-slate-950 overflow-hidden min-h-0">
        
        {/* View State: INTRO */}
        {viewState === 'intro' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto my-auto gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Capture Guided AI 180°</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This experiment runs a 10-second guided capture to extract 9 viewpoints of your face and hair, generating your custom styling results across multiple views using the Gemini AI pipeline.
            </p>

            {scans.length > 0 ? (
              <div className="flex flex-col gap-2 w-full mt-4">
                <button
                  onClick={() => setViewState('customization')}
                  className="w-full py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-xs font-black uppercase tracking-widest transition shadow-lg"
                >
                  Reuse Previous Scan
                </button>
                <button
                  onClick={() => setViewState('capture')}
                  className="w-full py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-black uppercase tracking-widest transition"
                >
                  Capture New Scan
                </button>
              </div>
            ) : (
              <button
                onClick={() => setViewState('capture')}
                className="w-full py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-xs font-black uppercase tracking-widest transition mt-4 shadow-lg shadow-indigo-600/20"
              >
                Start Guided Capture
              </button>
            )}
          </div>
        )}

        {/* View State: CAPTURE */}
        {viewState === 'capture' && (
          <AI180Capture 
            onCaptureComplete={handleCaptureComplete}
            onClose={() => setViewState(scans.length > 0 ? 'customization' : 'intro')}
          />
        )}

        {/* View State: GENERATING */}
        {viewState === 'generating' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <div className="w-full max-w-xs h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_8px_#6366f1]"
                style={{ width: `${genProgress}%` }}
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              {genMessage} ({genProgress}%)
            </span>
          </div>
        )}

        {/* View State: CUSTOMIZATION (Edit & Setup parameters) */}
        {viewState === 'customization' && (
          <div className="flex-1 flex flex-col justify-between pb-8 overflow-y-auto no-scrollbar">
            <div className="p-4 space-y-6">
              {/* Hairstyle selector */}
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 block mb-2">Select Hairstyle</span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setSelectedHair('original')}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                      selectedHair === 'original' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-neutral-400'
                    }`}
                  >
                    Original Hair
                  </button>
                  {currentHairList.map(h => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHair(h.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        selectedHair === h.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-neutral-400'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair color selector */}
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 block mb-2">Select Hair Color</span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setSelectedColor('natural')}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                      selectedColor === 'natural' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-neutral-400'
                    }`}
                  >
                    Natural Color
                  </button>
                  {HAIR_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        selectedColor === c.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-neutral-400'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Beard Selector (Male only) */}
              {appState.gender === 'male' && (
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 block mb-2">Select Beard style</span>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                      onClick={() => setSelectedBeard('beard_none')}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        selectedBeard === 'beard_none' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-neutral-400'
                      }`}
                    >
                      Clean Shaven
                    </button>
                    {BEARD_STYLES.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBeard(b.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                          selectedBeard === b.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-neutral-400'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Outfit selector */}
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 block mb-2">Select Outfit</span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setSelectedOutfit('original')}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                      selectedOutfit === 'original' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-neutral-400'
                    }`}
                  >
                    Original Outfit
                  </button>
                  {OUTFIT_STYLES.map(o => (
                    <button
                      key={o.id}
                      onClick={() => setSelectedOutfit(o.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        selectedOutfit === o.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-neutral-400'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 mt-auto">
              <button
                onClick={handleStartGeneration}
                className="w-full py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-xs font-black uppercase tracking-widest transition shadow-lg shadow-indigo-600/20"
              >
                ⚡ Generate AI 180° Style
              </button>
            </div>
          </div>
        )}

        {/* View State: VIEWER (horizontal drag rotation) */}
        {viewState === 'viewer' && (
          <div className="flex-1 flex flex-col justify-between min-h-0 relative">
            
            {/* Viewport Frame Box Container */}
            <div 
              ref={containerRef}
              className="flex-1 touch-none relative overflow-hidden min-h-0 flex items-center justify-center"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            >
              {/* Radiant Studio Backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#f1f5f9_50%,_#cbd5e1_100%)] z-0"></div>
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0"></div>

              {/* Render Image (Warp / Interpolated frames view) */}
              <img
                src={generateIntermediateViews()}
                alt="AI 180 Styled Face View"
                className="w-full max-w-[640px] aspect-square object-cover z-10 shadow-2xl rounded-2xl pointer-events-none border border-white/5 select-none"
              />

              {/* User rotation instruction indicator */}
              <div className="absolute inset-x-0 bottom-6 text-center text-neutral-800 text-[10px] font-black uppercase tracking-widest pointer-events-none z-20">
                ◀ Drag left or right to rotate 180° ◀
              </div>
            </div>

            {/* Back to editing customization trigger */}
            <div className="px-6 py-4 bg-slate-950 border-t border-white/5 flex flex-col gap-2 z-20 flex-shrink-0">
              <button
                onClick={() => setViewState('customization')}
                className="w-full py-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-black uppercase tracking-widest transition"
              >
                Change Style Options
              </button>
            </div>
          </div>
        )}

        {/* View State: ERROR */}
        {viewState === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto my-auto gap-4 z-20">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">AI 180° couldn't be generated</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {errorMsg || 'An unexpected error occurred during the styling generation cycle. Please check your network connection and try again.'}
            </p>
            
            <div className="flex flex-col gap-2 w-full mt-4">
              <button
                onClick={handleStartGeneration}
                className="w-full py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-xs font-black uppercase tracking-widest transition shadow-lg"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenOriginal180();
                }}
                className="w-full py-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-black uppercase tracking-widest transition text-indigo-400"
              >
                Use Original 180° Preview
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
