import React, { useEffect, useState } from 'react';
import { auth, fetchUserFavorites, deleteGeneration, toggleFavorite, SavedGeneration } from '../services/firebase';
import { Icons } from '../constants';
import { AppState, AppMode, Gender } from '../types';

interface FavoritesViewProps {
  onLoadGeneration: (generation: SavedGeneration) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ onLoadGeneration }) => {
  const [favorites, setFavorites] = useState<SavedGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tempShowOriginalId, setTempShowOriginalId] = useState<string | null>(null);

  const loadFavorites = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError("Please sign in to view your favorites.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchUserFavorites(user.uid);
      setFavorites(data);
    } catch (err: any) {
      console.error("Error loading favorites:", err);
      setError("Failed to load favorites.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemoveFavorite = async (docId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await toggleFavorite(user.uid, docId, false);
      setFavorites(prev => prev.filter(item => item.id !== docId));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  const handleDelete = async (docId: string) => {
    const user = auth.currentUser;
    if (!user || !window.confirm("Are you sure you want to delete this styling preview?")) return;
    try {
      await deleteGeneration(user.uid, docId);
      setFavorites(prev => prev.filter(item => item.id !== docId));
    } catch (err) {
      console.error("Failed to delete generation:", err);
    }
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div id="favorites-view" className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 z-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3"></div>
        <p className="text-xs text-neutral-400 font-medium">Loading saved styles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div id="favorites-view" className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 z-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-md font-bold text-white">Something went wrong</h2>
        <p className="text-xs text-neutral-400 max-w-xs">{error}</p>
        <button onClick={loadFavorites} className="px-5 py-2 bg-indigo-600 rounded-xl text-xs font-bold uppercase tracking-wider text-white">Retry</button>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div id="favorites-view" className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 z-10 text-center space-y-4 pt-24 pb-28">
        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-600">
          <Icons.Heart />
        </div>
        <div className="space-y-1">
          <h2 className="text-md font-bold text-white">No Favorites Yet</h2>
          <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
            Generate hairstyle and beard options in the editor and click the heart icon to save them to your library.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="favorites-view" className="absolute inset-0 bg-neutral-950 flex flex-col overflow-y-auto no-scrollbar z-10 p-6 pt-24 pb-28">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-white">Saved Favorites</h1>
        <p className="text-xs text-neutral-400">View and manage your styling try-ons</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {favorites.map((item) => {
          const isShowingOriginal = tempShowOriginalId === item.id;
          const displayImage = isShowingOriginal ? item.originalImageUrl : item.generatedImageUrl;

          return (
            <div
              key={item.id}
              className="group relative flex flex-col bg-neutral-900/50 border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden p-2 transition-all"
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

                {/* Compare / View Original Button (Hold to View) */}
                <button
                  type="button"
                  onMouseDown={() => setTempShowOriginalId(item.id || null)}
                  onMouseUp={() => setTempShowOriginalId(null)}
                  onTouchStart={() => setTempShowOriginalId(item.id || null)}
                  onTouchEnd={() => setTempShowOriginalId(null)}
                  onMouseLeave={() => setTempShowOriginalId(null)}
                  className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-md"
                  title="Hold to view original"
                >
                  <Icons.Eye />
                </button>

                {/* Remove from Favorites Button */}
                <button
                  onClick={() => handleRemoveFavorite(item.id || '')}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-400 active:scale-90 transition-transform shadow-md"
                  title="Remove from favorites"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>

                {/* Overlay Action Panel */}
                <div className={`absolute inset-x-2 bottom-2 z-20 flex gap-2 justify-center transition-all duration-300 ${hoveredId === item.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                  <button
                    onClick={() => onLoadGeneration(item)}
                    className="flex-grow py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider shadow-md text-center active:scale-95 transition-transform"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDownload(item.generatedImageUrl, `StyleVision_${item.id}.jpg`)}
                    className="w-8 h-8 rounded-lg bg-neutral-900/90 border border-white/15 flex items-center justify-center text-white active:scale-95 transition-transform"
                  >
                    <Icons.Download />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id || '')}
                    className="w-8 h-8 rounded-lg bg-red-600/90 hover:bg-red-500 border border-red-500/10 flex items-center justify-center text-white active:scale-95 transition-transform"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Labels */}
              <div className="px-1 text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{item.gender}</span>
                </div>
                <div className="text-[11px] font-semibold text-white/90 truncate">
                  {item.hairStyle === 'original' ? 'Original Hair' : item.hairStyle} ({item.hairColor})
                </div>
                {item.gender === Gender.MALE && item.beardStyle !== 'original' && (
                  <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                    Beard: {item.beardStyle} ({item.beardColor})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
