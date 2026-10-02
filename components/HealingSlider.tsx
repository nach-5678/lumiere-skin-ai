import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRightLeft, Loader2 } from 'lucide-react';
import { generateHealedSkin, getCachedHealedSkin } from '../services/geminiService';

interface HealingSliderProps {
  originalImage: string;
  className?: string;
}

const HealingSlider: React.FC<HealingSliderProps> = ({ originalImage, className = '' }) => {
  const [sliderValue, setSliderValue] = useState(50);
  const [healedImage, setHealedImage] = useState<string | null>(() => getCachedHealedSkin(originalImage));
  const [isLoading, setIsLoading] = useState(() => !getCachedHealedSkin(originalImage));
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    let mounted = true;
    const fetchHealedImage = async () => {
      if (getCachedHealedSkin(originalImage)) {
        if (mounted) {
          setHealedImage(getCachedHealedSkin(originalImage));
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        const generated = await generateHealedSkin(originalImage);
        if (mounted) {
            setHealedImage(generated);
            setIsLoading(false);
        }
      } catch (e) {
        console.error("Failed to generate healed skin", e);
        if (mounted) {
            setError(true);
            setIsLoading(false);
        }
      }
    };

    fetchHealedImage();
    return () => { mounted = false; };
  }, [originalImage]);

  // Touch/Mouse handling for smoother sliding
  const handleMove = (clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderValue(percentage);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleMove(e.clientX);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (isDragging.current) handleMove(e.clientX);
    };
    const handleGlobalUp = () => {
      isDragging.current = false;
    };
    const handleGlobalTouchMove = (e: TouchEvent) => {
        if (isDragging.current) handleMove(e.touches[0].clientX);
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalTouchMove);
    window.addEventListener('touchend', handleGlobalUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, []);

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="flex justify-between items-end mb-4">
        <div>
           <h3 className="font-serif text-2xl text-stone-800 flex items-center gap-2">
            <Sparkles className="text-sage-400" size={20} />
            AI Healing Projection
          </h3>
          <p className="text-stone-500 text-sm mt-1">
            Drag to see your skin after 3-6 months of care.
          </p>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl bg-stone-200 group cursor-ew-resize select-none touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Layer 1: Background (Original/Before) */}
        <img 
            src={originalImage} 
            alt="Current Skin" 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Loading State Overlay */}
        {isLoading && (
            <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin mb-2" size={32} />
                <span className="text-sm font-medium tracking-wide">Generating Projection...</span>
            </div>
        )}

        {/* Error Fallback: Just shows original with a message, slider disabled visually */}
        {error && !isLoading && (
            <div className="absolute inset-x-0 top-0 bg-red-500/80 text-white text-xs py-1 text-center z-50">
                Could not generate projection. Showing original image.
            </div>
        )}

        {/* Layer 2: Overlay (Healed/After) - Variable Width */}
        {/* Progressive Logic: Slider 0% (Left) = 0% Healed visible. Slider 100% (Right) = 100% Healed visible. */}
        {healedImage && !isLoading && (
            <div 
                className="absolute inset-y-0 left-0 overflow-hidden shadow-[2px_0_10px_rgba(0,0,0,0.2)]"
                style={{ width: `${sliderValue}%` }}
            >
                <img 
                    src={healedImage} 
                    alt="Healed Skin" 
                    className="absolute inset-0 w-full max-w-none h-full object-cover"
                    style={{ width: containerRef.current?.offsetWidth }} // Force image to match container width regardless of parent clip
                />
                
                {/* Glow effect on the "healed" side */}
                <div className="absolute inset-0 bg-sage-500/10 mix-blend-overlay"></div>
            </div>
        )}

        {/* Slider Handle Line */}
        {!isLoading && !error && (
            <div 
                className="absolute inset-y-0 w-1 bg-white cursor-ew-resize z-40 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                style={{ left: `${sliderValue}%` }}
            >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-sage-600 border border-stone-100">
                    <ArrowRightLeft size={16} />
                </div>
            </div>
        )}

        {/* Labels */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold pointer-events-none z-30">
            BEFORE
        </div>
        <div className="absolute bottom-4 right-4 bg-sage-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold pointer-events-none z-30">
            AFTER
        </div>
      </div>
    </div>
  );
};

export default HealingSlider;
