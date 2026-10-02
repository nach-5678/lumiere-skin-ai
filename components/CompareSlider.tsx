
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';

interface CompareSliderProps {
  leftImage: string;
  rightImage: string;
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
}

const CompareSlider: React.FC<CompareSliderProps> = ({ 
  leftImage, 
  rightImage, 
  leftLabel = "Before", 
  rightLabel = "After",
  className = "" 
}) => {
  const [sliderValue, setSliderValue] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

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
    <div 
        ref={containerRef}
        className={`relative w-full aspect-[3/4] sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-stone-200 group cursor-ew-resize select-none touch-none ${className}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
    >
        {/* Layer 1: Background (Right Image / After) */}
        <img 
            src={rightImage} 
            alt="Comparison Right" 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Layer 2: Overlay (Left Image / Before) - Clipped */}
        <div 
            className="absolute inset-y-0 left-0 overflow-hidden shadow-[2px_0_10px_rgba(0,0,0,0.2)]"
            style={{ width: `${sliderValue}%` }}
        >
            <img 
                src={leftImage} 
                alt="Comparison Left" 
                className="absolute inset-0 w-full max-w-none h-full object-cover"
                style={{ width: containerRef.current?.offsetWidth }}
            />
        </div>

        {/* Slider Handle Line */}
        <div 
            className="absolute inset-y-0 w-1 bg-white cursor-ew-resize z-40 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
            style={{ left: `${sliderValue}%` }}
        >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-sage-600 border border-stone-100 transform hover:scale-110 transition-transform">
                <ArrowRightLeft size={16} />
            </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold pointer-events-none z-30">
            {leftLabel}
        </div>
        <div className="absolute bottom-4 right-4 bg-sage-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold pointer-events-none z-30">
            {rightLabel}
        </div>
    </div>
  );
};

export default CompareSlider;
