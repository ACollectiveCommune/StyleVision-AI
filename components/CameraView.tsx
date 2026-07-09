import React, { useRef, useEffect, useState } from 'react';
import { Icons } from '../constants';

interface CameraViewProps {
  onCapture: (imageDataUrl: string) => void;
  isActive: boolean;
}

const PRESET_MODELS = [
  {
    id: 'male_1',
    name: 'Ethan',
    gender: 'Male',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600&h=800',
    thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=200'
  },
  {
    id: 'male_2',
    name: 'Marcus',
    gender: 'Male',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600&h=800',
    thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=200'
  },
  {
    id: 'female_1',
    name: 'Sophia',
    gender: 'Female',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600&h=800',
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=200'
  },
  {
    id: 'female_2',
    name: 'Chloe',
    gender: 'Female',
    url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=600&h=800',
    thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad80?auto=format&fit=crop&q=80&w=150&h=200'
  }
];

const convertUrlToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error('Failed to get 2d context'));
      }
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);
  
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    const startCamera = async () => {
      if (!isActive) return;
      setPermissionError(false);

      try {
        // Attempt 1: High quality
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user', 
              width: { ideal: 1920 }, 
              height: { ideal: 1080 } 
            },
            audio: false,
          });
        } catch (e) {
          console.warn("High res camera failed, trying default", e);
          // Attempt 2: Basic fallback (fixes "Permission denied" caused by constraints)
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
        }

        if (mounted && videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera error:", err);
        if (mounted) setPermissionError(true);
      }
    };

    if (isActive) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isActive]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
      }
    }
  };

  const handleSelectPreset = async (model: typeof PRESET_MODELS[0]) => {
    if (loadingPresetId) return;
    setLoadingPresetId(model.id);
    setConversionError(null);
    try {
      const base64 = await convertUrlToBase64(model.url);
      onCapture(base64);
    } catch (err) {
      console.error("Preset conversion failed:", err);
      setConversionError(`Failed to load ${model.name}. Please upload a custom image or try again.`);
    } finally {
      setLoadingPresetId(null);
    }
  };

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
    <div id="camera-view-container" className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-between overflow-y-auto no-scrollbar z-10 p-6 pt-24 pb-28">
      {permissionError ? (
        // Gorgeous Fallback UI for Permission Denied Screen
        <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            {/* Custom Camera Off Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M7 21h10a2 2 0 0 0 2-2V9.4a2 2 0 0 0-.5-1.4l-2.5-3A2 2 0 0 0 14.5 4h-4a2 2 0 0 0-1.4.5L7.4 6.7M12 13a3 3 0 1 0 3 3" />
            </svg>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Camera Access Restricted</h2>
            <p className="text-xs text-neutral-400 leading-relaxed px-4">
              Camera access is unavailable in this environment. Try on stunning virtual hairstyles instantly using our preset model portraits below, or upload your own.
            </p>
          </div>

          {/* Upload Button */}
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

          {/* Presets Grid */}
          <div className="w-full pt-4 border-t border-white/5">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center mb-4">Or choose a model portrait</p>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_MODELS.map((model) => (
                <button
                  key={model.id}
                  id={`preset-model-${model.id}`}
                  onClick={() => handleSelectPreset(model)}
                  disabled={!!loadingPresetId}
                  className="group relative flex flex-col items-center bg-neutral-900/50 hover:bg-neutral-900/80 border border-white/5 hover:border-white/10 rounded-xl overflow-hidden p-2 transition-all text-left disabled:opacity-50"
                >
                  <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-neutral-950 mb-2">
                    <img 
                      src={model.thumbnail} 
                      alt={model.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 animate-in fade-in"
                    />
                    {loadingPresetId === model.id && (
                      <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-center p-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2"></div>
                        <span className="text-[10px] font-medium text-white/90">Preparing...</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full flex justify-between items-center px-1">
                    <span className="text-xs font-semibold text-white/95">{model.name}</span>
                    <span className="text-[9px] font-medium text-neutral-500 px-1.5 py-0.5 bg-neutral-800 rounded-full">{model.gender}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Active Camera View
        <div className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
            playsInline
            muted
            autoPlay
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Top Align Hint Overlay */}
          <div className="absolute top-28 left-0 right-0 text-center z-20 pointer-events-none">
            <p className="text-white/80 text-xs font-medium drop-shadow-md bg-black/40 inline-block px-4 py-1.5 rounded-full backdrop-blur-md border border-white/5">
              Align face & tap capture
            </p>
          </div>

          {/* Quick-Access Presets at the bottom of the active camera view */}
          <div className="absolute bottom-36 left-0 right-0 z-20 flex flex-col items-center space-y-3 pointer-events-none">
            {/* Quick model list */}
            <div className="flex gap-2.5 px-4 overflow-x-auto no-scrollbar py-1 pointer-events-auto max-w-full">
              {PRESET_MODELS.map((model) => (
                <button
                  key={model.id}
                  id={`quick-preset-${model.id}`}
                  onClick={() => handleSelectPreset(model)}
                  disabled={!!loadingPresetId}
                  className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 rounded-full pl-1.5 pr-3 py-1 text-xs font-semibold text-white/90 transition-all active:scale-95 disabled:opacity-50"
                >
                  <img src={model.thumbnail} alt={model.name} className="w-5 h-5 rounded-full object-cover border border-white/20" />
                  <span>{model.name}</span>
                </button>
              ))}
            </div>

            {/* Main Capture Button */}
            <button
              id="camera-capture-button"
              onClick={handleCapture}
              className="w-18 h-18 rounded-full border-[4px] border-white/40 bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all flex items-center justify-center active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.4)] pointer-events-auto"
              aria-label="Take Photo"
            >
              <div className="w-14 h-14 bg-white rounded-full shadow-inner"></div>
            </button>
          </div>
        </div>
      )}

      {/* Hidden local file input for fallbacks */}
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
