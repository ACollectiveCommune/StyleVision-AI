import React from 'react';
import { AppMode } from '../types';

interface BottomNavProps {
  currentMode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentMode, onSwitchMode }) => {
  const tabs = [
    {
      mode: AppMode.EDITOR,
      label: 'Editor',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.2 1.3l-5.9 1.9 5.9 1.9a2 2 0 0 1 1.2 1.3L12 21l1.9-5.8a2 2 0 0 1 1.2-1.3l5.9-1.9-5.9-1.9a2 2 0 0 1-1.2-1.3Z" />
        </svg>
      )
    },
    {
      mode: AppMode.SALON,
      label: 'Salon',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3"/>
          <circle cx="6" cy="18" r="3"/>
          <line x1="9.8" y1="8.2" x2="21" y2="19.4"/>
          <line x1="9.8" y1="15.8" x2="21" y2="4.6"/>
        </svg>
      )
    },
    {
      mode: AppMode.OUTFIT,
      label: 'AI Outfit',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46L16 6a2 2 0 0 1-2-2V2H10v2a2 2 0 0 1-2 2L3.62 3.46a1 1 0 0 0-1.34.46l-1 2A1 1 0 0 0 1.8 7.3l2.2 1.1a2 2 0 0 1 1 1.7V21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10.1a2 2 0 0 1 1-1.7l2.2-1.1a1 1 0 0 0 .5-1.38l-1-2a1 1 0 0 0-1.32-.46z"/>
        </svg>
      )
    },
    {
      mode: AppMode.AESTHETICS,
      label: 'Aesthetics',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 4 5 5" />
          <path d="m3 21 12-12" />
          <path d="M20.96 5.04a2.12 2.12 0 0 0-3-3l-3 3 3 3 3-3Z" />
          <path d="M19 16v3" />
          <path d="M17.5 17.5h3" />
          <path d="M8 5v3" />
          <path d="M6.5 6.5h3" />
        </svg>
      )
    },
    {
      mode: AppMode.ME,
      label: 'Favorites',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Scroll Transition: Bottom gradient fade overlay */}
      <div className="fixed bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent z-[90] pointer-events-none" />

      <div className="fixed bottom-[calc(0.6rem+env(safe-area-inset-bottom,0px))] left-1/2 transform -translate-x-1/2 w-[94%] max-w-md h-14 bg-neutral-900/80 backdrop-blur-xl border-t border-t-white/10 border-l border-l-white/10 border-b border-b-white/5 border-r border-r-white/5 rounded-full flex justify-between items-center px-1.5 z-[100] shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const isActive = currentMode === tab.mode;
          return (
            <button
              key={tab.mode}
              onClick={() => onSwitchMode(tab.mode)}
              className={`flex-1 flex items-center justify-center transition-all duration-300 relative ${
                isActive 
                  ? 'text-indigo-400 font-extrabold scale-105' 
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <div className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-2xl w-full max-w-[76px] transition-all duration-200 ${
                isActive 
                  ? 'bg-white/5 border border-white/5 shadow-inner' 
                  : 'border border-transparent'
              }`}>
                {tab.icon}
                <span className="text-[8px] uppercase tracking-wider font-extrabold leading-none mt-0.5">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
};
