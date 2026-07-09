import React from 'react';
import { AppMode } from '../types';
import { Icons } from '../constants';

interface BottomNavProps {
  currentMode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentMode, onSwitchMode }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/20 backdrop-blur-2xl border-t border-white/5 flex justify-around items-start pt-4 z-50">
      
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
