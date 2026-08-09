import React, { useEffect, useState } from 'react';
import { auth, fetchUserFavorites, deleteGeneration, toggleFavorite, SavedGeneration } from '../services/firebase';
import { Icons } from '../constants';
import { AESTHETIC_TREATMENTS } from '../constants/aesthetics';
import { AppState, AppMode, Gender } from '../types';
import { downloadOrShareImage } from '../services/shareService';

interface FavoritesViewProps {
  onLoadGeneration: (generation: SavedGeneration) => void;
  favorites: SavedGeneration[];
  loading: boolean;
  onRemoveFavorite: (docId: string) => Promise<void>;
  onDelete: (docId: string) => Promise<void>;
}

const formatStyleName = (id: string | undefined): string => {
  if (!id || id === 'original' || id === 'none') return 'Original';
  return id
    .replace(/^hair_/, '')
    .replace(/^beard_/, '')
    .replace(/^makeup_/, '')
    .replace(/^outfit_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onLoadGeneration,
  favorites,
  loading,
  onRemoveFavorite,
  onDelete
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tempShowOriginalId, setTempShowOriginalId] = useState<string | null>(null);
  
  // Selected creation for detailed specs modal inspection
  const [selectedItem, setSelectedItem] = useState<SavedGeneration | null>(null);
  const [modalShowOriginal, setModalShowOriginal] = useState(false);

  // States for bottom sheet parameters panel and delete workflow
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Prevent background scrolling when viewer is open
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsSpecsExpanded(false);
      setDeleteError(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedItem]);

  const handleRemoveFavorite = async (docId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await onRemoveFavorite(docId);
      if (selectedItem?.id === docId) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  const handleDeleteFavorite = async (docId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isDeleting) return;

    const confirmDelete = window.confirm("Are you sure you want to remove this photo from Favorites?");
    if (!confirmDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // In this app, Favorites are history entries with isFavorite = true.
      // Setting it to false (via onRemoveFavorite) is the correct update to
      // remove it from the Favorites tab while preserving the photo in their creations history.
      await onRemoveFavorite(docId);
      setSelectedItem(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      setDeleteError(err.message || "Failed to remove from Favorites. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = async (docId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await onDelete(docId);
      if (selectedItem?.id === docId) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Failed to delete generation:", err);
    }
  };

  const handleDownload = async (imageUrl: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await downloadOrShareImage(imageUrl);
  };

  if (loading) {
    return (
      <div id="favorites-view" className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 z-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3"></div>
        <p className="text-xs text-neutral-400 font-medium">Loading saved styles...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div id="favorites-view" className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 z-10 text-center space-y-4 pt-24 pb-36">
        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-600">
          <Icons.Heart />
        </div>
        <div className="space-y-1">
          <h2 className="text-md font-bold text-white">No Favorites Yet</h2>
          <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
            Generate hairstyle, beard, makeup, or aesthetic options and tap the heart icon to save them to your library.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="favorites-view" className="w-full flex flex-col pt-2">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-lg font-black tracking-wider bg-gradient-to-r from-indigo-200 via-purple-100 to-white bg-clip-text text-transparent uppercase font-sans">Saved Favorites</h1>
          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">Tap any photo to view applied styling specs</p>
        </div>
        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400 tracking-wider">
          {favorites.length} Saved
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {favorites.map((item) => {
          const isShowingOriginal = tempShowOriginalId === item.id;
          const displayImage = isShowingOriginal ? item.originalImageUrl : item.generatedImageUrl;
          const hasAesthetics = (item.treatments && item.treatments.length > 0) || !!item.customPrompt;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative flex flex-col bg-neutral-900/50 border border-white/5 hover:border-indigo-500/30 rounded-2xl overflow-hidden p-2 transition-all cursor-pointer active:scale-[0.99]"
              onMouseEnter={() => setHoveredId(item.id || null)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Photo Area */}
              <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-neutral-950 mb-2">
                <img
                  src={displayImage}
                  alt="Style preview"
                  className="w-full h-full object-cover transition-opacity duration-200"
                />

                {/* Badges Overlay */}
                {hasAesthetics && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-indigo-600/80 backdrop-blur-md text-[7.5px] font-black uppercase text-white tracking-widest border border-indigo-400/30 shadow-md">
                    Aesthetics
                  </div>
                )}

                {/* Compare / View Original Button */}
                <button
                  type="button"
                  onMouseDown={(e) => { e.stopPropagation(); setTempShowOriginalId(item.id || null); }}
                  onMouseUp={(e) => { e.stopPropagation(); setTempShowOriginalId(null); }}
                  onTouchStart={(e) => { e.stopPropagation(); setTempShowOriginalId(item.id || null); }}
                  onTouchEnd={(e) => { e.stopPropagation(); setTempShowOriginalId(null); }}
                  onMouseLeave={() => setTempShowOriginalId(null)}
                  className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-md"
                  title="Hold to view original"
                >
                  <Icons.Eye />
                </button>

                {/* Remove from Favorites Button */}
                <button
                  onClick={(e) => handleRemoveFavorite(item.id || '', e)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-400 active:scale-90 transition-transform shadow-md hover:bg-red-500/20"
                  title="Remove from favorites"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
              </div>

              {/* Summary Labels */}
              <div className="px-1 text-left">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">{item.gender}</span>
                  <span className="text-[8px] text-indigo-400 font-extrabold uppercase tracking-widest">Inspect Specs →</span>
                </div>
                <div className="text-[11px] font-semibold text-white/90 truncate">
                  {formatStyleName(item.hairStyle)} ({formatStyleName(item.hairColor)})
                </div>
                {item.gender === Gender.MALE && item.beardStyle && item.beardStyle !== 'original' && item.beardStyle !== 'none' && (
                  <div className="text-[9.5px] text-neutral-400 truncate mt-0.5">
                    Beard: {formatStyleName(item.beardStyle)}
                  </div>
                )}
                {item.makeup && item.makeup !== 'original' && item.makeup !== 'none' && (
                  <div className="text-[9.5px] text-pink-400/90 truncate mt-0.5 font-medium">
                    💄 {formatStyleName(item.makeup)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- DETAILED STYLE INSPECTOR MODAL --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-[95] bg-black flex flex-col justify-between animate-in fade-in duration-300 select-none">
          
          {/* Close button floating at the top-right, respecting safe areas */}
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-[calc(16px+env(safe-area-inset-top,20px))] right-6 z-[140] w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
            title="Close viewer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Full Screen Image Container (Preserves Aspect Ratio, Max Size, Black Background) */}
          <div className="flex-1 flex items-center justify-center w-full h-full p-4 bg-black">
            <div className="relative max-w-full max-h-[80vh] w-auto h-auto flex items-center justify-center">
              <img
                src={modalShowOriginal ? selectedItem.originalImageUrl : selectedItem.generatedImageUrl}
                alt="Saved creation preview"
                className="max-w-full max-h-[70vh] w-auto h-auto object-contain rounded-2xl shadow-2xl"
              />

              {/* Hold to Compare floating button */}
              <button
                type="button"
                onMouseDown={() => setModalShowOriginal(true)}
                onMouseUp={() => setModalShowOriginal(false)}
                onTouchStart={() => setModalShowOriginal(true)}
                onTouchEnd={() => setModalShowOriginal(false)}
                onMouseLeave={() => setModalShowOriginal(false)}
                className="absolute bottom-4 left-4 px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-white active:scale-95 transition-transform shadow-lg"
              >
                <Icons.Eye />
                <span>{modalShowOriginal ? "Original" : "Hold to Compare"}</span>
              </button>
            </div>
          </div>

          {/* Floating Collapsible bottom sheet for Applied Parameters (Placed above Bottom Navigation) */}
          <div 
            className={`absolute left-1/2 transform -translate-x-1/2 w-[94%] max-w-md bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-[24px] transition-all duration-300 ease-out flex flex-col z-[96] ${
              isSpecsExpanded ? 'max-h-[48vh] p-2' : 'max-h-[56px] py-1.5 px-2'
            }`}
            style={{
              bottom: 'calc(4.8rem + env(safe-area-inset-bottom, 0px))'
            }}
          >
            {/* Header toggle handle with Delete button */}
            <div className="flex items-center justify-between w-full px-4 py-2.5 border-b border-white/5">
              <div 
                onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
                className="flex-1 flex items-center gap-2 cursor-pointer select-none"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300">
                  Applied Parameters
                </span>
                <svg 
                  className={`w-3 h-3 text-neutral-400 transition-transform duration-300 ${isSpecsExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth="3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Trash option: Delete from Favorites */}
              <button
                disabled={isDeleting}
                onClick={(e) => handleDeleteFavorite(selectedItem.id || '', e)}
                className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider shadow-sm"
                title="Delete from Favorites"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-400"></div>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    <span className="hidden sm:inline">Delete</span>
                  </>
                )}
              </button>
            </div>

            {/* Scrollable Content inside expanded panel */}
            <div className={`overflow-y-auto no-scrollbar px-4 transition-all duration-300 ${
              isSpecsExpanded ? 'opacity-100 max-h-[35vh] py-3' : 'opacity-0 max-h-0 pointer-events-none'
            }`}>
              <div className="grid grid-cols-2 gap-2 text-left">
                {/* Hair Style */}
                {selectedItem.hairStyle && selectedItem.hairStyle !== 'original' && selectedItem.hairStyle !== 'none' && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col space-y-0.5">
                    <span className="text-[7.5px] font-black uppercase text-neutral-500 tracking-wider">Hairstyle</span>
                    <span className="text-[11px] font-extrabold text-white truncate">{formatStyleName(selectedItem.hairStyle)}</span>
                  </div>
                )}

                {/* Hair Color */}
                {selectedItem.hairColor && selectedItem.hairColor !== 'original' && selectedItem.hairColor !== 'none' && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col space-y-0.5">
                    <span className="text-[7.5px] font-black uppercase text-neutral-500 tracking-wider">Hair Color</span>
                    <span className="text-[11px] font-extrabold text-white truncate">{formatStyleName(selectedItem.hairColor)}</span>
                  </div>
                )}

                {/* Beard Style */}
                {selectedItem.gender === Gender.MALE && selectedItem.beardStyle && selectedItem.beardStyle !== 'original' && selectedItem.beardStyle !== 'none' && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col space-y-0.5">
                    <span className="text-[7.5px] font-black uppercase text-neutral-500 tracking-wider">Beard Style</span>
                    <span className="text-[11px] font-extrabold text-white truncate">{formatStyleName(selectedItem.beardStyle)}</span>
                  </div>
                )}

                {/* Beard Color */}
                {selectedItem.gender === Gender.MALE && selectedItem.beardColor && selectedItem.beardColor !== 'original' && selectedItem.beardColor !== 'none' && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col space-y-0.5">
                    <span className="text-[7.5px] font-black uppercase text-neutral-500 tracking-wider">Beard Color</span>
                    <span className="text-[11px] font-extrabold text-white truncate">{formatStyleName(selectedItem.beardColor)}</span>
                  </div>
                )}

                {/* Makeup Style */}
                {selectedItem.makeup && selectedItem.makeup !== 'original' && selectedItem.makeup !== 'none' && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col space-y-0.5">
                    <span className="text-[7.5px] font-black uppercase text-pink-400 tracking-wider">Makeup Style</span>
                    <span className="text-[11px] font-extrabold text-white truncate">{formatStyleName(selectedItem.makeup)}</span>
                  </div>
                )}

                {/* Outfit Style */}
                {selectedItem.outfit && selectedItem.outfit !== 'original' && selectedItem.outfit !== 'none' && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col space-y-0.5">
                    <span className="text-[7.5px] font-black uppercase text-indigo-400 tracking-wider">Outfit</span>
                    <span className="text-[11px] font-extrabold text-white truncate">{formatStyleName(selectedItem.outfit)}</span>
                  </div>
                )}

                {/* Aesthetic Enhancements */}
                {selectedItem.treatments && selectedItem.treatments.length > 0 && (
                  <div className="col-span-2 p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/15 flex flex-col space-y-2 text-left mt-1">
                    <span className="text-[8px] font-black uppercase text-indigo-300 tracking-wider">Aesthetic Enhancements</span>
                    <div className="flex flex-col space-y-1.5">
                      {selectedItem.treatments.map((t, idx) => {
                        const fullTreat = AESTHETIC_TREATMENTS.find(item => item.id === t.treatmentId);
                        const labelName = fullTreat ? fullTreat.label : t.treatmentId;
                        return (
                          <div key={idx} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1 last:border-0 last:pb-0">
                            <span className="text-neutral-400 font-medium">{labelName}</span>
                            <span className="text-white font-extrabold">{t.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedItem.customPrompt && (
                  <div className="col-span-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-neutral-300 italic text-left mt-1">
                    "{selectedItem.customPrompt}"
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    onLoadGeneration(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[9px] font-black uppercase tracking-widest text-white active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-1.5"
                >
                  <span>Load in Editor</span>
                </button>

                <button
                  onClick={(e) => handleDownload(selectedItem.generatedImageUrl, e)}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform hover:bg-white/10"
                  title="Download photo"
                >
                  <Icons.Download />
                </button>
              </div>

              {deleteError && (
                <div className="mt-2.5 text-center text-[9.5px] font-bold text-red-400 leading-normal">
                  {deleteError}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
