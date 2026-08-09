import React, { useState, useRef, useEffect } from 'react';
import { AppState, AppMode, Gender } from './types';
import { CameraView } from './components/CameraView';
import { PhotoEditor, EditorErrorBoundary } from './components/PhotoEditor';
import { BottomNav } from './components/BottomNav';
import { LoginView } from './components/LoginView';
import { FavoritesView } from './components/FavoritesView';
import { PaywallView } from './components/PaywallView';
import { OnboardingView } from './components/OnboardingView';
import { ThreeSixtyViewer } from './components/ThreeSixtyViewer';
import { ENABLE_AI_180_EXPERIMENT } from './constants/featureFlags';
import { AI180Viewer } from './components/AI180Viewer';
import { AI180Capture } from './components/AI180Capture';
import { extractAnchorFrames } from './services/AI180ViewProcessor';
import { saveAI180Scan } from './services/AI180FirestoreService';
import { Icons, HAIR_STYLES_MALE, HAIR_STYLES_FEMALE, HAIR_COLORS, BEARD_STYLES, BEARD_COLORS, OUTFIT_STYLES, MAKEUP_STYLES } from './constants';
import { 
  auth, 
  logout, 
  onAuthStateChanged, 
  SavedGeneration, 
  deleteUserAccount, 
  uploadImageToStorage, 
  saveGeneration,
  toggleFavoritedStyle,
  fetchFavoritedStyles,
  FavoritedStyle,
  toggleFavorite,
  fetchUserFavorites,
  deleteGeneration
} from './services/firebase';
import { subscribeToCredits, incrementUserCredits, consumeCredit } from './services/billingService';
import { getUser360Wallet } from './services/threeSixtyService';
import { initializeBilling, purchasePremium, manageBillingSubscription, logoutBilling, isIOS } from './services/iapService';
import { AdRewardModal } from './components/AdRewardModal';
import { LegalDocumentsModal } from './components/LegalDocumentsModal';
import { initializeAdMob, showRewardedVideoAd } from './services/adService';
import { User } from 'firebase/auth';
import { AestheticsView } from './components/AestheticsView';
import { PhotoQualityModal } from './components/PhotoQualityModal';
import { generateStylePreview } from './services/geminiService';
import { downloadOrShareImage } from './services/shareService';
import {
  MALE_HAIR_PREVIEWS,
  FEMALE_HAIR_PREVIEWS,
  COLOR_PREVIEWS,
  MALE_BEARD_PREVIEWS,
  MALE_OUTFIT_PREVIEWS,
  FEMALE_OUTFIT_PREVIEWS,
  MALE_MAKEUP_PREVIEWS,
  FEMALE_MAKEUP_PREVIEWS,
  PreviewPreset
} from './services/previews';

const OutfitCard: React.FC<{
  t: PreviewPreset;
  isSelected: boolean;
  onClick: () => void;
  favoritedStyles: FavoritedStyle[];
  onToggleStyleFavorite: (style: FavoritedStyle) => void;
}> = ({ t, isSelected, onClick, favoritedStyles, onToggleStyleFavorite }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Select outfit preset ${t.label}`}
      className={`group flex-shrink-0 w-36 flex flex-col rounded-2xl overflow-hidden p-2 transition-all text-left ${
        isSelected
          ? 'bg-indigo-950/40 border border-indigo-500 ring-2 ring-indigo-500/10'
          : 'bg-neutral-900/40 hover:bg-neutral-900/70 border border-white/5 hover:border-white/10'
      }`}
    >
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-neutral-950 mb-2 flex items-center justify-center">
        {/* Favorites Style Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStyleFavorite({
              id: t.id,
              category: 'outfit',
              label: t.label,
              image: t.image,
              gender: t.gender
            });
          }}
          className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white active:scale-90 hover:bg-black/85 transition-all z-10"
        >
          <svg
            className={`w-2.5 h-2.5 ${favoritedStyles.some(f => f.id === t.id) ? 'fill-red-500 stroke-red-500' : 'stroke-white fill-none'}`}
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        {/* Skeleton Pulse */}
        {!loaded && !error && (
          <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
            <svg className="w-5 h-5 text-neutral-800 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {/* Error Fallback */}
        {error && (
          <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-2 text-center">
            <svg className="w-5 h-5 text-neutral-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[7px] text-neutral-500 font-bold uppercase">Load Failed</span>
          </div>
        )}

        <img 
          src={t.image} 
          alt={t.label} 
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Selected Badge */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 bg-indigo-500 text-white rounded-full p-1 shadow-md z-10 animate-in zoom-in duration-200">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{t.label}</span>
      <p className="text-[9px] text-neutral-500 font-semibold truncate leading-relaxed mt-0.5">{t.description}</p>
    </button>
  );
};

const App: React.FC = () => {
  const billingUnsubscribeRef = useRef<(() => void) | null>(null);
  const webUnsubscribeRef = useRef<(() => void) | null>(null);

  const [state, setState] = useState<AppState>({
    currentMode: AppMode.EDITOR,
    gender: Gender.MALE,
    originalImage: null,
    currentImage: null,
    selectedHairStyle: HAIR_STYLES_MALE[0],
    selectedHairColor: HAIR_COLORS[0],
    selectedBeardStyle: BEARD_STYLES[0],
    selectedBeardColor: BEARD_COLORS[0],
    selectedOutfit: OUTFIT_STYLES[0],
    selectedMakeup: MAKEUP_STYLES[0],
    isProcessing: false,
    customPrompt: '',
    currentDocId: null,
    isPremium: false,
    premiumChecked: false,
    generationCount: 0,
    credits: 999,
    subscriptionTier: 'none',
    selectedTreatments: [],
    isSubscriber: false,
    subscriptionPlan: null,
    available360Credits: 0,
    active360PreviewId: null,
    is360FeatureEnabled: true,
    show360Viewer: false,
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showOnboardingPaywall, setShowOnboardingPaywall] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showAI180Capture, setShowAI180Capture] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [favoritedStyles, setFavoritedStyles] = useState<FavoritedStyle[]>([]);
  const [favoritedCreations, setFavoritedCreations] = useState<SavedGeneration[]>([]);
  const [loadingCreations, setLoadingCreations] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('has_completed_onboarding') === 'true';
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestAestheticsRequestId = useRef(0);

  const handleToggleStyleFavorite = async (style: FavoritedStyle) => {
    const isCurrentlyFav = favoritedStyles.some(f => f.id === style.id);
    const uid = currentUser?.uid || "guest_user_local";
    try {
      await toggleFavoritedStyle(uid, style, !isCurrentlyFav);
      setFavoritedStyles(prev => {
        if (isCurrentlyFav) {
          return prev.filter(f => f.id !== style.id);
        } else {
          return [...prev, style];
        }
      });
    } catch (err) {
      console.error("Failed to toggle style favorite:", err);
    }
  };

  const handleToggleLookFavorite = async (generation: SavedGeneration, isFavorite: boolean) => {
    const uid = currentUser?.uid || "guest_user_local";
    if (!generation.id) return;
    try {
      await toggleFavorite(uid, generation.id, isFavorite);
      setFavoritedCreations(prev => {
        if (isFavorite) {
          if (prev.some(g => g.id === generation.id)) return prev;
          return [generation, ...prev];
        } else {
          return prev.filter(g => g.id !== generation.id);
        }
      });
    } catch (err) {
      console.error("Failed to toggle look favorite:", err);
    }
  };

  const handleDeleteLook = async (docId: string) => {
    const uid = currentUser?.uid || "guest_user_local";
    if (!window.confirm("Are you sure you want to delete this styling preview?")) return;
    try {
      await deleteGeneration(uid, docId);
      setFavoritedCreations(prev => prev.filter(item => item.id !== docId));
    } catch (err) {
      console.error("Failed to delete generation:", err);
    }
  };

  const handleUseFavoritedStyle = (style: FavoritedStyle) => {
    const updates: Partial<any> = { currentMode: AppMode.EDITOR };
    if (style.gender === 'Female' && state.gender !== Gender.FEMALE) {
      updates.gender = Gender.FEMALE;
    } else if (style.gender === 'Male' && state.gender !== Gender.MALE) {
      updates.gender = Gender.MALE;
    }

    if (style.category === 'hair') {
      const match = (style.gender === 'Female' ? HAIR_STYLES_FEMALE : HAIR_STYLES_MALE).find(h => h.id === style.id);
      if (match) {
        updates.selectedHairStyle = match;
      }
    } else if (style.category === 'beard') {
      const match = BEARD_STYLES.find(b => b.id === style.id);
      if (match) {
        updates.selectedBeardStyle = match;
      }
    } else if (style.category === 'outfit') {
      const match = OUTFIT_STYLES.find(o => o.id === style.id);
      if (match) {
        updates.selectedOutfit = match;
      }
    } else if (style.category === 'makeup') {
      const match = MAKEUP_STYLES.find(m => m.id === style.id);
      if (match) {
        updates.selectedMakeup = match;
      }
    }
    updateState(updates);
  };

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
      
      const uid = user ? user.uid : "guest_user_local";
      fetchFavoritedStyles(uid).then(setFavoritedStyles).catch(console.error);
      
      setLoadingCreations(true);
      fetchUserFavorites(uid)
        .then((data) => {
          setFavoritedCreations(data);
          setLoadingCreations(false);
        })
        .catch((err) => {
          console.error("Failed to load user creations favorites:", err);
          setLoadingCreations(false);
        });

      // Cleanup previous listener
      if (billingUnsubscribeRef.current) {
        billingUnsubscribeRef.current();
        billingUnsubscribeRef.current = null;
      }
      if (webUnsubscribeRef.current) {
        webUnsubscribeRef.current();
        webUnsubscribeRef.current = null;
      }

      if (user) {
        try {
          // Listen/fetch 360 wallet
          getUser360Wallet(user.uid).then((wallet) => {
            updateState({
              isSubscriber: wallet.subscriptionStatus === "active",
              subscriptionPlan: wallet.subscriptionPlan,
              subscriptionCredits: wallet.subscriptionCredits,
              purchasedCredits: wallet.purchasedCredits,
              available360Credits: wallet.subscriptionCredits + wallet.purchasedCredits
            });
          }).catch(console.error);

          // Listen to active credits balance
          const unsubBilling = subscribeToCredits(user.uid, (credits) => {
            updateState({
              credits: credits,
              premiumChecked: true,
              generationCount: 0
            });
          });
          billingUnsubscribeRef.current = unsubBilling;

          if (isIOS()) {
            // Initialize native Apple App Store billing listeners via RevenueCat (on iOS)
            initializeBilling(
              user.uid, 
              (newCredits) => {
                updateState({ credits: newCredits });
              },
              (isPremiumActive) => {
                updateState({ isPremium: isPremiumActive, premiumChecked: true });
              }
            );
          } else {
            // If on Web, listen to the user document in Firestore to check web-subscriber status (Guideline 4)
            import('./services/firebase').then(({ db }) => {
              if (db) {
                import('firebase/firestore').then(({ doc, onSnapshot }) => {
                  const userDocRef = doc(db, "users", user.uid);
                  const unsubDoc = onSnapshot(userDocRef, (docSnap: any) => {
                    if (docSnap.exists()) {
                      const data = docSnap.data();
                      const hasWebPremium = !!data.isPremium || (data.subscriptionTier && data.subscriptionTier !== 'none');
                      
                      // Check/sync web subscription status with 360 wallet active status
                       getUser360Wallet(user.uid).then((wallet) => {
                        const updatedPlan = data.subscriptionTier || null;
                        const isSubActive = hasWebPremium;
                        
                        updateState({ 
                          isPremium: hasWebPremium,
                          premiumChecked: true,
                          subscriptionTier: data.subscriptionTier || 'none',
                          isSubscriber: isSubActive,
                          subscriptionPlan: updatedPlan,
                          subscriptionCredits: wallet.subscriptionCredits,
                          purchasedCredits: wallet.purchasedCredits,
                          available360Credits: wallet.subscriptionCredits + wallet.purchasedCredits
                        });
                      });
                    }
                  }, (err) => {
                    updateState({ premiumChecked: true });
                  });
                  webUnsubscribeRef.current = unsubDoc;
                });
              }
            });
          }
        } catch (err) {
          console.error("Error setting up user billing data:", err);
          updateState({
            isPremium: false,
            premiumChecked: true,
            generationCount: 0,
            credits: 999,
            isSubscriber: false,
            subscriptionPlan: null,
            available360Credits: 0
          });
        }
      } else {
        updateState({
          isPremium: false,
          premiumChecked: true,
          generationCount: 0,
          credits: 999,
          isSubscriber: false,
          subscriptionPlan: null,
          available360Credits: 0,
          active360PreviewId: null
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
      if (webUnsubscribeRef.current) {
        webUnsubscribeRef.current();
      }
    };
  }, []);

  // Automatically show photo guidelines when entering camera screen
  useEffect(() => {
    if (state.currentMode === AppMode.EDITOR && state.originalImage === null && authChecked && currentUser) {
      const isHidden = localStorage.getItem('hide_photo_guidelines') === 'true';
      if (!isHidden) {
        setShowQualityModal(true);
      }
    }
  }, [state.currentMode, state.originalImage, authChecked, currentUser]);

  const [showSideMenu, setShowSideMenu] = useState(false);
  const [isBillingPortalLoading, setIsBillingPortalLoading] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | 'account' | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<PreviewPreset | null>(null);
  const [salonFilter, setSalonFilter] = useState<string>('all');
  const [meFilter, setMeFilter] = useState<'All' | 'Editor' | 'Salon' | 'AI Outfit'>('All');
  const [meTab, setMeTab] = useState<'creations' | 'styles'>('creations');
  const [salonGender, setSalonGender] = useState<Gender>(Gender.MALE);
  const [outfitGender, setOutfitGender] = useState<Gender>(Gender.MALE);
  const [outfitCategory, setOutfitCategory] = useState<string>('all');
  const [salonScrolled, setSalonScrolled] = useState(false);
  const [outfitScrolled, setOutfitScrolled] = useState(false);

  const handleAdCompleted = async () => {
    setShowAdModal(false);
    if (currentUser) {
      try {
        const newCredits = await incrementUserCredits(currentUser.uid, 10, state.credits);
        updateState({ credits: newCredits, isPremium: newCredits > 0 });
      } catch (err) {
        console.error("Failed to grant ad credit:", err);
        const fallbackCredits = state.credits + 10;
        updateState({ credits: fallbackCredits, isPremium: fallbackCredits > 0 });
      }
    } else {
      const fallbackCredits = state.credits + 10;
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
      await logoutBilling(); // Revoke RevenueCat identity alignment
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

  const resetEditingSessionForNewPhoto = (newSourceImage: string | null) => {
    const isMale = state.gender === Gender.MALE;
    const defaultHair = isMale ? HAIR_STYLES_MALE[0] : HAIR_STYLES_FEMALE[0];
    
    updateState({
      originalImage: newSourceImage,
      currentImage: null, // Clear generated result
      currentDocId: null,
      selectedHairStyle: defaultHair,
      selectedHairColor: HAIR_COLORS[0],
      selectedBeardStyle: BEARD_STYLES[0],
      selectedBeardColor: BEARD_COLORS[0],
      selectedOutfit: OUTFIT_STYLES[0],
      selectedMakeup: MAKEUP_STYLES[0],
      selectedTreatments: [],
      customPrompt: '',
      isProcessing: false, // Prevent auto-run
      editorMode: "single_photo",
      captured180Frames: undefined,
    });
  };

  const applyCapturedImage = (imageDataUrl: string) => {
    resetEditingSessionForNewPhoto(imageDataUrl);
    updateState({ currentMode: AppMode.EDITOR });
  };

  const handleCapture = (imageDataUrl: string) => {
    applyCapturedImage(imageDataUrl);
  };

  const handleCaptureAI180Complete = async (rawFrames: string[]) => {
    setShowAI180Capture(false);
    updateState({ isProcessing: true });
    const uid = currentUser?.uid || "guest_user_local";
    try {
      // 1. Extract 9 sharpest anchor views
      const anchors = await extractAnchorFrames(rawFrames);
      
      // 2. Upload frames to Firebase Storage
      const uploadPromises = anchors.map((base64) => 
        uploadImageToStorage(uid, base64, 'original')
      );
      const urls = await Promise.all(uploadPromises);

      // 3. Save scan to Firestore / LocalStorage
      const scanId = await saveAI180Scan(uid, {
        userId: uid,
        sourceFrames: urls,
        createdAt: new Date().toISOString(),
        version: '1.0'
      });

      // 4. Transition straight to Editor mode with Front View baseline
      updateState({
        editorMode: "ai_180",
        currentMode: AppMode.EDITOR,
        originalImage: urls[4], // Front view frame as baseline
        activeAI180ScanId: scanId,
        isProcessing: false
      });
    } catch (err: any) {
      console.error("Failed to process AI 180 capture:", err);
      alert(`Failed to process scan: ${err?.message || err}`);
      updateState({ isProcessing: false });
    }
  };

  const handleTryTemplate = (template: PreviewPreset) => {
    if (!state.originalImage) {
      alert("Please capture or upload a face portrait first using the Editor tab!");
      return;
    }

    const updates: Partial<AppState> = {
      currentMode: AppMode.EDITOR,
      isProcessing: true,
      currentImage: null,
      currentDocId: null,
      customPrompt: '',
    };

    const isFemale = template.gender === 'Female' || (template.gender === 'unisex' && outfitGender === Gender.FEMALE);
    const defaultHair = isFemale ? HAIR_STYLES_FEMALE[0] : HAIR_STYLES_MALE[0];
    const genderChanged = state.gender !== (isFemale ? Gender.FEMALE : Gender.MALE);

    updates.gender = isFemale ? Gender.FEMALE : Gender.MALE;

    if (template.category === 'hair') {
      const hairStylesList = isFemale ? HAIR_STYLES_FEMALE : HAIR_STYLES_MALE;
      const matchStyle = hairStylesList.find(x => x.id === template.id) || hairStylesList[0];
      
      updates.selectedHairStyle = matchStyle;
      updates.selectedHairColor = state.selectedHairColor || HAIR_COLORS[0];
      updates.selectedBeardStyle = isFemale ? BEARD_STYLES[0] : (state.selectedBeardStyle || BEARD_STYLES[0]);
      updates.selectedBeardColor = state.selectedBeardColor || BEARD_COLORS[0];
      updates.selectedOutfit = state.selectedOutfit || OUTFIT_STYLES[0];
      updates.selectedMakeup = state.selectedMakeup || MAKEUP_STYLES[0];
    } else if (template.category === 'outfit') {
      const matchOutfit = OUTFIT_STYLES.find(x => x.id === template.id) || OUTFIT_STYLES[0];
      
      updates.selectedOutfit = matchOutfit;
      updates.selectedHairStyle = genderChanged ? defaultHair : (state.selectedHairStyle || defaultHair);
      updates.selectedHairColor = state.selectedHairColor || HAIR_COLORS[0];
      updates.selectedBeardStyle = isFemale ? BEARD_STYLES[0] : (state.selectedBeardStyle || BEARD_STYLES[0]);
      updates.selectedBeardColor = state.selectedBeardColor || BEARD_COLORS[0];
      updates.selectedMakeup = state.selectedMakeup || MAKEUP_STYLES[0];
    } else if (template.category === 'beard') {
      const matchBeard = BEARD_STYLES.find(x => x.id === template.id) || BEARD_STYLES[0];
      
      updates.selectedBeardStyle = matchBeard;
      updates.selectedHairStyle = genderChanged ? defaultHair : (state.selectedHairStyle || defaultHair);
      updates.selectedHairColor = state.selectedHairColor || HAIR_COLORS[0];
      updates.selectedBeardColor = state.selectedBeardColor || BEARD_COLORS[0];
      updates.selectedOutfit = state.selectedOutfit || OUTFIT_STYLES[0];
      updates.selectedMakeup = state.selectedMakeup || MAKEUP_STYLES[0];
    }

    updateState(updates);
    setSelectedTemplate(null);
  };

  const handleGenerateAesthetics = async () => {
    const cost = 2;
    if (state.credits < cost) {
      setShowOnboardingPaywall(true);
      return;
    }
    
    const requestId = ++latestAestheticsRequestId.current;
    updateState({ isProcessing: true });
    try {
      const resultImage = await generateStylePreview(state);
      
      if (requestId !== latestAestheticsRequestId.current) {
        console.log("Stale aesthetics generation request ignored");
        return;
      }
      
      let nextCredits = state.credits;
      const targetUid = currentUser?.uid || 'guest_user_local';
      
      if (currentUser && currentUser.uid !== "guest_user_local") {
        try {
          await consumeCredit(currentUser.uid);
          nextCredits = await consumeCredit(currentUser.uid);
        } catch (countErr) {
          console.error("Failed to consume credit:", countErr);
          nextCredits = Math.max(0, state.credits - cost);
        }
      } else {
        nextCredits = Math.max(0, state.credits - cost);
      }

      updateState({ 
        currentImage: resultImage, 
        isProcessing: false, 
        credits: nextCredits,
        currentMode: AppMode.EDITOR
      });

      // Auto-save aesthetics prediction in background
      (async () => {
        try {
          let originalUrl = '';
          let generatedUrl = '';
          
          if (currentUser && currentUser.uid !== "guest_user_local") {
            try {
              originalUrl = await uploadImageToStorage(currentUser.uid, state.originalImage!, 'original');
              generatedUrl = await uploadImageToStorage(currentUser.uid, resultImage, 'generated');
            } catch (storageErr) {
              console.warn("Storage upload failed, falling back to base64", storageErr);
              originalUrl = state.originalImage!;
              generatedUrl = resultImage;
            }
          } else {
            originalUrl = state.originalImage!;
            generatedUrl = resultImage;
          }
          
          const treatmentsStr = state.selectedTreatments?.map(t => `${t.treatmentId} (${t.label})`).join(', ') || 'None';

          await saveGeneration(targetUid, {
            originalImageUrl: originalUrl,
            generatedImageUrl: generatedUrl,
            hairStyle: state.selectedHairStyle?.id || 'original',
            hairColor: state.selectedHairColor?.id || 'original',
            beardStyle: state.gender === Gender.MALE ? (state.selectedBeardStyle?.id || 'original') : 'none',
            beardColor: state.gender === Gender.MALE ? (state.selectedBeardColor?.id || 'original') : 'none',
            outfit: state.selectedOutfit?.id || 'original',
            makeup: state.selectedMakeup?.id || 'original',
            treatments: state.selectedTreatments,
            gender: state.gender,
            isFavorite: false,
            customPrompt: treatmentsStr ? `Aesthetics consultation: ${treatmentsStr}` : undefined
          });
        } catch (dbErr) {
          console.error("Failed to auto-save aesthetics prediction:", dbErr);
        }
      })();

    } catch (err: any) {
      updateState({ isProcessing: false });
      throw err;
    }
  };

  const handleSaveAestheticsResult = async (generatedSrc: string) => {
    try {
      await downloadOrShareImage(generatedSrc);
    } catch (e) {
      console.error("Failed to download or share image:", e);
    }
  };

  const handleSelectTemplateForPreview = (t: PreviewPreset) => {
    updateState({
      selectedHairColor: HAIR_COLORS[0],
      selectedBeardColor: BEARD_COLORS[0]
    });
    setSelectedTemplate(t);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resetEditingSessionForNewPhoto(result);
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
      selectedOutfit: generation.outfit ? { id: generation.outfit, label: generation.outfit, category: 'outfit', type: 'style' } : OUTFIT_STYLES[0],
      selectedMakeup: generation.makeup ? { id: generation.makeup, label: generation.makeup, category: 'makeup', type: 'style' } : MAKEUP_STYLES[0],
      currentMode: AppMode.EDITOR,
      customPrompt: generation.customPrompt || '',
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

  // Display Onboarding Questionnaire if first-time user
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingView 
        onComplete={() => {
          localStorage.setItem('has_completed_onboarding', 'true');
          setHasCompletedOnboarding(true);
        }} 
      />
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
        {state.currentMode === AppMode.EDITOR && (
          state.originalImage === null ? (
            <CameraView 
              isActive={state.currentMode === AppMode.EDITOR && state.originalImage === null && !showOnboardingPaywall} 
              onCapture={handleCapture} 
              isSubscriber={state.isSubscriber}
              onOpen360Viewer={() => {
                if (state.isSubscriber) {
                  updateState({ show360Viewer: true });
                } else {
                  setShowOnboardingPaywall(true);
                }
              }}
              onOpenAI180Capture={() => {
                if (state.isSubscriber) {
                  setShowAI180Capture(true);
                } else {
                  setShowOnboardingPaywall(true);
                }
              }}
            />
          ) : (
            <EditorErrorBoundary
              fallback={(error, reset) => (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 z-[100] text-white">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold mb-2 font-sans">Unable to open editor</h3>
                  <p className="text-xs text-red-400 font-mono max-w-xs mb-6 overflow-x-auto whitespace-pre-wrap bg-red-950/20 p-3 rounded-lg border border-red-500/20">
                    {error.message || String(error)}
                  </p>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                      onClick={() => reset()}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition font-sans"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => {
                        reset();
                        updateState({ 
                          show360Viewer: true, 
                          editorMode: "single_photo", 
                          current180Session: null 
                        });
                      }}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold transition font-sans"
                    >
                      Return to scan
                    </button>
                    <button
                      onClick={() => {
                        reset();
                        updateState({ 
                          originalImage: null, 
                          currentImage: null, 
                          editorMode: "single_photo", 
                          current180Session: null 
                        });
                      }}
                      className="w-full py-3 bg-slate-900 border border-white/10 rounded-xl text-sm font-semibold hover:bg-slate-800 transition font-sans"
                    >
                      Start over
                    </button>
                  </div>
                </div>
              )}
            >
              <PhotoEditor 
                uid={currentUser.uid}
                appState={state} 
                onUpdateState={updateState} 
                onTriggerAd={handleTriggerAd}
                favoritedStyles={favoritedStyles}
                onToggleStyleFavorite={handleToggleStyleFavorite}
                onOpenMenu={() => setShowSideMenu(true)}
                favoritedCreations={favoritedCreations}
                onToggleLookFavorite={handleToggleLookFavorite}
              />
            </EditorErrorBoundary>
          )
        )}

        {state.currentMode === AppMode.SALON && (
          <div className="absolute inset-0 bg-neutral-950 flex flex-col pb-0 pt-0 overflow-hidden z-10 animate-in fade-in duration-300">
            
            {/* Scrollable grid container */}
            <div 
              className="flex-1 overflow-y-auto no-scrollbar pb-36"
              onScroll={(e) => setSalonScrolled(e.currentTarget.scrollTop > 10)}
            >
              {/* Sticky Header wrapper */}
              <div className={`sticky top-0 z-20 bg-neutral-950/80 backdrop-blur-md px-6 pt-[calc(16px+env(safe-area-inset-top,20px))] pb-4 border-b transition-all duration-300 ${
                salonScrolled ? 'border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' : 'border-transparent shadow-none'
              }`}>
                {/* Gender Switcher Tab bar */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => { setSalonGender(Gender.MALE); setSalonFilter('all'); }}
                    className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 ${
                      salonGender === Gender.MALE 
                        ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]' 
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Male Styles
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSalonGender(Gender.FEMALE); setSalonFilter('all'); }}
                    className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 ${
                      salonGender === Gender.FEMALE 
                        ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]' 
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Female Styles
                  </button>
                </div>

                {/* Salon Categories filter row */}
                <div className="flex overflow-x-auto no-scrollbar space-x-2 items-center mt-4 h-8 flex-shrink-0">
                  {(salonGender === Gender.MALE 
                    ? [
                        { id: 'all', label: 'All' },
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
                        { id: 'original', label: 'Original' },
                        { id: 'short', label: 'Short' },
                        { id: 'medium', label: 'Medium' },
                        { id: 'long', label: 'Long' },
                        { id: 'bangs', label: 'Bangs' },
                        { id: 'bob', label: 'Bob' },
                        { id: 'braids', label: 'Braids' },
                        { id: 'ponytails', label: 'Ponytails' },
                        { id: 'buns', label: 'Buns' },
                        { id: 'curly', label: 'Curly' },
                        { id: 'natural', label: 'Natural' },
                        { id: 'locs', label: 'Locs' },
                        { id: 'trendy', label: 'Trendy' },
                        { id: 'formal', label: 'Formal' },
                      ]
                  ).map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSalonFilter(cat.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                        salonFilter === cat.id
                          ? 'bg-white text-black font-extrabold shadow-sm'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Templates */}
              <div className="px-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const rawFiltered = salonGender === Gender.MALE ? MALE_HAIR_PREVIEWS : FEMALE_HAIR_PREVIEWS;
                    const filtered = rawFiltered.filter(t => {
                      if (salonFilter === 'all') return true;
                      if (salonFilter === 'original') return t.id === 'original';
                      return t.subcategory === salonFilter;
                    });
                  
                  return filtered.map(t => (
                    <button
                      key={t.id + t.image}
                      type="button"
                      onClick={() => handleSelectTemplateForPreview(t)}
                      className="group relative flex flex-col items-center bg-neutral-900/40 hover:bg-neutral-900/70 border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden p-2 transition-all text-left"
                    >
                      <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-neutral-950 mb-2">
                        <img 
                          src={t.image} 
                          alt={t.label} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Favorites Style Heart Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStyleFavorite({
                              id: t.id,
                              category: t.category,
                              label: t.label,
                              image: t.image,
                              gender: t.gender || (salonGender === Gender.MALE ? 'Male' : 'Female')
                            });
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white active:scale-90 hover:bg-black/85 transition-all z-10"
                        >
                          <svg
                            className={`w-3.5 h-3.5 ${favoritedStyles.some(f => f.id === t.id) ? 'fill-red-500 stroke-red-500' : 'stroke-white fill-none'}`}
                            viewBox="0 0 24 24"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                      </div>
                      <div className="w-full px-1">
                        <span className="text-[11px] font-extrabold text-white group-hover:text-indigo-400 transition-colors leading-none">{t.label}</span>
                        <p className="text-[9px] text-neutral-500 font-semibold truncate leading-relaxed mt-0.5">{t.description}</p>
                      </div>
                    </button>
                  ));
                })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {state.currentMode === AppMode.OUTFIT && (
          <div className="absolute inset-0 bg-neutral-950 flex flex-col pb-0 pt-0 overflow-hidden z-10 animate-in fade-in duration-300">
            
            {/* Scrollable list container */}
            <div 
              className="flex-1 overflow-y-auto no-scrollbar pb-36"
              onScroll={(e) => setOutfitScrolled(e.currentTarget.scrollTop > 10)}
            >
              {/* Sticky Header wrapper */}
              <div className={`sticky top-0 z-20 bg-neutral-950/80 backdrop-blur-md px-6 pt-[calc(16px+env(safe-area-inset-top,20px))] pb-5 border-b transition-all duration-300 ${
                outfitScrolled ? 'border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' : 'border-transparent shadow-none'
              }`}>
                {/* Gender Switcher Tab bar */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setOutfitGender(Gender.MALE);
                      setOutfitCategory('all');
                    }}
                    className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 ${
                      outfitGender === Gender.MALE 
                        ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]' 
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Male Outfits
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOutfitGender(Gender.FEMALE);
                      setOutfitCategory('all');
                    }}
                    className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 ${
                      outfitGender === Gender.FEMALE 
                        ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]' 
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Female Outfits
                  </button>
                </div>

                {/* Category Filter Chips */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 px-1 scroll-smooth">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'casual', label: 'Casual' },
                    { id: 'business', label: 'Business' },
                    { id: 'luxury', label: 'Luxury' },
                    { id: 'active', label: 'Activewear' },
                    { id: 'vacation', label: 'Vacation' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setOutfitCategory(cat.id)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-200 flex-shrink-0 active:scale-95 ${
                        outfitCategory === cat.id
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10'
                          : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group shelves by outfit subcategory */}
              <div className="px-6 mt-7 space-y-6">
              {(() => {
                const shelves = [
                  { title: 'Casual & Daily Wear', key: 'casual' },
                  { title: 'Business & Professional', key: 'business' },
                  { title: 'Upscale Luxury Attire', key: 'luxury' },
                  { title: 'Activewear & Sport', key: 'active' },
                  { title: 'Vacation & Travel', key: 'vacation' }
                ];

                const targetPresets = outfitGender === Gender.MALE ? MALE_OUTFIT_PREVIEWS : FEMALE_OUTFIT_PREVIEWS;

                return shelves.map(shelf => {
                  // Filter shelves by category tab selection
                  if (outfitCategory !== 'all' && shelf.key !== outfitCategory) return null;

                  const list = targetPresets.filter(o => o.subcategory === shelf.key);
                  if (list.length === 0) return null;

                  return (
                    <div key={shelf.key} className={`mb-6 flex-shrink-0 ${list.length <= 2 ? 'text-center' : 'text-left'}`}>
                      <div className={`flex mb-3 ${list.length <= 2 ? 'justify-center' : 'justify-between items-center'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{shelf.title}</span>
                      </div>
                      <div className={`flex gap-4 overflow-x-auto no-scrollbar py-1 ${list.length <= 2 ? 'justify-center' : 'justify-start'}`}>
                        {list.map(t => (
                          <OutfitCard
                            key={t.id + t.image}
                            t={t}
                            isSelected={state.selectedOutfit?.id === t.id}
                            onClick={() => handleSelectTemplateForPreview(t)}
                            favoritedStyles={favoritedStyles}
                            onToggleStyleFavorite={handleToggleStyleFavorite}
                          />
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

        {state.currentMode === AppMode.AESTHETICS && (
          <AestheticsView 
            appState={state}
            onUpdateState={updateState}
            uid={currentUser?.uid || 'guest_user_local'}
            onTriggerAd={handleTriggerAd}
            onUploadClick={() => fileInputRef.current?.click()}
            onGenerateImage={handleGenerateAesthetics}
            onSaveResult={handleSaveAestheticsResult}
          />
        )}

        {state.currentMode === AppMode.ME && (
          <div className="absolute inset-0 bg-neutral-950 flex flex-col px-6 pb-36 pt-[calc(12px+env(safe-area-inset-top,20px))] overflow-y-auto no-scrollbar z-10 animate-in fade-in duration-300">
            <div className="flex justify-start items-center mb-6">
              <button
                onClick={() => setShowSideMenu(true)}
                className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/15 active:scale-90 transition-all shadow-lg"
                title="Open Settings"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
            </div>



            {/* Tab switch header */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-6">
              <button
                type="button"
                onClick={() => setMeTab('creations')}
                className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 ${
                  meTab === 'creations' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Saved Looks
              </button>
              <button
                type="button"
                onClick={() => setMeTab('styles')}
                className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 ${
                  meTab === 'styles' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Saved Styles
              </button>
            </div>

            {/* Favorites Content */}
            {meTab === 'creations' ? (
              <div className="flex-1 flex flex-col min-h-[300px] text-left">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">My Saved Creations</span>
                </div>
                <div className="flex-1 relative">
                  <FavoritesView 
                    onLoadGeneration={handleLoadGeneration} 
                    favorites={favoritedCreations}
                    loading={loadingCreations}
                    onRemoveFavorite={(id) => handleToggleLookFavorite({ id } as any, false)}
                    onDelete={handleDeleteLook}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-[300px] text-left">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">My Saved Styles</span>
                </div>
                <div className="flex-1 relative">
                  {favoritedStyles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-500 bg-neutral-900/10 border border-white/5 rounded-2xl">
                      <svg className="w-10 h-10 text-neutral-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-7.682-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <p className="text-xs font-bold text-white">No favorited styles yet</p>
                      <p className="text-[10px] text-neutral-500 mt-1 max-w-[200px] leading-relaxed">Tap the heart icon on any hair, beard, or makeup option in the editor to save it here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 pb-24">
                      {favoritedStyles.map(style => (
                        <div 
                          key={style.id}
                          className="relative flex flex-col items-center bg-neutral-900/40 border border-white/5 rounded-2xl overflow-hidden p-2 text-left animate-in zoom-in duration-200"
                        >
                          <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-neutral-950 mb-2">
                            <img 
                              src={style.image} 
                              alt={style.label} 
                              className="w-full h-full object-cover"
                            />
                            {/* Unfavorite button */}
                            <button
                              type="button"
                              onClick={() => handleToggleStyleFavorite(style)}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-red-500 active:scale-90 transition-all z-10"
                            >
                              <svg className="w-3.5 h-3.5 fill-red-500 stroke-red-500" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                            </button>
                          </div>
                          <div className="w-full px-1 flex flex-col justify-between flex-1">
                            <div>
                              <span className="text-[11px] font-extrabold text-white leading-none block truncate">{style.label}</span>
                              <span className="text-[8px] text-indigo-400 font-extrabold uppercase tracking-wider block mt-1">{style.category} • {style.gender || 'Any'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUseFavoritedStyle(style)}
                              className="w-full mt-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.98] text-center"
                            >
                              Apply Style
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Top Bar (Transparent / Floating) - Only on Camera Screen --- */}
      {state.currentMode === AppMode.EDITOR && state.originalImage === null && (
        <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-[calc(24px+env(safe-area-inset-top,20px))] flex justify-between items-start bg-gradient-to-b from-black/90 via-black/30 to-transparent">
          {/* Menu Button & 3D Test button (Left Column) */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setShowSideMenu(true)}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all shadow-lg"
              title="Open Menu"
            >
              <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>

          </div>

          {/* Controls: Credits & Gallery (Right) */}
          <div className="flex items-center gap-2.5 pt-0.5">
            {/* Credits Balance Badge */}
            {(!state.isSubscriber || (state.purchasedCredits !== undefined && state.purchasedCredits > 0)) && (
              <button
                onClick={() => setShowOnboardingPaywall(true)}
                className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-indigo-300 hover:text-white text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                title="Buy Credits / Watch Ads"
              >
                <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>
                  {state.isSubscriber 
                    ? `${state.purchasedCredits} Extra Credits`
                    : `${state.credits} Credits`}
                </span>
              </button>
            )}

            {/* Album Picker */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-xl border border-white/10 shadow-lg active:scale-95 transition-transform"
              title="Choose from Gallery"
            >
              <Icons.Album />
            </button>
          </div>
        </div>
      )}

      {/* --- Bottom Navigation --- */}
      {!showAI180Capture && !state.showAI180Viewer && state.editorMode !== "interactive_180" && !state.show360Viewer && (
        <BottomNav 
          currentMode={state.currentMode} 
          onSwitchMode={(mode) => updateState({ currentMode: mode })} 
        />
      )}

      {/* --- Template Swapping Bridge Overlay --- */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-[150] bg-neutral-950 flex flex-col animate-in fade-in duration-300 pointer-events-auto">
          {/* Immersive Background Image */}
          <div className="absolute inset-0 z-0">
            <img src={selectedTemplate.image} alt={selectedTemplate.label} className="w-full h-full object-cover animate-in zoom-in-95 duration-500 no-ios-callout" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/70 via-transparent to-transparent" />
          </div>

          {/* Detail Header */}
          <div className="absolute top-0 left-0 right-0 bg-neutral-950/40 backdrop-blur-md border-b border-white/10 pt-[calc(16px+env(safe-area-inset-top,24px))] pb-4 px-4 flex justify-between items-center z-20">
            <button
              onClick={() => setSelectedTemplate(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white backdrop-blur-sm"
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-wider">Back</span>
            </button>
            <span className="text-xs font-black uppercase tracking-widest text-white drop-shadow-md">{selectedTemplate.label}</span>
            <button
              onClick={() => alert(selectedTemplate.description)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform backdrop-blur-sm"
            >
              <span className="text-[10px] font-bold font-serif">i</span>
            </button>
          </div>

          {/* Floating "Your Portrait" Badge */}
          <div className="absolute top-[calc(72px+env(safe-area-inset-top,24px))] right-4 z-20 flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-neutral-950/50 backdrop-blur-md border border-white/10 shadow-xl max-w-[180px]">
            {state.originalImage ? (
              <div className="w-7 h-9 rounded-lg overflow-hidden border border-white/20 bg-neutral-900 flex-shrink-0">
                <img src={state.originalImage} alt="Your Face" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-7 h-9 rounded-lg bg-neutral-900 border border-white/20 border-dashed flex items-center justify-center text-white/40 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            )}
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[8px] font-black uppercase tracking-wider text-white">Your Portrait</span>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[8px] text-indigo-400 font-extrabold uppercase tracking-wider text-left underline mt-0.5 hover:text-indigo-300"
              >
                Change
              </button>
            </div>
          </div>

          {/* Empty spacer to push overlay flex layout */}
          <div className="flex-1" />

          {/* Swapping Controls Bridge bottom area */}
          <div className="p-6 space-y-5 bg-neutral-950/55 backdrop-blur-md border-t border-white/10 relative z-10 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            
            {/* Color Selection Bubbles */}
            {selectedTemplate.category === 'hair' && (
              <div className="space-y-2 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                <span className="text-[10px] font-black uppercase tracking-wider text-white">Choose Hair Color</span>
                <div className="flex overflow-x-auto no-scrollbar py-2 space-x-3 items-center scroll-smooth">
                  {HAIR_COLORS.map(c => (
                    <ColorButton
                      key={c.id}
                      item={c}
                      isSelected={state.selectedHairColor?.id === c.id}
                      onClick={() => updateState({ selectedHairColor: c })}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedTemplate.category === 'beard' && (
              <div className="space-y-2 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                <span className="text-[10px] font-black uppercase tracking-wider text-white">Choose Beard Color</span>
                <div className="flex overflow-x-auto no-scrollbar py-2 space-x-3 items-center scroll-smooth">
                  {BEARD_COLORS.map(c => (
                    <ColorButton
                      key={c.id}
                      item={c}
                      isSelected={state.selectedBeardColor?.id === c.id}
                      onClick={() => updateState({ selectedBeardColor: c })}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Try This Style Button */}
            <button
              onClick={() => handleTryTemplate(selectedTemplate)}
              disabled={!state.originalImage}
              className={`w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${
                state.originalImage
                  ? 'bg-white text-black hover:bg-neutral-100'
                  : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
              }`}
            >
              <span>Try This Style</span>
            </button>
          </div>
        </div>
      )}

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
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3.5 text-left">
                <div className="flex flex-col space-y-0.5">
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
                  <span className="text-xs font-black text-white">
                    {state.isSubscriber 
                      ? `${state.purchasedCredits || 0} Extra Credits`
                      : `${state.credits} Credits`}
                  </span>
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
                onClick={async () => {
                  setShowSideMenu(false);
                  await logoutBilling(); // Isolates user identification cache in RevenueCat
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
          appState={state}
          onUpdateState={updateState}
          onContinueFree={() => setShowOnboardingPaywall(false)}
          onWatchAdClick={handleTriggerAd}
        />
      )}

      {/* --- Premium 180° Preview Overlay --- */}
      {state.show360Viewer && currentUser && (
        <ThreeSixtyViewer
          uid={currentUser.uid}
          appState={state}
          onUpdateState={updateState}
          onClose={() => updateState({ show360Viewer: false, active360PreviewId: null })}
          onOpenPaywall={() => {
            updateState({ show360Viewer: false, active360PreviewId: null });
            setShowOnboardingPaywall(true);
          }}
        />
      )}

      {/* --- Experimental AI 180° Viewer Overlay --- */}
      {state.showAI180Viewer && currentUser && (
        <AI180Viewer
          uid={currentUser.uid}
          appState={state}
          onUpdateState={updateState}
          onClose={() => updateState({ showAI180Viewer: false, activeAI180ScanId: null })}
          onOpenOriginal180={() => updateState({ show360Viewer: true })}
        />
      )}

      {showAI180Capture && currentUser && (
        <AI180Capture
          onCaptureComplete={handleCaptureAI180Complete}
          onClose={() => setShowAI180Capture(false)}
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

      {/* Hidden global file input for device upload hooks */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileUpload} 
      />

      {/* --- Photo Quality Guidelines Modal --- */}
      <PhotoQualityModal
        isOpen={showQualityModal}
        onClose={() => {
          setShowQualityModal(false);
          setPendingImage(null);
        }}
        onConfirm={() => {
          setShowQualityModal(false);
          if (pendingImage) {
            applyCapturedImage(pendingImage);
            setPendingImage(null);
          }
        }}
      />

    </div>
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

const ColorButton: React.FC<{
  item: { id: string; label: string };
  isSelected: boolean;
  onClick: () => void;
}> = ({ item, isSelected, onClick }) => {
  const swatchClass = getColorSwatchClass(item.id);
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 w-9 h-9 rounded-full border-2 transition-all duration-200 overflow-hidden relative active:scale-95 ${
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

export default App;
