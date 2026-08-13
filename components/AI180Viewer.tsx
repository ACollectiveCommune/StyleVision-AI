import React, { useState, useEffect, useRef } from 'react';
import { 
  AppState, 
  AI180Scan, 
  AI180GeneratedStyle 
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
import { analyzeScanAngles, AI180FrameMetadata } from '../services/geminiService';
import { 
  saveAI180Scan, 
  getAI180Scans, 
  saveAI180Style, 
  getAI180StylesForScan,
  deleteAI180Style
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
};const formatStyleName = (id: string | undefined): string => {
  if (!id) return 'Original';
  const clean = id.replace(/^(hair|beard|outfit|eyecolor|makeup)_/, '');
  return clean.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const ensureScanMetadata = (scan: AI180Scan): AI180FrameMetadata[] => {
  if (scan.metadata && scan.metadata.length > 0) {
    return scan.metadata;
  }
  
  // Fallback metadata calculation if metadata is missing or empty
  const len = scan.sourceFrames?.length || 7;
  return new Array(len).fill(null).map((_, i) => {
    const stepSize = len > 1 ? 180 / (len - 1) : 22.5;
    const yaw = Math.round(-90 + (i * stepSize));
    const side = yaw < -15 ? "left" : yaw > 15 ? "right" : "front";
    const viewLabel =
      yaw <= -75 ? "left-profile" :
      yaw <= -45 ? "left-3q" :
      yaw <= -15 ? "front-left" :
      yaw <= 15 ? "front" :
      yaw <= 45 ? "front-right" :
      yaw <= 75 ? "right-3q" : "right-profile";
    return { index: i, yaw, side, viewLabel } as AI180FrameMetadata;
  });
};

export const AI180Viewer: React.FC<AI180ViewerProps> = ({
  uid,
  appState,
  onUpdateState,
  onClose
}) => {
  const [viewState, setViewState] = useState<'intro' | 'capture' | 'customization' | 'generating' | 'viewer' | 'error'>(
    appState.activeAI180Favorite ? 'viewer' : (appState.activeAI180ScanId ? 'generating' : 'intro')
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
  const [isSavingFavorite, setIsSavingFavorite] = useState<boolean>(false);
  // Viewer states
  const [styledFrames, setStyledFrames] = useState<string[]>([]);
  const [activeFrameIdx, setActiveFrameIdx] = useState<number>(3); // Default to Front view (index 3)
  const [isPreloading, setIsPreloading] = useState<boolean>(false);
  const [hasSwiped, setHasSwiped] = useState<boolean>(false);
  const [isParamsExpanded, setIsParamsExpanded] = useState<boolean>(false);
  // Favorite synchronization states
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [currentSavedDocId, setCurrentSavedDocId] = useState<string | null>(null);

  // Drag interaction refs
  const dragStartX = useRef<number>(0);
  const startFrameIdx = useRef<number>(3);
  const startYaw = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Slider interaction states & refs
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const lastInteractionTime = useRef<number>(Date.now());
  const [idleOffset, setIdleOffset] = useState<number>(0);

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

  // Idle nudge animation hook
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let intervalId: any;
    let animationTimeoutId: any;
    
    const runNudgeAnimation = () => {
      if (isInteracting || Date.now() - lastInteractionTime.current < 2500) {
        return;
      }
      
      // Shift left by 6px
      setIdleOffset(-6);
      
      animationTimeoutId = setTimeout(() => {
        // Shift right by 6px
        setIdleOffset(6);
        
        animationTimeoutId = setTimeout(() => {
          // Return to center
          setIdleOffset(0);
        }, 350);
      }, 350);
    };

    // Poll every 5 seconds
    intervalId = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionTime.current;
      if (timeSinceLastInteraction > 2500 && !isInteracting) {
        runNudgeAnimation();
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(animationTimeoutId);
    };
  }, [isInteracting]);

  // Log metadata debug table in development/console
  useEffect(() => {
    if (viewState === 'viewer' && selectedScan) {
      const meta = ensureScanMetadata(selectedScan);
      const sortedMeta = [...meta].sort((a, b) => a.yaw - b.yaw);
      console.log("=== AI 180° VIEW METADATA DEBUG TABLE ===");
      console.table(
        sortedMeta.map((m, sortedIdx) => ({
          finalViewerPosition: sortedIdx,
          originalIndex: m.index,
          yaw: `${m.yaw}°`,
          side: m.side,
          viewLabel: m.viewLabel,
          url: styledFrames[m.index] ? `${styledFrames[m.index].substring(0, 40)}...` : 'N/A'
        }))
      );
    }
  }, [viewState, selectedScan, styledFrames]);

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

  // Update favorited state when style selections or parent favorited list changes
  useEffect(() => {
    if (viewState === 'viewer' && styledFrames.length > 0) {
      const aestheticsMap: Record<string, number> = {};
      if (appState.selectedTreatments) {
        appState.selectedTreatments.forEach(t => {
          if (t.value > 0) {
            aestheticsMap[t.treatmentId] = t.value * 20;
          }
        });
      }

      const dbHairStyle = appState.selectedHairStyle?.id || selectedHair || 'original';
      const dbHairColor = appState.selectedHairColor?.id || selectedColor || 'natural';
      const dbBeardStyle = appState.gender === 'male' ? (appState.selectedBeardStyle?.id || selectedBeard || 'beard_none') : 'none';
      const dbBeardColor = appState.gender === 'male' ? (appState.selectedBeardColor?.id || selectedBeardColor || 'natural') : 'none';
      const dbOutfit = appState.selectedOutfit?.id || selectedOutfit || 'original';
      const dbMakeup = appState.selectedMakeup?.id || 'makeup_none';

      const existingFav = appState.favoritedCreations?.find(c => 
        (c.hairStyle || 'original') === dbHairStyle &&
        (c.hairColor || 'natural') === dbHairColor &&
        (c.beardStyle || (appState.gender === 'male' ? 'beard_none' : 'none')) === dbBeardStyle &&
        (c.beardColor || (appState.gender === 'male' ? 'natural' : 'none')) === dbBeardColor &&
        (c.outfit || 'original') === dbOutfit &&
        (c.makeup || 'makeup_none') === dbMakeup &&
        c.gender === appState.gender
      );

      if (existingFav && existingFav.id) {
        setIsFavorited(true);
        setCurrentSavedDocId(existingFav.id);
      } else {
        setIsFavorited(false);
        setCurrentSavedDocId(null);
      }
    }
  }, [
    viewState, 
    styledFrames, 
    appState.favoritedCreations, 
    selectedHair, 
    selectedColor, 
    selectedBeard, 
    selectedBeardColor, 
    selectedOutfit, 
    appState.selectedHairStyle, 
    appState.selectedHairColor, 
    appState.selectedBeardStyle, 
    appState.selectedBeardColor, 
    appState.selectedOutfit, 
    appState.selectedMakeup, 
    appState.selectedTreatments, 
    appState.gender
  ]);



  // Handle loading a previously saved/favorited 180° preview directly
  useEffect(() => {
    if (appState.activeAI180Favorite) {
      const fav = appState.activeAI180Favorite;
      console.log("[AI180Viewer] Loading favorited 180-preview directly:", fav);
      let framesList = fav.frames;
      if (!framesList || framesList.length === 0) {
        console.warn("[AI180Viewer] fav.frames is missing or empty. Creating fallback 7-frame list using generatedImageUrl.");
        const fallbackUrl = fav.generatedImageUrl || fav.imageUrl || '';
        framesList = new Array(7).fill(null).map((_, idx) => ({
          imageUrl: fallbackUrl,
          sortIndex: idx,
          yaw: Math.round(-90 + (idx * 30)),
          side: idx < 3 ? 'left' : idx > 3 ? 'right' : 'front',
          viewLabel: idx === 0 ? 'left-profile' : idx === 1 ? 'left-3q' : idx === 2 ? 'front-left' : idx === 3 ? 'front' : idx === 4 ? 'front-right' : idx === 5 ? 'right-3q' : 'right-profile'
        }));
      }

      if (framesList && framesList.length > 0) {
        // Sort and extract frames from structured object array
        const sortedFavFrames = [...framesList].map((f, i) => {
          if (typeof f === 'string') {
            return {
              imageUrl: f,
              sortIndex: i,
              yaw: Math.round(-90 + (i * (180 / (framesList.length - 1 || 6)))),
              viewLabel: i === 0 ? 'left-profile' : i === 1 ? 'left-3q' : i === 2 ? 'front-left' : i === 3 ? 'front' : i === 4 ? 'front-right' : i === 5 ? 'right-3q' : 'right-profile',
              side: i < 3 ? 'left' : i > 3 ? 'right' : 'front'
            };
          }
          return f;
        }).sort((a, b) => a.sortIndex - b.sortIndex);

        const urls = sortedFavFrames.map(f => f.imageUrl);
        setStyledFrames(urls);
        setActiveFrameIdx(Math.floor(urls.length / 2)); // Reset to front view (middle index)
        setViewState('viewer');

        const reconstructedMetadata = fav.angleMetadata && fav.angleMetadata.length > 0
          ? fav.angleMetadata
          : sortedFavFrames.map((f, idx) => ({
              index: idx,
              yaw: f.yaw,
              side: f.side as 'left' | 'right' | 'front',
              viewLabel: f.viewLabel as any
            }));

        // Reconstruct a mock scan session
        const mockScan: AI180Scan = {
          id: fav.sessionId || `mock_session_${Date.now()}`,
          userId: uid,
          createdAt: fav.timestamp || new Date().toISOString(),
          sourceFrames: new Array(framesList.length).fill(fav.originalImageUrl || ''),
          version: '1.0',
          metadata: reconstructedMetadata
        };
        setSelectedScan(mockScan);

        // Populate customization states
        if (fav.hairStyle) setSelectedHair(fav.hairStyle);
        if (fav.hairColor) setSelectedColor(fav.hairColor);
        if (fav.beardStyle) setSelectedBeard(fav.beardStyle);
        if (fav.beardColor) setSelectedBeardColor(fav.beardColor);
        if (fav.outfit) setSelectedOutfit(fav.outfit);
      }
    }
  }, [appState.activeAI180Favorite, uid]);


  useEffect(() => {
    if (appState.activeAI180ScanId && !appState.activeAI180Favorite) {
      const runImmediateGeneration = async () => {
        try {
          let scanId = appState.activeAI180ScanId;
          let list = await getAI180Scans(uid);
          let scan = list.find(s => s.id === scanId);
          if (!scan) {
            setViewState('generating');
            setGenProgress(10);
            setGenMessage('Finalizing scan upload...');
            if ((window as any).activeAI180UploadPromise) {
              try {
                const bgResult = await (window as any).activeAI180UploadPromise;
                if (bgResult.scanId === scanId || scanId.startsWith('temp_')) {
                  scanId = bgResult.scanId;
                  onUpdateState({ activeAI180ScanId: scanId });
                  scan = {
                    id: scanId,
                    userId: uid,
                    createdAt: new Date().toISOString(),
                    sourceFrames: bgResult.urls || bgResult.sortedFrames,
                    metadata: bgResult.sortedMeta,
                    version: '1.0'
                  };
                }
              } catch (e) {
                console.error("[AI180Viewer] speculative background upload promise failed:", e);
              }
            }

            if (!scan) {
              const cached = (window as any).localScanFramesCache?.[scanId];
              if (cached && cached.length > 0) {
                scan = {
                  id: scanId,
                  userId: uid,
                  createdAt: new Date().toISOString(),
                  sourceFrames: cached,
                  metadata: [],
                  version: '1.0'
                };
              }
            }
          }
          if (scan) {
            setSelectedScan(scan);
            setViewState('generating');
            setGenProgress(15);
            setGenMessage('Initializing Try-on Generator...');
            const aestheticsMap: Record<string, number> = {};
            if (appState.selectedTreatments) {
              appState.selectedTreatments.forEach(t => {
                if (t.value > 0) {
                  aestheticsMap[t.treatmentId] = t.value * 20;
                }
              });
            }

            const styleSnapshot = {
              hairstyleId: appState.selectedHairStyle?.id || 'original',
              hairColorId: appState.selectedHairColor?.id || 'natural',
              beardId: appState.selectedBeardStyle?.id || 'beard_none',
              beardColorId: appState.selectedBeardColor?.id || 'natural',
              aesthetics: aestheticsMap,
              makeup: appState.selectedMakeup?.id || 'makeup_none',
              outfitId: appState.selectedOutfit?.id || 'original',
              eyeColorId: appState.selectedEyeColor?.id || 'eyecolor_original'
            };

            // 1. Check in-memory cache first for instant transition
            const cachedStyled = getCachedAI180Preview(scan.id, styleSnapshot);
            if (cachedStyled && cachedStyled.length > 0) {
              setStyledFrames(cachedStyled);
              setActiveFrameIdx(3);
              setCurrentYaw(0);
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
              setActiveFrameIdx(3);
              setCurrentYaw(0);
              setViewState('viewer');
              return;
            }

            setGenProgress(30);
            const cachedFrames = (window as any).localScanFramesCache?.[scan.id] || (window as any).localScanFramesCache?.[appState.activeAI180ScanId];
            const sourceFrames = (cachedFrames && cachedFrames.length > 0)
              ? cachedFrames
              : (scan.sourceFrames && scan.sourceFrames.length > 0 ? scan.sourceFrames : []);

            if (!sourceFrames || sourceFrames.length === 0) {
              throw new Error("Active 180° scan frames could not be found");
            }
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
      setGenProgress(8);
      setGenMessage('Analyzing face rotation angles...');
      
      // Analyze rotation angles using Gemini
      const metadata = await analyzeScanAngles(anchors);
      
      setGenProgress(10);
      setGenMessage('Uploading scan frames to storage...');

      // Upload frames to Firebase Storage and get public HTTPS URLs
      const uploadPromises = anchors.map((base64) => 
        uploadImageToStorage(uid, base64, 'original')
      );
      const urls = await Promise.all(uploadPromises);

      setGenProgress(15);
      setGenMessage('Saving scan metadata...');

      const updatedMetadata = metadata.map(m => ({ ...m }));

      // 2. Save scan to Firestore (using storage URLs instead of heavy base64 strings)
      const scanId = await saveAI180Scan(uid, {
        userId: uid,
        sourceFrames: urls,
        metadata: updatedMetadata,
        createdAt: new Date().toISOString(),
        version: '1.0'
      });

      const newScan: AI180Scan = {
        id: scanId,
        userId: uid,
        sourceFrames: urls,
        metadata: updatedMetadata,
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

  const handleStartGeneration = async (scanOverride?: AI180Scan, forceRegenerate?: boolean) => {
    const scan = scanOverride || selectedScan;
    if (!scan) {
      alert('Please perform a scan first!');
      return;
    }

    setIsFavorited(false);
    setCurrentSavedDocId(null);

    const aestheticsMap: Record<string, number> = {};
    if (appState.selectedTreatments) {
      appState.selectedTreatments.forEach(t => {
        if (t.value > 0) {
          aestheticsMap[t.treatmentId] = t.value * 20;
        }
      });
    }

    const styleSnapshot = {
      hairstyleId: appState.selectedHairStyle?.id || selectedHair,
      hairColorId: appState.selectedHairColor?.id || selectedColor,
      beardId: appState.selectedBeardStyle?.id || selectedBeard,
      beardColorId: appState.selectedBeardColor?.id || selectedBeardColor,
      aesthetics: aestheticsMap,
      makeup: appState.selectedMakeup?.id || 'makeup_none',
      outfitId: appState.selectedOutfit?.id || selectedOutfit,
      eyeColorId: appState.selectedEyeColor?.id || 'eyecolor_original'
    };

    const aestheticsHash = Object.entries(styleSnapshot.aesthetics || {})
      .filter(([_, val]) => val > 0)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([id, val]) => `${id}:${val}`)
      .join(',');
    const eyeColor = styleSnapshot.eyeColorId || 'eyecolor_original';
    const cacheKey = `${scan.id}_h:${styleSnapshot.hairstyleId}_c:${styleSnapshot.hairColorId}_b:${styleSnapshot.beardId}_bc:${styleSnapshot.beardColorId}_o:${styleSnapshot.outfitId}_m:${styleSnapshot.makeup}_ae:${aestheticsHash}_eye:${eyeColor}`;

    if (forceRegenerate) {
      delete generationCache[cacheKey];
      await deleteAI180Style(uid, scan.id, styleSnapshot);
    } else {
      // 1. Check in-memory cache first for instant transition
      const cachedStyled = getCachedAI180Preview(scan.id, styleSnapshot);
      if (cachedStyled && cachedStyled.length > 0) {
        setStyledFrames(cachedStyled);
        setActiveFrameIdx(4);
        setViewState('viewer');
        return;
      }
    }

    setViewState('generating');
    setGenProgress(20);
    setGenMessage(forceRegenerate ? 'Regenerating styled frames...' : 'Checking for saved styles...');

    try {
      if (!forceRegenerate) {
        // 2. Query Firestore/LocalStorage styles next
        const savedStyles = await getAI180StylesForScan(uid, scan.id);
        const matchingStyle = findMatchingSavedStyle(savedStyles, styleSnapshot);
        if (matchingStyle && matchingStyle.generatedFrames && matchingStyle.generatedFrames.length > 0) {
          setGenProgress(60);
          setGenMessage('Retrieving previously generated look...');
          await preloadImages(matchingStyle.generatedFrames);
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
    }

      setGenProgress(35);
      setGenMessage('Initializing try-on generator...');
      const cachedFrames = (window as any).localScanFramesCache?.[scan.id] || (window as any).localScanFramesCache?.[appState.activeAI180ScanId];
      const sourceFrames = (cachedFrames && cachedFrames.length > 0)
        ? cachedFrames
        : (scan.sourceFrames && scan.sourceFrames.length > 0 ? scan.sourceFrames : []);

      if (!sourceFrames || sourceFrames.length === 0) {
        throw new Error("Active 180° scan frames could not be found");
      }
      // Execute 9-view generation loop
      const resolvedMetadata = ensureScanMetadata(scan);
      const results = await generateAI180Preview(
        uid,
        scan.id,
        sourceFrames,
        styleSnapshot,
        appState,
        (percent, msg) => {
          setGenProgress(percent);
          setGenMessage(msg);
        },
        resolvedMetadata
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
      setActiveFrameIdx(3); // Reset to front view
      setCurrentYaw(0);
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
    if (isSavingFavorite) {
      console.log("[handleToggleFavorite] Operation in progress, ignoring click.");
      return;
    }
    setIsSavingFavorite(true);

    console.log("=== 180 FAVORITE TAP RECEIVED ===");
    console.log("Current user UID:", uid);
    console.log("Current 180° session ID (sessionId):", selectedScan?.id);
    console.log("Current active frame index:", activeFrameIdx);
    console.log("Current active styled frame URL:", styledFrames[activeFrameIdx]);
    console.log("Current favorited state:", isFavorited);
    console.log("Current saved document ID:", currentSavedDocId);
    console.log("Is handler function defined:", typeof handleToggleFavorite === 'function');

    const previousFavoritedState = isFavorited;
    const previousSavedDocId = currentSavedDocId;

    if (isFavorited && currentSavedDocId) {
      // Optimistically update UI
      setIsFavorited(false);
      setCurrentSavedDocId(null);
      if (appState.favoritedCreations) {
        onUpdateState({
          favoritedCreations: appState.favoritedCreations.filter(c => c.id !== currentSavedDocId)
        });
      }

      console.log(`[handleToggleFavorite] Unfavoriting initiated for docId: "${currentSavedDocId}"`);
      try {
        await toggleFavorite(uid, currentSavedDocId, false);
        console.log(`[handleToggleFavorite] Unfavoriting Firestore success!`);
      } catch (err: any) {
        console.error(`[handleToggleFavorite] Unfavoriting failed! Reverting optimistic state. Error details:`, err);
        setIsFavorited(previousFavoritedState);
        setCurrentSavedDocId(previousSavedDocId);
        if (appState.favoritedCreations) {
          onUpdateState({
            favoritedCreations: [...appState.favoritedCreations]
          });
        }
        alert("Couldn't remove favorite: " + (err.message || err));
      } finally {
        setIsSavingFavorite(false);
      }
    } else {
      // Optimistically update UI
      setIsFavorited(true);

      try {
        const frontIdx = 3;
        // Map each styled frame to its explicit metadata object
        const savedFrames = styledFrames.map((url, idx) => {
          return {
            imageUrl: url,
            yaw: Math.round(-90 + (idx * 30)),
            viewLabel: idx === 0 ? 'left-profile' : idx === 1 ? 'left-3q' : idx === 2 ? 'front-left' : idx === 3 ? 'front' : idx === 4 ? 'front-right' : idx === 5 ? 'right-3q' : 'right-profile',
            side: idx < 3 ? 'left' : idx > 3 ? 'right' : 'front',
            sortIndex: idx
          };
        });

        // Define full 180° preview data model
        const docData: SavedGeneration = {
          originalImageUrl: selectedScan?.sourceFrames[frontIdx] || "", // Front original frame as baseline
          generatedImageUrl: styledFrames[activeFrameIdx] || styledFrames[frontIdx] || "", // Currently active stylized view
          hairStyle: selectedHair || 'original',
          hairColor: selectedColor || 'natural',
          beardStyle: appState.gender === 'male' ? (selectedBeard || 'beard_none') : 'none',
          beardColor: appState.gender === 'male' ? (selectedBeardColor || 'natural') : 'none',
          outfit: selectedOutfit || 'original',
          makeup: appState.selectedMakeup?.id || 'makeup_none',
          eyeColor: appState.selectedEyeColor?.id || 'eyecolor_original',
          treatments: appState.selectedTreatments || [],
          customPrompt: appState.customPrompt || '',
          gender: appState.gender,
          isFavorite: true,
          
          type: "180-preview",
          sessionId: selectedScan?.id || `scan_${Date.now()}`,
          frontImage: styledFrames[frontIdx] || "",
          frames: savedFrames,
          angleMetadata: savedFrames.map((f, idx) => ({
            index: idx,
            yaw: f.yaw,
            side: f.side as 'left' | 'right' | 'front',
            viewLabel: f.viewLabel as any
          })),
          appliedParameters: {
            hairStyle: selectedHair || 'original',
            hairColor: selectedColor || 'natural',
            beardStyle: selectedBeard || 'beard_none',
            beardColor: selectedBeardColor || 'natural',
            outfit: selectedOutfit || 'original',
            makeup: appState.selectedMakeup?.id || 'makeup_none',
            eyeColor: appState.selectedEyeColor?.id || 'eyecolor_original',
            treatments: appState.selectedTreatments || [],
            customPrompt: appState.customPrompt || ''
          }
        };

        // Filter undefined properties before writing to database
        const sanitizedDocData = JSON.parse(JSON.stringify(docData, (k, v) => v === undefined ? null : v));
        console.log(`[handleToggleFavorite] Favoriting initiated. Payload details:`, sanitizedDocData);

        const docId = await saveGeneration(uid, sanitizedDocData);
        console.log(`[handleToggleFavorite] Favoriting saveGeneration success! Generated docId: "${docId}"`);
        setCurrentSavedDocId(docId);

        // Sync local parent creations list
        const newGen = { id: docId, ...sanitizedDocData };
        onUpdateState({
          favoritedCreations: [newGen, ...(appState.favoritedCreations || [])]
        });
      } catch (err: any) {
        console.error(`[handleToggleFavorite] Favoriting failed! Reverting optimistic state. Error details:`, err);
        setIsFavorited(false);
        setCurrentSavedDocId(null);
        alert("Couldn't save favorite: " + (err.message || err));
      } finally {
        setIsSavingFavorite(false);
      }
    }
  };

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const width = rect.width;
    const offsetX = Math.max(0, Math.min(width, clientX - rect.left));
    const percent = offsetX / width;
    
    // Map percent 0 (Left/L) to index 0 (Left Profile), percent 1 (Right/R) to index 6
    const maxIdx = 6;
    const targetIdx = Math.max(0, Math.min(maxIdx, Math.round(percent * maxIdx)));
    
    if (targetIdx !== activeFrameIdx) {
      setActiveFrameIdx(targetIdx);
      if (!hasSwiped) setHasSwiped(true);
    }
    lastInteractionTime.current = Date.now();
    setIsInteracting(true);
    setIdleOffset(0);
  };

  const handleSliderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSliderMove(e.clientX);
  };

  const handleSliderTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 1) {
      setIsInteracting(true);
      setIdleOffset(0);
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleSliderTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 1) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleInteractionEnd = () => {
    setIsInteracting(false);
    lastInteractionTime.current = Date.now();
  };

  const handleTouchEnd = () => {
    handleInteractionEnd();
  };

  const handleMouseUp = () => {
    handleInteractionEnd();
  };

  // Drag interaction handlers
  const handleDragStart = (clientX: number) => {
    setIsInteracting(true);
    setIdleOffset(0);
    lastInteractionTime.current = Date.now();
    dragStartX.current = clientX;
    startFrameIdx.current = activeFrameIdx;
    startYaw.current = -90 + (activeFrameIdx * 30);
  };
  const handleDragMove = (clientX: number) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const diffX = clientX - dragStartX.current;
    
    // Map movement to yaw degrees (-90 to +90)
    let targetYaw = startYaw.current + (diffX / width) * 180;
    targetYaw = Math.max(-90, Math.min(90, targetYaw));
    
    const getIndexFromYaw = (yaw: number, currentIdx: number): number => {
      const midpoints = [-75, -45, -15, 15, 45, 75];
      const hysteresis = 4;
      
      let tempIdx = currentIdx;
      while (tempIdx > 0 && yaw < midpoints[tempIdx - 1] - (tempIdx === currentIdx ? hysteresis : 0)) {
        tempIdx--;
      }
      while (tempIdx < 6 && yaw > midpoints[tempIdx] + (tempIdx === currentIdx ? hysteresis : 0)) {
        tempIdx++;
      }
      return tempIdx;
    };

    const targetIdx = getIndexFromYaw(targetYaw, activeFrameIdx);
    
    if (targetIdx !== activeFrameIdx) {
      setActiveFrameIdx(targetIdx);
      if (!hasSwiped) {
        setHasSwiped(true);
      }
    }
    
    lastInteractionTime.current = Date.now();
    setIsInteracting(true);
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

  // Double-tap to return to center front (0°)
  const lastTap = useRef<number>(0);
  const handleDoubleTap = () => {
    setActiveFrameIdx(Math.floor(styledFrames.length / 2) || 3);
    lastInteractionTime.current = Date.now();
  };
  const handleTouchStartWithDoubleTap = (e: React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      handleDoubleTap();
    }
    lastTap.current = now;
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX);
    }
  };
  // Abstraction layer to warp or interpolate between views
  const generateIntermediateViews = () => {
    if (styledFrames.length === 0) return '';
    return styledFrames[activeFrameIdx] || styledFrames[3] || '';
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
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Capture Guided 180° Preview</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This feature runs a 10-second guided capture to extract 9 viewpoints of your face and hair, generating your custom styling results across multiple views using the Gemini AI pipeline.
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
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStartWithDoubleTap}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onDoubleClick={handleDoubleTap}
          >
            <style>{`
              @keyframes border-rotate {
                100% {
                  transform: rotate(360deg);
                }
              }
              .rgb-pill-container {
                position: relative;
                border-radius: 9999px;
                padding: 1px; /* border thickness */
                overflow: hidden;
                display: inline-flex;
                align-items: center;
                justify-content: center;
              }
              .rgb-pill-bg {
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: conic-gradient(
                  from 0deg,
                  #fbbf24 0%,
                  #d97706 25%,
                  #8b5cf6 50%,
                  #ec4899 75%,
                  #fbbf24 100%
                );
                animation: border-rotate 4s linear infinite;
                z-index: 0;
              }
              .rgb-pill-content {
                position: relative;
                z-index: 1;
                background-color: rgba(9, 9, 11, 0.85); /* Dark translucent background */
                border-radius: 9999px;
                height: 100%;
                width: 100%;
                display: flex;
                align-items: center;
                gap: 6px;
              }
            `}</style>

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
            <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-[calc(env(safe-area-inset-top,20px)+24px)] flex justify-between items-center pointer-events-none">
              
              {/* Left: Back button */}
              <div className="pointer-events-auto">
                <button 
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-xs font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all"
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
              </div>

              {/* Center: Title Pill with RGB Outline Animation */}
              <div className="pointer-events-none">
                <div className="rgb-pill-container h-10 px-[1px] py-[1px] shadow-lg">
                  <div className="rgb-pill-bg" />
                  <div className="rgb-pill-content px-5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 whitespace-nowrap">
                      180° PREVIEW
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Heart & Download Grouping */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Favorite (Heart) Button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-xl transition-all active:scale-90 shadow-lg ${
                    isFavorited
                      ? 'bg-black/40 border-rose-500/25 text-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                      : 'bg-black/40 border-white/10 text-white hover:bg-black/60'
                  }`}
                  title="Favorite Look"
                >
                  <svg 
                    width={16} 
                    height={16} 
                    fill={isFavorited ? "currentColor" : "none"} 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2}
                    className={`transition-all duration-300 ${isFavorited ? 'scale-110 text-rose-500' : 'text-white'}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                {/* Download Button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDownloadFrame(); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all shadow-lg"
                  title="Save View to Camera Roll"
                >
                  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>

                {/* Regenerate Button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleStartGeneration(undefined, true); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all shadow-lg hover:text-amber-400"
                  title="Regenerate Look"
                >
                  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Collapsible Applied Parameters Drawer */}
            {appState.activeAI180Favorite && (
              <div className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px)+120px)] left-4 right-4 z-30 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
                {/* Header */}
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsParamsExpanded(!isParamsExpanded); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-full px-4 py-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-neutral-300 border-b border-white/5 active:bg-white/5 transition-colors"
                >
                  <span className="text-neutral-200">Applied Parameters</span>
                  <svg 
                    className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-300 ${isParamsExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Content */}
                {isParamsExpanded && (
                  <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-left animate-in slide-in-from-bottom duration-300">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">Hairstyle</span>
                      <span className="text-xs font-bold text-white/90 truncate">{formatStyleName(appState.activeAI180Favorite.hairStyle || 'original')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">Hair Color</span>
                      <span className="text-xs font-bold text-white/90 truncate">{formatStyleName(appState.activeAI180Favorite.hairColor || 'natural')}</span>
                    </div>
                    {appState.activeAI180Favorite.gender === 'male' && (
                      <>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">Beard Style</span>
                          <span className="text-xs font-bold text-white/90 truncate">{formatStyleName(appState.activeAI180Favorite.beardStyle || 'beard_none')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">Beard Color</span>
                          <span className="text-xs font-bold text-white/90 truncate">{formatStyleName(appState.activeAI180Favorite.beardColor || 'natural')}</span>
                        </div>
                      </>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">Outfit</span>
                      <span className="text-xs font-bold text-white/90 truncate">{formatStyleName(appState.activeAI180Favorite.outfit || 'original')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">Makeup</span>
                      <span className="text-xs font-bold text-white/90 truncate">{formatStyleName(appState.activeAI180Favorite.makeup || 'makeup_none')}</span>
                    </div>
                    <div className="flex flex-col col-span-2">
                      <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">Eye Color</span>
                      <span className="text-xs font-bold text-white/90 truncate">{formatStyleName(appState.activeAI180Favorite.eyeColor || 'eyecolor_original')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Floating Bottom Glass Bar Container */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/40 backdrop-blur-xl border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] px-6 flex flex-col items-center gap-4 pointer-events-auto">
              
              {/* Subtle Swipe rotation indicator text */}
              {!hasSwiped && (
                <div className="text-[10px] text-white/50 tracking-wider font-medium select-none pointer-events-none animate-pulse">
                  Swipe to rotate
                </div>
              )}

              {/* Subtle Active Slider Indicator */}
              <div className="w-full max-w-[80%] flex items-center justify-between gap-3 select-none">
                <span className="text-[9px] font-bold text-white/30 tracking-widest">L</span>
                
                {/* Track */}
                <div 
                  ref={sliderRef}
                  onClick={handleSliderClick}
                  onTouchStart={handleSliderTouchStart}
                  onTouchMove={handleSliderTouchMove}
                  onTouchEnd={(e) => { e.stopPropagation(); handleTouchEnd(); }}
                  onTouchCancel={(e) => { e.stopPropagation(); handleTouchEnd(); }}
                  className="flex-1 h-3 flex items-center relative cursor-pointer group"
                >
                  {/* Track Background */}
                  <div className="w-full h-[2px] bg-white/10 rounded-full group-hover:bg-white/20 transition-colors relative">
                    {/* Center tick */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/30" />
                  </div>

                  {/* Active Thumb */}
                  <div 
                    style={{
                      left: `${(activeFrameIdx / (styledFrames.length - 1 || 6)) * 100}%`,
                      transform: `translate(-50%, -50%) ${idleOffset !== 0 ? `translateX(${idleOffset}px)` : ''}`,
                      transition: isInteracting ? 'none' : 'left 0.15s ease-out, transform 0.3s ease'
                    }}
                    className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] border border-neutral-800 cursor-grab active:cursor-grabbing transition-shadow hover:scale-110"
                  />
                </div>
                
                <span className="text-[9px] font-bold text-white/30 tracking-widest">R</span>
              </div>

              {/* Back to Editor CTA Button */}
              <div className="w-full max-w-[280px]">
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
                onClick={onClose}
                className="w-full py-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-black uppercase tracking-widest transition text-white/80"
              >
                Return to Editor
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
