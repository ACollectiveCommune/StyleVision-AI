import React, { useState, useRef, useEffect } from 'react';
import { AppState, SelectedTreatment, AppMode } from '../types';
import { AESTHETIC_TREATMENTS, AestheticTreatment } from '../constants/aesthetics';
import { Icons } from '../constants';

const getPreviewConfig = (treatmentId: string) => {
  const treat = AESTHETIC_TREATMENTS.find(t => t.id === treatmentId);
  const maxVal = treat ? Math.max(...treat.steps.map(s => s.value)) : 1.0;

  switch (treatmentId) {
    case 'lip_filler':
    case 'lip_flip':
      return {
        source: '/presets/aesthetics/female_lip_filler.jpg',
        position: '50% 68%',
        zoom: 'scale-[2.4]',
        maxVal
      };
    case 'cheek_filler':
    case 'jaw_contour':
    case 'masseter_botox':
      return {
        source: '/presets/aesthetics/female_cheek_jaw_filler.jpg',
        position: '68% 62%',
        zoom: 'scale-[2.0]',
        maxVal
      };
    case 'chin_filler':
      return {
        source: '/presets/aesthetics/female_cheek_jaw_filler.jpg',
        position: '50% 82%',
        zoom: 'scale-[2.2]',
        maxVal
      };
    case 'nose_enhancement':
      return {
        source: '/presets/aesthetics/female_cheek_jaw_filler.jpg',
        position: '50% 48%',
        zoom: 'scale-[2.6]',
        maxVal
      };
    case 'botox_forehead':
    case 'botox_frown':
    case 'brow_lift':
    case 'temple_filler':
      return {
        source: '/presets/aesthetics/female_botox.jpg',
        position: '50% 24%',
        zoom: 'scale-[2.0]',
        maxVal
      };
    case 'botox_crow':
    case 'undereye_filler':
      return {
        source: '/presets/aesthetics/female_botox.jpg',
        position: '62% 40%',
        zoom: 'scale-[2.3]',
        maxVal
      };
    default:
      // Skin categories
      return {
        source: '/presets/aesthetics/female_skin_glow.jpg',
        position: '62% 52%',
        zoom: 'scale-[1.8]',
        maxVal
      };
  }
};

interface AestheticsViewProps {
  appState: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  uid: string;
  onTriggerAd?: () => void;
  onUploadClick: () => void;
  onGenerateImage: () => Promise<void>;
  onSaveResult: (generatedSrc: string) => void;
}

const PreviewCard: React.FC<{
  sel: SelectedTreatment;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
}> = ({ sel, onRemove, onEdit }) => {
  const treat = AESTHETIC_TREATMENTS.find(t => t.id === sel.treatmentId);
  if (!treat) return null;
  
  const config = getPreviewConfig(sel.treatmentId);
  const opacityVal = Math.min(1.0, Math.max(0.15, Math.pow(sel.value / config.maxVal, 0.75)));
  
  return (
    <div 
      onClick={() => onEdit(sel.treatmentId)}
      className="flex-shrink-0 w-[190px] bg-neutral-900/90 hover:bg-neutral-800/90 border border-white/10 hover:border-indigo-500/30 rounded-2xl p-2 flex gap-2.5 items-center cursor-pointer transition-all duration-300 relative group"
    >
      {/* Cropped Before/After visualizer container */}
      <div className="flex gap-1 flex-shrink-0">
        
        {/* Before Cropped Image */}
        <div className="w-11 h-11 rounded-lg overflow-hidden relative bg-neutral-950 border border-white/5">
          <img 
            src="/presets/female_makeup_natural.jpg" 
            alt="Before" 
            className={`absolute w-full h-full object-cover origin-center ${config.zoom}`}
            style={{ objectPosition: config.position }}
          />
          <div className="absolute bottom-0.5 left-0.5 bg-black/75 px-1 rounded text-[5px] font-black uppercase text-white/50">
            Pre
          </div>
        </div>
        
        {/* After Cropped Image with Dynamic Blending */}
        <div className="w-11 h-11 rounded-lg overflow-hidden relative bg-neutral-950 border border-white/5">
          {/* Base Image */}
          <img 
            src="/presets/female_makeup_natural.jpg" 
            alt="Base" 
            className={`absolute w-full h-full object-cover origin-center ${config.zoom}`}
            style={{ objectPosition: config.position }}
          />
          {/* Enhanced Layer */}
          <img 
            src={config.source} 
            alt="After" 
            className={`absolute w-full h-full object-cover origin-center ${config.zoom}`}
            style={{ 
              objectPosition: config.position,
              opacity: opacityVal 
            }}
          />
          <div className="absolute bottom-0.5 right-0.5 bg-indigo-600 px-1 rounded text-[5px] font-black uppercase text-white">
            Post
          </div>
        </div>
        
      </div>

      {/* Text information */}
      <div className="flex flex-col text-left justify-center min-w-0 flex-1">
        <span className="text-[8px] font-black text-white leading-tight truncate">
          {treat.label}
        </span>
        <span className="text-[8px] font-extrabold text-indigo-400 uppercase tracking-wider mt-0.5">
          {sel.label}
        </span>
        <span className="text-[6px] text-neutral-500 font-semibold mt-0.5 truncate">
          Tap to adjust
        </span>
      </div>

      {/* Delete button absolute floating */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(sel.treatmentId);
        }}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-950/90 hover:bg-red-900 border border-red-500/30 text-red-400 hover:text-red-200 text-[8px] font-black flex items-center justify-center transition-all shadow-md z-10"
        title="Remove Treatment"
      >
        ✕
      </button>

    </div>
  );
};

interface TreatmentDetailModalProps {
  treatment: AestheticTreatment;
  activeSelections: SelectedTreatment[];
  onClose: () => void;
  onSave: (value: number, label: string) => void;
}

const TreatmentDetailModal: React.FC<TreatmentDetailModalProps> = ({
  treatment,
  activeSelections,
  onClose,
  onSave
}) => {
  const activeSel = activeSelections.find((s) => s.treatmentId === treatment.id);
  const currentValue = activeSel ? activeSel.value : 0;
  const activeStepIdx = treatment.steps.findIndex(s => s.value === currentValue);
  const currentStepIdx = activeStepIdx > -1 ? activeStepIdx : 0;

  const [sliderValIdx, setSliderValIdx] = useState(currentStepIdx);

  useEffect(() => {
    setSliderValIdx(currentStepIdx);
  }, [treatment.id, currentStepIdx]);

  const activeStep = treatment.steps[sliderValIdx];

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-white/10 p-6 flex flex-col space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="text-left">
            <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest">
              {treatment.category.toUpperCase()}
            </span>
            <h3 className="text-lg font-black text-white">{treatment.label}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Description Card */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 text-left space-y-2">
          <p className="text-[10px] text-neutral-300 leading-normal">{treatment.shortDesc}</p>
          <div className="pt-2 border-t border-white/5 flex flex-col space-y-0.5">
            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Common Areas</span>
            <span className="text-[9px] text-neutral-400 font-semibold">{treatment.commonAreas}</span>
          </div>
        </div>



        {/* Dynamic Slider controls */}
        <div className="flex flex-col space-y-3 py-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Simulated Level</span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/[0.04] border border-indigo-500/10 text-indigo-300 text-[9px] font-black uppercase tracking-wider">
              {activeStep.label}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max={treatment.steps.length - 1}
            step="1"
            value={sliderValIdx}
            onChange={(e) => setSliderValIdx(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          {/* Steps indicator tags */}
          <div className="flex justify-between text-[8px] font-black uppercase text-neutral-500 px-1.5">
            {treatment.steps.map((step, idx) => (
              <span 
                key={idx} 
                className={`transition-colors duration-200 ${idx === sliderValIdx ? 'text-white' : ''}`}
              >
                {step.label.replace(' mL', '').replace(' Units', '')}
              </span>
            ))}
          </div>
        </div>

        {/* Prompt description preview */}
        <div className="h-[60px] p-3 bg-neutral-950/40 border border-white/[0.03] rounded-2xl text-left flex flex-col justify-center overflow-hidden">
          <span className="text-[7.5px] font-bold text-neutral-500 uppercase tracking-widest block mb-0.5">AI Visualization Detail</span>
          <p className="text-[9px] italic text-neutral-400 leading-tight line-clamp-2">
            "{activeStep.value === 0 ? "Keeps original face structure." : activeStep.promptDesc}"
          </p>
        </div>

        {/* Legal Warning Notice */}
        <div className="flex gap-2 items-start text-left bg-yellow-500/[0.02] border border-yellow-500/5 p-3 rounded-2xl">
          <svg className="w-3.5 h-3.5 text-yellow-500/80 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[8px] text-yellow-500/70 font-semibold leading-normal">
            {treatment.disclaimer}
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={() => onSave(activeStep.value, activeStep.label)}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all font-extrabold text-[10px] uppercase tracking-widest text-white shadow-lg"
        >
          Apply to Consultation
        </button>
      </div>
    </div>
  );
};

export const AestheticsView: React.FC<AestheticsViewProps> = ({
  appState,
  onUpdateState,
  uid,
  onTriggerAd,
  onUploadClick,
  onGenerateImage,
  onSaveResult
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'filler' | 'botox' | 'skin'>('all');
  const [selectedTreatmentForEdit, setSelectedTreatmentForEdit] = useState<AestheticTreatment | null>(null);
  const [localSelections, setLocalSelections] = useState<SelectedTreatment[]>(
    appState.selectedTreatments || []
  );
  const [aestheticsScrolled, setAestheticsScrolled] = useState(false);

  // Sync external state updates if needed
  useEffect(() => {
    if (appState.selectedTreatments) {
      setLocalSelections(appState.selectedTreatments);
    }
  }, [appState.selectedTreatments]);

  // Filter treatments based on active tab category
  const filteredTreatments = AESTHETIC_TREATMENTS.filter(
    (t) => activeTab === 'all' || t.category === activeTab
  );

  const getActiveIntensityLabel = (treatmentId: string): string | null => {
    const found = localSelections.find((s) => s.treatmentId === treatmentId);
    return found && found.value > 0 ? found.label : null;
  };

  const handleOpenEdit = (treatment: AestheticTreatment) => {
    setSelectedTreatmentForEdit(treatment);
  };

  const handleSaveTreatmentValue = (value: number, label: string) => {
    if (!selectedTreatmentForEdit) return;
    
    let updated: SelectedTreatment[];
    if (value === 0) {
      // Remove from list if intensity is set to "Natural / 0"
      updated = localSelections.filter(
        (s) => s.treatmentId !== selectedTreatmentForEdit.id
      );
    } else {
      const existingIdx = localSelections.findIndex(
        (s) => s.treatmentId === selectedTreatmentForEdit.id
      );
      const newSel: SelectedTreatment = {
        treatmentId: selectedTreatmentForEdit.id,
        value,
        label
      };
      
      if (existingIdx > -1) {
        updated = [...localSelections];
        updated[existingIdx] = newSel;
      } else {
        updated = [...localSelections, newSel];
      }
    }

    setLocalSelections(updated);
    onUpdateState({ selectedTreatments: updated });
    setSelectedTreatmentForEdit(null);
  };

  const handleRemoveSelection = (treatmentId: string) => {
    const updated = localSelections.filter((s) => s.treatmentId !== treatmentId);
    setLocalSelections(updated);
    onUpdateState({ selectedTreatments: updated });
  };

  const handleResetAll = () => {
    setLocalSelections([]);
    onUpdateState({ selectedTreatments: [] });
  };

  const triggerGeneration = async () => {
    if (!appState.originalImage) {
      alert("Please upload or capture a portrait selfie first.");
      return;
    }
    if (localSelections.length === 0) {
      alert("Please select at least one treatment option to visualize.");
      return;
    }
    
    try {
      await onGenerateImage();
    } catch (err: any) {
      alert(err.message || "Aesthetics generation failed.");
    }
  };

  const handleResetPreview = () => {
    onUpdateState({ currentImage: null });
  };

  const handleSaveCreations = () => {
    if (appState.currentImage) {
      onSaveResult(appState.currentImage);
      alert("Creations saved successfully to your gallery!");
    }
  };



  // Input Selection Screen (Grid of Categories & Selection summaries)
  return (
    <div className="absolute inset-0 bg-neutral-950 flex flex-col pb-0 pt-0 overflow-hidden z-10">
      
      {/* Scrollable Content Container */}
      <div 
        className="flex-1 overflow-y-auto no-scrollbar pb-36"
        onScroll={(e) => setAestheticsScrolled(e.currentTarget.scrollTop > 10)}
      >
        {/* Sticky Header wrapper */}
        <div className={`sticky top-0 z-20 bg-neutral-950/80 backdrop-blur-md px-6 pt-[calc(16px+env(safe-area-inset-top,20px))] pb-5 border-b transition-all duration-300 ${
          aestheticsScrolled ? 'border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' : 'border-transparent shadow-none'
        }`}>
          {/* Category Sorting Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: 'all' as const, label: 'All Treatments' },
              { id: 'filler' as const, label: 'Dermal Fillers' },
              { id: 'botox' as const, label: 'Botox / Tox' },
              { id: 'skin' as const, label: 'Skin Solutions' }
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex-shrink-0 active:scale-95 ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : 'bg-white/[0.02] border border-white/[0.05] text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable items wrapper */}
        <div className="mt-7">
          {/* Linked Portrait Header Bar */}
          {appState.originalImage ? (
            <div className="mx-6 mb-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3 flex justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-11 rounded-lg overflow-hidden border border-white/10 bg-neutral-900 flex-shrink-0">
                  <img src={appState.originalImage} alt="Your Face" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider text-white">Your Portrait Linked</span>
                  <span className="text-[7px] text-neutral-400 font-semibold mt-0.5">Ready for aesthetics simulation</span>
                </div>
              </div>
              <button 
                onClick={onUploadClick}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[8px] font-black uppercase tracking-widest text-white transition-all active:scale-95"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="mx-6 mb-5 bg-indigo-600/[0.03] border border-indigo-500/10 rounded-2xl p-3 flex justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-11 rounded-lg bg-neutral-900 border border-indigo-500/20 border-dashed flex items-center justify-center text-indigo-400/50 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider text-white">No Portrait Linked</span>
                  <span className="text-[7px] text-neutral-400 font-semibold mt-0.5">Upload a photo to visualize</span>
                </div>
              </div>
              <button 
                onClick={onUploadClick}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-[8px] font-black uppercase tracking-widest text-white transition-all active:scale-95"
              >
                Upload
              </button>
            </div>
          )}

          {/* Active Treatments Scroll Gallery */}
          {localSelections.length > 0 && (
            <div className="mx-6 mb-5 flex flex-col space-y-2 text-left bg-white/[0.02] border border-white/[0.05] rounded-3xl p-3.5 flex-shrink-0 animate-in fade-in duration-300">
              <div className="flex justify-between items-center px-1">
                <span className="text-[8px] font-black uppercase text-neutral-400 tracking-wider">Aesthetics Plan ({localSelections.length})</span>
                <button
                  onClick={handleResetAll}
                  className="text-[8px] font-black uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
                >
                  Reset Plan
                </button>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-3 py-1 scroll-smooth">
                {localSelections.map((sel) => (
                  <PreviewCard 
                    key={sel.treatmentId} 
                    sel={sel} 
                    onRemove={handleRemoveSelection}
                    onEdit={(id) => {
                      const treat = AESTHETIC_TREATMENTS.find(t => t.id === id);
                      if (treat) setSelectedTreatmentForEdit(treat);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* disclaimer info banner */}
          <div className="px-6 mb-4 text-left">
        <div className="p-3 bg-indigo-950/[0.04] border border-indigo-500/10 rounded-2xl flex gap-2.5 items-start">
          <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider">Aesthetics Simulator Disclaimer</span>
            <p className="text-[9px] text-neutral-400 font-semibold leading-relaxed">
              These simulations are visual estimations for layout visualization only. They do not constitute medical consultation, diagnosis, dosage recommendations, or surgical pricing advice.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Treatments */}
      <div className="px-6 flex-grow grid grid-cols-2 gap-3.5 pb-44">
        {filteredTreatments.map((treat) => {
          const activeLabel = getActiveIntensityLabel(treat.id);
          const isSelected = activeLabel !== null;
          const treatConfig = getPreviewConfig(treat.id);
          
          return (
            <button
              key={treat.id}
              onClick={() => handleOpenEdit(treat)}
              className={`group relative flex flex-col bg-neutral-900/40 hover:bg-neutral-900/70 border rounded-3xl overflow-hidden p-2.5 transition-all text-left ${
                isSelected 
                  ? 'border-indigo-500/40 bg-indigo-950/5 shadow-[0_4px_16px_rgba(99,102,241,0.05)]' 
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              {/* Visual Cropped Preview container */}
              <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-950 mb-3 border border-white/5">
                <img 
                  src={treatConfig.source} 
                  alt={treat.label}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${treatConfig.zoom}`}
                  style={{ objectPosition: treatConfig.position }}
                />
                {/* Category Indicator Tag */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[6px] font-black uppercase text-neutral-400 tracking-wider">
                  {treat.category}
                </div>
                
                {/* Active Level overlay */}
                {isSelected && (
                  <div className="absolute bottom-2 right-2 bg-indigo-600 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider text-white shadow-md">
                    {activeLabel}
                  </div>
                )}
              </div>

              {/* Text info */}
              <div className="px-1 flex flex-col justify-between flex-1">
                <span className="text-[10px] font-black text-white leading-tight group-hover:text-indigo-400 transition-colors">
                  {treat.label}
                </span>
                <p className="text-[8px] text-neutral-500 font-semibold leading-relaxed mt-1">
                  {treat.shortDesc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      
      </div>
      
      </div>

      {/* Floating Action Button (Bottom) */}
      {appState.originalImage && (
        <div className="fixed bottom-[calc(5.1rem+env(safe-area-inset-bottom,0px))] left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm z-[110] shadow-[0_8px_32px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-5 duration-300">
          <button
            onClick={triggerGeneration}
            disabled={appState.isProcessing}
            className={`w-full py-4 rounded-3xl font-extrabold text-[10px] uppercase tracking-widest text-white flex items-center justify-center gap-2 border border-white/10 backdrop-blur-md transition-all active:scale-[0.98] ${
              appState.isProcessing
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border-white/5'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/20'
            }`}
          >
            {appState.isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                <span>Simulating Aesthetics...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>✨ Generate Aesthetics {localSelections.length > 0 ? `(${localSelections.length} Applied)` : ''}</span>
              </div>
            )}
          </button>
          {!appState.isProcessing && (
            <div className="w-full text-center mt-1.5">
              <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">
                Costs 2 Credits
              </span>
            </div>
          )}
        </div>
      )}

      {selectedTreatmentForEdit && (
        <TreatmentDetailModal
          treatment={selectedTreatmentForEdit}
          activeSelections={localSelections}
          onClose={() => setSelectedTreatmentForEdit(null)}
          onSave={handleSaveTreatmentValue}
        />
      )}

    </div>
  );
};
