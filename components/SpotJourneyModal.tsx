import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Trash2, ArrowLeft, ArrowRight, Target } from 'lucide-react';
import { WatchedSpot } from '../types';

interface SpotJourneyModalProps {
  label: string;
  spots: WatchedSpot[];
  onClose: () => void;
  onDeleteSpot: (id: string) => void;
}

const SpotJourneyModal: React.FC<SpotJourneyModalProps> = ({ label, spots, onClose, onDeleteSpot }) => {
  // Sort spots by date ascending
  const sortedSpots = [...spots].sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(sortedSpots.length - 1);
  const playInterval = useRef<number | null>(null);

  const togglePlay = () => {
    if (isPlaying) {
      if (playInterval.current) clearInterval(playInterval.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (currentIndex >= sortedSpots.length - 1) {
        setCurrentIndex(0);
      }
      playInterval.current = window.setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= sortedSpots.length - 1) {
            if (playInterval.current) clearInterval(playInterval.current);
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    }
  };

  useEffect(() => {
    return () => {
      if (playInterval.current) clearInterval(playInterval.current);
    };
  }, []);

  const currentSpot = sortedSpots[currentIndex];

  if (!currentSpot) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-stone-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-800">{label} Journey</h2>
            <p className="text-sm text-stone-500">{sortedSpots.length} records over time</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-stone-400 hover:text-stone-800 shadow-sm border border-stone-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Morph Viewer */}
          <div className="relative aspect-square max-w-md mx-auto bg-stone-900 rounded-2xl overflow-hidden shadow-inner mb-6">
            {sortedSpots.map((spot, idx) => (
              <img 
                key={spot.id}
                src={spot.imageCrop} 
                alt={`Spot ${idx}`} 
                className={`absolute inset-0 w-full h-full object-cover scale-150 transition-opacity duration-700 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} 
              />
            ))}
            
            {/* Crosshair Guide */}
            <div className="absolute inset-0 z-15 pointer-events-none flex items-center justify-center opacity-20">
              <div className="w-full h-[1px] bg-white/50" />
              <div className="absolute h-full w-[1px] bg-white/50" />
              <div className="absolute w-4 h-4 rounded-full border border-white/50" />
            </div>

            {/* Date Overlay */}
            <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs font-bold">
              {new Date(currentSpot.dateAdded).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>

            {/* Play Controls Overlay */}
            {sortedSpots.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <button 
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="text-white disabled:opacity-30 hover:text-sage-300 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                
                <button 
                  onClick={togglePlay}
                  className="w-10 h-10 bg-white text-stone-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-1" />}
                </button>
                
                <button 
                  onClick={() => setCurrentIndex(Math.min(sortedSpots.length - 1, currentIndex + 1))}
                  disabled={currentIndex === sortedSpots.length - 1}
                  className="text-white disabled:opacity-30 hover:text-sage-300 transition-colors"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Timeline Strip */}
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {sortedSpots.map((spot, idx) => (
              <div 
                key={spot.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  if (isPlaying) togglePlay();
                }}
                className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${idx === currentIndex ? 'border-sage-500 shadow-md scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={spot.imageCrop} className="w-full h-full object-cover scale-150" alt="Thumbnail" />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this spot record?")) {
                      onDeleteSpot(spot.id);
                      if (currentIndex >= sortedSpots.length - 1) {
                        setCurrentIndex(Math.max(0, sortedSpots.length - 2));
                      }
                    }
                  }}
                  className="absolute top-1 right-1 p-1 bg-white/90 text-stone-400 hover:text-red-500 rounded-md opacity-0 hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Spot Details */}
          <div className="mt-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <h3 className="text-sm font-bold text-stone-800 mb-2">Spot Details</h3>
            <div className="text-sm text-stone-600">
              {currentSpot.note ? (
                <p>{currentSpot.note}</p>
              ) : (
                <p className="italic opacity-50">No notes added for this record.</p>
              )}
            </div>
            {currentSpot.autoTrack && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-sage-100 text-sage-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                <Target size={12} /> Auto-Tracked
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotJourneyModal;
