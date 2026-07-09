import React, { useState, useRef, useEffect } from 'react';
import { AppState, AppMode, Gender } from './types';
import { CameraView } from './components/CameraView';
import { PhotoEditor } from './components/PhotoEditor';
import { BottomNav } from './components/BottomNav';
import { Icons } from './constants';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentMode: AppMode.CAMERA,
    gender: Gender.MALE,
    originalImage: null,
    currentImage: null,
    selectedHairStyle: null,
    selectedHairColor: null,
    selectedBeardStyle: null,
    selectedBeardColor: null,
    isProcessing: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to update state
  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleCapture = (imageDataUrl: string) => {
    updateState({
      originalImage: imageDataUrl,
      currentImage: imageDataUrl, // Reset edits on new photo
      currentMode: AppMode.EDITOR,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        updateState({
          originalImage: result,
          currentImage: result,
          currentMode: AppMode.EDITOR
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleGender = () => {
    updateState({ 
      gender: state.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE,
      // Reset specific selections that might be invalid, but keep logical ones if possible
      selectedBeardStyle: null,
      selectedBeardColor: null,
      selectedHairStyle: null,
    });
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white select-none">
      
      {/* --- Top Bar (Transparent / Floating) --- */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-10 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        
        {/* Branding */}
        <div className="flex items-center gap-2 pointer-events-auto">
           <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center font-bold text-xs shadow-lg">
             <span className="bg-gradient-to-tr from-indigo-400 to-purple-400 bg-clip-text text-transparent">SV</span>
           </div>
           <span className="font-bold tracking-tight text-lg drop-shadow-md text-white/90">StyleVision</span>
        </div>

        {/* Controls: Gender & Album */}
        <div className="flex items-center gap-3 pointer-events-auto">
          
          {/* Gender Toggle Pill */}
          <button 
            onClick={toggleGender}
            className="flex items-center bg-black/20 backdrop-blur-xl rounded-full px-1 py-1 border border-white/10 shadow-lg"
          >
            <div className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${state.gender === Gender.MALE ? 'bg-white/20 text-white shadow-sm' : 'text-white/40'}`}>
              Male
            </div>
            <div className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${state.gender === Gender.FEMALE ? 'bg-white/20 text-white shadow-sm' : 'text-white/40'}`}>
              Female
            </div>
          </button>

          {/* Album Picker */}
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-10 h-10 flex items-center justify-center bg-black/20 rounded-full backdrop-blur-xl border border-white/10 shadow-lg active:scale-95 transition-transform"
          >
            <Icons.Album />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload} 
          />

        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="absolute inset-0 z-0">
        {state.currentMode === AppMode.CAMERA && (
          <CameraView 
            isActive={state.currentMode === AppMode.CAMERA} 
            onCapture={handleCapture} 
          />
        )}

        {(state.currentMode === AppMode.EDITOR || state.currentMode === AppMode.FAVORITES) && (
          <PhotoEditor 
            appState={state} 
            onUpdateState={updateState} 
          />
        )}
      </div>

      {/* --- Bottom Navigation --- */}
      <BottomNav 
        currentMode={state.currentMode} 
        onSwitchMode={(mode) => updateState({ currentMode: mode })} 
      />

    </div>
  );
};

export default App;
