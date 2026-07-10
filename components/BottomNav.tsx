import React from 'react';
import { AppMode } from '../types';
import { Icons } from '../constants';

interface BottomNavProps {
  currentMode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentMode, onSwitchMode }) => {
  return (
    <div className="absolute bottom-[calc(2.5rem+env(safe-area-inset-bottom,0px))] left-1/2 transform -translate-x-1/2 w-[85%] max-w-xs h-14 bg-black/55 backdrop-blur-xl border border-white/10 rounded-full flex justify-around items-center z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      
      <button 
        onClick={() => onSwitchMode(AppMode.CAMERA)}
        className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active:scale-90 ${
          currentMode === AppMode.CAMERA 
            ? 'text-white bg-white/10 shadow-sm border border-white/5' 
            : 'text-white/45 hover:text-white/70'
        }`}
        title="Camera"
      >
        <Icons.Camera />
      </button>

      <button 
        onClick={() => onSwitchMode(AppMode.EDITOR)}
        className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active:scale-90 ${
          currentMode === AppMode.EDITOR 
            ? 'text-white bg-white/10 shadow-sm border border-white/5' 
            : 'text-white/45 hover:text-white/70'
        }`}
        title="Editor"
      >
        <Icons.Styles />
      </button>

      <button 
        onClick={() => onSwitchMode(AppMode.FAVORITES)}
        className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active:scale-90 ${
          currentMode === AppMode.FAVORITES 
            ? 'text-white bg-white/10 shadow-sm border border-white/5' 
            : 'text-white/45 hover:text-white/70'
        }`}
        title="Favorites"
      >
        <Icons.Heart />
      </button>

    </div>
  );
};
