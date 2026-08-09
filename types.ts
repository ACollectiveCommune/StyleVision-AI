export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export enum AppMode {
  EDITOR = 'Editor',
  SALON = 'Salon',
  OUTFIT = 'Outfit',
  AESTHETICS = 'Aesthetics',
  ME = 'Me',
}

export interface StyleOption {
  id: string;
  label: string;
  category: 'hair' | 'beard' | 'outfit' | 'makeup' | 'eyecolor';
  type: 'style' | 'color';
  gender?: string; // 'Male', 'Female', or 'unisex'
  subcategory?: string;
}

export interface MakeupPreset {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  complexion: {
    finish: string;
    coverage: number;
    glow: number;
    warmth: number;
  };
  eyes: {
    eyeshadowStyle: string;
    eyeshadowColor: string;
    eyelinerStyle: string;
    lashIntensity: number;
  };
  brows: {
    definition: number;
    shape: string;
  };
  cheeks: {
    blushColor: string;
    blushIntensity: number;
    bronzerIntensity: number;
    highlighterIntensity: number;
  };
  lips: {
    color: string;
    finish: string;
    intensity: number;
  };
}

export interface SelectedTreatment {
  treatmentId: string;
  value: number;
  label: string;
}

export interface AppState {
  currentMode: AppMode;
  gender: Gender;
  originalImage: string | null;
  currentImage: string | null;
  selectedHairStyle: StyleOption | null;
  selectedHairColor: StyleOption | null;
  selectedBeardStyle: StyleOption | null;
  selectedBeardColor: StyleOption | null;
  selectedOutfit: StyleOption | null;
  selectedMakeup: StyleOption | null;
  selectedEyeColor: StyleOption | null;
  isProcessing: boolean;
  customPrompt?: string;
  selectedCustomLookId?: string | null;
  customLookVersion?: number;
  isPremium: boolean;
  premiumChecked: boolean;
  generationCount: number;
  credits: number;
  subscriptionTier?: 'none' | 'weekly' | 'monthly' | 'yearly';
  selectedTreatments?: SelectedTreatment[];
  // 360° Preview fields
  isSubscriber?: boolean;
  subscriptionPlan?: "weekly" | "monthly" | "yearly" | null;
  subscriptionCredits?: number;
  purchasedCredits?: number;
  available360Credits?: number;
  active360PreviewId?: string | null;
  is360FeatureEnabled?: boolean;
  show360Viewer?: boolean;
  showAI180Viewer?: boolean;
  activeAI180ScanId?: string | null;
  captured180Frames?: Record<string, string>;
  currentDocId?: string | null;
  editorMode?: "single_photo" | "interactive_180" | "ai_180";
  current180Session?: Interactive180Session | null;
}

export interface Interactive180Session {
  id: string;
  frames: {
    left: string;
    front_left: string;
    front: string;
    front_right: string;
    right: string;
    allFrames?: string[];
  };
  status: "captured" | "editing" | "generating" | "complete";
}

export interface AI180Scan {
  id: string;
  userId: string;
  createdAt: string;
  sourceFrames: string[]; // 9 base64/Storage URLs
  version: string;
}

export interface AI180GeneratedStyle {
  id: string;
  userId: string;
  scanId: string;
  hairstyleId: string;
  hairColorId: string;
  beardId: string;
  beardColorId: string;
  generatedFrames: string[]; // 9 styled preview URLs
  createdAt: string;
}

export interface User360Wallet {
  userId: string;
  subscriptionCredits: number;
  purchasedCredits: number;
  subscriptionPlan: "weekly" | "monthly" | "yearly" | null;
  subscriptionStatus: "active" | "expired" | "cancelled" | "grace_period";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceType: "subscription" | "purchased";
  transactionType:
    | "subscription_grant"
    | "top_up_purchase"
    | "reservation"
    | "generation_charge"
    | "refund"
    | "expiration"
    | "manual_adjustment";
  storeTransactionId?: string;
  generationJobId?: string;
  createdAt: string;
}

export interface ThreeSixtyPreview {
  id: string;
  userId: string;
  sourceSessionId: string;
  hairstyleId: string;
  beardId: string;
  outfitId?: string | null;
  aestheticsState: Record<string, number>;
  aestheticsStateHash: string;
  frameUrls: string[];
  highResFrameUrls?: string[];
  thumbnailUrl?: string;
  status: "draft" | "validating" | "processing" | "complete" | "failed";
  createdAt: string;
  completedAt?: string;
}

export interface ThreeSixtyGenerationJob {
  id: string;
  userId: string;
  previewId: string;
  sourceSessionId: string;
  stateSnapshot: {
    hairstyleId: string;
    beardId: string;
    outfitId?: string | null;
    aesthetics: Record<string, number>;
    hairColorId?: string | null;
    beardColorId?: string | null;
    eyeColorId?: string | null;
    makeup?: string | null;
  };
  status: "queued" | "processing" | "retrying" | "complete" | "failed" | "refunded";
  reservedCreditTransactionId?: string;
  expectedFrameCount: number;
  completedFrameCount: number;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ThreeSixtyFeatureConfig {
  enabled: boolean;
  subscriberOnly: boolean;
  welcomeCredits: number;
  weeklyAllowance: number;
  monthlyAllowance: number;
  yearlyMonthlyAllowance: number;
  expectedFrameCount: number;
  maxAutomaticRetries: number;
  allowTopUpPurchases: boolean;
  usePrototypeFrames: boolean;
}
