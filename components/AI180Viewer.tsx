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
import { generateAI180Preview, getCachedAI180Preview, generationCache } from '../services/AI180GenerationService';
import { 
  saveAI180Scan, 
  getAI180Scans, 
  saveAI180Style, 
  getAI180StylesForScan 
} from '../services/AI180FirestoreService';
import { uploadImageToStorage } from '../services/firebase';
import { saveGeneration, toggleFavorite } from '../services/firebase';
import { downloadOrShareImage } from '../services/shareService';

interface AI180ViewerProps {
  uid: string;
  appState: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onClose: () => void;
  onOpenOriginal180: () => void;
}

const findMatchingSavedStyle = (
  savedStyles: AI180GeneratedStyle[],
  target: {
    hairstyleId: string;
    hairColorId: string;
    beardId: string;
    beardColorId: string;
    outfitId: string;
    makeup: string;
    aesthetics: Record<string, number>;
    eyeColorId?: string;
  }
): AI180GeneratedStyle | null => {
  for (const style of savedStyles) {
    if (
      style.hairstyleId === target.hairstyleId &&
      style.hairColorId === target.hairColorId &&
      style.beardId === target.beardId &&
      style.beardColorId === target.beardColorId &&
      style.outfitId === target.outfitId &&
      style.makeup === target.makeup &&
      (style.eyeColorId || 'eyecolor_original') === (target.eyeColorId || 'eyecolor_original')
    ) {
      // Compare aesthetics
      const styleAes = style.aesthetics || {};
      const targetAes = target.aesthetics || {};
      
      const allKeys = new Set([...Object.keys(styleAes), ...Object.keys(targetAes)]);
      let aesMatches = true;
      for (const k of allKeys) {
        const val1 = styleAes[k] || 0;
        const val2 = targetAes[k] || 0;
        if (val1 !== val2) {
          aesMatches = false;
          break;
        }
      }
      
      if (aesMatches) {
        return style;
      }
    }
  }
  return null;
};

export const AI180Viewer: React.FC<AI180ViewerProps> = ({
  uid,
  appState,
  onUpdateState,
  onClose,
  onOpenOriginal180
}) => {
  const [viewState, setViewState] = useState<'intro' | 'capture' | 'customization' | 'generating' | 'viewer' | 'error'>(
    appState.activeAI180ScanId ? 'generating' : 'intro'
  );
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
  const [hasSwiped, setHasSwiped] = useState<boolean>(false);

  // Favorite synchronization states
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [currentSavedDocId, setCurrentSavedDocId] = useState<string | null>(null);

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

  // Synchronize style selections from the main editor appState on mount
  useEffect(() => {
    if (appState.selectedHairStyle) {
      setSelectedHair(appState.selectedHairStyle.id);
    }
    if (appState.selectedHairColor) {
      setSelectedColor(appState.selectedHairColor.id);
    }
    if (appState.selectedBeardStyle) {
      setSelectedBeard(appState.selectedBeardStyle.id);
    }
    if (appState.selectedBeardColor) {
      setSelectedBeardColor(appState.selectedBeardColor.id);
    }
    if (appState.selectedOutfit) {
      setSelectedOutfit(appState.selectedOutfit.id);
    }
  }, [appState]);

  // Handle immediate auto-generation if mounted from editor try-on trigger
  useEffect(() => {
    if (appState.activeAI180ScanId) {
      const runImmediateGeneration = async () => {
        try {
          const list = await getAI180Scans(uid);
          const scan = list.find(s => s.id === appState.activeAI180ScanId);
          if (scan) {
            setSelectedScan(scan);
            setViewState('generating');
            setGenProgress(0);
            setGenMessage('Initializing Try-on Generator...');

            const styleSnapshot = {
              hairstyleId: appState.selectedHairStyle?.id || 'original',
              hairColorId: appState.selectedHairColor?.id || 'natural',
              beardId: appState.selectedBeardStyle?.id || 'beard_none',
              beardColorId: appState.selectedBeardColor?.id || 'natural',
              aesthetics: appState.aestheticsState || {},
              makeup: appState.selectedMakeup?.id || 'makeup_none',
              outfitId: appState.selectedOutfit?.id || 'original',
              eyeColorId: appState.selectedEyeColor?.id || 'eyecolor_original'
            };

            // 1. Check in-memory cache first for instant transition
            const cachedStyled = getCachedAI180Preview(scan.id, styleSnapshot);
            if (cachedStyled && cachedStyled.length > 0) {
              setStyledFrames(cachedStyled);
              setActiveFrameIdx(4);
              setViewState('viewer');
              return;
            }

            // 2. Query Firestore/LocalStorage styles next
            setViewState('generating');
            setGenProgress(20);
            setGenMessage('Checking for saved styles...');
            const savedStyles = await getAI180StylesForScan(uid, scan.id);
            const matchingStyle = findMatchingSavedStyle(savedStyles, styleSnapshot);
            if (matchingStyle && matchingStyle.generatedFrames && matchingStyle.generatedFrames.length > 0) {
              setGenProgress(60);
              setGenMessage('Retrieving previously generated look...');
              await preloadImages(matchingStyle.generatedFrames);

              // Seed cache
              const aestheticsHash = Object.entries(styleSnapshot.aesthetics || {})
                .filter(([_, val]) => val > 0)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([id, val]) => `${id}:${val}`)
                .join(',');
              const eyeColor = styleSnapshot.eyeColorId || 'eyecolor_original';
              const cacheKey = `${scan.id}_h:${styleSnapshot.hairstyleId}_c:${styleSnapshot.hairColorId}_b:${styleSnapshot.beardId}_bc:${styleSnapshot.beardColorId}_o:${styleSnapshot.outfitId}_m:${styleSnapshot.makeup}_ae:${aestheticsHash}_eye:${eyeColor}`;
              generationCache[cacheKey] = matchingStyle.generatedFrames;

              setStyledFrames(matchingStyle.generatedFrames);
              setActiveFrameIdx(4);
              setViewState('viewer');
              return;
            }

            setGenProgress(30);
            setGenMessage('Initializing Try-on Generator...');

            const cachedFrames = (window as any).localScanFramesCache?.[scan.id];
            const sourceFrames = cachedFrames && cachedFrames.length > 0 ? cachedFrames : scan.sourceFrames;

            const results = await generateAI180Preview(
              uid,
              scan.id,
              sourceFrames,
              styleSnapshot,
              appState,
              (percent, msg) => {
                setGenProgress(30 + Math.floor(percent * 0.5));
                setGenMessage(msg);
              }
            );

            setGenMessage('Uploading styled frames...');
            const uploadPromises = results.map(base64 => 
              uploadImageToStorage(uid, base64, 'generated')
            );
            const urls = await Promise.all(uploadPromises);

            setGenMessage('Preloading frames...');
            await preloadImages(urls);

            // Save styled metadata
            await saveAI180Style(uid, {
              userId: uid,
              scanId: scan.id,
              hairstyleId: styleSnapshot.hairstyleId,
              hairColorId: styleSnapshot.hairColorId,
              beardId: styleSnapshot.beardId,
              beardColorId: styleSnapshot.beardColorId,
              generatedFrames: urls,
              createdAt: new Date().toISOString()
            });

            setStyledFrames(urls);
            setActiveFrameIdx(4);
            setViewState('viewer');
          } else {
            throw new Error("Active 180° scan data could not be found");
          }
        } catch (err: any) {
          console.error(err);
          setErrorMsg(err.message || 'AI generation failed');
          setViewState('error');
        }
      };
      runImmediateGeneration();
    }
  }, [appState.activeAI180ScanId, uid]);

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
      
      // Directly start generation using the new scan instead of showing the customization panel
      handleStartGeneration(newScan);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to process capture');
      setViewState('error');
    }
  };

  const handleStartGeneration = async (scanOverride?: AI180Scan) => {
    const scan = scanOverride || selectedScan;
    if (!scan) {
      alert('Please perform a scan first!');
      return;
    }

    const styleSnapshot = {
      hairstyleId: appState.selectedHairStyle?.id || selectedHair,
      hairColorId: appState.selectedHairColor?.id || selectedColor,
      beardId: appState.selectedBeardStyle?.id || selectedBeard,
      beardColorId: appState.selectedBeardColor?.id || selectedBeardColor,
      aesthetics: appState.aestheticsState || {},
      makeup: appState.selectedMakeup?.id || 'makeup_none',
      outfitId: appState.selectedOutfit?.id || selectedOutfit,
      eyeColorId: appState.selectedEyeColor?.id || 'eyecolor_original'
    };

    // 1. Check in-memory cache first for instant transition
    const cachedStyled = getCachedAI180Preview(scan.id, styleSnapshot);
    if (cachedStyled && cachedStyled.length > 0) {
      setStyledFrames(cachedStyled);
      setActiveFrameIdx(4);
      setViewState('viewer');
      return;
    }

    setViewState('generating');
    setGenProgress(20);
    setGenMessage('Checking for saved styles...');

    try {
      // 2. Query Firestore/LocalStorage styles next
      const savedStyles = await getAI180StylesForScan(uid, scan.id);
      const matchingStyle = findMatchingSavedStyle(savedStyles, styleSnapshot);
      if (matchingStyle && matchingStyle.generatedFrames && matchingStyle.generatedFrames.length > 0) {
        setGenProgress(60);
        setGenMessage('Retrieving previously generated look...');
        await preloadImages(matchingStyle.generatedFrames);

        // Seed cache
        const aestheticsHash = Object.entries(styleSnapshot.aesthetics || {})
          .filter(([_, val]) => val > 0)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([id, val]) => `${id}:${val}`)
          .join(',');
        const eyeColor = styleSnapshot.eyeColorId || 'eyecolor_original';
        const cacheKey = `${scan.id}_h:${styleSnapshot.hairstyleId}_c:${styleSnapshot.hairColorId}_b:${styleSnapshot.beardId}_bc:${styleSnapshot.beardColorId}_o:${styleSnapshot.outfitId}_m:${styleSnapshot.makeup}_ae:${aestheticsHash}_eye:${eyeColor}`;
        generationCache[cacheKey] = matchingStyle.generatedFrames;

        setStyledFrames(matchingStyle.generatedFrames);
        setActiveFrameIdx(4);
        setViewState('viewer');
        return;
      }

      setGenProgress(35);
      setGenMessage('Initializing try-on generator...');

      const cachedFrames = (window as any).localScanFramesCache?.[scan.id];
      const sourceFrames = cachedFrames && cachedFrames.length > 0 ? cachedFrames : scan.sourceFrames;

      // Execute 9-view generation loop
      const results = await generateAI180Preview(
        uid,
        scan.id,
        sourceFrames,
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
        scanId: scan.id,
        hairstyleId: styleSnapshot.hairstyleId,
        hairColorId: styleSnapshot.hairColorId,
        beardId: styleSnapshot.beardId,
        beardColorId: styleSnapshot.beardColorId,
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

  // Save current frame to device Photos/Downloads
  const handleDownloadFrame = async () => {
    const activeUrl = styledFrames[activeFrameIdx];
    if (!activeUrl) return;
    try {
      await downloadOrShareImage(activeUrl);
    } catch (err) {
      console.error("Failed to save view to camera roll:", err);
      alert("Failed to save image. Please verify permission settings.");
    }
  };

  // Toggle look favoriting and sync with Favorites tab
  const handleToggleFavorite = async () => {
    if (isFavorited && currentSavedDocId) {
      try {
        await toggleFavorite(uid, currentSavedDocId, false);
        setIsFavorited(false);
        // Sync local parent creations list
        if (appState.favoritedCreations) {
          onUpdateState({
            favoritedCreations: appState.favoritedCreations.filter(c => c.id !== currentSavedDocId)
          });
        }
      } catch (err) {
        console.error("Failed to unfavorite look:", err);
      }
    } else {
      try {
        const docData = {
          originalImageUrl: selectedScan?.sourceFrames[4] || "", // Front original frame as baseline
          generatedImageUrl: styledFrames[activeFrameIdx] || styledFrames[4] || "", // Currently active stylized view
          hairStyle: selectedHair,
          hairColor: selectedColor,
          beardStyle: selectedBeard,
          beardColor: selectedBeardColor,
          outfit: selectedOutfit,
          gender: appState.gender,
          isFavorite: true,
          createdAt: new Date().toISOString()
        };

        const docId = await saveGeneration(uid, docData);
        setCurrentSavedDocId(docId);
        setIsFavorited(true);

        // Sync local parent creations list
        const newGen = { id: docId, ...docData };
        onUpdateState({
          favoritedCreations: [newGen, ...(appState.favoritedCreations || [])]
        });
      } catch (err) {
        console.error("Failed to favorite look:", err);
      }
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
    
    if (targetIdx !== activeFrameIdx) {
      setActiveFrameIdx(targetIdx);
      if (!hasSwiped) {
        setHasSwiped(true);
      }
    }
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
      
      {/* 1. Header (Only rendered when not in viewer state to prevent duplicate floating headers) */}
      {viewState !== 'viewer' && viewState !== 'capture' && (
        <div className="relative flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 bg-slate-950 border-b border-white/10 z-30">
          <button 
            onClick={onClose} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-neutral-300 active:scale-95 transition-all"
          >
            Back
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              AI 180° Preview
            </span>
            <span className="text-[8px] bg-amber-400 text-neutral-950 font-extrabold px-1.5 py-0.5 rounded leading-none">
              EXP
            </span>
          </div>
          <div className="w-12 h-6" /> {/* Spacer */}
        </div>
      )}

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
            onClick={() => handleStartGeneration()}
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
            onClose={() => setViewState('intro')}
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
          <div 
            ref={containerRef}
            className="absolute inset-0 touch-none flex flex-col justify-between bg-neutral-950 z-40"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {/* Full-Screen Immersive Render Image Frame Container */}
            <div className="absolute inset-0 z-10 overflow-hidden flex items-center justify-center pointer-events-none select-none">
              {/* Background: Blurred letterboxing fallback */}
              <img
                src={generateIntermediateViews()}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-35 scale-110 pointer-events-none select-none z-0"
              />
              {/* Foreground: Pristine high-resolution sharp preview */}
              <img
                src={generateIntermediateViews()}
                alt="AI 180 Styled Face View"
                className="relative max-w-full max-h-full object-contain z-10 pointer-events-none select-none"
              />
            </div>

            {/* Floating Top Bar overlay */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-[calc(env(safe-area-inset-top,20px)+12px)] flex justify-between items-center pointer-events-none">
              
              {/* Left: Back button */}
              <div className="pointer-events-auto">
                <button 
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-xs font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all"
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
              </div>

              {/* Center: Title Pill */}
              <div className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg pointer-events-none">
                <span className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">
                  AI 180° Preview
                </span>
                <span className="text-[8px] bg-amber-400 text-neutral-950 font-extrabold px-1.5 py-0.5 rounded leading-none">
                  EXP
                </span>
              </div>

              {/* Right: Heart & Download Grouping */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Favorite (Heart) Button */}
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-xl transition-all active:scale-90 shadow-lg ${
                    isFavorited
                      ? 'bg-rose-500/90 border-rose-600/50 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                      : 'bg-black/40 border-white/10 text-white hover:bg-black/60'
                  }`}
                  title="Favorite Look"
                >
                  <svg width={16} height={16} fill={isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadFrame}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all shadow-lg"
                  title="Save View to Camera Roll"
                >
                  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>

            </div>

            {/* Floating Bottom Info & CTA */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] flex flex-col items-center gap-4 pointer-events-none">
              
              {/* Drag instruction overlay */}
              <div className={`px-4 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/5 shadow-lg text-white/70 text-[10px] font-bold tracking-wider transition-opacity duration-500 pointer-events-none ${
                hasSwiped ? 'opacity-0' : 'opacity-100'
              }`}>
                ↔ Swipe to rotate
              </div>

              {/* Back to Editor CTA */}
              <div className="w-full max-w-[280px] pointer-events-auto">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/10 text-[11px] font-extrabold uppercase tracking-widest text-white/80 hover:text-white shadow-lg transition-all active:scale-[0.97]"
                >
                  Back to Editor
                </button>
              </div>

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
