import React from 'react';
import { AppMode } from '../types';
import { Icons } from '../constants';

interface BottomNavProps {
  currentMode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentMode, onSwitchMode }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[calc(5rem+env(safe-area-inset-bottom,16px))] pb-[env(safe-area-inset-bottom,16px)] bg-black/40 backdrop-blur-2xl border-t border-black/30 flex justify-around items-center z-50">
      
      <button 
        onClick={() => onSwitchMode(AppMode.CAMERA)}
        className={`flex flex-col items-center space-y-1 transition-colors duration-300 ${currentMode === AppMode.CAMERA ? 'text-white' : 'text-white/40'}`}
      >
        <Icons.Camera />
        <span className="text-[10px] font-medium tracking-wide">Camera</span>
      </button>

      <button 
        onClick={() => onSwitchMode(AppMode.EDITOR)}
        className={`flex flex-col items-center space-y-1 transition-colors duration-300 ${currentMode === AppMode.EDITOR ? 'text-white' : 'text-white/40'}`}
      >
        <Icons.Styles />
        <span className="text-[10px] font-medium tracking-wide">Styles</span>
      </button>

      <button 
        onClick={() => onSwitchMode(AppMode.FAVORITES)}
        className={`flex flex-col items-center space-y-1 transition-colors duration-300 ${currentMode === AppMode.FAVORITES ? 'text-white' : 'text-white/40'}`}
      >
        <Icons.Heart />
        <span className="text-[10px] font-medium tracking-wide">Favorites</span>
      </button>

    </div>
  );
};
