import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, StyleOption, Gender, AppMode, SelectedTreatment } from '../types';
import { CUSTOM_LOOK_PRESETS, CustomLookPreset } from '../constants/customLooks';
import { Icons, HAIR_STYLES_MALE, HAIR_STYLES_FEMALE, BEARD_STYLES, HAIR_COLORS, BEARD_COLORS, OUTFIT_STYLES, MAKEUP_STYLES } from '../constants';
import { generateStylePreview, GenerationError } from '../services/geminiService';
import { auth, saveGeneration, uploadImageToStorage, toggleFavorite, SavedGeneration } from '../services/firebase';
import { 
  consumeCredit,
} from '../services/billingService';
import { AESTHETIC_TREATMENTS } from '../constants/aesthetics';
import { purchasePremium } from '../services/iapService';
import { PaywallView } from './PaywallView';
import { triggerAppStoreReview } from '../services/rateService';
import { downloadOrShareImage } from '../services/shareService';
import {
  MALE_HAIR_PREVIEWS,
  FEMALE_HAIR_PREVIEWS,
  COLOR_PREVIEWS,
  MALE_BEARD_PREVIEWS,
  MALE_OUTFIT_PREVIEWS,
  FEMALE_OUTFIT_PREVIEWS,
  MALE_MAKEUP_PREVIEWS,
  FEMALE_MAKEUP_PREVIEWS,
  EYE_COLOR_PREVIEWS
} from '../services/previews';

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



const getColorHexValue = (colorId: string): string => {
  const map: Record<string, string> = {
    original: 'linear-gradient(135deg, #64748b, #334155)',
    match: 'linear-gradient(135deg, #a855f7, #6366f1)',
    black: '#0f172a',
    darkbrown: '#27160c',
    brown: '#4a2c11',
    lightbrown: '#784315',
    blonde: '#eab308',
    platinum: '#e2e8f0',
    red: '#ea580c',
    auburn: '#7f1d1d',
    grey: '#94a3b8',
    white: '#f8fafc',
    blue: '#2563eb',
    green: '#16a34a',
    pink: '#db2777',
    blonde_highlights: 'linear-gradient(135deg, #eab308 0%, #4a2c11 100%)',
    brown_highlights: 'linear-gradient(135deg, #784315 0%, #0f172a 100%)',
    platinum_highlights: 'linear-gradient(135deg, #e2e8f0 0%, #4a2c11 100%)',
    blue_highlights: 'linear-gradient(135deg, #2563eb 0%, #0f172a 100%)',
    pink_highlights: 'linear-gradient(135deg, #db2777 0%, #0f172a 100%)',
    blonde_ombre: 'linear-gradient(180deg, #4a2c11 0%, #eab308 100%)',
    brown_ombre: 'linear-gradient(180deg, #0f172a 0%, #784315 100%)',
    red_ombre: 'linear-gradient(180deg, #4a2c11 0%, #ea580c 100%)',
    blue_ombre: 'linear-gradient(180deg, #0f172a 0%, #2563eb 100%)',
    pink_ombre: 'linear-gradient(180deg, #0f172a 0%, #db2777 100%)',
  };
  return map[colorId] || '#475569';
};

const getPreviewConfig = (treatmentId: string) => {
  const treat = AESTHETIC_TREATMENTS.find(t => t.id === treatmentId);
  const maxVal = treat ? Math.max(...treat.steps.map(s => s.value)) : 1.0;

  switch (treatmentId) {
    case 'lip_filler':
    case 'lip_flip':
      return {
        source: '/presets/aesthetics/female_lip_filler.jpg',
        position: '50% 68%',
        zoom: 'scale-[2.4]',
        maxVal
      };
    case 'cheek_filler':
    case 'jaw_contour':
    case 'masseter_botox':
      return {
        source: '/presets/aesthetics/female_cheek_jaw_filler.jpg',
        position: '68% 62%',
        zoom: 'scale-[2.0]',
        maxVal
      };
    case 'chin_filler':
      return {
        source: '/presets/aesthetics/female_cheek_jaw_filler.jpg',
        position: '50% 82%',
        zoom: 'scale-[2.2]',
        maxVal
      };
    case 'nose_enhancement':
      return {
        source: '/presets/aesthetics/female_cheek_jaw_filler.jpg',
        position: '50% 48%',
        zoom: 'scale-[2.6]',
        maxVal
      };
    case 'botox_forehead':
    case 'botox_frown':
    case 'brow_lift':
    case 'temple_filler':
      return {
        source: '/presets/aesthetics/female_botox.jpg',
        position: '50% 24%',
        zoom: 'scale-[2.0]',
        maxVal
      };
    case 'botox_crow':
    case 'undereye_filler':
      return {
        source: '/presets/aesthetics/female_botox.jpg',
        position: '62% 40%',
        zoom: 'scale-[2.3]',
        maxVal
      };
    default:
      return {
        source: '/presets/aesthetics/female_skin_glow.jpg',
        position: '62% 52%',
        zoom: 'scale-[1.8]',
        maxVal
      };
  }
};

interface EditorErrorBoundaryProps {
  fallback: (error: Error, reset: () => void) => React.ReactNode;
  children: React.ReactNode;
}

interface EditorErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class EditorErrorBoundary extends React.Component<EditorErrorBoundaryProps, EditorErrorBoundaryState> {
  public state: EditorErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): EditorErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("EditorErrorBoundary caught a fatal crash:", error, errorInfo);
  }

  private reset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }
    return this.props.children;
  }
}

interface PhotoEditorProps {
  uid: string;
  appState: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onTriggerAd?: () => void;
  favoritedStyles: any[];
  onToggleStyleFavorite: (style: any) => void;
  onOpenMenu: () => void;
  favoritedCreations: SavedGeneration[];
  onToggleLookFavorite: (generation: SavedGeneration, isFavorite: boolean) => Promise<void>;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ 
  uid, 
  appState, 
  onUpdateState, 
  onTriggerAd, 
  favoritedStyles, 
  onToggleStyleFavorite, 
  onOpenMenu,
  favoritedCreations,
  onToggleLookFavorite
}) => {
  const isAI180Mode = appState.editorMode === "ai_180";

  const [showOriginal, setShowOriginal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<'hair' | 'beard' | 'eyecolor' | 'outfit' | 'makeup' | 'aesthetics' | 'prompt'>('hair');
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<'Decades & Retro' | 'Sci-Fi & Cyber' | 'Fantasy & Myth' | 'Warriors & History' | 'Modern & High Fashion'>('Decades & Retro');
  
  // Aesthetics options tab states
  const [aestheticsCategory, setAestheticsCategory] = useState<string>('all');
  const [activeAestheticId, setActiveAestheticId] = useState<string>('lip_filler');

  // Firestore sync state
  const currentDocId = appState.currentDocId || null;
  const isFavorited = currentDocId ? favoritedCreations.some(c => c.id === currentDocId) : false;
  const [isSaving, setIsSaving] = useState(false);

  // Billing States
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // Dynamic Loading Progress Messages
  const [processingStep, setProcessingStep] = useState("Analyzing portrait details...");

  useEffect(() => {
    if (!appState.isProcessing) {
      setProcessingStep("Analyzing portrait details...");
      return;
    }
    const steps = [
      "Analyzing portrait details...",
      "Styling hair & facial features...",
      "Applying photorealistic textures...",
      "Finalizing high-resolution render..."
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setProcessingStep(steps[idx]);
    }, 2200);
    return () => clearInterval(interval);
  }, [appState.isProcessing]);

  // Split Slider & History State
  const [isSplitView, setIsSplitView] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const isDraggingSliderRef = useRef(false);
  const sliderContainerRef = useRef<HTMLDivElement | null>(null);

  const [hairCategory, setHairCategory] = useState('all');
  const [beardCategory, setBeardCategory] = useState('all');
  const [outfitCategory, setOutfitCategory] = useState('all');
  const [makeupCategory, setMakeupCategory] = useState('all');

  const isGeneratingRef = useRef(false);
  const latestRequestId = useRef(0);

  interface HistoryEntry {
    image: string;
    selectedHairStyle: any;
    selectedHairColor: any;
    selectedBeardStyle: any;
    selectedBeardColor: any;
    selectedOutfit: any;
    selectedMakeup: any;
    selectedTreatments: SelectedTreatment[];
    selectedCustomLookId: string | null;
    customLookVersion: number | null;
  }

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Reset local state when a new photo is loaded/replaced
  useEffect(() => {
    if (appState.originalImage) {
      setHistory([]);
      setHistoryIndex(-1);
      setIsSplitView(false);
      setErrorMsg(null);
    }
  }, [appState.originalImage]);

  // Sync image history when currentImage changes, storing the full customization state configuration
  useEffect(() => {
    if (appState.currentImage && (!history.length || history[historyIndex]?.image !== appState.currentImage)) {
      const newEntry: HistoryEntry = {
        image: appState.currentImage,
        selectedHairStyle: appState.selectedHairStyle,
        selectedHairColor: appState.selectedHairColor,
        selectedBeardStyle: appState.selectedBeardStyle,
        selectedBeardColor: appState.selectedBeardColor,
        selectedOutfit: appState.selectedOutfit,
        selectedMakeup: appState.selectedMakeup,
        selectedTreatments: appState.selectedTreatments || [],
        selectedCustomLookId: appState.selectedCustomLookId || null,
        customLookVersion: appState.customLookVersion || null,
      };
      setHistory(prev => [...prev.slice(0, historyIndex + 1), newEntry]);
      setHistoryIndex(prev => prev + 1);
    }
  }, [appState.currentImage]);

  // Touch & Mouse Drag Handlers for Split Slider
  const updateSplitPos = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSplitPosition(percent);
  }, []);

  const handleSliderStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingSliderRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    updateSplitPos(clientX);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingSliderRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      updateSplitPos(clientX);
    };

    const handleEnd = () => {
      isDraggingSliderRef.current = false;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [updateSplitPos]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      const entry = history[prevIdx];
      onUpdateState({
        currentImage: entry.image,
        selectedHairStyle: entry.selectedHairStyle,
        selectedHairColor: entry.selectedHairColor,
        selectedBeardStyle: entry.selectedBeardStyle,
        selectedBeardColor: entry.selectedBeardColor,
        selectedOutfit: entry.selectedOutfit,
        selectedMakeup: entry.selectedMakeup,
        selectedTreatments: entry.selectedTreatments,
        selectedCustomLookId: entry.selectedCustomLookId,
        customLookVersion: entry.customLookVersion,
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const entry = history[nextIdx];
      onUpdateState({
        currentImage: entry.image,
        selectedHairStyle: entry.selectedHairStyle,
        selectedHairColor: entry.selectedHairColor,
        selectedBeardStyle: entry.selectedBeardStyle,
        selectedBeardColor: entry.selectedBeardColor,
        selectedOutfit: entry.selectedOutfit,
        selectedMakeup: entry.selectedMakeup,
        selectedTreatments: entry.selectedTreatments,
        selectedCustomLookId: entry.selectedCustomLookId,
        customLookVersion: entry.customLookVersion,
      });
    }
  };

  // Manual Generation Handler
  // Manual Generation Handler
  const handleGenerate = useCallback(async () => {
    if (appState.editorMode === "ai_180") {
      onUpdateState({ showAI180Viewer: true });
      return;
    }

    if (!appState.originalImage) {
      onUpdateState({ isProcessing: false });
      return;
    }
    if (isGeneratingRef.current) return;
    
    const user = uid ? { uid } : null;
    const is180Mode = appState.editorMode === "interactive_180";

    // Enforce credits check
    const isCustomLook = !!appState.selectedCustomLookId || (!!appState.customPrompt && appState.customPrompt.trim().length > 0);
    const requiresCredit = !appState.isSubscriber || isCustomLook;

    if (requiresCredit && appState.credits <= 0) {
      setShowUpgradeModal(true);
      onUpdateState({ isProcessing: false });
      return;
    }
    
    isGeneratingRef.current = true;
    const requestId = ++latestRequestId.current;
    onUpdateState({ isProcessing: true });
    setIsControlsVisible(false); // Auto-hide controls when generating
    setErrorMsg(null);
    onUpdateState({ currentDocId: null });

    if (is180Mode) {
      if (!appState.current180Session || !appState.current180Session.frames) {
        alert("Missing active 180° session frames.");
        isGeneratingRef.current = false;
        onUpdateState({ isProcessing: false });
        setIsControlsVisible(true);
        return;
      }

      const jobId = "job_" + Math.random().toString(36).substr(2, 9);
      const previewId = "prev_" + Math.random().toString(36).substr(2, 9);
      let reservedTxId = "";

      // 60-second safety timeout for the entire 180° generation process
      const safetyTimeout = setTimeout(async () => {
        if (requestId === latestRequestId.current && isGeneratingRef.current) {
          console.warn("180° Generation safety timeout triggered (60s).");
          isGeneratingRef.current = false;
          onUpdateState({ isProcessing: false });
          setIsControlsVisible(true);
          setErrorMsg("Request timed out. Please try again.");
          if (uid && reservedTxId) {
            try {
              const w = await getUser360Wallet(uid);
              await refundCredit(uid, jobId, reservedTxId, w.subscriptionCredits ? "subscription" : "purchased");
            } catch (err) {
              console.error("Timeout refund failed:", err);
            }
          }
        }
      }, 60000);

      try {
        if (uid) {
          setProcessingStep("Reserving subscription credit...");
          reservedTxId = await reserveCredit(uid, jobId);
          // Sync credit balance
          const w = await getUser360Wallet(uid);
          const nextCredits = w.subscriptionCredits + w.purchasedCredits;
          onUpdateState({ credits: nextCredits });
        }

        const aestheticsMap: Record<string, number> = {};
        AESTHETIC_TREATMENTS.forEach(t => {
          const val = appState.selectedTreatments?.find(sel => sel.treatmentId === t.id)?.value || 0;
          aestheticsMap[t.id] = val * 20; // 0-5 to percent 0-100
        });

        // 1. Create one Locked Style Snapshot
        const styleSnapshot = {
          hairstyleId: appState.selectedHairStyle?.id || "male_hair_fade",
          hairColorId: appState.selectedHairColor?.id || "natural",
          beardId: appState.gender === Gender.MALE ? (appState.selectedBeardStyle?.id || "beard_none") : "none",
          beardColorId: appState.gender === Gender.MALE ? (appState.selectedBeardColor?.id || "natural") : "natural",
          aesthetics: aestheticsMap,
          makeup: appState.selectedMakeup?.id || "makeup_none",
          outfitId: appState.selectedOutfit?.id || "outfit_casual",
          eyeColorId: appState.selectedEyeColor?.id || "eyecolor_original"
        };

        // 2. Generate a deterministic seed number (reused for all 5 generation calls)
        const jobSeed = Math.floor(Math.random() * 900000) + 100000;

        const jobRecord: ThreeSixtyGenerationJob = {
          id: jobId,
          userId: uid || "guest",
          previewId,
          sourceSessionId: appState.current180Session.id,
          stateSnapshot: styleSnapshot,
          status: "processing",
          reservedCreditTransactionId: reservedTxId,
          expectedFrameCount: 5,
          completedFrameCount: 0,
          retryCount: 0,
          createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
        };

        if (uid) {
          await saveGenerationJob(jobRecord);
        }

        const compiledHighResFrames: string[] = [];
        const compiledLowResFrames: string[] = [];
        
        const anglesList = [
          { id: "left", label: "Left Profile" },
          { id: "front_left", label: "Front-Left (45°)" },
          { id: "front", label: "Front (0°)" },
          { id: "front_right", label: "Front-Right (45°)" },
          { id: "right", label: "Right Profile" }
        ];

        const sessionFrames = appState.current180Session.frames;
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < anglesList.length; i++) {
          const angle = anglesList[i];
          if (requestId !== latestRequestId.current) return;
          
          const sourceDataUrl = sessionFrames[angle.id as keyof typeof sessionFrames];
          if (!sourceDataUrl) {
            throw new Error(`Missing source frame for: ${angle.id}`);
          }

          // Spacing delay between consecutive successful frame requests to prevent rate limit spike
          if (i > 0) {
            await sleep(1200);
          }

          const mockState: AppState = {
            ...appState,
            originalImage: sourceDataUrl,
            currentImage: null,
            isProcessing: false,
            generationCount: 0
          };

          let frameOk = false;
          let retries = 0;
          let lastError = "";
          let generatedUrl = "";

          while (!frameOk && retries <= 2) {
            try {
              setProcessingStep(`Rendering ${angle.label}${retries > 0 ? ` (Retry ${retries}/2)` : ""}...`);
              
              // Pass styleSnapshot override and jobSeed to ensure cross-angle consistency
              generatedUrl = await generateStylePreview(mockState, styleSnapshot, jobSeed);
              
              if (!generatedUrl || generatedUrl === sourceDataUrl) {
                throw new Error("AI model returned empty or unchanged frame");
              }

              // Run output consistency check
              const check = await validateFrameConsistency(generatedUrl, angle.id, styleSnapshot);
              if (check.valid) {
                frameOk = true;
              } else {
                retries++;
                lastError = check.reason || "Consistency validation check failed";
              }
            } catch (e: any) {
              retries++;
              lastError = e.message || "Unknown generation error";
              
              const isRateLimit = e.reason === "rate-limited" || 
                                  (e.message && (
                                    e.message.includes("429") || 
                                    e.message.toLowerCase().includes("quota") || 
                                    e.message.toLowerCase().includes("exhausted")
                                  ));
              
              if (isRateLimit && retries <= 2) {
                const backoffMs = retries * 5000;
                console.warn(`Gemini rate limit hit during 180° render. Retrying in ${backoffMs}ms...`);
                await sleep(backoffMs);
              }
            }
          }

          if (!frameOk) {
            throw new Error(`Failed to generate consistent frame for ${angle.label} after retries: ${lastError}`);
          }

          compiledHighResFrames.push(generatedUrl);
          
          const compressedUrl = await compressImageBase64(generatedUrl, 360, 0.45);
          compiledLowResFrames.push(compressedUrl);
        }

        clearTimeout(safetyTimeout);
        if (requestId !== latestRequestId.current) return;

        setProcessingStep("Finalizing interactive 180° preview...");
        if (uid && reservedTxId) {
          await finalizeCharge(uid, jobId, reservedTxId);
        }

        const previewRecord: ThreeSixtyPreview = {
          id: previewId,
          userId: uid || "guest",
          sourceSessionId: jobRecord.sourceSessionId,
          hairstyleId: styleSnapshot.hairstyleId,
          beardId: styleSnapshot.beardId,
          outfitId: styleSnapshot.outfitId,
          aestheticsState: aestheticsMap,
          aestheticsStateHash: JSON.stringify(aestheticsMap) + `_${styleSnapshot.hairstyleId}_${styleSnapshot.beardId}_${styleSnapshot.outfitId}`,
          frameUrls: compiledLowResFrames,
          highResFrameUrls: compiledHighResFrames,
          thumbnailUrl: compiledHighResFrames[2], // Use front frame as thumbnail
          status: "complete",
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        };

        if (uid) {
          await save360Preview(previewRecord);
          jobRecord.status = "complete";
          jobRecord.completedFrameCount = 5;
          await saveGenerationJob(jobRecord);
          
          // Re-sync wallet credits
          const w = await getUser360Wallet(uid);
          onUpdateState({ credits: w.subscriptionCredits + w.purchasedCredits });
        } else {
          // Local/guest mock preview saving so local run continues
          const guestHistory = JSON.parse(localStorage.getItem("guest_360_previews") || "[]");
          guestHistory.push(previewRecord);
          localStorage.setItem("guest_360_previews", JSON.stringify(guestHistory));
          
          onUpdateState({ credits: Math.max(0, appState.credits - 1) });
        }

        isGeneratingRef.current = false;
        onUpdateState({
          isProcessing: false,
          show360Viewer: true,
          active360PreviewId: previewId
        });

      } catch (err: any) {
        clearTimeout(safetyTimeout);
        console.error("AI 180 generation failure:", err);
        
        if (uid) {
          try {
            const jobRecord = {
              id: jobId,
              userId: uid,
              previewId,
              status: "failed" as const,
              updatedAt: new Date().toISOString()
            };
            await saveGenerationJob(jobRecord as any);
            
            if (reservedTxId) {
              const w = await getUser360Wallet(uid);
              await refundCredit(uid, jobId, reservedTxId, w.subscriptionCredits ? "subscription" : "purchased");
              onUpdateState({ credits: w.subscriptionCredits + w.purchasedCredits });
            }
          } catch (refundErr) {
            console.error("Refund cleanup failed:", refundErr);
          }
        }

        if (requestId === latestRequestId.current) {
          isGeneratingRef.current = false;
          onUpdateState({ isProcessing: false });
          setIsControlsVisible(true);
          
          let friendlyMessage = "Failed to generate 180° preview. Credits refunded.";
          if (err instanceof GenerationError) {
            switch (err.reason) {
              case "moderation-blocked":
                friendlyMessage = "This look could not be processed due to content safety settings. Please select a different style.";
                break;
              case "timeout":
                friendlyMessage = "The style service took too long to respond. Please try again.";
                break;
              case "rate-limited":
                friendlyMessage = "Generation quota exceeded. Please wait a moment and try again.";
                break;
              case "empty-output":
                friendlyMessage = "No styling image was generated. Please try again.";
                break;
              case "invalid-response":
                friendlyMessage = "The image styling service returned an invalid response. Please try again.";
                break;
              default:
                friendlyMessage = "Failed to generate 180° preview. Credits refunded.";
            }
          } else if (
            err?.message?.toLowerCase().includes("exceeded") || 
            err?.message?.toLowerCase().includes("quota") || 
            err?.message?.toLowerCase().includes("429") || 
            err?.message?.toLowerCase().includes("exhausted")
          ) {
            friendlyMessage = "Generation quota exceeded. Please wait a moment and try again.";
          }
          
          setErrorMsg(friendlyMessage);
        }
      } finally {
        isGeneratingRef.current = false;
      }

    } else {
      // Single photo generation logic (Original)
      const safetyTimeout = setTimeout(() => {
        if (requestId === latestRequestId.current && isGeneratingRef.current) {
          console.warn("Generation safety timeout triggered (18s). Dismissing spinner.");
          isGeneratingRef.current = false;
          onUpdateState({ isProcessing: false });
          setIsControlsVisible(true);
          setErrorMsg("Request timed out. Please tap Generate to try again.");
        }
      }, 18000);
      
      try {
        setProcessingStep("Analyzing portrait details...");
        const newImage = await generateStylePreview(appState);
        clearTimeout(safetyTimeout);
        
        if (requestId === latestRequestId.current) {
          const isCustomLook = !!appState.selectedCustomLookId || (!!appState.customPrompt && appState.customPrompt.trim().length > 0);
          const shouldConsume = !appState.isSubscriber || isCustomLook;

          let nextCredits = appState.credits;
          if (shouldConsume) {
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
          }

          onUpdateState({ 
            currentImage: newImage, 
            isProcessing: false, 
            credits: nextCredits
          });

          try {
            const hasPromptedReview = localStorage.getItem("has_prompted_review");
            if (!hasPromptedReview && appState.generationCount >= 1) {
              localStorage.setItem("has_prompted_review", "true");
              triggerAppStoreReview();
            }
          } catch (e) {
            console.warn("Storage check failed for rate prompt:", e);
          }
          
          if (user && appState.originalImage) {
            (async () => {
              setIsSaving(true);
              try {
                let originalUrl = '';
                let generatedUrl = '';
                try {
                  originalUrl = await uploadImageToStorage(user.uid, appState.originalImage, 'original');
                  generatedUrl = await uploadImageToStorage(user.uid, newImage, 'generated');
                } catch (storageErr) {
                  console.warn("Storage upload failed, falling back to base64 strings:", storageErr);
                  originalUrl = await compressImageBase64(appState.originalImage, 360, 0.4);
                  generatedUrl = await compressImageBase64(newImage, 360, 0.4);
                }
                
                const docId = await saveGeneration(user.uid, {
                  originalImageUrl: originalUrl,
                  generatedImageUrl: generatedUrl,
                  hairStyle: appState.selectedHairStyle?.id || 'original',
                  hairColor: appState.selectedHairColor?.id || 'original',
                  beardStyle: appState.gender === Gender.MALE ? (appState.selectedBeardStyle?.id || 'original') : 'none',
                  beardColor: appState.gender === Gender.MALE ? (appState.selectedBeardColor?.id || 'original') : 'none',
                  outfit: appState.selectedOutfit?.id || 'original',
                  makeup: appState.selectedMakeup?.id || 'original',
                  eyeColor: appState.selectedEyeColor?.id || 'original',
                  treatments: appState.selectedTreatments,
                  gender: appState.gender,
                  isFavorite: false
                });
                
                onUpdateState({ currentDocId: docId });
              } catch (dbErr) {
                console.error("Failed to sync to database:", dbErr);
                onUpdateState({ currentDocId: "temp_session_" + Date.now() });
              } finally {
                setIsSaving(false);
              }
            })();
          }
        }
      } catch (err: any) {
        clearTimeout(safetyTimeout);
        if (requestId === latestRequestId.current) {
          console.error("PhotoEditor generation crash:", err?.message || err, err?.stack);
          
          let friendlyMessage = "This look is temporarily unavailable. Please try again.";
          if (err instanceof GenerationError) {
            switch (err.reason) {
              case "moderation-blocked":
                friendlyMessage = "This look could not be processed with the current photo due to content safety settings. Please select a different look.";
                break;
              case "timeout":
                friendlyMessage = "The style service took too long to respond. Please try again.";
                break;
              case "rate-limited":
                friendlyMessage = "The styling service is busy. Please wait a moment and try again.";
                break;
              case "empty-output":
                friendlyMessage = "No styling image was generated. Please try again with another photo.";
                break;
              case "invalid-response":
                friendlyMessage = "The image styling service returned an invalid response. Please try again.";
                break;
              case "source-image-failed":
                friendlyMessage = "We couldn't access the source photo. Please upload it again.";
                break;
              default:
                friendlyMessage = "This look is temporarily unavailable. Please try again.";
            }
          } else if (err?.message?.includes("timed out") || err?.message?.includes("timeout")) {
            friendlyMessage = "The style service took too long to respond. Please try again.";
          }

          setErrorMsg(friendlyMessage);
          onUpdateState({ isProcessing: false });
          setIsControlsVisible(true);
        }
      } finally {
        clearTimeout(safetyTimeout);
        isGeneratingRef.current = false;
      }
    }
  }, [appState, onUpdateState]);

  // Trigger auto-generate on mount if requested by template try-on
  useEffect(() => {
    if (appState.isProcessing && !appState.currentImage && appState.originalImage) {
      handleGenerate();
    }
  }, [appState.isProcessing, appState.originalImage, appState.currentImage, handleGenerate]);

  // Toggle favorite helper
  const handleToggleFavorite = async () => {
    const userUid = uid || 'guest_user_local';
    if (isSaving) return;

    if (currentDocId) {
      try {
        const nextState = !isFavorited;
        
        const docData = {
          id: currentDocId,
          originalImageUrl: appState.originalImage || '',
          generatedImageUrl: appState.currentImage || '',
          hairStyle: appState.selectedHairStyle?.id || 'original',
          hairColor: appState.selectedHairColor?.id || 'original',
          beardStyle: appState.gender === Gender.MALE ? (appState.selectedBeardStyle?.id || 'original') : 'none',
          beardColor: appState.gender === Gender.MALE ? (appState.selectedBeardColor?.id || 'original') : 'none',
          outfit: appState.selectedOutfit?.id || 'original',
          makeup: appState.selectedMakeup?.id || 'original',
          treatments: appState.selectedTreatments,
          gender: appState.gender,
          isFavorite: nextState
        };

        await onToggleLookFavorite(docData, nextState);
      } catch (err) {
        console.error("Failed to toggle favorite:", err);
        setErrorMsg("Failed to save favorite style.");
      }
    } else if (appState.currentImage && appState.originalImage) {
      // Document not yet saved to Firestore/LocalStorage - save now with isFavorite = true
      setIsSaving(true);
      try {
        let originalUrl = '';
        let generatedUrl = '';
        try {
          originalUrl = await uploadImageToStorage(userUid, appState.originalImage, 'original');
          generatedUrl = await uploadImageToStorage(userUid, appState.currentImage, 'generated');
        } catch (storageErr) {
          console.warn("Storage upload fallback to compressed base64:", storageErr);
          originalUrl = await compressImageBase64(appState.originalImage, 360, 0.4);
          generatedUrl = await compressImageBase64(appState.currentImage, 360, 0.4);
        }

        const docData = {
          originalImageUrl: originalUrl,
          generatedImageUrl: generatedUrl,
          hairStyle: appState.selectedHairStyle?.id || 'original',
          hairColor: appState.selectedHairColor?.id || 'original',
          beardStyle: appState.gender === Gender.MALE ? (appState.selectedBeardStyle?.id || 'original') : 'none',
          beardColor: appState.gender === Gender.MALE ? (appState.selectedBeardColor?.id || 'original') : 'none',
          outfit: appState.selectedOutfit?.id || 'original',
          makeup: appState.selectedMakeup?.id || 'original',
          eyeColor: appState.selectedEyeColor?.id || 'original',
          treatments: appState.selectedTreatments,
          gender: appState.gender,
          isFavorite: true
        };
        const docId = await saveGeneration(userUid, docData);

        onUpdateState({ currentDocId: docId });
        await onToggleLookFavorite({
          ...docData,
          id: docId,
          timestamp: new Date().toISOString()
        }, true);
      } catch (err) {
        console.error("Failed to save favorite style:", err);
        setErrorMsg("Failed to save favorite style.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Style Selection Handler - Updates state only, does not trigger API
  const handleSelectStyle = (option: StyleOption) => {
    if (option.category === 'hair') {
      if (option.type === 'style') onUpdateState({ selectedHairStyle: option });
      else onUpdateState({ selectedHairColor: option });
    } else if (option.category === 'beard') {
      if (option.type === 'style') onUpdateState({ selectedBeardStyle: option });
      else onUpdateState({ selectedBeardColor: option });
    } else if (option.category === 'outfit') {
      onUpdateState({ selectedOutfit: option });
    } else if (option.category === 'makeup') {
      onUpdateState({ selectedMakeup: option });
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
    setHairCategory('all');
    setBeardCategory('all');
    onUpdateState({ 
      gender: targetGender,
      selectedHairStyle: hairStylesList[0],
      selectedHairColor: appState.selectedHairColor || HAIR_COLORS[0],
      selectedBeardStyle: appState.selectedBeardStyle || BEARD_STYLES[0],
      selectedBeardColor: appState.selectedBeardColor || BEARD_COLORS[0],
      selectedOutfit: appState.selectedOutfit || OUTFIT_STYLES[0],
      selectedMakeup: appState.selectedMakeup || MAKEUP_STYLES[0],
      customPrompt: appState.customPrompt || '',
    });
  };


  const activeImage = showOriginal ? appState.originalImage : (appState.currentImage || appState.originalImage);
  const rawHairStyles = appState.gender === Gender.MALE ? HAIR_STYLES_MALE : HAIR_STYLES_FEMALE;
  const hairStyles = rawHairStyles.filter(s => {
    if (hairCategory === 'favorites') {
      return favoritedStyles.some(f => f.id === s.id && f.category === 'hair');
    }
    if (hairCategory === 'all') return true;
    if (hairCategory === 'original') return s.id === 'original';
    return s.subcategory === hairCategory;
  });

  const rawBeardOptions = appState.gender === Gender.MALE ? BEARD_STYLES : [];
  const beardOptions = rawBeardOptions.filter(b => {
    if (beardCategory === 'favorites') {
      return favoritedStyles.some(f => f.id === b.id && f.category === 'beard');
    }
    if (beardCategory === 'all') return true;
    if (beardCategory === 'original') return b.id === 'original';
    return b.subcategory === beardCategory;
  });

  const outfitStyles = OUTFIT_STYLES.filter(o => {
    if (outfitCategory === 'favorites') {
      return favoritedStyles.some(f => f.id === o.id && f.category === 'outfit');
    }
    if (outfitCategory === 'all') return true;
    return o.subcategory === outfitCategory;
  });

  const makeupStyles = MAKEUP_STYLES.filter(m => {
    if (makeupCategory === 'favorites') {
      return favoritedStyles.some(f => f.id === m.id && f.category === 'makeup');
    }
    return true;
  });



  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      
      {/* 1. Main Photo Area */}
      <div className="absolute inset-0 z-0">
        {isSplitView && appState.currentImage && appState.originalImage ? (
          <div 
            ref={sliderContainerRef}
            className="relative w-full h-full select-none cursor-ew-resize overflow-hidden"
            onMouseDown={handleSliderStart}
            onTouchStart={handleSliderStart}
          >
            {/* Original Image (Bottom Layer) */}
            <img 
              src={appState.originalImage} 
              alt="Original" 
              className="absolute inset-0 w-full h-full object-cover no-ios-callout" 
            />
            {/* Generated Image (Clipped Overlay Layer) */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${splitPosition}% 0, ${splitPosition}% 100%, 0 100%)` }}
            >
              <img 
                src={appState.currentImage} 
                alt="Generated" 
                className="absolute inset-0 w-full h-full object-cover no-ios-callout" 
              />
            </div>
            {/* Split Drag Line & Divider Handle */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] pointer-events-none z-20 flex items-center justify-center"
              style={{ left: `${splitPosition}%` }}
            >
              <div className="w-9 h-9 -ml-[18px] rounded-full bg-neutral-900/90 border-2 border-white text-white flex items-center justify-center shadow-2xl text-xs font-black tracking-tighter">
                ‹|›
              </div>
            </div>
            {/* Labels */}
            <div className="absolute top-28 left-4 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider text-white border border-white/10 z-20 pointer-events-none">
              Generated
            </div>
            <div className="absolute top-28 right-4 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider text-white border border-white/10 z-20 pointer-events-none">
              Original
            </div>
          </div>
        ) : activeImage ? (
          <img 
            src={activeImage} 
            alt="Preview" 
            className="w-full h-full object-cover opacity-100 transition-opacity duration-300 no-ios-callout" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />

        {/* Global Loading Spinner (Screen Center) */}
        {appState.isProcessing && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mb-4 shadow-[0_0_24px_rgba(251,191,36,0.6)]"></div>
             <p className="text-white text-xs font-black uppercase tracking-widest drop-shadow-md animate-pulse">{processingStep}</p>
             <span className="text-[9px] text-white/70 mt-1.5 font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">AI Transformation In Progress</span>
          </div>
        )}


        {/* Error Toast */}
        {errorMsg && (
          <div className="absolute top-28 left-4 right-4 bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-center text-xs z-50 shadow-lg border border-red-400/20 animate-in fade-in slide-in-from-top-2 pointer-events-none">
            {errorMsg}
          </div>
        )}
      </div>

      {/* 2b. Floating Menu Trigger (Top Left) */}
      <div className="absolute top-24 left-4 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={onOpenMenu}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform shadow-lg"
          title="Open Menu"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
      </div>


      {/* 2. Floating Action Controls (Top Right) */}
      <div className="absolute top-24 right-4 flex flex-col gap-3 z-30 pointer-events-auto">
        {/* View AI 180° Preview Button */}
        {isAI180Mode && (
          <button 
            type="button"
            onClick={() => onUpdateState({ showAI180Viewer: true })}
            className="w-10 h-10 rounded-full bg-indigo-600 backdrop-blur-xl flex items-center justify-center text-white border border-indigo-500/40 active:scale-90 transition-transform shadow-lg shadow-indigo-600/20"
            title="View 180° Rotatable Preview"
          >
            <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-amber-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.07M21 8v1h-1a8.001 8.001 0 00-6.19-2.07" />
            </svg>
          </button>
        )}

        {/* Change Photo Button */}
        <button 
          type="button"
          onClick={() => {
            const confirmMsg = isAI180Mode 
              ? "Exit 180° session? This will clear your captured scan."
              : "Change photo? This will clear your current edits.";
            if (window.confirm(confirmMsg)) {
              onUpdateState({ 
                originalImage: null, 
                currentImage: null,
                selectedHairStyle: null,
                selectedHairColor: null,
                selectedBeardStyle: null,
                selectedBeardColor: null,
                selectedOutfit: null,
                selectedMakeup: null,
                selectedTreatments: [],
                customPrompt: '',
                captured180Frames: undefined,
                activeAI180ScanId: null,
                editorMode: "single_photo"
              });
            }
          }}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform shadow-lg"
          title="Change photo / Start over"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>

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

        {/* Split View Drag Slider Toggle */}
        {appState.currentImage && (
          <button 
            type="button"
            onClick={() => setIsSplitView(!isSplitView)}
            className={`w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center border transition-all active:scale-90 shadow-lg ${
              isSplitView ? 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' : 'text-white border-white/10'
            }`}
            title="Toggle Split Drag Slider"
          >
            <span className="text-xs font-black tracking-tighter">‹|›</span>
          </button>
        )}

        {/* Undo Button */}
        {history.length > 1 && (
          <button 
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform shadow-lg disabled:opacity-30"
            title="Undo last edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14L4 9l5-5"/>
              <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>
            </svg>
          </button>
        )}

        {/* Redo Button */}
        {history.length > 1 && (
          <button 
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform shadow-lg disabled:opacity-30"
            title="Redo edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14l5-5-5-5"/>
              <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/>
            </svg>
          </button>
        )}

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
        <div className="absolute bottom-0 left-0 right-0 z-40 flex flex-col gap-0 pt-1 rounded-t-3xl bg-[#090909]/95 backdrop-blur-3xl border-t border-white/5 animate-in slide-in-from-bottom duration-300 pointer-events-auto">
          
          {/* Top Collapse Handle */}
          <div className="flex justify-center items-center h-5 cursor-pointer group" onClick={() => setIsControlsVisible(false)}>
            <div className="w-12 h-1 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors"></div>
          </div>

          {/* Persistent Credit Top-Up Banner */}
          {!appState.isSubscriber && appState.credits <= 10 && (
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

          {/* Scrollable Options Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar max-h-[35vh]">
            {/* Tab Selection */}
            <div className="flex flex-row overflow-x-auto no-scrollbar justify-start border-b border-black/30 px-4 mb-2 space-x-1.5 h-10 items-center flex-nowrap whitespace-nowrap">
              <button
                type="button"
                onClick={() => setActiveTab('hair')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all flex-shrink-0 ${
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
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all flex-shrink-0 ${
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
                onClick={() => setActiveTab('eyecolor')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'eyecolor' 
                    ? 'text-white border-white' 
                    : 'text-white/40 border-transparent hover:text-white/60'
                }`}
              >
                Eye Color
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('outfit')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'outfit' 
                    ? 'text-white border-white' 
                    : 'text-white/40 border-transparent hover:text-white/60'
                }`}
              >
                AI Outfit
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('makeup')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'makeup' 
                    ? 'text-white border-white' 
                    : 'text-white/40 border-transparent hover:text-white/60'
                }`}
              >
                AI Makeup
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('aesthetics')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'aesthetics' 
                    ? 'text-white border-white' 
                    : 'text-white/40 border-transparent hover:text-white/60'
                }`}
              >
                Aesthetics
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('prompt')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all flex-shrink-0 ${
                  activeTab === 'prompt' 
                    ? 'text-white border-white' 
                    : 'text-white/40 border-transparent hover:text-white/60'
                }`}
              >
                Custom Look
              </button>
            </div>

            {activeTab === 'hair' && (
              <div className="w-full animate-in fade-in duration-200">
                {/* Hair Categories filter row */}
                <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center mb-3 h-8 flex-shrink-0 flex-nowrap whitespace-nowrap">
                  {(appState.gender === Gender.MALE 
                    ? [
                        { id: 'all', label: 'All' },
                        { id: 'favorites', label: '❤️ Favorites' },
                        { id: 'original', label: 'Original' },
                        { id: 'short', label: 'Short' },
                        { id: 'fade', label: 'Fade' },
                        { id: 'medium', label: 'Medium' },
                        { id: 'long', label: 'Long' },
                        { id: 'curly', label: 'Curly' },
                        { id: 'braids', label: 'Braids' },
                        { id: 'locs', label: 'Locs' },
                        { id: 'trendy', label: 'Trendy' },
                        { id: 'mature', label: 'Mature' },
                      ]
                    : [
                        { id: 'all', label: 'All' },
                        { id: 'favorites', label: '❤️ Favorites' },
                        { id: 'original', label: 'Original' },
                        { id: 'short', label: 'Short' },
                        { id: 'bob-lob', label: 'Bob / Lob' },
                        { id: 'medium', label: 'Medium' },
                        { id: 'long', label: 'Long' },
                        { id: 'updo', label: 'Updo / Buns' },
                        { id: 'curly', label: 'Curly' },
                        { id: 'braids', label: 'Braids' },
                        { id: 'trendy', label: 'Trendy' },
                        { id: 'bangs', label: 'Bangs' },
                      ]
                  ).map((cat) => {
                    const isSelected = hairCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setHairCategory(cat.id as any)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                          isSelected 
                            ? 'bg-white text-black font-extrabold shadow-sm' 
                            : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Hair styles gallery */}
                <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-3 items-center mb-1 h-32 scroll-smooth flex-nowrap whitespace-nowrap">
                  {hairStyles
                    .map((item) => {
                      const isSelected = appState.selectedHairStyle?.id === item.id;
                      const presetImg = appState.gender === Gender.MALE 
                        ? MALE_HAIR_PREVIEWS.find(p => p.id === item.id)?.image
                        : FEMALE_HAIR_PREVIEWS.find(p => p.id === item.id)?.image;
                      const previewSrc = presetImg || (appState.gender === Gender.MALE ? '/presets/male_hair_fade.jpg' : '/presets/female_hair_bob.jpg');
                      
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onUpdateState({ selectedHairStyle: item })}
                          className={`flex-shrink-0 flex flex-col items-center justify-between w-20 h-28 rounded-2xl transition-all duration-200 overflow-hidden relative group border ${
                            isSelected 
                              ? 'border-yellow-500 bg-neutral-900 shadow-[0_4px_20px_rgba(234,179,8,0.3)] scale-102 font-extrabold' 
                              : 'border-white/5 bg-neutral-950/40 hover:bg-neutral-900/60 opacity-80'
                          }`}
                        >
                          <div className="w-full flex-1 relative overflow-hidden bg-neutral-900">
                            <img 
                              src={previewSrc} 
                              alt={item.label} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Favorites Style Heart Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleStyleFavorite({
                                  id: item.id,
                                  category: 'hair',
                                  label: item.label,
                                  image: previewSrc,
                                  gender: appState.gender === Gender.MALE ? 'Male' : 'Female'
                                });
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white active:scale-90 hover:bg-black/85 transition-all z-10"
                            >
                              <svg
                                className={`w-2.5 h-2.5 ${favoritedStyles.some(f => f.id === item.id) ? 'fill-red-500 stroke-red-500' : 'stroke-white fill-none'}`}
                                viewBox="0 0 24 24"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                            </button>
                            {isSelected && (
                              <div className="absolute inset-0 bg-yellow-500/10 border-2 border-yellow-500 rounded-t-2xl pointer-events-none" />
                            )}
                          </div>
                          <div className={`w-full py-1.5 px-1 text-center border-t ${isSelected ? 'border-yellow-500/20 bg-yellow-950/20' : 'border-white/5 bg-black/40'}`}>
                            <span className={`text-[8px] font-black uppercase tracking-wider truncate block w-full leading-none ${isSelected ? 'text-yellow-500' : 'text-neutral-400'}`}>
                              {item.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Hair Color picker row */}
                <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-3 items-center h-12 scroll-smooth flex-nowrap whitespace-nowrap">
                  {HAIR_COLORS.map((item) => {
                    const isSelected = appState.selectedHairColor?.id === item.id;
                    const previewColor = getColorHexValue(item.id);
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onUpdateState({ selectedHairColor: item })}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 active:scale-95 ${
                          isSelected 
                            ? 'border-yellow-500 bg-yellow-500/15 text-white font-black' 
                            : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div 
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-inner"
                          style={{ background: previewColor }}
                        />
                        <span className="text-[8px] uppercase tracking-widest">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'beard' && appState.gender === Gender.MALE && (
              /* Beard Tab Panel */
              <div className="w-full animate-in fade-in duration-200">
                {/* Beard Categories filter row */}
                <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center mb-3 h-8 flex-shrink-0 flex-nowrap whitespace-nowrap">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'favorites', label: '❤️ Favorites' },
                    { id: 'stubble', label: 'Stubble' },
                    { id: 'short', label: 'Short' },
                    { id: 'long', label: 'Long' }
                  ].map((cat) => {
                    const isSelected = beardCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setBeardCategory(cat.id as any)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                          isSelected 
                            ? 'bg-white text-black font-extrabold shadow-sm' 
                            : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Beard styles gallery */}
                <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-3 items-center mb-1 h-32 scroll-smooth flex-nowrap whitespace-nowrap">
                  {beardOptions.map((item) => {
                    const isSelected = appState.selectedBeardStyle?.id === item.id;
                    const presetImg = MALE_BEARD_PREVIEWS.find(p => p.id === item.id)?.image;
                    const previewSrc = presetImg || '/presets/male_beard_none.jpg';
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onUpdateState({ selectedBeardStyle: item })}
                        className={`flex-shrink-0 flex flex-col items-center justify-between w-20 h-28 rounded-2xl transition-all duration-200 overflow-hidden relative group border ${
                          isSelected 
                            ? 'border-yellow-500 bg-neutral-900 shadow-[0_4px_20px_rgba(234,179,8,0.3)] scale-102 font-extrabold' 
                            : 'border-white/5 bg-neutral-950/40 hover:bg-neutral-900/60 opacity-80'
                        }`}
                      >
                        <div className="w-full flex-1 relative overflow-hidden bg-neutral-900">
                          <img 
                            src={previewSrc} 
                            alt={item.label} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Favorites Style Heart Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStyleFavorite({
                                id: item.id,
                                category: 'beard',
                                label: item.label,
                                image: previewSrc,
                                gender: 'Male'
                              });
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white active:scale-90 hover:bg-black/85 transition-all z-10"
                          >
                            <svg
                              className={`w-2.5 h-2.5 ${favoritedStyles.some(f => f.id === item.id) ? 'fill-red-500 stroke-red-500' : 'stroke-white fill-none'}`}
                              viewBox="0 0 24 24"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </button>
                          {isSelected && (
                            <div className="absolute inset-0 bg-yellow-500/10 border-2 border-yellow-500 rounded-t-2xl pointer-events-none" />
                          )}
                        </div>
                        <div className={`w-full py-1.5 px-1 text-center border-t ${isSelected ? 'border-yellow-500/20 bg-yellow-950/20' : 'border-white/5 bg-black/40'}`}>
                          <span className={`text-[8px] font-black uppercase tracking-wider truncate block w-full leading-none ${isSelected ? 'text-yellow-500' : 'text-neutral-400'}`}>
                            {item.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Beard Color picker row */}
                <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-3 items-center h-12 scroll-smooth flex-nowrap whitespace-nowrap">
                  {BEARD_COLORS.map((item) => {
                    const isSelected = appState.selectedBeardColor?.id === item.id;
                    const previewColor = getColorHexValue(item.id);
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onUpdateState({ selectedBeardColor: item })}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 active:scale-95 ${
                          isSelected 
                            ? 'border-yellow-500 bg-yellow-500/15 text-white font-black' 
                            : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div 
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-inner"
                          style={{ background: previewColor }}
                        />
                        <span className="text-[8px] uppercase tracking-widest">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'outfit' && (
              /* AI Outfit Tab Panel */
              <div className="w-full animate-in fade-in duration-200">
                {/* Outfit Categories filter row */}
                <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center mb-3 h-8 flex-shrink-0 flex-nowrap whitespace-nowrap">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'favorites', label: '❤️ Favorites' },
                    { id: 'casual', label: 'Casual' },
                    { id: 'business', label: 'Business' },
                    { id: 'luxury', label: 'Luxury' },
                    { id: 'active', label: 'Active' },
                    { id: 'vacation', label: 'Vacation' }
                  ].map((cat) => {
                    const isSelected = outfitCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setOutfitCategory(cat.id as any)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                          isSelected 
                            ? 'bg-white text-black font-extrabold shadow-sm' 
                            : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Outfit styles gallery */}
                <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-3 items-center mb-1 h-32 scroll-smooth flex-nowrap whitespace-nowrap">
                  {outfitStyles.map((item) => {
                    const isSelected = appState.selectedOutfit?.id === item.id;
                    const presetImg = appState.gender === Gender.MALE
                      ? MALE_OUTFIT_PREVIEWS.find(p => p.id === item.id)?.image
                      : FEMALE_OUTFIT_PREVIEWS.find(p => p.id === item.id)?.image;
                    const previewSrc = presetImg || (appState.gender === Gender.MALE ? '/presets/male_outfit_casual.jpg' : '/presets/female_outfit_casual.jpg');
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onUpdateState({ selectedOutfit: item })}
                        className={`flex-shrink-0 flex flex-col items-center justify-between w-20 h-28 rounded-2xl transition-all duration-200 overflow-hidden relative group border ${
                          isSelected 
                            ? 'border-yellow-500 bg-neutral-900 shadow-[0_4px_20px_rgba(234,179,8,0.3)] scale-102 font-extrabold' 
                            : 'border-white/5 bg-neutral-950/40 hover:bg-neutral-900/60 opacity-80'
                        }`}
                      >
                        <div className="w-full flex-1 relative overflow-hidden bg-neutral-900">
                          <img 
                            src={previewSrc} 
                            alt={item.label} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Favorites Style Heart Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStyleFavorite({
                                id: item.id,
                                category: 'outfit',
                                label: item.label,
                                image: previewSrc,
                                gender: appState.gender === Gender.MALE ? 'Male' : 'Female'
                              });
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white active:scale-90 hover:bg-black/85 transition-all z-10"
                          >
                            <svg
                              className={`w-2.5 h-2.5 ${favoritedStyles.some(f => f.id === item.id) ? 'fill-red-500 stroke-red-500' : 'stroke-white fill-none'}`}
                              viewBox="0 0 24 24"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </button>
                          {isSelected && (
                            <div className="absolute inset-0 bg-yellow-500/10 border-2 border-yellow-500 rounded-t-2xl pointer-events-none" />
                          )}
                        </div>
                        <div className={`w-full py-1.5 px-1 text-center border-t ${isSelected ? 'border-yellow-500/20 bg-yellow-950/20' : 'border-white/5 bg-black/40'}`}>
                          <span className={`text-[8px] font-black uppercase tracking-wider truncate block w-full leading-none ${isSelected ? 'text-yellow-500' : 'text-neutral-400'}`}>
                            {item.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'makeup' && (
              /* AI Makeup Tab Panel */
              <div className="w-full animate-in fade-in duration-200">
                {/* Makeup Categories filter row */}
                <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center mb-3 h-8 flex-shrink-0 flex-nowrap whitespace-nowrap">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'favorites', label: '❤️ Favorites' }
                  ].map((cat) => {
                    const isSelected = makeupCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMakeupCategory(cat.id as any)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                          isSelected 
                            ? 'bg-white text-black font-extrabold shadow-sm' 
                            : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Makeup styles gallery */}
                <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-3 items-center mb-1 h-32 scroll-smooth flex-nowrap whitespace-nowrap">
                  {makeupStyles.map((item) => {
                    const isSelected = appState.selectedMakeup?.id === item.id;
                    const presetImg = FEMALE_MAKEUP_PREVIEWS.find(p => p.id === item.id)?.image;
                    const previewSrc = presetImg || '/presets/female_makeup_natural.jpg';
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onUpdateState({ selectedMakeup: item })}
                        className={`flex-shrink-0 flex flex-col items-center justify-between w-20 h-28 rounded-2xl transition-all duration-200 overflow-hidden relative group border ${
                          isSelected 
                            ? 'border-yellow-500 bg-neutral-900 shadow-[0_4px_20px_rgba(234,179,8,0.3)] scale-102 font-extrabold' 
                            : 'border-white/5 bg-neutral-950/40 hover:bg-neutral-900/60 opacity-80'
                        }`}
                      >
                        <div className="w-full flex-1 relative overflow-hidden bg-neutral-900">
                          <img 
                            src={previewSrc} 
                            alt={item.label} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Favorites Style Heart Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStyleFavorite({
                                id: item.id,
                                category: 'makeup',
                                label: item.label,
                                image: previewSrc,
                                gender: 'Female' // Makeup previews are all generated on the consistent female model
                              });
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white active:scale-90 hover:bg-black/85 transition-all z-10"
                          >
                            <svg
                              className={`w-2.5 h-2.5 ${favoritedStyles.some(f => f.id === item.id) ? 'fill-red-500 stroke-red-500' : 'stroke-white fill-none'}`}
                              viewBox="0 0 24 24"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </button>
                          {isSelected && (
                            <div className="absolute inset-0 bg-yellow-500/10 border-2 border-yellow-500 rounded-t-2xl pointer-events-none" />
                          )}
                        </div>
                        <div className={`w-full py-1.5 px-1 text-center border-t ${isSelected ? 'border-yellow-500/20 bg-yellow-950/20' : 'border-white/5 bg-black/40'}`}>
                          <span className={`text-[8px] font-black uppercase tracking-wider truncate block w-full leading-none ${isSelected ? 'text-yellow-500' : 'text-neutral-400'}`}>
                            {item.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'eyecolor' && (
              /* Eye Color Tab Panel */
              <div className="w-full animate-in fade-in duration-200">
                <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest text-left pl-4 mb-2">
                  Select Contact Lens Shade
                </div>
                
                {/* Eye color gallery */}
                <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-3 items-center mb-1 h-32 scroll-smooth flex-nowrap whitespace-nowrap">
                  {EYE_COLOR_PREVIEWS.map((item) => {
                    const isSelected = appState.selectedEyeColor?.id === item.id || (!appState.selectedEyeColor && item.id === 'eyecolor_original');
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onUpdateState({ selectedEyeColor: item })}
                        className={`flex-shrink-0 flex flex-col items-center justify-between w-20 h-28 rounded-2xl transition-all duration-200 overflow-hidden relative group border ${
                          isSelected 
                            ? 'border-yellow-500 bg-neutral-900 shadow-[0_4px_20px_rgba(234,179,8,0.3)] scale-102 font-extrabold' 
                            : 'border-white/5 bg-neutral-950/40 hover:bg-neutral-900/60 opacity-80'
                        }`}
                      >
                        <div className="w-full flex-1 relative overflow-hidden bg-neutral-900">
                          <img 
                            src={item.image} 
                            alt={item.label} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Favorites Style Heart Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStyleFavorite({
                                id: item.id,
                                category: 'eyecolor',
                                label: item.label,
                                image: item.image,
                                gender: 'unisex'
                              });
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white active:scale-90 hover:bg-black/85 transition-all z-10"
                          >
                            <svg
                              className={`w-2.5 h-2.5 ${favoritedStyles.some(f => f.id === item.id) ? 'fill-red-500 stroke-red-500' : 'stroke-white fill-none'}`}
                              viewBox="0 0 24 24"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </button>
                          {isSelected && (
                            <div className="absolute inset-0 bg-yellow-500/10 border-2 border-yellow-500 rounded-t-2xl pointer-events-none" />
                          )}
                        </div>
                        <div className={`w-full py-1.5 px-1 text-center border-t ${isSelected ? 'border-yellow-500/20 bg-yellow-950/20' : 'border-white/5 bg-black/40'}`}>
                          <span className={`text-[8px] font-black uppercase tracking-wider truncate block w-full leading-none ${isSelected ? 'text-yellow-500' : 'text-neutral-400'}`}>
                            {item.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Aesthetics Tab Panel */}
            {activeTab === 'aesthetics' && (() => {
              const filteredAestheticTreatments = AESTHETIC_TREATMENTS.filter(
                t => aestheticsCategory === 'all' || t.category === aestheticsCategory
              );
              const activeAestheticTreatment = AESTHETIC_TREATMENTS.find(t => t.id === activeAestheticId);
              const currentVal = appState.selectedTreatments?.find(sel => sel.treatmentId === activeAestheticId)?.value || 0;
              const stepLabel = activeAestheticTreatment?.steps.find(s => s.value === currentVal)?.label || 'Natural';
              
              const handleUpdateTreatmentValue = (treatmentId: string, value: number) => {
                const treatment = AESTHETIC_TREATMENTS.find(t => t.id === treatmentId);
                if (!treatment) return;
                const stepLabel = treatment.steps.find(s => s.value === value)?.label || 'Natural';
                
                const currentSelections = appState.selectedTreatments || [];
                let nextSelections = [...currentSelections];
                
                const existingIdx = nextSelections.findIndex(t => t.treatmentId === treatmentId);
                if (value === 0) {
                  if (existingIdx > -1) {
                    nextSelections.splice(existingIdx, 1);
                  }
                } else {
                  const newSelection = { treatmentId, value, label: stepLabel };
                  if (existingIdx > -1) {
                    nextSelections[existingIdx] = newSelection;
                  } else {
                    nextSelections.push(newSelection);
                  }
                }
                
                onUpdateState({ selectedTreatments: nextSelections });
              };

              return (
                <div className="w-full animate-in fade-in duration-200">
                  {/* Aesthetics Category Filters */}
                  <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-2 items-center mb-3 h-8 flex-shrink-0 flex-nowrap whitespace-nowrap">
                    {[
                      { id: 'all', label: 'All Treatments' },
                      { id: 'filler', label: 'Dermal Fillers' },
                      { id: 'botox', label: 'Botox / Tox' },
                      { id: 'skin', label: 'Skin Solutions' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setAestheticsCategory(cat.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                          aestheticsCategory === cat.id
                            ? 'bg-white text-black font-extrabold shadow-sm'
                            : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Treatments Row */}
                  <div className="flex flex-row overflow-x-auto no-scrollbar pl-4 pr-4 space-x-3 items-center mb-2.5 h-32 scroll-smooth flex-nowrap whitespace-nowrap">
                    {filteredAestheticTreatments.map(t => {
                      const currentVal = appState.selectedTreatments?.find(sel => sel.treatmentId === t.id)?.value || 0;
                      const isSelected = activeAestheticId === t.id;
                      const previewConfig = getPreviewConfig(t.id);
                      
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveAestheticId(t.id)}
                          className={`flex-shrink-0 flex flex-col items-center justify-between w-20 h-28 rounded-2xl transition-all duration-200 overflow-hidden relative group border ${
                            isSelected 
                              ? 'border-indigo-500 bg-neutral-900 shadow-[0_4px_20px_rgba(99,102,241,0.3)] scale-102 font-extrabold' 
                              : 'border-white/5 bg-neutral-950/40 hover:bg-neutral-900/60 opacity-80'
                          }`}
                        >
                          <div className="w-full flex-1 relative overflow-hidden bg-neutral-900">
                            <img 
                              src={previewConfig.source} 
                              alt={t.label} 
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${previewConfig.zoom}`}
                              style={{ objectPosition: previewConfig.position }}
                            />
                            {currentVal > 0 && (
                              <div className="absolute bottom-1 right-1 bg-indigo-600 px-1.5 py-0.5 rounded-full text-[6.5px] font-black uppercase tracking-wider text-white shadow-md">
                                Lvl {currentVal}
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 bg-indigo-500/10 border-2 border-indigo-500 rounded-t-2xl pointer-events-none" />
                            )}
                          </div>
                          <div className={`w-full py-1.5 px-1 text-center border-t ${isSelected ? 'border-indigo-500/20 bg-indigo-950/20' : 'border-white/5 bg-black/40'}`}>
                            <span className={`text-[8px] font-black uppercase tracking-wider truncate block w-full leading-none ${isSelected ? 'text-indigo-400' : 'text-neutral-400'}`}>
                              {t.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Slider for Active Treatment */}
                  {activeAestheticTreatment && (
                    <div className="mx-4 px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-2xl text-left animate-in slide-in-from-bottom-2 duration-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">
                          {activeAestheticTreatment.label} Intensity
                        </span>
                        <span className="text-[10px] font-extrabold text-white bg-indigo-600/35 px-2.5 py-0.5 rounded-full">
                          {stepLabel}
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        value={currentVal}
                        onChange={(e) => handleUpdateTreatmentValue(activeAestheticTreatment.id, parseInt(e.target.value))}
                        className="w-full accent-indigo-500 h-2 rounded-lg bg-neutral-800 cursor-pointer mt-1"
                      />
                      <div className="flex justify-between text-[7.5px] text-neutral-500 font-extrabold uppercase mt-1 px-0.5">
                        <span>Natural</span>
                        <span>Subtle</span>
                        <span>Moderate</span>
                        <span>Defined</span>
                        <span>Strong</span>
                        <span>Maximum</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {activeTab === 'prompt' && (
              /* Custom prompt text input panel */
              <div className="w-full animate-in fade-in duration-200 px-4">
                <textarea
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500/50 resize-none font-medium leading-relaxed"
                  placeholder="Describe details for custom prompt (e.g., 'platinum blonde long hair, black suit, natural lighting')..."
                  value={appState.customPrompt || ''}
                  onChange={(e) => onUpdateState({ customPrompt: e.target.value, selectedCustomLookId: null })}
                />
                
                {/* Horizontal scroll presets header */}
                <div className="flex flex-row overflow-x-auto no-scrollbar py-2.5 gap-2.5 items-center flex-shrink-0 mt-1 border-t border-white/5 flex-nowrap whitespace-nowrap">
                  {[
                    'Decades & Retro',
                    'Sci-Fi & Cyber',
                    'Fantasy & Myth',
                    'Warriors & History',
                    'Modern & High Fashion'
                  ].map((cat) => {
                    const isSelected = selectedPresetCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedPresetCategory(cat as any)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-black border border-indigo-500'
                            : 'bg-white/5 text-neutral-400 border border-white/10 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* Preset Pills wrapping list */}
                <div className="flex flex-wrap gap-2 py-1 max-h-[140px] overflow-y-auto no-scrollbar">
                  {CUSTOM_LOOK_PRESETS.filter(p => p.category === selectedPresetCategory && p.enabled).map(item => {
                    const isSelected = appState.selectedCustomLookId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onUpdateState({
                            selectedCustomLookId: isSelected ? null : item.id,
                            customLookVersion: isSelected ? null : item.version
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-200 active:scale-95 flex-shrink-0 ${
                          isSelected
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-neutral-950 border-yellow-500 shadow-md shadow-yellow-500/20'
                            : 'bg-white/5 text-neutral-300 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
                        }`}
                        title={item.description}
                      >
                        ✨ {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Generate Button Container */}
          <div className={`w-full flex flex-col items-center bg-gradient-to-t from-[#090909] via-[#090909] to-transparent pt-3 px-4 flex-shrink-0 z-10 ${
            isAI180Mode
              ? "pb-[calc(2.2rem+env(safe-area-inset-bottom,0px))]"
              : "pb-[calc(5.2rem+env(safe-area-inset-bottom,0px))]"
          }`}>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={appState.isProcessing}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${
            appState.isProcessing
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5'
              : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-neutral-950 shadow-yellow-500/20 active:scale-[0.98]'
          }`}
        >
          {appState.isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-950"></div>
              <span>Designing your look...</span>
            </>
          ) : (
            <>
              <Icons.Magic className="w-4 h-4 stroke-[2.5]" />
              <span>✨ {isAI180Mode ? "Generate 180° Style" : "Generate New Look"}</span>
            </>
          )}
        </button>
        {!appState.isProcessing && (
          <span className="text-[8px] font-black uppercase text-neutral-500 mt-1.5 tracking-wider">
            {isAI180Mode 
              ? "Costs 1 Premium Credit" 
              : activeTab === 'prompt'
                ? "Costs 1 Premium Credit"
                : appState.isSubscriber
                  ? "Free for Premium members (Unmetered)"
                  : "Costs 1 Credit"}
          </span>
        )}
          </div>
        </div>
      ) : (
        <div className="absolute bottom-[calc(4.6rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 flex justify-center pointer-events-none animate-in fade-in duration-500">
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
          appState={appState}
          onUpdateState={onUpdateState}
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

// --- Sub-components ---

const getPresetPreviewUrl = (id: string, category: string, gender: Gender): string => {
  const isMale = gender === Gender.MALE;
  let url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80';
  if (category === 'hair') {
    const list = isMale ? MALE_HAIR_PREVIEWS : FEMALE_HAIR_PREVIEWS;
    const found = list.find(x => x.id === id);
    url = found ? found.image : url;
  } else if (category === 'beard') {
    const found = MALE_BEARD_PREVIEWS.find(x => x.id === id);
    url = found ? found.image : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80';
  } else if (category === 'color') {
    const found = COLOR_PREVIEWS.find(x => x.id === id);
    url = found ? found.image : url;
  } else if (category === 'outfit') {
    const list = isMale ? MALE_OUTFIT_PREVIEWS : FEMALE_OUTFIT_PREVIEWS;
    const found = list.find(x => x.id === id);
    url = found ? found.image : 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80';
  } else if (category === 'makeup') {
    const list = isMale ? MALE_MAKEUP_PREVIEWS : FEMALE_MAKEUP_PREVIEWS;
    let found = list.find(x => x.id === id);
    if (!found && isMale) {
      found = FEMALE_MAKEUP_PREVIEWS.find(x => x.id === id);
    }
    url = found ? found.image : 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100&q=80';
  }

  if (url.startsWith('/presets/') && !url.includes('/presets/thumbs/')) {
    return url.replace('/presets/', '/presets/thumbs/');
  }
  return url;
};

const StyleButton: React.FC<{ item: StyleOption; gender: Gender; isSelected: boolean; onClick: () => void }> = ({ item, gender, isSelected, onClick }) => {
  const imageUrl = getPresetPreviewUrl(item.id, item.category, gender);
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 flex flex-col items-center justify-between w-20 h-28 rounded-2xl transition-all duration-200 overflow-hidden relative group border ${
        isSelected 
          ? 'border-indigo-500 bg-neutral-900 shadow-[0_4px_20px_rgba(99,102,241,0.3)] scale-102 font-extrabold' 
          : 'border-white/5 bg-neutral-950/40 hover:bg-neutral-900/60 opacity-80 hover:opacity-100'
      }`}
    >
      {/* Target Preview Image */}
      <div className="w-full flex-1 relative overflow-hidden bg-neutral-900">
        <img 
          src={imageUrl} 
          alt={item.label} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isSelected && (
          <div className="absolute inset-0 bg-indigo-500/10 border-2 border-indigo-500 rounded-t-2xl pointer-events-none" />
        )}
      </div>
      {/* Label Box */}
      <div className={`w-full py-1.5 px-1 text-center border-t ${isSelected ? 'border-indigo-500/20 bg-indigo-950/20' : 'border-white/5 bg-black/40'}`}>
        <span className={`text-[8.5px] font-black uppercase tracking-wider truncate block w-full leading-none ${isSelected ? 'text-indigo-400' : 'text-neutral-400 group-hover:text-white'}`}>
          {item.label}
        </span>
      </div>
    </button>
  );
};

const getColorSwatchClass = (colorId: string): string => {
  switch (colorId) {
    case 'original':
      return 'bg-gradient-to-tr from-neutral-600 via-neutral-700 to-neutral-800';
    case 'match':
      return 'bg-gradient-to-tr from-neutral-800 via-indigo-600 to-indigo-400';
    case 'black':
      return 'bg-[#0E0E10]';
    case 'darkbrown':
      return 'bg-[#29170E]';
    case 'brown':
      return 'bg-[#4A2F1D]';
    case 'lightbrown':
      return 'bg-[#734A2E]';
    case 'blonde':
      return 'bg-[#DEBC85]';
    case 'platinum':
      return 'bg-[#E5E9EC]';
    case 'red':
      return 'bg-[#AC2D15]';
    case 'auburn':
      return 'bg-[#6F2314]';
    case 'grey':
      return 'bg-[#989A9C]';
    case 'white':
      return 'bg-[#FAFAFA]';
    case 'blue':
      return 'bg-[#1E40AF]';
    case 'green':
      return 'bg-[#065F46]';
    case 'pink':
      return 'bg-[#BE185D]';
    case 'blonde_highlights':
      return 'bg-gradient-to-r from-[#DEBC85] via-[#E5E9EC] to-[#DEBC85]';
    case 'brown_highlights':
      return 'bg-gradient-to-r from-[#4A2F1D] via-[#DEBC85] to-[#4A2F1D]';
    case 'platinum_highlights':
      return 'bg-gradient-to-r from-[#E5E9EC] via-[#1E40AF] to-[#E5E9EC]';
    case 'blue_highlights':
      return 'bg-gradient-to-r from-[#0E0E10] via-[#1E40AF] to-[#0E0E10]';
    case 'pink_highlights':
      return 'bg-gradient-to-r from-[#DEBC85] via-[#BE185D] to-[#DEBC85]';
    case 'blonde_ombre':
      return 'bg-gradient-to-b from-[#29170E] to-[#DEBC85]';
    case 'brown_ombre':
      return 'bg-gradient-to-b from-[#29170E] to-[#734A2E]';
    case 'red_ombre':
      return 'bg-gradient-to-b from-[#29170E] to-[#AC2D15]';
    case 'blue_ombre':
      return 'bg-gradient-to-b from-[#0E0E10] to-[#1E40AF]';
    case 'pink_ombre':
      return 'bg-gradient-to-b from-[#0E0E10] to-[#BE185D]';
    default:
      return 'bg-neutral-800';
  }
};

const ColorButton: React.FC<{ item: StyleOption; isSelected: boolean; onClick: () => void }> = ({ item, isSelected, onClick }) => {
  const swatchClass = getColorSwatchClass(item.id);
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 w-10 h-10 rounded-full border-2 transition-all duration-200 overflow-hidden relative group active:scale-95 ${
        isSelected 
          ? 'border-indigo-500 scale-105 shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
          : 'border-white/10 hover:border-white/30'
      }`}
      title={item.label}
    >
      <div className={`w-full h-full ${swatchClass}`} />
      {isSelected && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
};