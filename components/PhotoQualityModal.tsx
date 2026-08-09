import React from 'react';

interface PhotoQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PhotoQualityModal: React.FC<PhotoQualityModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [dontShowAgain, setDontShowAgain] = React.useState(false);

  if (!isOpen) return null;

  const handleProceed = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_photo_guidelines', 'true');
    }
    onConfirm();
  };


  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl text-white overflow-hidden max-h-[90vh] flex flex-col justify-between">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Photo Guidelines</h3>
                <p className="text-[10px] text-neutral-400">For 100% realistic AI transformations</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Guidelines List */}
          <div className="space-y-2.5 my-3 overflow-y-auto no-scrollbar">
            <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl mt-0.5 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-neutral-200">Single Face Only</h4>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">Ensure only 1 person is in the photo. Group photos or pet photos will be rejected.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-xl mt-0.5 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-neutral-200">Good Front Lighting</h4>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">Use clear, front-lit lighting. Avoid heavy shadows, dark environments, or backlighting.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl mt-0.5 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-neutral-200">Straight Camera Angle</h4>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">Look directly at the camera. Extreme side angles or high overhead angles reduce quality.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-xl mt-0.5 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-neutral-200">Neutral Expression Recommended</h4>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">A relaxed, non-smiling face yields the crispest hairline, lip, and filler results.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="pt-2.5 border-t border-neutral-800/80 flex flex-col gap-2.5">
          <label className="flex items-center gap-2 cursor-pointer text-[10px] text-neutral-400 hover:text-neutral-300 select-none">
            <input 
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-800 text-yellow-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Don't show these tips again</span>
          </label>

          <button
            onClick={handleProceed}
            className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <span>Got It, Open Camera</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
