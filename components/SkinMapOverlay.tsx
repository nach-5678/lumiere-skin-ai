
import React, { useState, useRef, useEffect } from 'react';
import { SkinAnalysisResult, SkinConcern, WatchedSpot, UserProfile } from '../types';
import { X, Target, Check, Loader2, Droplets, Scan, Zap, Clock } from 'lucide-react';
import { saveUserProfile } from '../services/storageService';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface SkinMapOverlayProps {
  image: string;
  result: SkinAnalysisResult;
  user?: UserProfile | null;
  onUpdateUser?: (u: UserProfile) => void;
}

type VisualMode = 'defects';

// SVG Paths approximating facial zones on a standard portrait photo
// These are normalized (0-100 coordinates)
const ZONE_PATHS = {
    forehead: "M 25,25 Q 50,15 75,25 Q 85,35 80,45 Q 50,50 20,45 Q 15,35 25,25 Z",
    cheeks: "M 20,55 Q 10,65 25,80 Q 40,85 45,65 Q 35,55 20,55 M 80,55 Q 90,65 75,80 Q 60,85 55,65 Q 65,55 80,55",
    tzone: "M 35,30 H 65 V 45 Q 65,65 58,70 H 42 Q 35,65 35,45 V 30 Z",
    eyes: "M 25,48 Q 35,45 45,48 Q 35,55 25,48 M 75,48 Q 65,45 55,48 Q 65,55 75,48"
};

const SkinMapOverlay: React.FC<SkinMapOverlayProps> = ({ image, result, user, onUpdateUser }) => {
  const [activeConcern, setActiveConcern] = useState<SkinConcern | null>(null);
  const [visualMode, setVisualMode] = useState<VisualMode>('defects');
  
  // Pin Mode State
  const [isPinMode, setIsPinMode] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [isConfirmingPin, setIsConfirmingPin] = useState(false);
  const [pinLabel, setPinLabel] = useState('');
  const [autoTrack, setAutoTrack] = useState(true);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
      setShowExplanation(false);
  }, [visualMode]);
  
  const imgRef = useRef<HTMLImageElement>(null);

  // Helper to handle both 0-1000 (Gemini default) and 0-1 (Normalized) coordinates
  const getStyle = (coords: number[]) => {
    if (!coords || coords.length !== 4) return {};
    const [ymin, xmin, ymax, xmax] = coords;
    const isNormalized = coords.every(c => c >= 0 && c <= 1);

    if (isNormalized) {
        return {
            top: `${ymin * 100}%`,
            left: `${xmin * 100}%`,
            height: `${(ymax - ymin) * 100}%`,
            width: `${(xmax - xmin) * 100}%`,
        };
    }
    return {
      top: `${ymin / 10}%`,
      left: `${xmin / 10}%`,
      height: `${(ymax - ymin) / 10}%`,
      width: `${(xmax - xmin) / 10}%`,
    };
  };

  const getPointStyle = (coords: number[]) => {
    if (!coords || coords.length !== 2) return {};
    const [y, x] = coords;
    const isNormalized = coords.every(c => c >= 0 && c <= 1);

    if (isNormalized) {
        return {
            top: `${y * 100}%`,
            left: `${x * 100}%`,
        };
    }
    return {
      top: `${y / 10}%`,
      left: `${x / 10}%`,
    };
  };

  const savePin = async () => {
      if (!crop || !imgRef.current || !pinLabel.trim() || !user || !onUpdateUser) return;
      setIsSavingPin(true);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = imgRef.current;
      
      let x1, y1, width, height;
      if (crop.unit === '%') {
          x1 = (crop.x / 100) * img.naturalWidth;
          y1 = (crop.y / 100) * img.naturalHeight;
          width = (crop.width / 100) * img.naturalWidth;
          height = (crop.height / 100) * img.naturalHeight;
      } else {
          const scaleX = img.naturalWidth / img.width;
          const scaleY = img.naturalHeight / img.height;
          x1 = crop.x * scaleX;
          y1 = crop.y * scaleY;
          width = crop.width * scaleX;
          height = crop.height * scaleY;
      }

      // Make it square for the crop
      const size = Math.max(width, height, 150); // At least 150px
      const cx = x1 + width / 2;
      const cy = y1 + height / 2;

      canvas.width = size;
      canvas.height = size;
      
      ctx?.drawImage(img, cx - size/2, cy - size/2, size, size, 0, 0, size, size);
      
      // Calculate normalized coordinates for auto-tracking
      const normalizedCoords = {
        x: (cx - size/2) / img.naturalWidth,
        y: (cy - size/2) / img.naturalHeight,
        width: size / img.naturalWidth,
        height: size / img.naturalHeight
      };

      const newSpot: WatchedSpot = {
          id: Date.now().toString(),
          dateAdded: new Date().toISOString(),
          label: pinLabel,
          imageCrop: canvas.toDataURL('image/jpeg', 0.8),
          autoTrack: autoTrack,
          coordinates: normalizedCoords
      };
      
      const updatedUser = { ...user, watchlist: [...(user.watchlist || []), newSpot] };
      await saveUserProfile(updatedUser);
      onUpdateUser(updatedUser);
      setIsSavingPin(false);
      setCrop(undefined);
      setIsConfirmingPin(false);
      setPinLabel('');
      setIsPinMode(false);
  };

  const concernsWithCoords = result.concerns.filter(c => (c.coordinates && c.coordinates.length === 4) || (c.preciseLocation && c.preciseLocation.length === 2));

  // --- RENDER HELPERS ---

  // 1. Defect Markers (Crosshairs)
  const renderDefectMarkers = () => (
      <>
        {/* Render Points separately to ensure correct positioning independent of boxes */}
        {concernsWithCoords.map((concern, i) => {
             if (!concern.preciseLocation && !concern.coordinates) return null;
             
             const isActive = activeConcern?.name === concern.name;
             const pointStyle = concern.preciseLocation 
                ? getPointStyle(concern.preciseLocation) 
                : (concern.coordinates ? { 
                    top: `${(concern.coordinates[0] + concern.coordinates[2])/20}%`, 
                    left: `${(concern.coordinates[1] + concern.coordinates[3])/20}%` 
                  } : {}); // Fallback to box center

             let bgClass = 'bg-sage-500';
             let ringClass = 'ring-sage-300';
             
             if (concern.severity === 'high') {
                 bgClass = 'bg-rose-500';
                 ringClass = 'ring-rose-300';
             } else if (concern.severity === 'medium') {
                 bgClass = 'bg-amber-500';
                 ringClass = 'ring-amber-300';
             }

             return (
                <div
                    key={`point-${i}`}
                    className={`absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all duration-300 ${isActive ? 'scale-125 z-30' : 'hover:scale-110'}`}
                    style={pointStyle}
                    onClick={(e) => { e.stopPropagation(); setActiveConcern(concern); }}
                >
                    <div className={`w-full h-full rounded-full border-2 border-white shadow-sm ${bgClass} ${isActive ? 'animate-pulse' : ''}`}></div>
                    <div className={`absolute inset-0 rounded-full ring-4 ${ringClass} opacity-30 animate-ping`}></div>
                    
                    {/* Hover Label */}
                    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-stone-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40`}>
                        {concern.name}
                    </div>
                </div>
             );
        })}

        {/* Render Boxes separately (subtle) */}
        {concernsWithCoords.map((concern, i) => {
            if (!concern.coordinates) return null;
            const style = getStyle(concern.coordinates);
            const isActive = activeConcern?.name === concern.name;
            
            let borderClass = 'border-sage-400/30';
            if (concern.severity === 'high') borderClass = 'border-rose-500/30';
            else if (concern.severity === 'medium') borderClass = 'border-amber-500/30';

            return (
                <div
                    key={`box-${i}`}
                    style={style}
                    className={`absolute border-2 border-dashed rounded-lg pointer-events-none transition-all duration-300 ${borderClass} ${isActive ? 'opacity-100 border-solid' : 'opacity-0 hover:opacity-50'}`}
                ></div>
            );
        })}
      </>
  );

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone-100 relative overflow-hidden transition-colors duration-300">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 z-20 relative">
         <div>
            <h3 className="font-serif text-xl text-stone-800 flex items-center gap-2">
                <Scan size={20} className="text-sage-500" />
                Clinical Diagnostics
            </h3>
            <p className="text-stone-500 text-sm">Select a lens to analyze specific layers.</p>
         </div>
         
         {/* LENS SELECTOR */}
         <div className="flex bg-stone-100 p-1 rounded-full">
            <button 
                onClick={() => { setVisualMode('defects'); setIsPinMode(false); setActiveConcern(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${visualMode === 'defects' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
                <Zap size={14} className={visualMode === 'defects' ? 'text-rose-500' : ''} /> Blemishes
            </button>
         </div>
      </div>

      <div className="relative w-full rounded-2xl overflow-hidden bg-stone-900 group shadow-inner">
        
        {/* SCANNER LINE ANIMATION (Runs once on mode switch) */}
        <div key={visualMode} className="absolute inset-0 pointer-events-none z-30 opacity-30">
             <div className="w-full h-1 bg-white shadow-[0_0_20px_white] animate-[scan_1s_ease-out_forwards]"></div>
        </div>

            {/* MAIN IMAGE CONTAINER */}
            <div 
                className="relative font-mono text-[0] flex justify-center bg-stone-950/50 rounded-xl overflow-hidden select-none"
            > 
                <div className="relative inline-block">
                    {isPinMode ? (
                        <ReactCrop crop={crop} onChange={c => setCrop(c)}>
                            <img 
                                ref={imgRef}
                                src={image} 
                                className="w-auto h-auto max-h-[65vh] object-contain transition-all duration-500 opacity-90" 
                                alt="Analysis Subject" 
                            />
                        </ReactCrop>
                    ) : (
                        <img 
                            ref={imgRef}
                            src={image} 
                            className={`w-auto h-auto max-h-[65vh] object-contain transition-all duration-500 pointer-events-none opacity-90`} 
                            alt="Analysis Subject" 
                        />
                    )}
            
                    {/* VISUALIZATION LAYERS */}
                    {!isPinMode && (
                        <>
                            {visualMode === 'defects' && renderDefectMarkers()}
                        </>
                    )}
                </div>
            </div>

        {/* LEGEND / STATUS BAR (Dynamic based on mode) */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
             {visualMode === 'defects' && !isPinMode && (
                 <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-3">
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div><span className="text-[10px] text-white font-bold uppercase">High Priority</span></div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-sage-400"></div><span className="text-[10px] text-white font-bold uppercase">Minor</span></div>
                 </div>
             )}
        </div>

        {/* PIN MODE TOGGLE (Floating Bottom Right) */}
        {user && (
            <button 
                onClick={() => {
                    const newPinMode = !isPinMode;
                    setIsPinMode(newPinMode);
                    setCrop(undefined);
                    setIsConfirmingPin(false);
                    setVisualMode('defects'); // Reset to clear view
                }}
                className={`absolute bottom-4 right-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg ${isPinMode ? 'bg-white text-stone-900' : 'bg-black/60 text-white backdrop-blur-md hover:bg-black/80'}`}
            >
                <Target size={14} className={isPinMode ? 'text-rose-500 animate-pulse' : ''} />
                {isPinMode ? 'Cancel Tracking' : 'Track a Spot'}
            </button>
        )}
        
        {/* --- Active Concern Popup --- */}
        {activeConcern && !isPinMode && (
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-6 rounded-t-3xl border-t border-white/20 shadow-2xl animate-slide-up z-30">
                <button 
                    onClick={(e) => { e.stopPropagation(); setActiveConcern(null); }}
                    className="absolute top-4 right-4 p-1 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200"
                >
                    <X size={16} />
                </button>
                
                <div className="flex items-start gap-4">
                    <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                         activeConcern.severity === 'high' ? 'bg-rose-500' : activeConcern.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                        <h4 className="font-serif text-lg font-bold text-stone-900 leading-none mb-1">{activeConcern.name}</h4>
                        <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                            Severity: {activeConcern.severity}
                        </span>

                        <div className="mt-3 space-y-2">
                            <p className="text-sm text-stone-600 leading-relaxed">
                                <span className="font-bold text-stone-800">Clinical Overview: </span>
                                {activeConcern.clinicalOverview || activeConcern.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* --- Spot Tracking UI (Fixed below image) --- */}
      {isPinMode && (
          <div className="mt-4 animate-fade-in">
              {(!crop || crop.width === 0) && (
                  <div className="bg-sage-50 rounded-xl p-4 text-center border border-sage-100">
                      <p className="text-sm text-sage-800 font-medium flex items-center justify-center gap-2">
                          <Target size={16} className="text-sage-600" />
                          Click and drag on the image above to draw a box around the spot you want to track.
                      </p>
                  </div>
              )}

              {crop && crop.width > 0 && crop.height > 0 && !isConfirmingPin && (
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col gap-3 items-center">
                       <p className="text-sm font-bold text-stone-800">Spot selected. Ready to track?</p>
                       <div className="flex gap-3 w-full">
                           <button 
                              onClick={() => setCrop(undefined)} 
                              className="flex-1 bg-white border border-stone-200 text-stone-600 py-2 rounded-lg font-bold text-sm hover:bg-stone-100 transition-colors"
                           >
                               Cancel
                           </button>
                           <button 
                              onClick={() => setIsConfirmingPin(true)}
                              className="flex-1 bg-stone-900 text-white py-2 rounded-lg font-bold text-sm hover:bg-black transition-colors"
                           >
                               Confirm Selection
                           </button>
                       </div>
                  </div>
              )}

              {crop && crop.width > 0 && crop.height > 0 && isConfirmingPin && (
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col gap-3">
                       <div className="flex justify-between items-center">
                           <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Name This Spot</span>
                           <button onClick={() => { setCrop(undefined); setIsConfirmingPin(false); }} className="text-stone-400 hover:text-stone-600"><X size={16}/></button>
                       </div>
                       <div className="flex flex-col gap-3">
                           <div className="flex flex-col sm:flex-row gap-2">
                               <input 
                                  type="text" 
                                  placeholder="Label (e.g. Cheek Mole)" 
                                  value={pinLabel}
                                  onChange={(e) => setPinLabel(e.target.value)}
                                  className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-200"
                                  autoFocus
                               />
                               <button 
                                  onClick={savePin}
                                  disabled={!pinLabel.trim() || isSavingPin}
                                  className="bg-stone-900 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50"
                              >
                                  {isSavingPin ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
                                  Save Spot
                               </button>
                           </div>
                           <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setAutoTrack(!autoTrack)}>
                               <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${autoTrack ? 'bg-sage-500 border-sage-500' : 'bg-white border-stone-300 group-hover:border-sage-400'}`}>
                                   {autoTrack && <Check size={14} className="text-white" />}
                               </div>
                               <span className="text-sm text-stone-600 font-medium">Auto-track this spot in future scans</span>
                           </label>
                       </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default SkinMapOverlay;
