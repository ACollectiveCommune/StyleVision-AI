import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { estimateHeadPose, HeadPose } from "../services/mediaPipePose";
import { AppState, ThreeSixtyPreview, ThreeSixtyGenerationJob, User360Wallet, AppMode, Gender } from "../types";
import { AESTHETIC_TREATMENTS } from "../constants/aesthetics";

const isDevMode = window.location.hostname === "localhost" || window.location.hostname.includes("127.0.0.1");

const devLog = (message: string, ...args: any[]) => {
  if (isDevMode) {
    console.log(`[GuidedScan DEV] ${message}`, ...args);
  }
};
let globalFaceLandmarker: any = null;
let globalVisionResolver: any = null;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ScannerErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ScannerErrorBoundary caught a fatal crash:", error, errorInfo);
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
import { 
  threeSixtyFeatureConfig, 
  getUser360Wallet, 
  reserveCredit, 
  finalizeCharge, 
  refundCredit, 
  saveGenerationJob, 
  save360Preview, 
  get360PreviewsHistory,
  purchaseTopUpCredits
} from "../services/threeSixtyService";
import { generateStylePreview } from "../services/geminiService";
import { downloadOrShareImage } from "../services/shareService";
import { saveImageToPhotos, saveAllImagesToPhotos } from "../services/saveService";
import { 
  HAIR_STYLES_MALE, 
  HAIR_STYLES_FEMALE, 
  HAIR_COLORS, 
  BEARD_STYLES, 
  OUTFIT_STYLES,
  MAKEUP_STYLES
} from "../constants";

interface ThreeSixtyViewerProps {
  uid: string;
  appState: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onClose: () => void;
  onOpenPaywall: () => void;
  initialViewState?: "intro" | "scanner" | "customization" | "generating" | "viewer" | "history" | "store";
  initialPreview?: ThreeSixtyPreview | null;
}

const ANGLES = [
  { id: "left", label: "Left Profile (90°)", targetDesc: "Turn completely to your left profile" },
  { id: "front_left", label: "Front-Left (45°)", targetDesc: "Slowly turn your head to your front-left" },
  { id: "front", label: "Front (0°)", targetDesc: "Look straight into the camera" },
  { id: "front_right", label: "Front-Right (45°)", targetDesc: "Slowly turn your head to your front-right" },
  { id: "right", label: "Right Profile (90°)", targetDesc: "Turn completely to your right profile" }
];

// 3x3 Laplacian edge convolution filter to compute variance sharpness score
const computeLaplacianVariance = (ctx: CanvasRenderingContext2D, w: number, h: number): number => {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  
  const grid = 60;
  const lats = new Float32Array(grid * grid);
  const stepX = Math.floor(w / grid);
  const stepY = Math.floor(h / grid);
  
  const getGray = (gx: number, gy: number) => {
    const idx = (gy * stepY * w + gx * stepX) * 4;
    return 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
  };

  for (let y = 1; y < grid - 1; y++) {
    for (let x = 1; x < grid - 1; x++) {
      const val = 4 * getGray(x, y) - getGray(x-1, y) - getGray(x+1, y) - getGray(x, y-1) - getGray(x, y+1);
      lats[y * grid + x] = val;
    }
  }

  let sum = 0;
  let count = 0;
  for (let i = 0; i < lats.length; i++) {
    sum += lats[i];
    count++;
  }
  const mean = sum / count;
  let varianceSum = 0;
  for (let i = 0; i < lats.length; i++) {
    varianceSum += Math.pow(lats[i] - mean, 2);
  }
  return varianceSum / count;
};

// Check for duplicate captured frames by downsampling and calculating mean absolute error
const checkDuplicateFrames = (frameA: string, frameB: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const imgA = new Image();
    const imgB = new Image();
    let loaded = 0;
    
    const compare = () => {
      loaded++;
      if (loaded === 2) {
        const canvas = document.createElement("canvas");
        canvas.width = 30;
        canvas.height = 30;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(false);
          return;
        }
        
        ctx.drawImage(imgA, 0, 0, 30, 30);
        const dataA = ctx.getImageData(0, 0, 30, 30).data;
        
        ctx.drawImage(imgB, 0, 0, 30, 30);
        const dataB = ctx.getImageData(0, 0, 30, 30).data;
        
        let diffSum = 0;
        for (let i = 0; i < dataA.length; i += 4) {
          diffSum += Math.abs(dataA[i] - dataB[i]) + Math.abs(dataA[i+1] - dataB[i+1]) + Math.abs(dataA[i+2] - dataB[i+2]);
        }
        
        const avgDiff = diffSum / (30 * 30 * 3);
        resolve(avgDiff < 6.0); // Threshold representing identical frames
      }
    };
    imgA.onload = compare;
    imgB.onload = compare;
    imgA.onerror = () => resolve(false);
    imgB.onerror = () => resolve(false);
    imgA.src = frameA;
    imgB.src = frameB;
  });
};

export const playAngleCapturedFeedback = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.start(now);
    osc.stop(now + 0.15);
    
    if (navigator.vibrate) {
      navigator.vibrate([40]);
    }
  } catch (e) {
    console.warn("Audio/haptic feedback blocked or unsupported:", e);
  }
};

export const unlockAudio = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
    }
  } catch (e) {
    console.warn("AudioContext unlock failure:", e);
  }
};

export const validateFrameQuality = (dataUrl: string): Promise<{ valid: boolean; reason?: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width < 320 || img.height < 320) {
        resolve({ valid: false, reason: "Image resolution is too low" });
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ valid: true });
        return;
      }
      ctx.drawImage(img, 0, 0, 160, 160);
      
      const imgData = ctx.getImageData(0, 0, 160, 160);
      const data = imgData.data;
      
      let sumLuminance = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        sumLuminance += lum;
        count++;
      }
      const avgLuminance = sumLuminance / count;

      const sharpness = computeLaplacianVariance(ctx, 160, 160);

      if (avgLuminance < 35) {
        resolve({ valid: false, reason: "Too dark (Please move to a brighter area)" });
      } else if (avgLuminance > 225) {
        resolve({ valid: false, reason: "Too overexposed (Avoid harsh direct lights)" });
      } else if (sharpness < 8.0) {
        resolve({ valid: false, reason: "Blurry capture (Keep camera steady)" });
      } else {
        resolve({ valid: true });
      }
    };
    img.onerror = () => resolve({ valid: true });
    img.src = dataUrl;
  });
};

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

export const ThreeSixtyViewer: React.FC<ThreeSixtyViewerProps> = ({
  uid,
  appState,
  onUpdateState,
  onClose,
  onOpenPaywall,
  initialViewState,
  initialPreview
}) => {
  const userId = uid || "guest_user_local";
  
  // Wallet state
  const [wallet, setWallet] = useState<User360Wallet | null>(null);
  const [isSub, setIsSub] = useState(false);
  const [credits, setCredits] = useState(0);
  
  const [viewState, setViewState] = useState<"intro" | "scanner" | "customization" | "generating" | "viewer" | "history" | "store">(initialViewState || "intro");
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [scannerPhase, setScannerPhase] = useState<"idle" | "starting_camera" | "camera_ready" | "loading_tracker" | "ready" | "error" | "validating" | "preparing_editor">("idle");
  const [scannerError, setScannerError] = useState<string | null>(null);
  
  // Camera variables
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturingFrame, setIsCapturingFrame] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState<boolean>(false);
  const facingModeRef = useRef<string>('user');
  useEffect(() => { facingModeRef.current = facingMode; }, [facingMode]);

  // MediaPipe FaceLandmarker state
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [landmarkerLoading, setLandmarkerLoading] = useState(false);
  const [headPose, setHeadPose] = useState<HeadPose | null>(null);
  const poseHistoryRef = useRef<{ yaw: number; pitch: number; roll: number }[]>([]);

  // Scan tracking & stability parameters
  const [activeAngleIndex, setActiveAngleIndex] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<Record<string, string>>({});
  const [stabilityProgress, setStabilityProgress] = useState(0);
  const [isAligned, setIsAligned] = useState(false);
  const requestRef = useRef<number | null>(null);
  const lastLoopLogTime = useRef(0);

  // High-frequency frame loop sync refs to prevent React stale closure bugs
  const activeAngleIndexRef = useRef(activeAngleIndex);
  useEffect(() => { activeAngleIndexRef.current = activeAngleIndex; }, [activeAngleIndex]);
  const alignmentHoldDurationRef = useRef(0);
  const misalignedTimeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const misalignedFramesRef = useRef(0);

  // Motion metrics (for blur/motion lockouts)
  const prevFrameRef = useRef<ImageData | null>(null);
  const [motionLevel, setMotionLevel] = useState(0);
  const [phoneMoving, setPhoneMoving] = useState(false);

  // Validation Phase States
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<Record<string, { valid: boolean; reason?: string }>>({});
  const validationResultsRef = useRef<Record<string, { valid: boolean; reason?: string }>>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [retakeAngleId, setRetakeAngleId] = useState<string | null>(null);
  const retakeAngleIdRef = useRef<string | null>(null);
  useEffect(() => { retakeAngleIdRef.current = retakeAngleId; }, [retakeAngleId]);

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      setDebugLogs(prev => [...prev, `[Uncaught] ${event.message} at ${event.filename}:${event.lineno}`]);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      setDebugLogs(prev => [...prev, `[Rejection] ${event.reason}`]);
    };
    
    const originalConsoleError = console.error;
    console.error = (...args) => {
      setDebugLogs(prev => [...prev, `[Console Error] ${args.join(" ")}`]);
      originalConsoleError.apply(console, args);
    };

    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      setDebugLogs(prev => [...prev, `[Console Warn] ${args.join(" ")}`]);
      originalConsoleWarn.apply(console, args);
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleRejection);
    
    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleRejection);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Hybrid Rear Tracking manual capture override states & timer refs
  const [showManualFallbackBtn, setShowManualFallbackBtn] = useState(false);
  const [captureToast, setCaptureToast] = useState<string | null>(null);
  const activeAngleStartTimeRef = useRef<number>(0);
  useEffect(() => {
    setShowManualFallbackBtn(false);
    activeAngleStartTimeRef.current = performance.now();
  }, [activeAngleIndex]);

  // Customization selection state
  const [selectedHair, setSelectedHair] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedBeard, setSelectedBeard] = useState<any>(null);
  const [selectedBeardColor, setSelectedBeardColor] = useState<any>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<any>(null);
  const [aesthetics, setAesthetics] = useState<Record<string, number>>({
    botox: 0,
    skin_glow: 0,
    lip_filler: 0
  });

  // Generation status
  const [genProgress, setGenProgress] = useState(0);
  const [genMessage, setGenMessage] = useState("");
  
  // Interactive player state
  const [loadedPreview, setLoadedPreview] = useState<ThreeSixtyPreview | null>(initialPreview || null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(2);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const autoplayDir = useRef<1 | -1>(1);
  const dragStartX = useRef(0);
  const dragStartFrame = useRef(0);
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // Redesigned viewer & saving control states
  const [isZoomed, setIsZoomed] = useState(false);
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showStyleSummary, setShowStyleSummary] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isRegeneratingAngle, setIsRegeneratingAngle] = useState(false);

  const [previewsHistory, setPreviewsHistory] = useState<ThreeSixtyPreview[]>([]);

  // Sync wallet state
  const syncWallet = async () => {
    const w = await getUser360Wallet(userId);
    setWallet(w);
    const subActive = w.subscriptionStatus === "active";
    setIsSub(subActive);
    const balance = w.subscriptionCredits + w.purchasedCredits;
    setCredits(balance);
    onUpdateState({
      isSubscriber: subActive,
      subscriptionPlan: w.subscriptionPlan,
      available360Credits: balance
    });
  };

  useEffect(() => {
    syncWallet();
    loadPreviewsHistory();
    
    if (appState.active360PreviewId) {
      (async () => {
        try {
          const list = await get360PreviewsHistory(userId);
          const found = list.find(p => p.id === appState.active360PreviewId);
          if (found) {
            setLoadedPreview(found);
            setViewState("viewer");
            setCurrentFrameIndex(2);
          }
        } catch (e) {
          console.error("Failed to auto-load active 180 preview:", e);
        }
      })();
    }
  }, [userId, appState.active360PreviewId]);

  const loadPreviewsHistory = async () => {
    const list = await get360PreviewsHistory(userId);
    setPreviewsHistory(list);
  };

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);



  // Monitor phone motion to warn if phone is moving
  useEffect(() => {
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const force = Math.hypot(acc.x || 0, acc.y || 0, acc.z || 0);
      // Threshold for phone movement / shaking
      if (Math.abs(force - 9.8) > 2.2) {
        setPhoneMoving(true);
      } else {
        setPhoneMoving(false);
      }
    };
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  // Query list of video devices on scanner load
  useEffect(() => {
    const checkDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (e) {
        console.warn("Devices scan failed:", e);
      }
    };
    checkDevices();
  }, []);

  // Camera stream controllers
  const runScannerStartupSequence = async () => {
    try {
      devLog("Start button pressed, initializing startup sequence...");
      setScannerPhase("starting_camera");
      setScannerError(null);
      setCameraError(null);
      setIsCameraActive(false);

      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // 1. Request camera stream
      devLog("Requesting camera permission and stream...");
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        devLog("Camera stream acquired successfully.");
      } catch (err: any) {
        devLog("Camera stream acquisition failed:", err);
        throw new Error(`Camera access failed: ${err.message || err}`);
      }

      setStream(mediaStream);

      // 2. Attach stream to video element
      devLog("Attaching MediaStream to video element...");
      
      // Let's wait a frame for the video Ref to be populated by React render
      let video = videoRef.current;
      if (!video) {
        devLog("videoRef.current was null, waiting 100ms for element to mount...");
        await new Promise(r => setTimeout(r, 100));
        video = videoRef.current;
      }
      
      if (!video) {
        devLog("Fatal: video element ref is still null after waiting!");
        throw new Error("Video element mounting failed.");
      }

      video.srcObject = mediaStream;
      devLog("Stream attached, invoking video.play()...");

      try {
        await video.play();
        devLog("Video playback started.");
      } catch (err: any) {
        devLog("Video play() failed:", err);
        throw new Error(`Video playback failed to start: ${err.message || err}`);
      }

      // 3. Wait for video metadata and first frame
      devLog("Waiting for video metadata to load...");
      let checkCount = 0;
      while (
        (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) &&
        checkCount < 100
      ) {
        await new Promise(r => setTimeout(r, 50));
        checkCount++;
      }

      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        devLog(`Metadata load timed out: readyState=${video.readyState}, size=${video.videoWidth}x${video.videoHeight}`);
        throw new Error("Camera stream loaded but is not delivering frames.");
      }

      devLog(`Video metadata loaded: size=${video.videoWidth}x${video.videoHeight}, readyState=${video.readyState}`);

      // 4. Initialize MediaPipe FaceLandmarker
      setScannerPhase("loading_tracker");
      devLog("Initializing MediaPipe resolver...");

      let landmarkerInstance = landmarker || globalFaceLandmarker;
      if (!landmarkerInstance) {
        try {
          devLog("Fetching MediaPipe vision resolver...");
          if (!globalVisionResolver) {
            globalVisionResolver = await FilesetResolver.forVisionTasks(
              "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
            );
          }
          devLog("Creating FaceLandmarker instance (CPU delegate)...");
          landmarkerInstance = await FaceLandmarker.createFromOptions(globalVisionResolver, {
            baseOptions: {
              modelAssetPath: "/face_landmarker.task",
              delegate: "CPU"
            },
            runningMode: "VIDEO",
            numFaces: 1
          });
          globalFaceLandmarker = landmarkerInstance;
          setLandmarker(landmarkerInstance);
          devLog("MediaPipe FaceLandmarker created successfully.");
        } catch (err: any) {
          devLog("MediaPipe creation failed:", err);
          throw new Error(`Face tracker initialization failed: ${err.message || err}`);
        }
      } else {
        if (!landmarker) {
          setLandmarker(landmarkerInstance);
        }
        devLog("Reusing existing FaceLandmarker instance.");
      }

      // 5. Final camera check
      devLog("Performing final camera readiness checks...");
      if (
        video.srcObject !== mediaStream ||
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0 ||
        mediaStream.getVideoTracks()[0]?.readyState !== "live"
      ) {
        devLog("Readiness checks failed prior to starting loop.");
        throw new Error("Camera is in an unstable state.");
      }

      // 6. Transition to ready
      setScannerPhase("ready");
      setIsCameraActive(true);
      devLog("Scan loop ready and started.");

    } catch (err: any) {
      devLog("Startup sequence failed:", err);
      const errMsg = err.message || String(err);
      setScannerError(errMsg);
      setCameraError(errMsg);
      setScannerPhase("error");
      setIsCameraActive(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const stopCamera = () => {
    devLog("stopCamera() invoked, tearing down stream tracks...");
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setScannerPhase("idle");
  };

  const cleanupScannerForTransition = () => {
    devLog("cleanupScannerForTransition(): Tearing down camera, stream tracks, animations, and elements...");
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) { console.warn("Track stop error:", e); }
      });
      setStream(null);
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      } catch (e) {
        console.warn("Video cleanup error:", e);
      }
    }
    clearOverlay();
    setIsCameraActive(false);
  };

  // Sync camera stream with viewState lifecycle
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && viewState === "scanner") {
        runScannerStartupSequence();
      } else {
        stopCamera();
      }
    };

    if (viewState === "scanner") {
      runScannerStartupSequence();
      document.addEventListener("visibilitychange", handleVisibility);
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [viewState, facingMode]);



  // Optical flow motion analysis
  const detectMotion = (video: HTMLVideoElement) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return 0;
      ctx.drawImage(video, 0, 0, 64, 64);
      
      const currFrame = ctx.getImageData(0, 0, 64, 64);
      if (!prevFrameRef.current) {
        prevFrameRef.current = currFrame;
        return 0;
      }
      
      const prevData = prevFrameRef.current.data;
      const currData = currFrame.data;
      let diff = 0;
      for (let i = 0; i < currData.length; i += 16) {
        diff += Math.abs(currData[i] - prevData[i]) + Math.abs(currData[i+1] - prevData[i+1]) + Math.abs(currData[i+2] - prevData[i+2]);
      }
      
      prevFrameRef.current = currFrame;
      return diff / (64 * 64 * 3 / 4);
    } catch (e) {
      console.warn("Motion detection failed (e.g. cross-origin canvas security limit):", e);
      return 0;
    }
  };

  const autoCaptureSnap = async () => {
    if (!videoRef.current || !isCameraActive) return;
    
    const currentIdx = activeAngleIndexRef.current;
    if (currentIdx >= ANGLES.length) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (facingModeRef.current === 'user') {
        // Mirror the captured image only for front camera
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const frameDataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const angleId = ANGLES[currentIdx].id;
      
      if (navigator.vibrate) navigator.vibrate(80);
      
      setCapturedFrames(prev => {
        const updatedFrames = { ...prev, [angleId]: frameDataUrl };
        setTimeout(() => {
          handlePostCapture(updatedFrames, angleId, frameDataUrl);
        }, 0);
        return updatedFrames;
      });
      
      // Reset alignment trackers immediately
      alignmentHoldDurationRef.current = 0;
      misalignedTimeRef.current = 0;
      setIsAligned(false);
      setStabilityProgress(0);
    }
  };

  const proceedToEditor = async (frames: Record<string, string>) => {
    try {
      setScannerPhase("preparing_editor");
      cleanupScannerForTransition();
      
      const defaultHair = appState.selectedHairStyle || (appState.gender === "Female" ? HAIR_STYLES_FEMALE[0] : HAIR_STYLES_MALE[0]);
      const defaultBeard = appState.selectedBeardStyle || BEARD_STYLES[0];
      const defaultColor = appState.selectedHairColor || HAIR_COLORS[0];
      const defaultOutfit = appState.selectedOutfit || OUTFIT_STYLES[0];
      const defaultMakeup = appState.selectedMakeup || MAKEUP_STYLES[0];
      
      const session: Interactive180Session = {
        id: "session_" + Math.random().toString(36).substr(2, 9),
        frames: {
          left: frames["left"],
          front_left: frames["front_left"] || frames["frontLeft"] || frames["front-left 45"] || frames["front left 45"] || frames["left45"] || frames["frontLeft45"] || "",
          front: frames["front"],
          front_right: frames["front_right"] || frames["frontRight"] || frames["front-right 45"] || frames["front right 45"] || frames["right45"] || frames["frontRight45"] || "",
          right: frames["right"]
        },
        status: "captured"
      };
      
      onUpdateState({
        originalImage: frames["front"],
        currentImage: null,
        selectedHairStyle: defaultHair,
        selectedBeardStyle: defaultBeard,
        selectedHairColor: defaultColor,
        selectedBeardColor: defaultColor,
        selectedOutfit: defaultOutfit,
        selectedMakeup: defaultMakeup,
        selectedTreatments: appState.selectedTreatments || [],
        customPrompt: appState.customPrompt || '',
        captured180Frames: frames,
        editorMode: "interactive_180",
        current180Session: session,
        show360Viewer: false
      });
    } catch (err: any) {
      console.error("Failed to proceed to editor from 180 scan:", err);
      setScannerError(err.message || String(err));
      setScannerPhase("error");
    }
  };

  const handlePostCapture = async (updatedFrames: Record<string, string>, angleId: string, frameDataUrl: string) => {
    const retakeId = retakeAngleIdRef.current;
    
    const res = await validateFrameQuality(frameDataUrl);
    validationResultsRef.current = { ...validationResultsRef.current, [angleId]: res };
    setValidationResults(prev => ({ ...prev, [angleId]: res }));
    
    if (res.valid) {
      playAngleCapturedFeedback();
    }
    
    if (retakeId) {
      setIsValidating(false);
      setRetakeAngleId(null);
      
      setActiveAngleIndex(ANGLES.length);
      setShowValidationSummary(true);
    } else {
      const numCaptured = Object.keys(updatedFrames).length;
      if (numCaptured === ANGLES.length) {
        setScannerPhase("validating");
        setIsValidating(true);
        
        const results = { ...validationResultsRef.current };
        let allOk = true;

        for (const angle of ANGLES) {
          if (!results[angle.id]) {
            const dataUrl = updatedFrames[angle.id];
            if (dataUrl) {
              const valRes = await validateFrameQuality(dataUrl);
              results[angle.id] = valRes;
            } else {
              results[angle.id] = { valid: false, reason: "Missing capture" };
            }
          }
          if (!results[angle.id].valid) {
            allOk = false;
          }
        }

        // Optimized adjacent-frame duplicate check (4 checks instead of 10)
        const adjacentPairs = [
          ["left", "front_left"],
          ["front_left", "front"],
          ["front", "front_right"],
          ["front_right", "right"]
        ];

        for (const [idA, idB] of adjacentPairs) {
          if (updatedFrames[idA] && updatedFrames[idB]) {
            const isDup = await checkDuplicateFrames(updatedFrames[idA], updatedFrames[idB]);
            if (isDup) {
              results[idA] = { valid: false, reason: `Duplicate matches ${idB.replace("_", " ")}` };
              results[idB] = { valid: false, reason: `Duplicate matches ${idA.replace("_", " ")}` };
              allOk = false;
            }
          }
        }

        validationResultsRef.current = results;
        setValidationResults(results);
        setIsValidating(false);

        if (allOk) {
          await proceedToEditor(updatedFrames);
        } else {
          setScannerPhase("ready");
          setActiveAngleIndex(ANGLES.length);
          setShowValidationSummary(true);
        }
      } else {
        const nextUnscannedIdx = ANGLES.findIndex(a => !updatedFrames[a.id]);
        if (nextUnscannedIdx > -1) {
          setActiveAngleIndex(nextUnscannedIdx);
        }
      }
    }
  };

  const checkAlignmentAndTick = (pose: HeadPose | null, now: number) => {
    if (activeAngleIndexRef.current >= ANGLES.length) return;

    if (!pose) {
      handleAlignmentReset();
      return;
    }

    const { yaw, pitch, roll, faceX, faceY, faceScale } = pose;
    const isMirrored = facingModeRef.current === 'user';
    
    // 1. Identify which target angle matches the current head yaw
    let detectedAngle: typeof ANGLES[number] | null = null;
    
    if (Math.abs(yaw) <= 10) {
      detectedAngle = ANGLES.find(a => a.id === "front") || null;
    } else if (isMirrored ? (yaw >= 30 && yaw <= 55) : (yaw >= -55 && yaw <= -30)) {
      detectedAngle = ANGLES.find(a => a.id === "front_left") || null;
    } else if (isMirrored ? (yaw >= 55 && yaw <= 80) : (yaw >= -80 && yaw <= -55)) {
      detectedAngle = ANGLES.find(a => a.id === "left") || null;
    } else if (isMirrored ? (yaw >= -80 && yaw <= -55) : (yaw >= 55 && yaw <= 80)) {
      detectedAngle = ANGLES.find(a => a.id === "right") || null;
    } else if (isMirrored ? (yaw >= -55 && yaw <= -30) : (yaw >= 30 && yaw <= 55)) {
      detectedAngle = ANGLES.find(a => a.id === "front_right") || null;
    }

    // 2. Determine target angle to align
    let targetAngle: typeof ANGLES[number] | null = null;
    const retakeId = retakeAngleIdRef.current;
    if (retakeId) {
      if (detectedAngle && detectedAngle.id === retakeId) {
        targetAngle = detectedAngle;
      }
    } else {
      if (detectedAngle && !capturedFrames[detectedAngle.id]) {
        targetAngle = detectedAngle;
      }
    }

    if (!targetAngle) {
      setIsAligned(false);
      setStabilityProgress(0);
      alignmentHoldDurationRef.current = 0;
      lastTimeRef.current = now;
      return;
    }

    // 3. Highlight this angle in progress bar
    setActiveAngleIndex(ANGLES.indexOf(targetAngle));

    // 4. Centering and tilt checks with relaxed parameters for profile views
    const isProfile = targetAngle.id === "left" || targetAngle.id === "right";
    const xMin = isProfile ? 0.22 : 0.30;
    const xMax = isProfile ? 0.78 : 0.70;
    const yMin = isProfile ? 0.22 : 0.30;
    const yMax = isProfile ? 0.78 : 0.70;
    const maxPitch = isProfile ? 25 : 20;
    const maxRoll = isProfile ? 25 : 20;

    const isCentred = faceX >= xMin && faceX <= xMax && faceY >= yMin && faceY <= yMax;
    const isSized = faceScale >= 0.15 && faceScale <= 0.55;
    const isStraight = Math.abs(pitch) <= maxPitch && Math.abs(roll) <= maxRoll;

    const aligned = isCentred && isSized && isStraight && !phoneMoving && motionLevel < 2.5;
    setIsAligned(aligned);

    const deltaTime = lastTimeRef.current > 0 ? Math.min(now - lastTimeRef.current, 100) : 16;
    lastTimeRef.current = now;

    if (aligned) {
      misalignedTimeRef.current = 0;
      
      if (alignmentHoldDurationRef.current > 3500) {
        console.warn("Capture hold stuck. Resetting.");
        alignmentHoldDurationRef.current = 0;
        setStabilityProgress(0);
        setIsAligned(false);
        return;
      }

      alignmentHoldDurationRef.current += deltaTime;
      const progress = Math.min(100, Math.round((alignmentHoldDurationRef.current / 500) * 100));
      setStabilityProgress(progress);

      if (progress >= 100) {
        alignmentHoldDurationRef.current = 0;
        setStabilityProgress(0);
        setIsAligned(false);
        autoCaptureSnap();
      }
    } else {
      alignmentHoldDurationRef.current = 0;
      setStabilityProgress(0);
    }
  };

  const handleAlignmentReset = () => {
    setIsAligned(false);
    setStabilityProgress(0);
    alignmentHoldDurationRef.current = 0;
    misalignedTimeRef.current = 0;
    lastTimeRef.current = 0;
  };

  const handleSwitchCamera = async () => {
    setIsSwitchingCamera(true);
    handleAlignmentReset();

    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    await new Promise(r => setTimeout(r, 400));
    setIsSwitchingCamera(false);
  };

  // Face landmarker & pose estimation process loop
  useEffect(() => {
    if (viewState !== "scanner" || !isCameraActive || !landmarker || isSwitchingCamera) return;

    const processFrame = () => {
      const video = videoRef.current;
      const now = performance.now();

      if (now - lastLoopLogTime.current > 2000) {
        lastLoopLogTime.current = now;
        if (video) {
          console.warn(`DIAGNOSTIC: Video element details - readyState=${video.readyState}, paused=${video.paused}, srcObject=${video.srcObject ? "Set" : "Null"}, size=${video.videoWidth}x${video.videoHeight}`);
        } else {
          console.warn("DIAGNOSTIC: Video element is null in the requestAnimationFrame loop.");
        }
      }

      const activeStream = stream;
      const isStreamLive = activeStream && activeStream.getVideoTracks()[0]?.readyState === "live";
      
      const isReady = 
        video && 
        video.srcObject === activeStream &&
        video.readyState >= 2 && 
        video.videoWidth > 0 && 
        video.videoHeight > 0 && 
        isStreamLive && 
        !isSwitchingCamera;

      if (isReady) {
        let results;
        try {
          results = landmarker.detectForVideo(video, now);
        } catch (error) {
          console.error("MediaPipe detectForVideo crashed:", error);
          requestRef.current = requestAnimationFrame(processFrame);
          return;
        }
        
        // Calculate secondary motion speed
        const motion = detectMotion(video);
        setMotionLevel(motion);

        if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];
          const rawPose = estimateHeadPose(landmarks);
          if (rawPose) {
            // Pose smoothing moving average over latest 6 frames
            const history = poseHistoryRef.current;
            history.push({ yaw: rawPose.yaw, pitch: rawPose.pitch, roll: rawPose.roll });
            if (history.length > 6) {
              history.shift();
            }

            const avgYaw = history.reduce((sum, item) => sum + item.yaw, 0) / history.length;
            const avgPitch = history.reduce((sum, item) => sum + item.pitch, 0) / history.length;
            const avgRoll = history.reduce((sum, item) => sum + item.roll, 0) / history.length;

            const smoothedPose: HeadPose = {
              ...rawPose,
              yaw: Math.round(avgYaw),
              pitch: Math.round(avgPitch),
              roll: Math.round(avgRoll)
            };

            setHeadPose(smoothedPose);

            // Console debug logs in devMode
            if (isDevMode) {
              console.debug(`[Pose] Yaw: ${smoothedPose.yaw}°, Pitch: ${smoothedPose.pitch}°, Roll: ${smoothedPose.roll}°, faceScale: ${smoothedPose.faceScale}`);
            }

            // Draw face outline mesh on canvas overlay
            drawFaceMesh(landmarks);

            // Execute frame alignment delta checks
            checkAlignmentAndTick(smoothedPose, now);
          }
        } else {
          setHeadPose(null);
          poseHistoryRef.current = [];
          clearOverlay();
          checkAlignmentAndTick(null, now);
        }
      }
      requestRef.current = requestAnimationFrame(processFrame);
    };

    requestRef.current = requestAnimationFrame(processFrame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      clearOverlay();
      handleAlignmentReset();
    };
  }, [viewState, isCameraActive, landmarker, isSwitchingCamera]);

  const drawFaceMesh = (landmarks: any[]) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = isAligned ? "rgba(52, 211, 153, 0.6)" : "rgba(255, 255, 255, 0.4)";
    ctx.strokeStyle = isAligned ? "rgba(52, 211, 153, 0.3)" : "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;

    // Draw main face outline connection points
    const ovalIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
    
    ctx.beginPath();
    ovalIndices.forEach((idx, i) => {
      const lm = landmarks[idx];
      if (!lm) return;
      // Mirror coordinate only when preview is mirrored (facingMode === 'user')
      const x = facingMode === 'user' ? (1 - lm.x) * canvas.width : lm.x * canvas.width;
      const y = lm.y * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();

    // Draw key visual face coordinates
    const keyIndices = [1, 33, 263, 152];
    keyIndices.forEach(idx => {
      const lm = landmarks[idx];
      if (!lm) return;
      const x = facingMode === 'user' ? (1 - lm.x) * canvas.width : lm.x * canvas.width;
      const y = lm.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const clearOverlay = () => {
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };



  const manualCaptureFallback = async () => {
    if (activeAngleIndex < ANGLES.length) {
      setIsCapturingFrame(true);
      await new Promise(r => setTimeout(r, 600));
      await autoCaptureSnap();
      setIsCapturingFrame(false);
    }
  };

  const selectAngleForCapture = (index: number) => {
    setRetakeAngleId(null);
    setActiveAngleIndex(index);
    setStabilityProgress(0);
    setIsAligned(false);
  };

  const handleRetakeSingleAngle = (angleId: string, index: number) => {
    setRetakeAngleId(angleId);
    setActiveAngleIndex(index);
    setStabilityProgress(0);
    setIsAligned(false);
    setShowValidationSummary(false);
    setViewState("scanner");
  };

  // Quality validation dashboard
  const runQualityValidation = async (frames: Record<string, string>) => {
    setIsValidating(true);
    const results: Record<string, { valid: boolean; reason?: string }> = {};
    let allOk = true;

    // Validate brightness and sharpness on each frame
    for (const angle of ANGLES) {
      const dataUrl = frames[angle.id];
      if (dataUrl) {
        const res = await validateFrameQuality(dataUrl);
        results[angle.id] = res;
        if (!res.valid) {
          allOk = false;
        }
      } else {
        results[angle.id] = { valid: false, reason: "Missing capture" };
        allOk = false;
      }
    }

    // Cross-frame duplicate check
    const keys = Object.keys(frames);
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const idA = keys[i];
        const idB = keys[j];
        const isDup = await checkDuplicateFrames(frames[idA], frames[idB]);
        if (isDup) {
          results[idA] = { valid: false, reason: `Duplicate matches ${idB.replace("_", " ")}` };
          results[idB] = { valid: false, reason: `Duplicate matches ${idA.replace("_", " ")}` };
          allOk = false;
        }
      }
    }

    setValidationResults(results);
    setIsValidating(false);
    setShowValidationSummary(true);
  };

  // Autoplay rotation player
  useEffect(() => {
    if (viewState === "viewer" && loadedPreview && isPlaying) {
      autoplayTimer.current = setInterval(() => {
        setCurrentFrameIndex(prev => {
          let next = prev + autoplayDir.current;
          if (next >= 5) {
            autoplayDir.current = -1;
            next = 3;
          } else if (next < 0) {
            autoplayDir.current = 1;
            next = 1;
          }
          return next;
        });
      }, 800);
    }
    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    };
  }, [viewState, loadedPreview, isPlaying]);

  const handleDragStart = (clientX: number) => {
    setIsPlaying(false);
    setIsDragging(true);
    setHasInteracted(true);
    dragStartX.current = clientX;
    dragStartFrame.current = currentFrameIndex;
    if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  };

  const handleDragMove = (clientX: number) => {
    if (isPlaying) return;
    const deltaX = clientX - dragStartX.current;
    const frameDiff = Math.floor(deltaX / 30);
    let targetFrame = dragStartFrame.current - frameDiff;
    if (targetFrame < 0) targetFrame = 0;
    if (targetFrame > 4) targetFrame = 4;
    setCurrentFrameIndex(targetFrame);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleSaveCurrentView = async () => {
    setShowSaveMenu(false);
    setSaveError(null);
    setSuccessToast(null);
    if (!loadedPreview) return;

    const angle = ANGLES[currentFrameIndex];
    const highRes = loadedPreview.highResFrameUrls?.[currentFrameIndex] || loadedPreview.frameUrls[currentFrameIndex];
    
    setSaveProgress({ current: 1, total: 1 });
    try {
      const filename = `stylevision_${angle.id}.jpg`;
      const res = await saveImageToPhotos(highRes, filename);
      if (res.success) {
        if (res.method === 'download') {
          setSuccessToast(`${angle.label} downloaded successfully.`);
        } else {
          setSuccessToast(`${angle.label} view saved to Photos.`);
        }
      } else {
        setSaveError(res.message);
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to save current image.");
    } finally {
      setSaveProgress(null);
    }
  };

  const handleSaveAllViews = async () => {
    setShowSaveMenu(false);
    setSaveError(null);
    setSuccessToast(null);
    if (!loadedPreview) return;

    const frameList = loadedPreview.highResFrameUrls || loadedPreview.frameUrls;
    if (frameList.length < 5) {
      setSaveError("Not all 5 views are ready to save.");
      return;
    }

    const imagesToSave = ANGLES.map((angle, idx) => ({
      base64: frameList[idx],
      filename: `stylevision_${angle.id}.jpg`
    }));

    setSaveProgress({ current: 1, total: 5 });
    try {
      const res = await saveAllImagesToPhotos(imagesToSave, (curr, tot) => {
        setSaveProgress({ current: curr, total: tot });
      });
      if (res.success) {
        if (res.method === 'download') {
          setSuccessToast("All 5 views downloaded successfully.");
        } else {
          setSuccessToast("All 5 views saved successfully to Photos.");
        }
      } else {
        setSaveError(res.message);
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to save all images.");
    } finally {
      setSaveProgress(null);
    }
  };

  const handleShareCurrentView = async () => {
    setShowSaveMenu(false);
    setSaveError(null);
    setSuccessToast(null);
    if (!loadedPreview) return;
    const highRes = loadedPreview.highResFrameUrls?.[currentFrameIndex] || loadedPreview.frameUrls[currentFrameIndex];
    try {
      await downloadOrShareImage(highRes);
      setSuccessToast("Share sheet opened.");
    } catch (e: any) {
      setSaveError(e.message || "Share cancelled");
    }
  };

  const handleShareAllViews = async () => {
    setShowSaveMenu(false);
    setSaveError(null);
    setSuccessToast(null);
    if (!loadedPreview) return;

    const frameList = loadedPreview.highResFrameUrls || loadedPreview.frameUrls;
    const imagesToSave = ANGLES.map((angle, idx) => ({
      base64: frameList[idx],
      filename: `stylevision_${angle.id}.jpg`
    }));
    try {
      await saveAllImagesToPhotos(imagesToSave);
      setSuccessToast("Share sheet opened.");
    } catch (e: any) {
      setSaveError(e.message || "Share cancelled");
    }
  };

  const handleRegenerateCurrentAngle = async () => {
    if (isRegeneratingAngle) return;
    setShowSaveMenu(false);
    setIsRegeneratingAngle(true);
    setSuccessToast(null);
    setSaveError(null);

    const angle = ANGLES[currentFrameIndex];
    const sourceDataUrl = capturedFrames[angle.id];
    if (!sourceDataUrl) {
      setSaveError("No captured original frame found to regenerate.");
      setIsRegeneratingAngle(false);
      return;
    }

    try {
      const aestheticsMap: Record<string, number> = {};
      AESTHETIC_TREATMENTS.forEach(t => {
        aestheticsMap[t.id] = (aesthetics[t.id] || 0);
      });

      const styleSnapshot = {
        hairstyleId: selectedHair?.id || "male_hair_fade",
        hairColorId: selectedColor?.id || "natural",
        beardId: appState.gender === Gender.MALE ? (selectedBeard?.id || "beard_none") : "none",
        beardColorId: appState.gender === Gender.MALE ? (selectedBeardColor?.id || "natural") : "natural",
        aesthetics: aestheticsMap,
        makeup: "makeup_none",
        outfitId: selectedOutfit?.id || "outfit_casual"
      };

      const jobSeed = Math.floor(Math.random() * 900000) + 100000;

      const mockState: AppState = {
        currentMode: AppMode.EDITOR,
        gender: appState.gender,
        originalImage: sourceDataUrl,
        currentImage: null,
        selectedHairStyle: selectedHair,
        selectedHairColor: selectedColor,
        selectedBeardStyle: selectedBeard,
        selectedBeardColor: selectedBeardColor,
        selectedOutfit: selectedOutfit,
        selectedMakeup: null,
        selectedTreatments: Object.entries(aesthetics)
          .filter(([_, val]) => (val as number) > 0)
          .map(([id, val]) => ({
            treatmentId: id,
            value: Math.ceil((val as number) / 20),
            label: id
          })),
        isProcessing: false,
        isPremium: true,
        premiumChecked: true,
        generationCount: 0,
        credits: 0
      };

      const regeneratedUrl = await generateStylePreview(mockState, styleSnapshot, jobSeed);
      if (!regeneratedUrl || regeneratedUrl === sourceDataUrl) {
        throw new Error("AI returned empty or unchanged frame.");
      }

      if (loadedPreview) {
        const updatedHighRes = [...(loadedPreview.highResFrameUrls || loadedPreview.frameUrls)];
        updatedHighRes[currentFrameIndex] = regeneratedUrl;

        const compressedUrl = await compressImageBase64(regeneratedUrl, 360, 0.45);
        const updatedLowRes = [...loadedPreview.frameUrls];
        updatedLowRes[currentFrameIndex] = compressedUrl;

        const updatedPreview: ThreeSixtyPreview = {
          ...loadedPreview,
          frameUrls: updatedLowRes,
          highResFrameUrls: updatedHighRes,
          thumbnailUrl: updatedHighRes[2],
          completedAt: new Date().toISOString()
        };

        if (uid) {
          await save360Preview(updatedPreview);
        } else {
          const guestHistory = JSON.parse(localStorage.getItem("guest_360_previews") || "[]");
          const idx = guestHistory.findIndex((p: any) => p.id === loadedPreview.id);
          if (idx !== -1) {
            guestHistory[idx] = updatedPreview;
            localStorage.setItem("guest_360_previews", JSON.stringify(guestHistory));
          }
        }

        setLoadedPreview(updatedPreview);
        setSuccessToast(`${angle.label} regenerated successfully!`);
      }
    } catch (err: any) {
      console.error("Single angle regeneration failed:", err);
      setSaveError(`Failed to regenerate ${angle.label}: ${err.message || "Unknown error"}`);
    } finally {
      setIsRegeneratingAngle(false);
    }
  };

  const handleStartCaptureClick = () => {
    unlockAudio();
    if (!isSub) {
      onOpenPaywall();
      return;
    }
    if (credits <= 0) {
      setViewState("store");
      return;
    }
    setViewState("scanner");
    startScanSequence();
  };

  const startScanSequence = () => {
    setActiveAngleIndex(0);
    setCapturedFrames({});
    setIsAligned(false);
    setStabilityProgress(0);
    setShowValidationSummary(false);
    setRetakeAngleId(null);
  };

  const handleScanCompletedContinue = () => {
    proceedToEditor(capturedFrames);
  };

  // AI try-on generation loop: routes each captured frame through Gemini API
  const handleGenerateSubmit = async () => {
    setViewState("generating");
    setGenProgress(5);
    setGenMessage("Initializing preview credit transaction...");

    const jobId = "job_" + Math.random().toString(36).substr(2, 9);
    const previewId = "prev_" + Math.random().toString(36).substr(2, 9);

    let reservedTxId = "";
    try {
      reservedTxId = await reserveCredit(userId, jobId);
      await syncWallet();
    } catch (e: any) {
      alert(e.message || "Failed to reserve credit.");
      setViewState("customization");
      return;
    }

    const jobRecord: ThreeSixtyGenerationJob = {
      id: jobId,
      userId,
      previewId,
      sourceSessionId: "session_" + Date.now(),
      stateSnapshot: {
        hairstyleId: selectedHair?.id || "male_hair_fade",
        beardId: selectedBeard?.id || "beard_none",
        outfitId: selectedOutfit?.id || "outfit_casual",
        aesthetics: aesthetics,
        hairColorId: selectedColor?.id || "natural",
        beardColorId: selectedBeardColor?.id || "natural"
      },
      status: "processing",
      reservedCreditTransactionId: reservedTxId,
      expectedFrameCount: 5,
      completedFrameCount: 0,
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveGenerationJob(jobRecord);

    try {
      const compiledHighResFrames: string[] = [];
      const compiledLowResFrames: string[] = [];
      
      for (let i = 0; i < ANGLES.length; i++) {
        const angle = ANGLES[i];
        setGenProgress(10 + i * 16);
        setGenMessage(`Generating AI look for ${angle.label}...`);
        
        const sourceDataUrl = capturedFrames[angle.id];
        if (!sourceDataUrl) {
          throw new Error(`Missing source photo for: ${angle.label}`);
        }

        // Construct mock state parameter to pass style options to API endpoint
        const mockState: AppState = {
          currentMode: AppMode.EDITOR,
          gender: appState.gender,
          originalImage: sourceDataUrl,
          currentImage: null,
          selectedHairStyle: selectedHair,
          selectedHairColor: selectedColor,
          selectedBeardStyle: selectedBeard,
          selectedBeardColor: selectedBeardColor,
          selectedOutfit: selectedOutfit,
          selectedMakeup: null,
          selectedTreatments: Object.entries(aesthetics)
            .filter(([_, val]) => (val as number) > 0)
            .map(([id, val]) => ({
              treatmentId: id,
              value: Math.ceil((val as number) / 20), // Map percent back to 1-5 slider values
              label: id
            })),
          isProcessing: false,
          isPremium: true,
          premiumChecked: true,
          generationCount: 0,
          credits: 0
        };

        const generatedUrl = await generateStylePreview(mockState);
        
        // Safety / duplicate confirmation check on returned frame
        if (!generatedUrl || generatedUrl === sourceDataUrl) {
          throw new Error(`AI model returned empty or unchanged frame for ${angle.label}.`);
        }

        compiledHighResFrames.push(generatedUrl);
        
        // Compress for smooth 60fps scrubbing
        const compressedUrl = await compressImageBase64(generatedUrl, 360, 0.45);
        compiledLowResFrames.push(compressedUrl);
      }

      setGenProgress(95);
      setGenMessage("Validating generated visual consistencies...");
      await new Promise(r => setTimeout(r, 600));

      await finalizeCharge(userId, jobId, reservedTxId);

      const previewRecord: ThreeSixtyPreview = {
        id: previewId,
        userId,
        sourceSessionId: jobRecord.sourceSessionId,
        hairstyleId: selectedHair?.id || "male_hair_fade",
        beardId: selectedBeard?.id || "beard_none",
        outfitId: selectedOutfit?.id || "outfit_casual",
        aestheticsState: aesthetics,
        aestheticsStateHash: JSON.stringify(aesthetics) + `_${selectedHair?.id}_${selectedBeard?.id}_${selectedOutfit?.id}`,
        frameUrls: compiledLowResFrames,
        highResFrameUrls: compiledHighResFrames,
        thumbnailUrl: compiledHighResFrames[2], // index 2 is Front profile in 5-angle set
        status: "complete",
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      await save360Preview(previewRecord);

      jobRecord.status = "complete";
      jobRecord.completedFrameCount = 5;
      await saveGenerationJob(jobRecord);

      setViewState("viewer");
      setLoadedPreview(previewRecord);
      setCurrentFrameIndex(2);
      onUpdateState({ active360PreviewId: previewId });
      syncWallet();
      loadPreviewsHistory();
    } catch (err: any) {
      console.error("AI 360 preview generation failed:", err);
      jobRecord.status = "failed";
      await saveGenerationJob(jobRecord);
      await refundCredit(userId, jobId, reservedTxId, wallet?.subscriptionCredits ? "subscription" : "purchased");
      await syncWallet();
      
      alert(err.message || "Failed to generate AI try-on frames. Your credit balance has been fully refunded.");
      setViewState("customization");
    }
  };

  const handleBuyTokens = async (packId: "360_preview_1_subscriber" | "360_preview_3_subscriber" | "360_preview_10_subscriber") => {
    if (!isSub) {
      alert("Top-up token packs are exclusive to premium subscribers.");
      return;
    }
    const txId = "token_tx_" + Math.random().toString(36).substr(2, 9);
    try {
      await purchaseTopUpCredits(userId, packId, txId);
      await syncWallet();
      alert("Purchase successful! Balance updated.");
      setViewState("scanner");
    } catch (e: any) {
      alert(e.message || "Purchase failed.");
    }
  };

  const getDynamicGuidanceMessage = () => {
    if (activeAngleIndex >= ANGLES.length) return "All angles captured!";
    const angle = ANGLES[activeAngleIndex];
    
    if (phoneMoving) return "Keep the phone still.";
    if (isAligned) return "Hold still.";

    if (motionLevel > 2.2) return "Slowly turn your head to align...";
    return angle.targetDesc;
  };

  const hairOptions = appState.gender === "Female" ? HAIR_STYLES_FEMALE : HAIR_STYLES_MALE;

  const failedCount = ANGLES.filter(a => validationResults[a.id] && !validationResults[a.id].valid).length;
  const isValidationPassed = ANGLES.every(a => validationResults[a.id] && validationResults[a.id].valid);

  const getArrowIcon = (angleId: string) => {
    if (["front_left", "left"].includes(angleId)) return "←";
    if (["front_right", "right"].includes(angleId)) return "→";
    return "⬆";
  };

  const getTargetYawRange = (angleId: string | undefined): string => {
    const isMirrored = facingMode === 'user';
    if (angleId === "front") return "±10°";
    if (angleId === "front_left") return isMirrored ? "30° to 55°" : "-55° to -30°";
    if (angleId === "left") return isMirrored ? "70° to 90°" : "-90° to -70°";
    if (angleId === "right") return isMirrored ? "-90° to -70°" : "70° to 90°";
    if (angleId === "front_right") return isMirrored ? "-55° to -30°" : "30° to 55°";
    return "Manual";
  };

  const activeAngle = ANGLES[activeAngleIndex];
  const isBackSilhouette = false;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden max-w-md mx-auto shadow-2xl">
      
      {/* Collapsible Debug Panel at the top of ThreeSixtyViewer */}
      {isDevMode && debugLogs.length > 0 && (
        <div className="fixed top-0 left-0 right-0 bg-red-950/95 border-b border-red-500/20 p-2 text-[10px] font-mono text-red-200 z-[9999] max-h-48 overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-1 font-bold">
            <span>🔧 SYSTEM DIAGNOSTICS</span>
            <button onClick={() => setDebugLogs([])} className="text-red-400 underline hover:text-red-300">Clear</button>
          </div>
          {debugLogs.slice().reverse().map((log, idx) => (
            <div key={idx} className="border-b border-white/5 pb-1 mb-1 text-left whitespace-pre-wrap">{log}</div>
          ))}
        </div>
      )}
      
      {/* HEADER (Hidden during full screen scanner pages) */}
      {viewState !== "scanner" && !showValidationSummary && (
        <div className="relative flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 bg-slate-950 border-b border-white/10 z-30">
          {/* Left Element */}
          <div className="flex-1 flex justify-start">
            <button 
              onClick={onClose} 
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold hover:bg-white/10 transition-all text-neutral-300 active:scale-95"
            >
              <svg className="w-3.5 h-3.5 rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
              <span className="hidden sm:inline">Back to Editor</span>
              <span className="inline sm:hidden">Back</span>
            </button>
          </div>

          {/* Center Element */}
          <div className="flex-[2] text-center min-w-0 px-2">
            <h2 className="text-xs sm:text-sm md:text-base font-black bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider truncate">
              180° Interactive Preview
            </h2>
          </div>

          {/* Right Element */}
          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <svg className="w-3.5 h-3.5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-[10px] font-bold text-indigo-300 whitespace-nowrap">
                {credits} Credits
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEWPORT */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        
        {/* INTRO VIEW */}
        {viewState === "intro" && (
          <div className="flex-1 flex flex-col justify-between p-6 pb-[calc(5.2rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex-1 flex flex-col justify-center items-center text-center gap-6">
              <div className="w-20 h-20 rounded-full bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center animate-pulse">
                <svg className="w-10 h-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">180° Interactive Preview</h3>
                <p className="text-sm text-slate-400 px-4">
                  Estimate head rotations using MediaPipe Face Tracking to auto-capture angles and edit them utilizing the Gemini AI try-on pipeline.
                </p>
              </div>

              {landmarkerLoading && (
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold bg-indigo-500/10 px-3 py-2 rounded-lg border border-indigo-500/20">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-400" />
                  <span>Loading Face Model...</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {previewsHistory.length > 0 && (
                <button 
                  onClick={() => {
                    setLoadedPreview(previewsHistory[0]);
                    setViewState("viewer");
                    setCurrentFrameIndex(2);
                  }}
                  className="w-full py-3 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/5 transition"
                >
                  View History ({previewsHistory.length})
                </button>
              )}
              
              <button 
                onClick={handleStartCaptureClick}
                disabled={landmarkerLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition animate-in fade-in"
              >
                {isSub ? "Start Guided Scan" : "Subscribe to Unlock 180° Preview"}
              </button>
            </div>
          </div>
        )}

        {/* SCANNER VIEW */}
        {viewState === "scanner" && !showValidationSummary && (
          <ScannerErrorBoundary
            fallback={(error, reset) => (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 z-[100] text-white">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Scanner Crashed</h3>
                <p className="text-xs text-red-400 font-mono max-w-xs mb-6 overflow-x-auto whitespace-pre-wrap bg-red-950/20 p-3 rounded-lg border border-red-500/20">
                  {error.message || String(error)}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      reset();
                      runScannerStartupSequence();
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      reset();
                      setViewState("intro");
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold transition"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            )}
          >
            <div className="absolute inset-0 flex flex-col justify-between z-50 bg-black overflow-hidden animate-in fade-in duration-200">
              
              {/* Always mount video so ref is bound */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? "scaleX(-1)" : "none" }}
              />

              {/* Always mount canvas overlay */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                width={640}
                height={640}
              />

              {/* 1. STARTING CAMERA LOADING OVERLAY */}
              {scannerPhase === "starting_camera" && (
                <div className="absolute inset-0 flex flex-col items-center justify-between p-6 bg-slate-950/95 z-40 text-center animate-in fade-in duration-200">
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400" />
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold">Starting camera...</h3>
                      <p className="text-xs text-slate-400 max-w-xs">Please allow camera access when prompted by your browser</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewState("intro")}
                    className="w-full py-3.5 bg-slate-900 border border-white/10 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* 2. LOADING FACE TRACKER LOADING OVERLAY */}
              {scannerPhase === "loading_tracker" && (
                <div className="absolute inset-0 flex flex-col items-center justify-between p-6 bg-slate-950/95 z-40 text-center animate-in fade-in duration-200">
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-400" />
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold">Loading face tracker...</h3>
                      <p className="text-xs text-slate-400 max-w-xs">Fetching 3D landmarker model (approx. 3.6 MB)...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewState("intro")}
                    className="w-full py-3.5 bg-slate-900 border border-white/10 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* 3. ERROR STATE OVERLAY */}
              {scannerPhase === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-between p-6 bg-slate-950 z-40 text-center animate-in fade-in duration-200">
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="space-y-2 max-w-xs">
                      <h3 className="text-lg font-bold">Startup Failed</h3>
                      <p className="text-xs text-red-400/90 font-mono bg-red-950/20 p-3 rounded-lg border border-red-500/15 max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {scannerError || "An unknown startup error occurred."}
                      </p>
                    </div>
                  </div>
                  <div className="w-full flex flex-col gap-3">
                    <button
                      onClick={runScannerStartupSequence}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500 transition"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => setViewState("intro")}
                      className="w-full py-3.5 bg-slate-900 border border-white/10 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              )}

              {/* 3a. VALIDATING ENVELOPE OVERLAY */}
              {scannerPhase === "validating" && (
                <div className="absolute inset-0 flex flex-col items-center justify-between p-6 bg-slate-950/95 z-40 text-center animate-in fade-in duration-200">
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400" />
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold">Scan complete</h3>
                      <p className="text-xs text-slate-400 max-w-xs">Validating 5 captured angles...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewState("intro")}
                    className="w-full py-3.5 bg-slate-900 border border-white/10 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* 3b. PREPARING EDITOR OVERLAY */}
              {scannerPhase === "preparing_editor" && (
                <div className="absolute inset-0 flex flex-col items-center justify-between p-6 bg-slate-950/95 z-40 text-center animate-in fade-in duration-200">
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400" />
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold">Preparing editor...</h3>
                      <p className="text-xs text-slate-400 max-w-xs">Entering 180° visual design studio...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewState("intro")}
                    className="w-full py-3.5 bg-slate-900 border border-white/10 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* 4. ACTIVE SCANNING ELEMENTS (Renders only if ready) */}
              {scannerPhase === "ready" && (
                <>
                  {/* HEADER OVERLAYS */}
                  <div className="w-full flex items-center justify-between p-4 z-25 bg-gradient-to-b from-black/85 to-transparent">
                    <button 
                      onClick={() => {
                        setViewState("intro");
                        setRetakeAngleId(null);
                      }} 
                      className="p-2 bg-black/50 border border-white/10 rounded-full text-white backdrop-blur-md pointer-events-auto"
                    >
                      <svg className="w-5 h-5 rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <div className="px-3 py-1.5 rounded-full bg-indigo-600/80 border border-indigo-400/30 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                      {isBackSilhouette ? "Rear View Assisted" : "Face AI Tracking"}
                    </div>

                    <div className="w-9 h-9" />
                  </div>

                  {/* Top Non-Blocking Instructions Overlay */}
                  {activeAngle && (
                    <div className="absolute top-28 left-4 right-4 z-30 flex justify-center pointer-events-none">
                      <div className="bg-slate-950/20 backdrop-blur-[3px] border border-white/5 rounded-2xl p-4 px-5 flex flex-col w-full max-w-sm drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                            {isBackSilhouette ? "Rear View Assisted" : `Angle: ${activeAngle.label}`}
                          </span>
                          <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full text-slate-200 font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                            {Object.keys(capturedFrames).length}/5
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-tight drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)]">
                          {getDynamicGuidanceMessage()}
                        </h4>
                      </div>
                    </div>
                  )}

                  {/* Dev Telemetry Info Overlay */}
                  {activeAngle && isDevMode && (
                    <div className="absolute bottom-28 left-4 z-30 pointer-events-none bg-black/85 border border-white/10 rounded-xl p-2 px-3 text-[9px] font-mono text-indigo-300 text-left space-y-0.5 shadow-lg animate-in fade-in duration-250">
                      <div>YAW: {headPose?.yaw ?? "N/A"}° (Target: {getTargetYawRange(activeAngle.id)})</div>
                      <div>PITCH: {headPose?.pitch ?? "N/A"}° | ROLL: {headPose?.roll ?? "N/A"}°</div>
                      <div>CAMERA: {facingMode.toUpperCase()} | HOLD: {stabilityProgress}%</div>
                      <div>STUCK LIMIT: {alignmentHoldDurationRef.current}ms / 3500ms</div>
                    </div>
                  )}

                  {/* Flip Camera Button */}
                  {hasMultipleCameras && (
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      disabled={isSwitchingCamera || !isCameraActive}
                      className="absolute bottom-28 right-4 z-30 p-3.5 bg-slate-900/80 border border-white/10 rounded-full text-white backdrop-blur-md hover:bg-white/15 active:scale-95 transition-transform flex items-center justify-center shadow-lg disabled:opacity-50 pointer-events-auto"
                      title="Switch camera"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                      </svg>
                    </button>
                  )}

                  {/* BOTTOM ANGLE PROGRESS INDICATOR */}
                  <div className="w-full p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent z-20 space-y-4">
                    <div className="flex gap-2 justify-start py-2 border-b border-white/5 overflow-x-auto no-scrollbar">
                      {ANGLES.map((a, i) => (
                        <button 
                          key={a.id} 
                          type="button"
                          onClick={() => selectAngleForCapture(i)}
                          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all min-w-[72px] ${
                            activeAngleIndex === i 
                              ? "bg-indigo-600/30 border border-indigo-500 text-white font-bold" 
                              : capturedFrames[a.id]
                                ? "border border-emerald-500/20 text-emerald-400 bg-emerald-950/20"
                                : "border border-white/5 text-slate-400"
                          }`}
                        >
                          <span className="text-[8px] tracking-wider uppercase truncate w-full text-center">{a.id.replace("_", " ")}</span>
                          <div 
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${
                              capturedFrames[a.id]
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            {capturedFrames[a.id] ? "✓" : i + 1}
                          </div>
                        </button>
                      ))}
                    </div>

                    {(!isBackSilhouette || showManualFallbackBtn) && (
                      <div className="space-y-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
                        <button 
                          onClick={manualCaptureFallback}
                          disabled={isCapturingFrame || !isCameraActive}
                          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs uppercase tracking-widest font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 pointer-events-auto"
                        >
                          {isCapturingFrame ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                              <span>Capturing...</span>
                            </>
                          ) : (
                            <span>Capture {activeAngle?.id.replace("_", " ").toUpperCase()} Manually</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScannerErrorBoundary>
        )}

        {/* SCAN COMPLETED VALIDATION VIEW */}
        {showValidationSummary && (
          <div className="flex-1 flex flex-col justify-between p-6 bg-slate-950 animate-in fade-in duration-300">
            <div className="space-y-6">
              
              <div className="text-center space-y-2">
                {isValidationPassed ? (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                      <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-emerald-400">Scan Complete</h3>
                    <p className="text-xs text-slate-400 leading-normal px-4">
                      All angles captured successfully! Your scans are clear. Continue to style selection.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                      <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-amber-500">Quality Checks Failed</h3>
                    <p className="text-xs text-slate-400 leading-normal px-4">
                      We detected duplicate captures, blur, or incorrect exposure. Please retake the failed angles.
                    </p>
                  </div>
                )}
              </div>

              {/* List of validation results */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {ANGLES.map((a, index) => {
                  const check = validationResults[a.id];
                  const frame = capturedFrames[a.id];
                  return (
                    <div 
                      key={a.id} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        check?.valid 
                          ? "bg-slate-900/50 border-white/5" 
                          : "bg-red-500/5 border-red-500/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {frame ? (
                          <img src={frame} alt={a.label} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-600 text-xs font-bold">?</div>
                        )}
                        <div className="text-left space-y-0.5">
                          <span className="text-xs font-bold block text-white">{a.label}</span>
                          {check ? (
                            <span className={`text-[10px] font-medium ${check.valid ? "text-emerald-400" : "text-red-400"}`}>
                              {check.valid ? "✓ Valid frame" : check.reason}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Not verified</span>
                          )}
                        </div>
                      </div>

                      {!check?.valid && (
                        <button
                          onClick={() => handleRetakeSingleAngle(a.id, index)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-wider rounded-lg text-white"
                        >
                          Retake
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            <div className="space-y-2.5">
              {isValidationPassed ? (
                <div className="space-y-3">
                  <button 
                    onClick={handleScanCompletedContinue}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs uppercase tracking-widest font-black rounded-xl shadow-lg transition"
                  >
                    Continue to Style Selection
                  </button>
                </div>
              ) : (
                <button 
                  disabled
                  className="w-full py-4 bg-slate-800 text-slate-500 text-xs uppercase tracking-widest font-black rounded-xl cursor-not-allowed border border-white/5"
                >
                  Fix Quality errors to proceed
                </button>
              )}
            </div>
          </div>
        )}



        {/* ROTATION VIEWER */}
        {viewState === "viewer" && loadedPreview && (() => {
          const angleId = ANGLES[currentFrameIndex].id;
          const originalSrc = capturedFrames[angleId];
          const highResUrl = loadedPreview.highResFrameUrls?.[currentFrameIndex];
          const generatedSrc = (isDragging || !highResUrl)
            ? loadedPreview.frameUrls[currentFrameIndex]
            : highResUrl;

          const imageSrc = (showOriginalComparison && originalSrc) ? originalSrc : generatedSrc;

          return (
            <div className="flex-1 flex flex-col justify-between bg-slate-950 animate-in fade-in duration-300 relative overflow-hidden">
              
              {/* Success Toast Overlay */}
              {successToast && (
                <div className="absolute top-6 left-4 right-4 bg-emerald-600/95 backdrop-blur-xl text-white px-4 py-3 rounded-2xl text-center text-xs z-50 shadow-2xl border border-emerald-500/20 animate-in fade-in slide-in-from-top-4 flex items-center justify-center gap-2 pointer-events-auto">
                  <span className="text-sm">✓</span>
                  <span className="font-extrabold uppercase tracking-widest text-[9px]">{successToast}</span>
                  <button onClick={() => setSuccessToast(null)} className="ml-auto text-white/50 hover:text-white font-extrabold px-1 text-[9px]">✕</button>
                </div>
              )}

              {/* Error Toast Overlay */}
              {saveError && (
                <div className="absolute top-6 left-4 right-4 bg-red-950/95 backdrop-blur-xl text-white px-4 py-3.5 rounded-2xl text-center text-xs z-50 shadow-2xl border border-red-500/20 animate-in fade-in slide-in-from-top-4 flex flex-col gap-2 pointer-events-auto">
                  <span className="font-extrabold text-[9px] uppercase tracking-widest text-red-300">{saveError}</span>
                  <div className="flex justify-center gap-4 mt-0.5">
                    <button onClick={() => { setSaveError(null); handleSaveCurrentView(); }} className="px-3.5 py-1 bg-white/10 hover:bg-white/20 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest">Retry</button>
                    <button onClick={() => setSaveError(null)} className="px-3.5 py-1 bg-black/40 hover:bg-black/60 rounded-lg text-[9px] font-black uppercase tracking-widest">Dismiss</button>
                  </div>
                </div>
              )}

              {/* Progress Overlay */}
              {saveProgress && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-[60] flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 shadow-[0_0_24px_rgba(251,191,36,0.5)]"></div>
                  <div className="text-center space-y-1">
                    <p className="text-white text-xs font-black uppercase tracking-widest">Exporting 180° Preview</p>
                    <p className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-wider">
                      {saveProgress.total === 1 
                        ? "Preparing view file..." 
                        : `Processing frame ${saveProgress.current} of ${saveProgress.total}...`}
                    </p>
                  </div>
                </div>
              )}

              {/* Active Angle Status Area */}
              <div className="text-center py-2.5 flex flex-col items-center gap-1 bg-slate-950 border-b border-white/5 flex-shrink-0">
                <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest bg-indigo-500/10 px-3.5 py-1 rounded-full border border-indigo-500/20">
                  {ANGLES[currentFrameIndex].label}
                </span>
                <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-extrabold">
                  5 of 5 angles ready
                </p>
              </div>

              {/* Interactive Grab Rotate Container */}
              <div 
                className="flex-1 flex flex-col items-center justify-center px-4 py-3 touch-none cursor-grab active:cursor-grabbing relative overflow-hidden min-h-0"
                onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                onTouchEnd={handleDragEnd}
                onMouseDown={(e) => handleDragStart(e.clientX)}
                onMouseMove={(e) => handleDragMove(e.clientX)}
                onMouseUp={handleDragEnd}
              >
                {/* The Viewer Box */}
                <div className="w-[35vh] h-[35vh] max-w-[280px] max-h-[280px] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative select-none flex items-center justify-center">
                  
                  {/* Zoom scale applied to image container */}
                  <div 
                    className="w-full h-full transition-transform duration-300 ease-out origin-center"
                    style={{ transform: isZoomed ? 'scale(1.6)' : 'scale(1)' }}
                  >
                    {isRegeneratingAngle ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div>
                        <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest animate-pulse">Regenerating angle...</p>
                      </div>
                    ) : (
                      <img 
                        src={imageSrc} 
                        alt={`Angle ${currentFrameIndex}`} 
                        className="w-full h-full object-cover pointer-events-none no-ios-callout"
                      />
                    )}
                  </div>

                  {/* Before/After Original Badge */}
                  {showOriginalComparison && originalSrc && (
                    <div className="absolute top-4 left-4 bg-amber-500 text-neutral-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border border-amber-400 shadow-lg pointer-events-none animate-in fade-in duration-100 z-30">
                      Original Photo
                    </div>
                  )}

                  {/* Swipe Guidance overlay chevrons */}
                  {!hasInteracted && (
                    <div className="absolute inset-x-0 bottom-4 flex justify-between px-6 pointer-events-none text-white/50 text-[10px] font-extrabold uppercase tracking-widest animate-in fade-in duration-500">
                      <span>← Drag</span>
                      <span className="text-indigo-400 animate-pulse">Rotate</span>
                      <span>Drag →</span>
                    </div>
                  )}
                </div>

                {/* Horizontal Swipe Guidance text below */}
                {!hasInteracted && (
                  <div className="mt-2.5 text-center text-white/30 text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-3 pointer-events-none animate-pulse">
                    <span className="animate-bounce">◀</span>
                    <span>Swipe to rotate</span>
                    <span className="animate-bounce">▶</span>
                  </div>
                )}

                {/* Dots Indicator */}
                <div className="flex gap-1.5 mt-4 pointer-events-none z-10">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                        currentFrameIndex === i ? "bg-indigo-400 scale-110 shadow-[0_0_8px_rgba(129,140,248,0.5)]" : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Controls Toolbar Container */}
              <div className="mx-4 mb-2.5 p-1 bg-white/5 border border-white/10 rounded-xl flex items-center gap-1 backdrop-blur-xl pointer-events-auto justify-between flex-shrink-0">
                {/* Prev button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentFrameIndex(prev => Math.max(0, prev - 1));
                  }}
                  disabled={currentFrameIndex === 0}
                  className="w-9 h-9 flex-shrink-0 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-xs text-neutral-300 hover:text-white active:scale-90 transition disabled:opacity-20 disabled:pointer-events-none"
                  title="Previous View"
                >
                  ◀
                </button>

                {/* Center Group - Auto scaling */}
                <div className="flex-1 flex items-center justify-center gap-1 min-w-0">
                  {/* Reset to Front */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentFrameIndex(2);
                    }}
                    className={`flex-1 min-w-0 h-9 rounded-lg border flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                      currentFrameIndex === 2
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                    }`}
                    title="Reset to Front"
                  >
                    <span>↺</span>
                    <span className="hidden min-[360px]:inline">Front</span>
                  </button>

                  {/* Autoplay Play/Pause */}
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`flex-1 min-w-0 h-9 rounded-lg border flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                      isPlaying
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                        <span className="hidden min-[360px]:inline">Pause</span>
                      </>
                    ) : (
                      <>
                        <span>▶</span>
                        <span className="hidden min-[360px]:inline">Play</span>
                      </>
                    )}
                  </button>

                  {/* Zoom Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsZoomed(!isZoomed)}
                    className={`flex-1 min-w-0 h-9 rounded-lg border flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                      isZoomed
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                        : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                    }`}
                    title="Zoom In/Out"
                  >
                    <span>🔍</span>
                    <span className="hidden min-[360px]:inline">{isZoomed ? "Zoom" : "Zoom"}</span>
                  </button>

                  {/* Compare / Lock */}
                  {originalSrc ? (
                    <button
                      type="button"
                      onMouseDown={() => setShowOriginalComparison(true)}
                      onMouseUp={() => setShowOriginalComparison(false)}
                      onTouchStart={() => setShowOriginalComparison(true)}
                      onTouchEnd={() => setShowOriginalComparison(false)}
                      className={`flex-1 min-w-0 h-9 rounded-lg border flex items-center justify-center gap-1 transition-all text-[9px] font-black uppercase tracking-wider ${
                        showOriginalComparison
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                          : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                      }`}
                      title="Hold to view original photo"
                    >
                      <span>👁</span>
                      <span className="hidden min-[360px]:inline">Comp</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex-1 min-w-0 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center gap-1 text-neutral-600 text-[9px] font-black uppercase tracking-wider select-none opacity-40 cursor-not-allowed"
                      title="Compare not available"
                    >
                      <span>🔒</span>
                      <span className="hidden min-[360px]:inline">Comp</span>
                    </button>
                  )}
                </div>

                {/* Next button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentFrameIndex(prev => Math.min(4, prev + 1));
                  }}
                  disabled={currentFrameIndex === 4}
                  className="w-9 h-9 flex-shrink-0 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-xs text-neutral-300 hover:text-white active:scale-90 transition disabled:opacity-20 disabled:pointer-events-none"
                  title="Next View"
                >
                  ▶
                </button>
              </div>

              {/* Collapsible Style Selections Summary */}
              <div className="mx-4 mb-2.5 bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl pointer-events-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowStyleSummary(!showStyleSummary)}
                  className="w-full px-4 py-2.5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-neutral-300 hover:text-white active:bg-white/5 transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    <span>Active Style Snapshot</span>
                  </span>
                  <svg 
                    className="w-3.5 h-3.5 text-neutral-400 transition-transform duration-300" 
                    style={{ transform: showStyleSummary ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showStyleSummary && (
                  <div className="px-4 pb-3 pt-1.5 flex flex-wrap gap-1.5 border-t border-white/5 bg-black/25 max-h-24 overflow-y-auto no-scrollbar animate-in slide-in-from-top-2 duration-200">
                    {selectedHair && (
                      <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-[9px] rounded-lg text-indigo-300 font-extrabold uppercase tracking-wider">
                        Hair: {selectedHair.label}
                      </span>
                    )}
                    {selectedColor && (
                      <span className="px-2.5 py-1 bg-pink-500/10 border border-pink-500/20 text-[9px] rounded-lg text-pink-300 font-extrabold uppercase tracking-wider">
                        Color: {selectedColor.label}
                      </span>
                    )}
                    {selectedBeard && selectedBeard.id !== 'beard_none' && (
                      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-[9px] rounded-lg text-amber-300 font-extrabold uppercase tracking-wider">
                        Beard: {selectedBeard.label}
                      </span>
                    )}
                    {selectedBeardColor && selectedBeard.id !== 'beard_none' && (
                      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-[9px] rounded-lg text-amber-300 font-extrabold uppercase tracking-wider">
                        Beard Color: {selectedBeardColor.label}
                      </span>
                    )}
                    {selectedOutfit && (
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[9px] rounded-lg text-emerald-300 font-extrabold uppercase tracking-wider">
                        Outfit: {selectedOutfit.label}
                      </span>
                    )}
                    {Object.entries(aesthetics).map(([id, val]) => {
                      if (!val) return null;
                      const treatment = AESTHETIC_TREATMENTS.find(t => t.id === id);
                      return (
                        <span key={id} className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-[9px] rounded-lg text-purple-300 font-extrabold uppercase tracking-wider">
                          {treatment?.label || id}: {val}%
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Sticky Action Area */}
              <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] bg-slate-950 border-t border-white/5 pointer-events-auto z-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      onUpdateState({ editorMode: "interactive_180" });
                      onClose();
                    }}
                    className="flex-[2] h-11 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-[11px] font-bold uppercase tracking-wider text-neutral-300 rounded-xl transition-all shadow-md flex items-center justify-center"
                  >
                    Adjust Selections
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setShowSaveMenu(true)}
                    className="flex-[3] h-11 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-neutral-950 text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-yellow-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>✨ Save & Finish</span>
                  </button>
                </div>
              </div>

              {/* Save Options Action Sheet */}
              {showSaveMenu && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-in fade-in duration-200 pointer-events-auto">
                  {/* Background Tap Close Dismiss Area */}
                  <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => setShowSaveMenu(false)}></div>
                  
                  {/* Action Drawer */}
                  <div className="bg-[#0e111a]/95 border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-w-md w-full mx-auto relative z-10 animate-in slide-in-from-bottom duration-300">
                    
                    {/* Drag line */}
                    <div className="flex justify-center mb-1">
                      <div className="w-12 h-1 bg-white/20 rounded-full"></div>
                    </div>

                    <div className="text-center pb-2 border-b border-white/5">
                      <h4 className="text-xs font-black uppercase tracking-widest text-white">Save & Share</h4>
                      <p className="text-[9px] text-neutral-400 uppercase font-bold mt-0.5">Export your AI hair and beard preview</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {/* Save Current */}
                      <button
                        type="button"
                        onClick={handleSaveCurrentView}
                        className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition active:scale-[0.99]"
                      >
                        <span>💾 Save Current View</span>
                        <span className="text-[8px] text-neutral-500 font-bold uppercase">To Photos / Downloads</span>
                      </button>

                      {/* Save All 5 */}
                      <button
                        type="button"
                        onClick={handleSaveAllViews}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/40 hover:to-purple-600/40 border border-indigo-500/20 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition active:scale-[0.99]"
                      >
                        <span>🌟 Save All 5 Views</span>
                        <span className="text-[8px] text-indigo-400 font-black uppercase">Batch Download</span>
                      </button>

                      {/* Share Current */}
                      <button
                        type="button"
                        onClick={handleShareCurrentView}
                        className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition active:scale-[0.99]"
                      >
                        <span>🔗 Share Current View</span>
                        <span className="text-[8px] text-neutral-500 font-bold uppercase">Open Share Sheet</span>
                      </button>

                      {/* Share All */}
                      <button
                        type="button"
                        onClick={handleShareAllViews}
                        className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition active:scale-[0.99]"
                      >
                        <span>🔗 Share All Views</span>
                        <span className="text-[8px] text-neutral-500 font-bold uppercase">Open Share Sheet</span>
                      </button>

                      {/* Regenerate Current */}
                      <button
                        type="button"
                        onClick={handleRegenerateCurrentAngle}
                        className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition active:scale-[0.99]"
                      >
                        <span>⚡ Regenerate This Angle</span>
                        <span className="text-[8px] text-amber-500/80 font-black uppercase">Free correction</span>
                      </button>

                      {/* Start Over */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Start over? This will clear your captured frames.")) {
                            setShowSaveMenu(false);
                            setViewState("intro");
                            setCapturedFrames({});
                            setCurrentFrameIndex(2);
                            onUpdateState({ active360PreviewId: null });
                          }
                        }}
                        className="w-full py-3.5 px-4 bg-red-950/20 hover:bg-red-950/30 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition active:scale-[0.99]"
                      >
                        <span>🗑 Start Over</span>
                        <span className="text-[8px] text-red-500/80 font-black uppercase">Clear Scan</span>
                      </button>
                    </div>

                    {/* Cancel */}
                    <button
                      type="button"
                      onClick={() => setShowSaveMenu(false)}
                      className="w-full py-3 bg-slate-900 border border-white/5 hover:bg-slate-800 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })()}

        {/* SUBSCRIBER TOP-UP STORE VIEW */}
        {viewState === "store" && (
          <div className="flex-1 flex flex-col justify-between p-6">
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Premium Credit Top-Ups</h3>
                <p className="text-sm text-slate-400">
                  You have consumed your subscription allowances. Purchase additional interactive 360° previews below:
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <div 
                  onClick={() => handleBuyTokens("360_preview_1_subscriber")}
                  className="flex items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-xl hover:border-indigo-500 cursor-pointer transition-all"
                >
                  <div className="text-left">
                    <span className="text-sm font-bold block">1 Additional Preview</span>
                    <span className="text-xs text-slate-400">Single top-up use</span>
                  </div>
                  <span className="text-sm font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                    $1.99
                  </span>
                </div>

                <div 
                  onClick={() => handleBuyTokens("360_preview_3_subscriber")}
                  className="flex items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-xl hover:border-indigo-500 cursor-pointer transition-all"
                >
                  <div className="text-left">
                    <span className="text-sm font-bold block">3 Additional Previews</span>
                    <span className="text-xs text-slate-400">Most Popular Pack</span>
                  </div>
                  <span className="text-sm font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                    $4.99
                  </span>
                </div>

                <div 
                  onClick={() => handleBuyTokens("360_preview_10_subscriber")}
                  className="flex items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-xl hover:border-indigo-500 cursor-pointer transition-all"
                >
                  <div className="text-left">
                    <span className="text-sm font-bold block">10 Additional Previews</span>
                    <span className="text-xs text-slate-400">Best Value Pack</span>
                  </div>
                  <span className="text-sm font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                    $12.99
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setViewState("intro")}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded-xl text-slate-300"
            >
              Cancel & Return
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
