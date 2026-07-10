import React, { useState, useRef, useEffect } from 'react';
import { AppState, AppMode, Gender } from './types';
import { CameraView } from './components/CameraView';
import { PhotoEditor } from './components/PhotoEditor';
import { BottomNav } from './components/BottomNav';
import { LoginView } from './components/LoginView';
import { FavoritesView } from './components/FavoritesView';
import { PaywallView } from './components/PaywallView';
import { Icons, HAIR_STYLES_MALE, HAIR_STYLES_FEMALE, HAIR_COLORS, BEARD_STYLES, BEARD_COLORS } from './constants';
import { auth, logout, onAuthStateChanged, SavedGeneration } from './services/firebase';
import { subscribeToSubscription, getGenerationCount } from './services/billingService';
import { initializeBilling, purchasePremium, manageBillingSubscription } from './services/iapService';
import { User } from 'firebase/auth';

const App: React.FC = () => {
  const billingUnsubscribeRef = useRef<(() => void) | null>(null);

  const [state, setState] = useState<AppState>({
    currentMode: AppMode.CAMERA,
    gender: Gender.MALE,
    originalImage: null,
    currentImage: null,
    selectedHairStyle: HAIR_STYLES_MALE[0],
    selectedHairColor: HAIR_COLORS[0],
    selectedBeardStyle: BEARD_STYLES[0],
    selectedBeardColor: BEARD_COLORS[0],
    isProcessing: false,
    customPrompt: '',
    isPremium: false,
    premiumChecked: false,
    generationCount: 0,
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showOnboardingPaywall, setShowOnboardingPaywall] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor auth state changes
  useEffect(() => {
    // Safety timeout: if auth state doesn't resolve in 1500ms, force proceed (fallback to guest/login)
    const safetyTimeout = setTimeout(() => {
      console.warn("Firebase Auth listener timed out. Bypassing loading screen.");
      setAuthChecked(true);
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(safetyTimeout);
      setCurrentUser(user);

      // Cleanup previous listener
      if (billingUnsubscribeRef.current) {
        billingUnsubscribeRef.current();
        billingUnsubscribeRef.current = null;
      }

      if (user) {
        try {
          const genCount = await getGenerationCount(user.uid);
          
          // Listen to active subscription status
          const unsubBilling = subscribeToSubscription(user.uid, (isPremium) => {
            updateState({
              isPremium,
              premiumChecked: true,
              generationCount: genCount
            });
            if (isPremium) {
              setShowOnboardingPaywall(false);
            } else {
              setShowOnboardingPaywall(true);
            }
          });
          billingUnsubscribeRef.current = unsubBilling;

          // Initialize native Apple App Store billing listeners (on iOS)
          initializeBilling(user.uid, (isPremium) => {
            updateState({ isPremium, premiumChecked: true });
            if (isPremium) {
              setShowOnboardingPaywall(false);
            }
          });
        } catch (err) {
          console.error("Error setting up user billing data:", err);
          updateState({
            isPremium: false,
            premiumChecked: true,
            generationCount: 0
          });
        }
      } else {
        updateState({
          isPremium: false,
          premiumChecked: true,
          generationCount: 0
        });
        setShowOnboardingPaywall(false);
      }
      setAuthChecked(true);
    });

    return () => {
      clearTimeout(safetyTimeout);
      if (unsubscribe) unsubscribe();
      if (billingUnsubscribeRef.current) {
        billingUnsubscribeRef.current();
      }
    };
  }, []);

  const [isHeaderUpgrading, setIsHeaderUpgrading] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isBillingPortalLoading, setIsBillingPortalLoading] = useState(false);

  const handleUpgradeFromHeader = async () => {
    if (!currentUser) return;
    setIsHeaderUpgrading(true);
    try {
      const checkoutUrl = await purchasePremium(currentUser.uid);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      console.error("Header upgrade failed:", err);
      alert(err.message || "Could not initiate premium checkout.");
    } finally {
      setIsHeaderUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!currentUser) return;
    setIsBillingPortalLoading(true);
    try {
      const portalUrl = await manageBillingSubscription(currentUser.uid);
      if (portalUrl) {
        window.location.href = portalUrl;
      }
    } catch (err: any) {
      console.error("Portal redirect failed:", err);
      alert(err.message || "Could not launch billing portal.");
    } finally {
      setIsBillingPortalLoading(false);
    }
  };

  // Helper to update state
  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleCapture = (imageDataUrl: string) => {
    updateState({
      originalImage: imageDataUrl,
      currentImage: imageDataUrl, // Reset edits on new photo
      currentMode: AppMode.EDITOR,
      selectedHairStyle: HAIR_STYLES_MALE[0],
      selectedHairColor: HAIR_COLORS[0],
      selectedBeardStyle: BEARD_STYLES[0],
      selectedBeardColor: BEARD_COLORS[0],
      customPrompt: '',
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
          currentMode: AppMode.EDITOR,
          selectedHairStyle: HAIR_STYLES_MALE[0],
          selectedHairColor: HAIR_COLORS[0],
          selectedBeardStyle: BEARD_STYLES[0],
          selectedBeardColor: BEARD_COLORS[0],
          customPrompt: '',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const setGender = (targetGender: Gender) => {
    if (state.gender === targetGender) return;
    const hairStylesList = targetGender === Gender.MALE ? HAIR_STYLES_MALE : HAIR_STYLES_FEMALE;
    updateState({ 
      gender: targetGender,
      selectedHairStyle: hairStylesList[0],
      selectedHairColor: HAIR_COLORS[0],
      selectedBeardStyle: BEARD_STYLES[0],
      selectedBeardColor: BEARD_COLORS[0],
      customPrompt: '',
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
      currentMode: AppMode.EDITOR,
      customPrompt: '',
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
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden font-sans text-white select-none">
      
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

      {/* --- Top Bar (Transparent / Floating) --- */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-safe-top flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        
        {/* Branding & Signout */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center font-bold text-xs shadow-lg">
              <span className="bg-gradient-to-tr from-indigo-400 to-purple-400 bg-clip-text text-transparent">SV</span>
            </div>
            <span className="font-bold tracking-tight text-lg drop-shadow-md text-white/90">StyleVision</span>
          </div>
          
          {/* Sign Out Button */}
          <button
            onClick={() => logout()}
            className="w-7 h-7 rounded-lg bg-red-950/30 border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 active:scale-90 transition-transform shadow-md ml-1"
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
        <div className="flex items-center gap-3">
          
          {/* Gender Selector Segmented Control */}
          <div className="flex items-center bg-black/40 backdrop-blur-xl rounded-full p-0.5 border border-white/10 shadow-lg">
            <button 
              onClick={() => setGender(Gender.MALE)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 ${state.gender === Gender.MALE ? 'bg-white/10 text-white shadow-sm font-extrabold' : 'text-white/40'}`}
            >
              Male
            </button>
            <button 
              onClick={() => setGender(Gender.FEMALE)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 ${state.gender === Gender.FEMALE ? 'bg-white/10 text-white shadow-sm font-extrabold' : 'text-white/40'}`}
            >
              Female
            </button>
          </div>

          {/* Subscription State Badge */}
          {state.isPremium ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[9px] font-extrabold uppercase tracking-widest shadow-md">
              <svg className="w-2.5 h-2.5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>Premium</span>
            </div>
          ) : (
            <button
              onClick={handleUpgradeFromHeader}
              disabled={isHeaderUpgrading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-indigo-600/95 hover:bg-indigo-500 disabled:bg-indigo-950/40 text-white text-[9px] font-extrabold uppercase tracking-widest shadow-md active:scale-95 transition-all border border-indigo-500/30"
              title="Upgrade to Premium"
            >
              {isHeaderUpgrading ? (
                <div className="animate-spin rounded-full h-2 w-2 border-b border-white"></div>
              ) : (
                <Icons.Magic className="w-2.5 h-2.5" />
              )}
              <span>Go Pro</span>
            </button>
          )}

          {/* Album Picker */}
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-8 h-8 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-xl border border-white/10 shadow-lg active:scale-95 transition-transform"
             title="Choose from Gallery"
          >
            <Icons.Album />
          </button>

          {/* Settings Button */}
          <button 
             onClick={() => setShowAccountModal(true)}
             className="w-8 h-8 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-xl border border-white/10 shadow-lg active:scale-95 transition-transform text-white/80 hover:text-white"
             title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
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

      {/* --- Bottom Navigation --- */}
      <BottomNav 
        currentMode={state.currentMode} 
        onSwitchMode={(mode) => updateState({ currentMode: mode })} 
      />

      {/* --- Account Settings Modal --- */}
      {showAccountModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300 pointer-events-auto">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm flex flex-col space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={() => setShowAccountModal(false)}
              className="absolute right-4 top-4 text-white/40 hover:text-white active:scale-90 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center font-bold text-lg shadow-lg">
                <span className="bg-gradient-to-tr from-indigo-400 to-purple-400 bg-clip-text text-transparent">SV</span>
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-white mt-1">My Account</h3>
              <p className="text-xs text-neutral-400 truncate max-w-xs">{currentUser?.email || "Guest Account"}</p>
            </div>

            {/* Membership Details Card */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Status</span>
                {state.isPremium ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-yellow-500/30 text-yellow-400 text-[9px] font-extrabold uppercase tracking-widest">
                    Premium Member
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/45 text-[9px] font-extrabold uppercase tracking-widest">
                    Free Tier
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-3">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Generations</span>
                <span className="text-xs font-bold text-white">
                  {state.isPremium ? "Unlimited" : `${state.generationCount} / 3 Free`}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-3 pt-2">
              {state.isPremium ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={isBillingPortalLoading}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-extrabold text-[10px] uppercase tracking-widest text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isBillingPortalLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>Connecting Portal...</span>
                    </>
                  ) : (
                    <span>Manage Subscription</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    setShowAccountModal(false);
                    try {
                      const url = await purchasePremium(currentUser!.uid);
                      if (url) {
                        window.location.href = url;
                      }
                    } catch (err: any) {
                      alert(err.message || "Failed to start premium upgrade.");
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-extrabold text-[10px] uppercase tracking-widest text-white transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
                >
                  Upgrade to Premium
                </button>
              )}

              <button
                onClick={() => {
                  setShowAccountModal(false);
                  logout();
                }}
                className="w-full py-3 rounded-xl bg-red-950/20 hover:bg-red-950/30 border border-red-500/20 font-extrabold text-[10px] uppercase tracking-widest text-red-400 transition-all active:scale-[0.98]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Onboarding Paywall Overlay --- */}
      {showOnboardingPaywall && currentUser && (
        <PaywallView 
          uid={currentUser.uid} 
          onContinueFree={() => setShowOnboardingPaywall(false)}
          onUpgradeSuccess={() => setShowOnboardingPaywall(false)}
        />
      )}

    </div>
  );
};

export default App;
