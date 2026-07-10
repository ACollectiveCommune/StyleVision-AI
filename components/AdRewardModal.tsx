import React, { useState, useEffect } from 'react';

interface AdRewardModalProps {
  onAdCompleted: () => void;
  onClose: () => void;
}

export const AdRewardModal: React.FC<AdRewardModalProps> = ({ onAdCompleted, onClose }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isAdFinished, setIsAdFinished] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      setIsAdFinished(true);
      setProgress(100);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        const nextSec = prev - 1;
        setProgress(((15 - nextSec) / 15) * 100);
        return nextSec;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const handleClaim = () => {
    onAdCompleted();
  };

  return (
    <div id="ad-reward-modal" className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/95 p-6 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Cinematic Blur Background elements */}
      <div className="absolute top-1/4 left-1/4 w-[160px] h-[160px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[160px] h-[160px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Theater Box */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center space-y-8 text-center animate-in zoom-in-95 duration-300">
        
        {/* Ad Video Window Mockup */}
        <div className="relative w-full aspect-[9/16] max-h-[460px] rounded-3xl overflow-hidden border border-white/10 bg-neutral-950 shadow-2xl flex flex-col items-center justify-center p-6">
          
          {/* Simulated Video Content */}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 flex flex-col items-center justify-center p-6 text-center space-y-6">
            
            {/* Spinning Virtual Model Placeholder */}
            <div className="w-28 h-28 rounded-full border border-indigo-500/20 flex items-center justify-center relative bg-indigo-500/5">
              
              {/* Outer Progress Ring */}
              <svg className="w-full h-full transform -rotate-90 absolute">
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  className="stroke-white/5"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  className="stroke-indigo-500 transition-all duration-1000"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - progress / 100)}
                  strokeLinecap="round"
                />
              </svg>

              {/* Central counter */}
              {!isAdFinished ? (
                <div className="flex flex-col items-center justify-center space-y-0.5">
                  <span className="text-2xl font-black text-white">{secondsRemaining}</span>
                  <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-widest">sec</span>
                </div>
              ) : (
                <div className="flex items-center justify-center text-yellow-400 animate-bounce">
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Video ad Pitch Text */}
            <div className="space-y-2 px-4 z-10">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                Sponsor Showcase
              </h4>
              <h3 className="text-sm font-extrabold text-white leading-snug">
                Try 3D Virtual Try-Ons with Premium Models
              </h3>
              <p className="text-[10px] text-neutral-400 leading-normal">
                Unlock instant hairstyles, hair coloring options, and precision facial hair filters with our prompt sandbox.
              </p>
            </div>
            
            {/* Warning indicator */}
            {!isAdFinished && (
              <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest animate-pulse z-10">
                Reward in progress... Do not close.
              </div>
            )}

          </div>

          {/* Close button (only visible when countdown finished, or if they forfeit) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            title={isAdFinished ? "Close" : "Forfeit Reward"}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

        </div>

        {/* Claim card at the bottom */}
        {isAdFinished && (
          <div className="w-full bg-neutral-900/90 border border-yellow-500/20 p-5 rounded-3xl flex flex-col items-center space-y-4 animate-in slide-in-from-bottom duration-500">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-yellow-400 uppercase tracking-widest">
                Reward Unlocked!
              </h3>
              <p className="text-[11px] text-neutral-300">
                You earned 1 free generation credit.
              </p>
            </div>
            <button
              onClick={handleClaim}
              className="w-full py-3 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-yellow-500/20"
            >
              Claim Reward
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
