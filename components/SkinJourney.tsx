
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, TrendingUp, History, AlertTriangle, ChevronRight, Activity, Trash2, Play, Pause, Rewind, LogOut } from 'lucide-react';
import { SavedScan, UserProfile } from '../types';
import { getAllScans, deleteScan } from '../services/storageService';
import CompareSlider from './CompareSlider';

interface SkinJourneyProps {
  user: UserProfile;
  onBack: () => void;
  onLogout: () => void;
  onViewReport: (scan: SavedScan) => void;
}

const SkinJourney: React.FC<SkinJourneyProps> = ({ user, onBack, onLogout, onViewReport }) => {
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection state for comparison
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [compareScanId, setCompareScanId] = useState<string | null>(null);

  // Time Travel / Morph State
  const [isPlayingMorph, setIsPlayingMorph] = useState(false);
  const [morphIndex, setMorphIndex] = useState(0);
  const morphInterval = useRef<number | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await getAllScans();
      // Sort oldest to newest for morph
      const sorted = history.sort((a, b) => a.timestamp - b.timestamp);
      setScans(sorted);
      
      if (sorted.length > 0) {
        // Default: Newest as selected, Oldest as compare
        setSelectedScanId(sorted[sorted.length - 1].id); 
        if (sorted.length > 1) {
             setCompareScanId(sorted[0].id); 
        }
      }
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this scan?")) {
        await deleteScan(id);
        loadHistory();
    }
  };

  const selectedScan = scans.find(s => s.id === selectedScanId);
  const compareScan = scans.find(s => s.id === compareScanId);

  // Helper to format date
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Time Travel Logic
  const toggleMorph = () => {
      if (isPlayingMorph) {
          if (morphInterval.current) clearInterval(morphInterval.current);
          setIsPlayingMorph(false);
      } else {
          setIsPlayingMorph(true);
          setMorphIndex(0);
          morphInterval.current = window.setInterval(() => {
              setMorphIndex(prev => {
                  if (prev >= scans.length - 1) {
                      // End of loop, pause or restart? Let's restart after a pause or just loop
                      return 0; 
                  }
                  return prev + 1;
              });
          }, 800); // Speed of morph
      }
  };

  useEffect(() => {
      return () => {
          if (morphInterval.current) clearInterval(morphInterval.current);
      };
  }, []);

  return (
    <div className="min-h-screen bg-cream text-stone-900 animate-fade-in transition-colors duration-300">
       {/* Header */}
       <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 text-stone-500 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="font-serif text-xl text-stone-900">{user.name.split(' ')[0]}'s Journey</h2>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                    <Calendar size={12} />
                    <span>Member since {new Date(user.joinedDate).getFullYear()}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-stone-900 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                {scans.length} Scans
            </div>
            <button 
                onClick={onLogout}
                className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors text-stone-600 hover:text-stone-900"
                title="Log Out"
            >
                <LogOut size={18} />
            </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 pb-20 space-y-10">
        
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin mb-4"></div>
                <p>Loading your history...</p>
            </div>
        ) : scans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50">
                <div className="w-20 h-20 bg-stone-200 rounded-full flex items-center justify-center text-stone-400">
                    <History size={32} />
                </div>
                <div>
                    <h3 className="font-serif text-2xl text-stone-800">No Scans Yet</h3>
                    <p className="text-stone-500 mt-2 max-w-xs mx-auto">Start analyzing your skin to track your progress and see improvements over time.</p>
                </div>
                <button onClick={onBack} className="bg-stone-900 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                    Start First Scan
                </button>
            </div>
        ) : (
            <>
                {/* 1. Comparison Stage */}
                {scans.length > 1 && selectedScan && compareScan ? (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-serif text-2xl text-stone-800 flex items-center gap-2">
                                <TrendingUp className="text-sage-500" size={24} />
                                Progress Time-Lapse
                            </h3>
                            
                            {/* Time Travel Controls */}
                            <button 
                                onClick={toggleMorph}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all shadow-sm ${
                                    isPlayingMorph 
                                    ? 'bg-sage-100 text-sage-700 border border-sage-200' 
                                    : 'bg-stone-900 text-white hover:bg-black'
                                }`}
                            >
                                {isPlayingMorph ? <Pause size={12} /> : <Play size={12} />}
                                {isPlayingMorph ? 'Pause Morph' : 'Play Time-Travel'}
                            </button>
                        </div>

                        {isPlayingMorph ? (
                            <div className="relative aspect-[3/4] sm:aspect-[4/3] bg-stone-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-stone-800">
                                {/* Morph Animation Frame */}
                                {scans.map((scan, index) => (
                                    <img 
                                        key={scan.id}
                                        src={scan.thumbnailUrl}
                                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                                            index === morphIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                        }`}
                                        alt={`Scan ${index}`}
                                    />
                                ))}
                                
                                {/* Overlay Stats */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20 flex justify-between items-end text-white">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-sage-300 mb-1">Date</div>
                                        <div className="font-serif text-2xl">{formatDate(scans[morphIndex].date)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase font-bold text-sage-300 mb-1">Score</div>
                                        <div className="font-serif text-4xl">{scans[morphIndex].score}</div>
                                    </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30">
                                    <div 
                                        className="h-full bg-sage-500 transition-all duration-700 ease-linear"
                                        style={{ width: `${((morphIndex + 1) / scans.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-stone-200 relative group">
                                <CompareSlider 
                                    leftImage={compareScan.thumbnailUrl || ''} 
                                    rightImage={selectedScan.thumbnailUrl || ''}
                                    leftLabel={formatDate(compareScan.date)}
                                    rightLabel={formatDate(selectedScan.date)}
                                    className="shadow-none rounded-[1.5rem]"
                                />
                                <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                     <span className="bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-xs">Drag to compare</span>
                                </div>
                            </div>
                        )}

                        {/* Comparison Stats */}
                        {!isPlayingMorph && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-stone-100 flex flex-col items-center text-center">
                                    <span className="text-[10px] uppercase font-bold text-stone-400 mb-1">{formatDate(compareScan.date)}</span>
                                    <span className="text-3xl font-serif font-bold text-stone-800">{compareScan.score}</span>
                                    <span className="text-xs text-stone-500">Health Score</span>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-stone-100 flex flex-col items-center text-center relative overflow-hidden">
                                    <span className="text-[10px] uppercase font-bold text-stone-400 mb-1">{formatDate(selectedScan.date)}</span>
                                    <span className="text-3xl font-serif font-bold text-sage-600">{selectedScan.score}</span>
                                    <span className="text-xs text-stone-500">Health Score</span>
                                    
                                    {/* Delta Indicator */}
                                    {selectedScan.score - compareScan.score !== 0 && (
                                        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                                            selectedScan.score >= compareScan.score ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {selectedScan.score >= compareScan.score ? '+' : ''}{selectedScan.score - compareScan.score}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="bg-sage-50 border border-sage-100 p-6 rounded-2xl text-center">
                        <Activity className="mx-auto text-sage-400 mb-3" size={24} />
                        <h3 className="font-bold text-sage-800">Not Enough Data</h3>
                        <p className="text-sage-600 text-sm mt-1">Complete at least 2 scans to unlock the time-lapse comparison features.</p>
                    </section>
                )}

                {/* 2. History Grid */}
                <section>
                    <h3 className="font-serif text-xl text-stone-800 mb-6 flex items-center gap-2">
                        <History size={20} /> Scan History
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Render reversed so newest is first in grid list, but scans state is sorted old->new for morph */}
                        {[...scans].reverse().map((scan) => {
                            const isSelected = selectedScanId === scan.id;
                            const isCompare = compareScanId === scan.id;
                            
                            return (
                                <div 
                                    key={scan.id}
                                    onClick={() => {
                                        if (isSelected) return; // Can't deselect primary
                                        if (compareScanId === scan.id) setCompareScanId(null); // Toggle off compare
                                        else setSelectedScanId(scan.id); // Set as primary
                                    }}
                                    className={`relative bg-white p-3 rounded-2xl border transition-all cursor-pointer group hover:shadow-md flex gap-4 items-center ${
                                        isSelected 
                                        ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50' 
                                        : isCompare 
                                            ? 'border-sage-400 ring-1 ring-sage-400 bg-sage-50'
                                            : 'border-stone-100 hover:border-stone-300'
                                    }`}
                                >
                                    {/* Thumbnail */}
                                    <div className="w-16 h-16 rounded-xl bg-stone-200 overflow-hidden flex-shrink-0 relative">
                                        <img src={scan.thumbnailUrl} className="w-full h-full object-cover" alt="Scan" />
                                        {isSelected && <div className="absolute inset-0 bg-stone-900/20 flex items-center justify-center text-white font-bold text-xs">NOW</div>}
                                        {isCompare && <div className="absolute inset-0 bg-sage-500/20 flex items-center justify-center text-white font-bold text-xs">THEN</div>}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-stone-800 text-sm hover:underline" onClick={(e) => { e.stopPropagation(); onViewReport(scan); }}>{formatDate(scan.date)}</h4>
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                                scan.score > 80 ? 'bg-green-100 text-green-700' : scan.score > 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {scan.score}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 mt-1">
                                            {scan.analysis.concerns.slice(0, 2).map((c, i) => (
                                                <span key={i} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                                                    {c.name}
                                                </span>
                                            ))}
                                            {scan.analysis.concerns.length > 2 && <span className="text-[10px] text-stone-400">+</span>}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onViewReport(scan); }}
                                            className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="View Full Report"
                                        >
                                            <Activity size={16} />
                                        </button>
                                        {scans.length > 1 && !isSelected && !isCompare && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setCompareScanId(scan.id); }}
                                                className="p-1.5 text-stone-400 hover:text-sage-600 hover:bg-sage-100 rounded-lg"
                                                title="Compare"
                                            >
                                                <ArrowLeft size={16} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => handleDelete(e, scan.id)}
                                            className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </>
        )}
      </main>
    </div>
  );
};

export default SkinJourney;
