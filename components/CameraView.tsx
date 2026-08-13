import React, { useRef, useEffect, useState } from 'react';
import { Icons } from '../constants';

interface CameraViewProps {
  onCapture: (imageDataUrl: string) => void;
  onCapture3DBust?: (frames: string[]) => void;
  isActive: boolean;
  isSubscriber: boolean;
  onOpenAI180Capture: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ 
  onCapture, 
  onCapture3DBust, 
  isActive,
  isSubscriber,
  onOpenAI180Capture
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);
  
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);

  // 3D Guided Scanning States
  const [scanState, setScanState] = useState<'idle' | 'countdown' | 'capturing'>('idle');
  const [countdown, setCountdown] = useState<number>(3);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanInstructions, setScanInstructions] = useState<string>('Align face and look straight');
  const [cameraMode, setCameraMode] = useState<'photo' | '180'>('photo');

  useEffect(() => {
    const checkDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (e) {
        console.warn("Enumerate devices failed:", e);
      }
    };
    checkDevices();
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    const startCamera = async () => {
      if (!isActive) return;
      setPermissionError(false);

      try {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: facingMode, 
              width: { ideal: 1920 }, 
              height: { ideal: 1080 } 
            },
            audio: false
          });
        } catch (err) {
          console.warn("Failed high quality camera stream, falling back to standard resolution:", err);
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
          });
        }

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        if (mounted) {
          setPermissionError(true);
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, facingMode]);

  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        onCapture(dataUrl);
      }
    }
  };

  // Guided 3D Scanner Capture Loop (40 frames over 4 seconds)
  const handleStart3DScan = () => {
    if (scanState !== 'idle') return;
    setScanState('countdown');
    setCountdown(3);
    setScanProgress(0);
    setScanInstructions('PREPARE TO TURN HEAD');
  };

  useEffect(() => {
    if (scanState !== 'countdown') return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Start actual high-frequency capture
          setScanState('capturing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [scanState]);

  useEffect(() => {
    if (scanState !== 'capturing' || !onCapture3DBust) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setScanState('idle');
      return;
    }

    const capturedFrames: string[] = [];
    const totalFrames = 40;
    let currentFrame = 0;

    // Set canvas dimensions
    canvas.width = 480; // Optimize dimension for fast ML processing
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setScanState('idle');
      return;
    }

    const captureInterval = setInterval(() => {
      if (currentFrame >= totalFrames) {
        clearInterval(captureInterval);
        setScanState('idle');
        onCapture3DBust(capturedFrames);
        return;
      }

      // Guide message updates based on frame index
      if (currentFrame < 12) {
        setScanInstructions('👤 FACE FORWARD (LOOK FRONT)');
      } else if (currentFrame < 26) {
        setScanInstructions('⬅ SLOWLY TURN LEFT');
      } else {
        setScanInstructions('➡ SLOWLY TURN RIGHT');
      }

      if (ctx && video) {
        ctx.save();
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        
        // Draw cropped/centered face canvas
        const srcWidth = video.videoWidth;
        const srcHeight = video.videoHeight;
        const size = Math.min(srcWidth, srcHeight);
        const sx = (srcWidth - size) / 2;
        const sy = (srcHeight - size) / 2;
        
        ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        capturedFrames.push(dataUrl);
      }

      currentFrame++;
      setScanProgress(Math.floor((currentFrame / totalFrames) * 100));
    }, 100); // 10 frames per second (40 frames over 4 seconds)

    return () => clearInterval(captureInterval);
  }, [scanState, facingMode, onCapture3DBust]);

  const handleLocalUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onCapture(result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isActive) return null;

  return (
    <div id="camera-view-container" className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-between overflow-y-auto no-scrollbar z-10 p-6 pt-24 pb-36">
      {permissionError ? (
        <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M7 21h10a2 2 0 0 0 2-2V9.4a2 2 0 0 0-.5-1.4l-2.5-3A2 2 0 0 0 14.5 4h-4a2 2 0 0 0-1.4.5L7.4 6.7M12 13a3 3 0 1 0 3 3" />
            </svg>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Camera Access Restricted</h2>
            <p className="text-xs text-neutral-400 leading-relaxed px-4">
              Camera access is unavailable in this environment. Please upload your own photo from your device gallery to start your hair & style try-on.
            </p>
          </div>

          <button
            id="camera-upload-fallback"
            onClick={() => localFileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95"
          >
            <Icons.Album />
            <span>Upload from Device</span>
          </button>

          {conversionError && (
            <p className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center w-full">
              {conversionError}
            </p>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden">
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
            playsInline
            muted
            autoPlay
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Switch Camera Button */}
          {hasMultipleCameras && scanState === 'idle' && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="absolute top-28 right-6 z-30 w-10 h-10 rounded-full bg-black/45 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shadow-lg pointer-events-auto"
              title="Switch camera"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
            </button>
          )}

          {/* Guided Scanner Instructions Bar */}
          <div className="absolute top-[calc(env(safe-area-inset-top,20px)+60px)] left-4 right-4 text-center z-20 pointer-events-none flex justify-center">
            <p className={`text-white text-xs font-black uppercase tracking-widest drop-shadow-md inline-block px-5 py-2 rounded-2xl backdrop-blur-xl border border-white/10 transition-all max-w-[240px] sm:max-w-xs truncate ${
              scanState === 'capturing' ? 'bg-indigo-900/60 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-black/45'
            }`}>
              {scanState === 'idle' && (
                cameraMode === 'photo' 
                  ? "Align face & tap capture" 
                  : "Align face & tap to start 180° scan"
              )}
              {scanState === 'countdown' && `Starting in ${countdown}...`}
              {scanState === 'capturing' && scanInstructions}
            </p>
          </div>

          {/* Guided Face Overlay Ring during scanning */}
          {scanState !== 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <div className={`w-[260px] h-[340px] rounded-[130px/170px] border-[3px] transition-all duration-300 ${
                scanState === 'countdown' ? 'border-amber-400/40 animate-pulseScale' : 'border-indigo-400 animate-radarScan'
              }`} style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}>
                {/* Crosshairs */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/10"></div>
              </div>
              <p className="mt-4 text-[10px] text-neutral-300 font-bold uppercase tracking-widest text-center px-6">
                {scanState === 'countdown' ? 'Prepare to slowly turn your head left to right' : `Scan progress: ${scanProgress}%`}
              </p>
            </div>
          )}

          {/* Unified Bottom Layout Container */}
          <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] flex flex-col items-center pointer-events-none">
            {scanState === 'idle' ? (
              <>
                {/* Compact Camera Mode Selector */}
                <div className="pointer-events-auto mb-6 flex bg-black/60 backdrop-blur-xl rounded-full p-0.5 border border-white/10 shadow-2xl relative overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCameraMode('photo')}
                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-200 ${
                      cameraMode === 'photo'
                        ? 'bg-white/10 text-white font-extrabold shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraMode('180')}
                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                      cameraMode === '180'
                        ? 'bg-indigo-600/30 text-indigo-300 font-extrabold border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {!isSubscriber && <span className="text-[10px]">🔒</span>}
                    180°
                  </button>
                </div>

                {/* Camera Controls Row */}
                <div className="flex items-center justify-center w-full max-w-[320px] pointer-events-auto mb-16 relative">
                  {/* Left: Gallery upload button */}
                  <div className="absolute left-0">
                    <button
                      type="button"
                      onClick={() => localFileInputRef.current?.click()}
                      className="w-12 h-12 rounded-full bg-black/45 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shadow-md"
                      title="Upload Photo"
                    >
                      <Icons.Album />
                    </button>
                  </div>

                  {/* Center: Main Shutter Button */}
                  <button
                    id="camera-capture-button"
                    onClick={cameraMode === 'photo' ? handleCapture : onOpenAI180Capture}
                    className={`w-18 h-18 rounded-full border-[4px] bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all flex items-center justify-center active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.4)] ${
                      cameraMode === '180' ? 'border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)] animate-pulse' : 'border-white/40'
                    }`}
                    aria-label={cameraMode === 'photo' ? "Take Photo" : "Start 180° Scan"}
                  >
                    <div className={`w-14 h-14 rounded-full shadow-inner transition-colors duration-300 ${
                      cameraMode === '180' ? 'bg-indigo-500' : 'bg-white'
                    }`}></div>
                  </button>
                </div>
              </>
            ) : (
              /* Scanning progress indicator */
              <div className="w-full max-w-xs flex flex-col items-center justify-center mb-20 pointer-events-none">
                <div className="w-full h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-100 ease-out"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={localFileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleLocalUpload} 
      />
    </div>
  );
};
