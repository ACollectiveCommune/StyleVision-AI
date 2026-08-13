export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export enum AppMode {
  EDITOR = 'Editor',
  SALON = 'Salon',
  STYLE = 'Style',
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
  // 180° Preview fields
  isSubscriber?: boolean;
  subscriptionPlan?: "weekly" | "monthly" | "yearly" | null;
  subscriptionCredits?: number;
  purchasedCredits?: number;
  showAI180Viewer?: boolean;
  activeAI180ScanId?: string | null;
  captured180Frames?: Record<string, string>;
  currentDocId?: string | null;
  editorMode?: "single_photo" | "ai_180";
  favoritedCreations?: SavedGeneration[];
  favoritedStyles?: FavoritedStyle[];
  activeAI180Favorite?: SavedGeneration | null;
}
export interface Saved180Frame {
  imageUrl: string;
  yaw: number;
  viewLabel: string;
  side: string;
  sortIndex: number;
}

export interface SavedGeneration {
  id?: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  hairStyle: string;
  hairColor: string;
  beardStyle: string;
  beardColor: string;
  outfit?: string;
  makeup?: string;
  eyeColor?: string;
  treatments?: Array<{ treatmentId: string; value: number; label: string }>;
  customPrompt?: string;
  gender: string;
  timestamp?: any;
  isFavorite: boolean;
  type?: "single-photo" | "180-preview";
  sessionId?: string;
  frontImage?: string;
  frames?: Array<string | Saved180Frame>;
  angleMetadata?: any[];
  appliedParameters?: {
    hairStyle?: string;
    hairColor?: string;
    beardStyle?: string;
    beardColor?: string;
    outfit?: string;
    makeup?: string;
    eyeColor?: string;
    treatments?: any[];
    customPrompt?: string;
  };
}

export interface FavoritedStyle {
  id: string;
  category: string;
  label: string;
  image: string;
  gender?: string;
}

export interface AI180Scan {
  id: string;
  userId: string;
  createdAt: string;
  sourceFrames: string[]; // 9 base64/Storage URLs
  version: string;
  metadata?: any[];
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
  metadata?: any[];
}
