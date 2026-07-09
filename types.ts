export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export enum AppMode {
  CAMERA = 'Camera',
  EDITOR = 'Editor',
  FAVORITES = 'Favorites',
}

export interface StyleOption {
  id: string;
  label: string;
  category: 'hair' | 'beard';
  type: 'style' | 'color';
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
  isProcessing: boolean;
}
