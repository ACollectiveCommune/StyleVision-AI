import React, { useState, useEffect } from 'react';
import appIcon from '../assets/icon.jpg';

interface OnboardingViewProps {
  onComplete: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Steps flow: 0 = Welcome, 1 = Goal, 2 = Frequency, 3 = AI Customization loader
  const steps = [
    {
      title: "Welcome to StyleVision",
      subtitle: "Find your signature look with AI-powered hairstyle, beard, and outfit simulation.",
      question: "Ready to discover your style?",
      type: "welcome"
    },
    {
      title: "What is your main style goal?",
      subtitle: "We'll customize your AI presets based on what you want to focus on.",
      question: "Select your primary interest:",
      type: "options",
      key: "goal",
      options: [
        { id: "hair", label: "Hairstyles & Haircuts", icon: "💇‍♂️" },
        { id: "beard", label: "Beard & Grooming", icon: "🧔" },
        { id: "outfits", label: "Outfits & Fashion", icon: "👕" },
        { id: "aesthetic", label: "Complete Aesthetic Makeover", icon: "✨" }
      ]
    },
    {
      title: "How often do you change your look?",
      subtitle: "This helps us adjust how frequently we suggest new styles.",
      question: "Select your frequency:",
      type: "options",
      key: "frequency",
      options: [
        { id: "frequent", label: "Constantly trying new trends", icon: "📅" },
        { id: "seasonal", label: "Seasonally or for special events", icon: "🍁" },
        { id: "signature", label: "Looking for one permanent signature look", icon: "🔄" }
      ]
    },
    {
      title: "Creating Your Aesthetic Profile",
      subtitle: "Our AI is processing your answers to generate customized styling recommendations.",
      type: "loader"
    }
  ];

  // Handle option selection
  const handleSelectOption = (key: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [key]: optionId }));
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, 250); // slight delay for visual tap response
  };

  // Loader progress animation for the final step (Step 3)
  useEffect(() => {
    if (currentStep === 3) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              onComplete();
            }, 500);
            return 100;
          }
          return prev + 1;
        });
      }, 30); // ~3 seconds loader
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const activeStep = steps[currentStep];

  return (
    <div className="w-screen h-[100dvh] bg-black text-white flex flex-col justify-between p-6 relative overflow-hidden font-sans select-none">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-15%] w-[80%] h-[40%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[80%] h-[40%] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />

      {/* Top Header & Progress bar */}
      <div className="w-full flex flex-col space-y-4 pt-[calc(12px+env(safe-area-inset-top,20px))]">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">StyleVision AI</span>
          {currentStep < 3 && (
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
              Step {currentStep + 1} of 3
            </span>
          )}
        </div>
        
        {currentStep < 3 ? (
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
              style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
            />
          </div>
        ) : (
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all rounded-full"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center text-center max-w-sm mx-auto w-full my-auto px-2">
        {activeStep.type === "welcome" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
            <img 
              src={appIcon} 
              className="w-20 h-20 rounded-3xl object-cover shadow-2xl shadow-indigo-500/20 border border-white/10 mx-auto" 
              alt="StyleVision Logo" 
            />
            
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-indigo-100 to-neutral-400 bg-clip-text text-transparent">
                {activeStep.title}
              </h1>
              <p className="text-sm text-neutral-400 font-medium px-4">
                {activeStep.subtitle}
              </p>
            </div>
          </div>
        )}

        {activeStep.type === "options" && (
          <div className="w-full space-y-5 animate-in fade-in slide-in-from-bottom duration-400">
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight leading-tight">
                {activeStep.title}
              </h2>
              <p className="text-xs text-neutral-400 font-medium px-4">
                {activeStep.subtitle}
              </p>
            </div>

            <div className="w-full space-y-2.5 pt-2">
              {activeStep.options?.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(activeStep.key!, option.id)}
                  className="w-full rounded-2xl p-4 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 active:scale-[0.98] transition-all flex items-center gap-4 text-left"
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="text-sm font-bold text-white/95">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeStep.type === "loader" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
              <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin"></div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{loadingProgress}%</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight">{activeStep.title}</h2>
              <div className="text-xs text-neutral-400 font-medium px-6 h-6 flex items-center justify-center">
                {loadingProgress < 30 && <span className="animate-pulse">Analyzing style preferences...</span>}
                {loadingProgress >= 30 && loadingProgress < 65 && <span className="animate-pulse">Curating hairstyle catalog...</span>}
                {loadingProgress >= 65 && loadingProgress < 90 && <span className="animate-pulse">Optimizing outfit presets...</span>}
                {loadingProgress >= 90 && <span className="animate-pulse">Customizing your profile...</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="w-full pb-[calc(12px+env(safe-area-inset-bottom,20px))] max-w-sm mx-auto flex flex-col space-y-3">
        {activeStep.type === "welcome" && (
          <button
            onClick={() => setCurrentStep(1)}
            className="w-full py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-white/10 hover:bg-neutral-100"
          >
            Get Started
          </button>
        )}

        {currentStep > 0 && currentStep < 3 && (
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="w-full py-3 rounded-2xl bg-white/5 border border-white/5 text-neutral-400 font-bold text-[10px] uppercase tracking-wider transition-all active:scale-[0.98]"
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
};
