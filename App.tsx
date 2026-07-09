import React, { useState, useRef, useEffect } from 'react';
import { AppState, AppMode, Gender } from './types';
import { CameraView } from './components/CameraView';
import { PhotoEditor } from './components/PhotoEditor';
import { BottomNav } from './components/BottomNav';
import { LoginView } from './components/LoginView';
import { FavoritesView } from './components/FavoritesView';
import { Icons } from './constants';
import { auth, logout, SavedGeneration } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

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

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

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
      selectedBeardStyle: null,
      selectedBeardColor: null,
      selectedHairStyle: null,
    });
  };

  const handleLoadGeneration = (generation: SavedGeneration) => {
    updateState({
      originalImage: generation.originalImageUrl,
      currentImage: generation.generatedImageUrl,
      gender: generation.gender as Gender,
      selectedHairStyle: { id: generation.hairStyle, label: generation.hairStyle, category: 'hair', type: 'style' },
      selectedHairColor: { id: generation.hairColor, label: generation.hairColor, category: 'hair', type: 'color' },
      selectedBeardStyle: { id: generation.beardStyle, label: generation.beardStyle, category: 'beard', type: 'style' },
      selectedBeardColor: { id: generation.beardColor, label: generation.beardColor, category: 'beard', type: 'color' },
      currentMode: AppMode.EDITOR
    });
  };

  // Render loading screen while verifying credentials
  if (!authChecked) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]"></div>
        <p className="text-white text-xs font-semibold tracking-wider uppercase animate-pulse">Initializing StyleVision...</p>
      </div>
    );
  }

  // Display Login Overlay if not signed in
  if (!currentUser) {
    return <LoginView onLoginStateChange={setIsAuthenticating} />;
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white select-none">
      
      {/* --- Top Bar (Transparent / Floating) --- */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-safe-top flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        
        {/* Branding & Signout */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center font-bold text-xs shadow-lg">
            <span className="bg-gradient-to-tr from-indigo-400 to-purple-400 bg-clip-text text-transparent">SV</span>
          </div>
          <span className="font-bold tracking-tight text-lg drop-shadow-md text-white/90 mr-1">StyleVision</span>
          
          {/* Sign Out Button */}
          <button
            onClick={() => logout()}
            className="w-7 h-7 rounded-lg bg-red-950/30 border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 active:scale-90 transition-transform shadow-md"
            title={currentUser.isAnonymous ? "Exit Guest Mode" : "Sign Out"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {/* Controls: Gender & Album */}
        <div className="flex items-center gap-3 pointer-events-auto">
          
          {/* Gender Toggle Pill */}
          <button 
            onClick={toggleGender}
            className="flex items-center bg-black/40 backdrop-blur-xl rounded-full p-0.5 border border-white/10 shadow-lg"
          >
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${state.gender === Gender.MALE ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}>
              Male
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${state.gender === Gender.FEMALE ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}>
              Female
            </div>
          </button>

          {/* Album Picker */}
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-8 h-8 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-xl border border-white/10 shadow-lg active:scale-95 transition-transform"
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

        {state.currentMode === AppMode.EDITOR && (
          <PhotoEditor 
            appState={state} 
            onUpdateState={updateState} 
          />
        )}

        {state.currentMode === AppMode.FAVORITES && (
          <FavoritesView 
            onLoadGeneration={handleLoadGeneration} 
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
