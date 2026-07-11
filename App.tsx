import React, { useState, useRef, useEffect } from 'react';
import { AppState, AppMode, Gender } from './types';
import { CameraView } from './components/CameraView';
import { PhotoEditor } from './components/PhotoEditor';
import { BottomNav } from './components/BottomNav';
import { LoginView } from './components/LoginView';
import { FavoritesView } from './components/FavoritesView';
import { PaywallView } from './components/PaywallView';
import { Icons, HAIR_STYLES_MALE, HAIR_STYLES_FEMALE, HAIR_COLORS, BEARD_STYLES, BEARD_COLORS } from './constants';
import { auth, logout, onAuthStateChanged, SavedGeneration, deleteUserAccount } from './services/firebase';
import { subscribeToCredits, incrementUserCredits } from './services/billingService';
import { initializeBilling, purchasePremium, manageBillingSubscription } from './services/iapService';
import { AdRewardModal } from './components/AdRewardModal';
import { LegalDocumentsModal } from './components/LegalDocumentsModal';
import { initializeAdMob, showRewardedVideoAd } from './services/adService';
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
    credits: 5,
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showOnboardingPaywall, setShowOnboardingPaywall] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor auth state changes
  useEffect(() => {
    // Initialize Google AdMob (native simulator check)
    initializeAdMob();

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
          // Listen to active credits balance
          const unsubBilling = subscribeToCredits(user.uid, (credits) => {
            updateState({
              credits,
              isPremium: credits > 0,
              premiumChecked: true,
              generationCount: 5 - credits
            });
            if (credits === 0) {
              setShowOnboardingPaywall(true);
            } else {
              setShowOnboardingPaywall(false);
            }
          });
          billingUnsubscribeRef.current = unsubBilling;

          // Initialize native Apple App Store billing listeners (on iOS)
          initializeBilling(user.uid, (newCredits) => {
            updateState({ credits: newCredits, isPremium: newCredits > 0 });
            if (newCredits > 0) {
              setShowOnboardingPaywall(false);
            }
          });
        } catch (err) {
          console.error("Error setting up user billing data:", err);
          updateState({
            isPremium: false,
            premiumChecked: true,
            generationCount: 0,
            credits: 0
          });
        }
      } else {
        updateState({
          isPremium: false,
          premiumChecked: true,
          generationCount: 0,
          credits: 0
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

  const [showSideMenu, setShowSideMenu] = useState(false);
  const [isBillingPortalLoading, setIsBillingPortalLoading] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | 'account' | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const handleAdCompleted = async () => {
    setShowAdModal(false);
    if (currentUser) {
      try {
        const newCredits = await incrementUserCredits(currentUser.uid, 1, state.credits);
        updateState({ credits: newCredits, isPremium: newCredits > 0 });
      } catch (err) {
        console.error("Failed to grant ad credit:", err);
        const fallbackCredits = state.credits + 1;
        updateState({ credits: fallbackCredits, isPremium: fallbackCredits > 0 });
      }
    } else {
      const fallbackCredits = state.credits + 1;
      updateState({ credits: fallbackCredits, isPremium: fallbackCredits > 0 });
    }
  };

  const handleTriggerAd = async () => {
    // Attempt showing native AdMob ad
    const completed = await showRewardedVideoAd();
    if (completed) {
      console.log("[ADMOB LOG] Native rewarded ad completed successfully.");
      await handleAdCompleted();
    } else {
      console.log("[ADMOB LOG] Native ad unavailable. Launching mock video sandbox simulator.");
      setShowAdModal(true);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    const confirmFirst = window.confirm(
      "Are you sure you want to delete your account? This will permanently wipe all your credit balance and saved favorites. This action CANNOT be undone."
    );
    if (!confirmFirst) return;

    const confirmSecond = window.confirm(
      "FINAL WARNING: Click OK to delete all your user profile data and close your account forever."
    );
    if (!confirmSecond) return;

    try {
      setIsBillingPortalLoading(true);
      await deleteUserAccount();
      setShowSideMenu(false);
      alert("Your account was successfully deleted.");
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      alert(err.message || "Failed to delete account. You may need to sign out and sign back in to re-authenticate before deleting.");
    } finally {
      setIsBillingPortalLoading(false);
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
            uid={currentUser.uid}
            appState={state} 
            onUpdateState={updateState} 
            onTriggerAd={handleTriggerAd}
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
        
        {/* Branding & Drawer Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSideMenu(true)}
            className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/15 active:scale-90 transition-all shadow-lg"
            title="Open Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <span className="font-bold tracking-tight text-lg drop-shadow-md text-white/90">StyleVision</span>
        </div>

        {/* Controls: Album & Credits */}
        <div className="flex items-center gap-2">

          {/* Credits Balance Badge */}
          <button
            onClick={() => setShowOnboardingPaywall(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/25 text-indigo-300 hover:text-white text-[9px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
            title="Buy Credits / Watch Ads"
          >
            <svg className="w-2.5 h-2.5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>{state.credits} Credits</span>
          </button>

          {/* Album Picker */}
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-8 h-8 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-xl border border-white/10 shadow-lg active:scale-95 transition-transform"
             title="Choose from Gallery"
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

      {/* --- Bottom Navigation --- */}
      <BottomNav 
        currentMode={state.currentMode} 
        onSwitchMode={(mode) => updateState({ currentMode: mode })} 
      />

      {/* --- Hamburger Side Drawer Menu --- */}
      {showSideMenu && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-200 pointer-events-auto">
          {/* Backdrop Blur overlay */}
          <div 
            onClick={() => setShowSideMenu(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 h-full bg-neutral-900 border-r border-white/5 flex flex-col justify-between p-6 shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Header: Branding & Close */}
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center font-extrabold text-[10px] text-indigo-400">
                    SV
                  </div>
                  <span className="font-extrabold tracking-tight text-sm text-white/95">StyleVision</span>
                </div>
                <button
                  onClick={() => setShowSideMenu(false)}
                  className="w-7 h-7 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* User Account Card */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3.5">
                <div className="flex flex-col text-left space-y-0.5">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Account Profile</span>
                  <span className="text-xs font-bold text-white/90 truncate max-w-[200px]">
                    {currentUser?.email || "Guest Account"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-white/5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Status</span>
                  {state.isPremium ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-yellow-500/30 text-yellow-400 text-[8px] font-black uppercase tracking-widest">
                      Premium
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/45 text-[8px] font-black uppercase tracking-widest">
                      Free Tier
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-white/5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Credit Balance</span>
                  <span className="text-xs font-black text-white">{state.credits} Credits</span>
                </div>
              </div>

              {/* Menu Navigation list */}
              <nav className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setShowSideMenu(false);
                    setShowOnboardingPaywall(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-left font-extrabold text-[10px] uppercase tracking-widest text-indigo-400 transition-all flex items-center justify-between"
                >
                  <span>Credit Hub / Buy Packs</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>

                {/* Guide/How it works toggle */}
                <div className="w-full rounded-xl border border-white/5 overflow-hidden transition-all bg-white/5">
                  <button
                    onClick={() => setShowHowItWorks(!showHowItWorks)}
                    className="w-full py-3 px-4 text-left font-extrabold text-[10px] uppercase tracking-widest text-white/80 hover:text-white transition-all flex items-center justify-between"
                  >
                    <span>Guide & Tutorial</span>
                    <svg 
                      className={`w-3 h-3 transition-transform duration-200 ${showHowItWorks ? 'rotate-90' : 'rotate-0'}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {showHowItWorks && (
                    <div className="px-4 pb-3 pt-1 space-y-2.5 text-left border-t border-white/5 text-[10px] text-neutral-400 leading-relaxed animate-in fade-in duration-300 font-medium">
                      <p>📸 <strong className="text-white/80">Upload Photo:</strong> Snap or pick a clear front-facing headshot.</p>
                      <p>💇 <strong className="text-white/80">Select Style:</strong> Browse hair, beard, or custom styling inputs.</p>
                      <p>✨ <strong className="text-white/80">Generate Look:</strong> Triggers AI compilation (consumes 1 credit).</p>
                      <p>📺 <strong className="text-white/80">Earn Credits:</strong> Watch short rewarded sponsors inside Credit Hub for free credits.</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setLegalTab('terms')}
                  className="w-full py-3 px-4 rounded-xl border border-white/5 hover:border-white/10 text-left font-extrabold text-[10px] uppercase tracking-widest text-white/70 hover:text-white transition-all"
                >
                  Terms of Use (EULA)
                </button>

                <button
                  onClick={() => setLegalTab('privacy')}
                  className="w-full py-3 px-4 rounded-xl border border-white/5 hover:border-white/10 text-left font-extrabold text-[10px] uppercase tracking-widest text-white/70 hover:text-white transition-all"
                >
                  Privacy Policy
                </button>

                <button
                  onClick={() => setLegalTab('account')}
                  className="w-full py-3 px-4 rounded-xl border border-white/5 hover:border-white/10 text-left font-extrabold text-[10px] uppercase tracking-widest text-white/70 hover:text-white transition-all"
                >
                  Account Data Settings
                </button>
              </nav>
            </div>

            {/* Footer actions / Danger Zone */}
            <div className="flex flex-col space-y-3.5 border-t border-white/5 pt-4">
              <button
                onClick={() => {
                  setShowSideMenu(false);
                  logout();
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 font-extrabold text-[9px] uppercase tracking-widest text-white/80 transition-all active:scale-[0.98]"
              >
                Sign Out
              </button>

              <div className="text-center text-[8px] font-black uppercase tracking-widest text-neutral-600 pt-1 leading-none">
                StyleVision v1.0.0 (Capacitor)
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- Onboarding Paywall Overlay --- */}
      {showOnboardingPaywall && currentUser && (
        <PaywallView 
          uid={currentUser.uid} 
          onContinueFree={() => setShowOnboardingPaywall(false)}
          onWatchAdClick={handleTriggerAd}
        />
      )}

      {/* --- Rewarded Video Ad Modal --- */}
      {showAdModal && (
        <AdRewardModal 
          onAdCompleted={handleAdCompleted} 
          onClose={() => setShowAdModal(false)}
        />
      )}

      {/* --- Legal Modal Overlay --- */}
      {legalTab && (
        <LegalDocumentsModal 
          initialTab={legalTab} 
          onClose={() => setLegalTab(null)} 
          onDeleteAccount={handleDeleteAccount}
          isBillingPortalLoading={isBillingPortalLoading}
        />
      )}

    </div>
  );
};

export default App;
