import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';

interface AI180CaptureProps {
  onCaptureComplete: (frames: string[]) => void;
  onClose: () => void;
}

export const AI180Capture: React.FC<AI180CaptureProps> = ({ onCaptureComplete, onClose }) => {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [captureState, setCaptureState] = useState<'idle' | 'countdown' | 'capturing' | 'done'>('idle');
  const [countdown, setCountdown] = useState<number>(3);
  const [progress, setProgress] = useState<number>(0); // 0 to 100
  const [instructions, setInstructions] = useState<string>('Align your face in the circle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const framesRef = useRef<string[]>([]);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start video stream
  const startStream = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (err) {
        console.warn("AI180Capture: Failed high quality stream, falling back to standard resolution:", err);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setPermissionGranted(true);
    } catch (err) {
      console.error('Camera access failed:', err);
      setPermissionGranted(false);
    }
  };

  useEffect(() => {
    startStream();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, [facingMode]);

  // Handle countdown
  useEffect(() => {
    if (captureState !== 'countdown') return;
    if (countdown === 0) {
      startCapture();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, captureState]);

  const startCapture = () => {
    setCaptureState('capturing');
    framesRef.current = [];
    setProgress(0);

    const totalFrames = 100; // 10 seconds at 10fps
    const intervalMs = 100;
    let currentFrame = 0;

    captureIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Downscale camera feed resolution to 1024px max dimension for high quality and safe token quotas
        const maxDim = 1024;
        let targetWidth = video.videoWidth;
        let targetHeight = video.videoHeight;

        if (targetWidth <= 0 || targetHeight <= 0) {
          targetWidth = 1080;
          targetHeight = 1920;
        }

        if (targetWidth > maxDim || targetHeight > maxDim) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
            targetWidth = maxDim;
          } else {
            targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
            targetHeight = maxDim;
          }
        }

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }

        ctx.save();
        // Mirror front camera only
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        framesRef.current.push(dataUrl);
      }

      currentFrame++;
      const percent = Math.floor((currentFrame / totalFrames) * 100);
      setProgress(percent);

      // Guided text instructions updates based on 10s timeline
      const elapsedSec = (currentFrame * intervalMs) / 1000;
      if (elapsedSec < 2.0) {
        setInstructions('👤 Look toward your left');
      } else if (elapsedSec < 4.0) {
        setInstructions('Slowly turn toward center');
      } else if (elapsedSec < 6.0) {
        setInstructions('Look straight ahead');
      } else if (elapsedSec < 8.0) {
        setInstructions('Continue toward your right');
      } else if (elapsedSec < 10.0) {
        setInstructions('Done!');
      }

      if (currentFrame >= totalFrames) {
        if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
        setCaptureState('done');
        onCaptureComplete(framesRef.current);
      }
    }, intervalMs);
  };

  const handleToggleFacing = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-50 overflow-hidden font-sans">
      {/* 1. Full-Screen Video Viewfinder */}
      <div className="absolute inset-0 bg-neutral-950 z-0 flex items-center justify-center">
        {permissionGranted === false && (
          <div className="text-center p-6 max-w-xs z-20">
            <p className="text-sm text-neutral-400 font-medium mb-3">Camera access denied.</p>
            <p className="text-xs text-neutral-500">Please enable camera permissions in iOS settings to use this feature.</p>
          </div>
        )}

        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover z-0 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Guided alignment ring (Face Ring) - semi-transparent overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-72 h-96 rounded-[140px] border-2 border-dashed border-white/20 flex items-center justify-center relative shadow-[0_0_100px_rgba(0,0,0,0.6)]">
            {captureState === 'countdown' && (
              <span className="text-8xl font-black text-white/95 animate-ping tracking-tighter">
                {countdown}
              </span>
            )}
            {captureState === 'idle' && (
              <div className="absolute inset-0 rounded-[140px] border border-white/40 animate-pulse" />
            )}
          </div>
        </div>

        {/* Dynamic Instruction Banner */}
        <div className="absolute top-[calc(env(safe-area-inset-top,20px)+60px)] left-4 right-4 z-20 flex justify-center pointer-events-none">
          <div className="px-6 py-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 shadow-2xl text-center text-xs font-black uppercase tracking-wider text-white animate-in fade-in slide-in-from-top-4 duration-300">
            {instructions}
          </div>
        </div>

        {/* Capturing Progress Indicator */}
        {captureState === 'capturing' && (
          <div className="absolute bottom-32 left-6 right-6 z-20 flex flex-col items-center gap-1.5 pointer-events-none">
            <div className="w-full max-w-xs h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-indigo-500 transition-all duration-100 ease-out shadow-[0_0_8px_#6366f1]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[9px] font-black tracking-widest text-neutral-400">
              SCANNING PROGRESS: {progress}%
            </span>
          </div>
        )}
      </div>

      {/* 2. Floating Top Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-[calc(env(safe-area-inset-top,20px)+12px)] pb-6 bg-gradient-to-b from-black/85 to-transparent flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
        <div className="px-4 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 whitespace-nowrap">
            AI 180° Scanner
          </span>
          <span className="ml-2 text-[8px] bg-indigo-500/20 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded border border-indigo-500/30 leading-none">
            EXP
          </span>
        </div>
        <div className="pointer-events-auto">
          <button
            onClick={handleToggleFacing}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all shadow-lg"
          >
            <Icons.Refresh />
          </button>
        </div>
      </div>

      {/* 3. Floating Bottom Action Footer Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-6 bg-gradient-to-t from-black/85 to-transparent flex flex-col items-center justify-center pointer-events-none">
        {captureState === 'idle' && (
          <div className="w-full max-w-xs pointer-events-auto flex justify-center">
            <button
              type="button"
              onClick={() => {
                setCountdown(3);
                setCaptureState('countdown');
              }}
              className="w-18 h-18 rounded-full border-[4px] border-white/40 bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all flex items-center justify-center active:scale-95 shadow-lg"
            >
              <div className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-[10px] font-black uppercase tracking-wider text-white">START</span>
              </div>
            </button>
          </div>
        )}
        {captureState === 'capturing' && (
          <div className="w-full max-w-xs pointer-events-auto flex justify-center">
            <button
              type="button"
              onClick={() => {
                if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
                setCaptureState('idle');
                setInstructions('Align your face in the circle');
              }}
              className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 border border-red-400/20 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
            >
              Cancel Scan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
