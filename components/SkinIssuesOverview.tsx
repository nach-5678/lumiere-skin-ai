import React, { useState } from 'react';
import { SkinConcern, SkincareProduct, UserProfile, WatchedSpot } from '../types';
import { AlertCircle, CheckCircle2, ArrowRight, ChevronDown, ChevronUp, Droplets, Sparkles, ShieldAlert, Info, Target, Check } from 'lucide-react';
import { saveUserProfile } from '../services/storageService';

interface Props {
  concerns: SkinConcern[];
  products: SkincareProduct[];
  onViewProduct: (product: SkincareProduct) => void;
  image?: string;
  user?: UserProfile | null;
  onUpdateUser?: (u: UserProfile) => void;
}

const SkinIssuesOverview: React.FC<Props> = ({ concerns, products, onViewProduct, image, user, onUpdateUser }) => {
  const [expandedConcern, setExpandedConcern] = useState<string | null>(concerns[0]?.name || null);
  const [trackingLoading, setTrackingLoading] = useState<string | null>(null);

  const getProductsForConcern = (concern: SkinConcern) => {
    const keywords = concern.name.toLowerCase().split(' ');
    const matched = products.filter(p => {
      const textToSearch = (p.reason + ' ' + p.description + ' ' + p.keyIngredients.join(' ')).toLowerCase();
      return keywords.some(kw => kw.length > 3 && textToSearch.includes(kw)) || textToSearch.includes(concern.name.toLowerCase());
    });
    return matched.length > 0 ? matched : products.slice(0, 2); // Fallback
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-sage-100 text-sage-700 border-sage-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'high': return <ShieldAlert size={16} className="text-rose-500" />;
      case 'medium': return <AlertCircle size={16} className="text-amber-500" />;
      default: return <CheckCircle2 size={16} className="text-sage-500" />;
    }
  };

  const handleTrackConcern = async (concern: SkinConcern) => {
    if (!user || !onUpdateUser || !image || !concern.coordinates) return;
    
    setTrackingLoading(concern.name);

    const coords = concern.coordinates;
    const img = new Image();
    
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setTrackingLoading(null);
        return;
      }

      let ymin, xmin, ymax, xmax;
      const isNormalized = coords.every(c => c >= 0 && c <= 1);
      if (isNormalized) {
        ymin = coords[0] * img.naturalHeight;
        xmin = coords[1] * img.naturalWidth;
        ymax = coords[2] * img.naturalHeight;
        xmax = coords[3] * img.naturalWidth;
      } else {
        ymin = (coords[0] / 1000) * img.naturalHeight;
        xmin = (coords[1] / 1000) * img.naturalWidth;
        ymax = (coords[2] / 1000) * img.naturalHeight;
        xmax = (coords[3] / 1000) * img.naturalWidth;
      }

      const width = xmax - xmin;
      const height = ymax - ymin;
      const size = Math.max(width, height, 150);
      const cx = xmin + width / 2;
      const cy = ymin + height / 2;

      canvas.width = size;
      canvas.height = size;

      ctx.drawImage(img, cx - size/2, cy - size/2, size, size, 0, 0, size, size);

      const normalizedCoords = {
        x: (cx - size/2) / img.naturalWidth,
        y: (cy - size/2) / img.naturalHeight,
        width: size / img.naturalWidth,
        height: size / img.naturalHeight
      };

      const newSpot: WatchedSpot = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        dateAdded: new Date().toISOString(),
        label: concern.name,
        imageCrop: canvas.toDataURL('image/jpeg', 0.8),
        autoTrack: true,
        coordinates: normalizedCoords
      };

      const updatedUser = { ...user, watchlist: [...(user.watchlist || []), newSpot] };
      await saveUserProfile(updatedUser);
      onUpdateUser(updatedUser);
      setTrackingLoading(null);
    };
    img.src = image;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
         <h3 className="font-serif text-xl text-stone-800">Key Skin Issues & Solutions</h3>
         <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full">Tap to expand</span>
      </div>
      
      {concerns.map((concern, idx) => {
        const isExpanded = expandedConcern === concern.name;
        const matchedProducts = getProductsForConcern(concern);
        const isTracking = user?.watchlist?.some(s => s.label === concern.name);
        const canTrack = !!concern.coordinates && !!user;
        
        return (
          <div 
            key={idx} 
            className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden animate-slide-up ${isExpanded ? 'border-sage-300 shadow-md' : 'border-stone-100 shadow-sm hover:border-stone-200'}`}
            style={{ animationDelay: `${idx * 100}ms`, opacity: 0, animationFillMode: 'forwards' }}
          >
            {/* Header */}
            <button 
              onClick={() => setExpandedConcern(isExpanded ? null : concern.name)}
              className="w-full p-5 flex items-center justify-between text-left focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(concern.severity).replace('border-', '').replace('text-', '')} bg-opacity-50`}>
                    {getSeverityIcon(concern.severity)}
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 text-lg">{concern.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${getSeverityColor(concern.severity)}`}>
                      {concern.severity} Severity
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-stone-400">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {/* Expanded Content */}
            <div 
              className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
              <div className="overflow-hidden">
                <div className="p-5 pt-0 border-t border-stone-50">
                
                {/* Issue & Solution Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 relative">
                    <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                          <AlertCircle size={14} /> The Issue
                        </h5>
                        {canTrack && (
                            <button
                                onClick={() => !isTracking && handleTrackConcern(concern)}
                                disabled={isTracking || trackingLoading === concern.name}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                                    isTracking 
                                    ? 'bg-sage-100 text-sage-700 border border-sage-200' 
                                    : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-300 shadow-sm'
                                }`}
                            >
                                {trackingLoading === concern.name ? (
                                    <span className="w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></span>
                                ) : isTracking ? (
                                    <><Check size={12} /> Tracking</>
                                ) : (
                                    <><Target size={12} /> Track Issue</>
                                )}
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-stone-700 leading-relaxed">
                      {concern.description}
                    </p>
                  </div>
                  
                  <div className="bg-sage-50/50 p-4 rounded-2xl border border-sage-100/50">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-sage-800 mb-2 flex items-center gap-1">
                      <Sparkles size={14} /> The Solution
                    </h5>
                    <p className="text-sm text-stone-700 leading-relaxed">
                      {concern.clinicalOverview || `To mitigate ${concern.name.toLowerCase()}, focus on targeted treatments that address the root cause while maintaining skin barrier health. Consistent use of recommended active ingredients will yield the best results.`}
                    </p>
                  </div>
                </div>

                {/* Recommended Products */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                      <Droplets size={14} /> Mitigation Products
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matchedProducts.map((product, pIdx) => (
                      <div 
                        key={pIdx}
                        onClick={() => onViewProduct(product)}
                        className="flex flex-col p-4 rounded-2xl border border-stone-100 hover:border-sage-300 hover:shadow-md transition-all cursor-pointer group bg-stone-50/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-sage-600 bg-sage-100 px-2 py-1 rounded-md">
                            {product.category}
                          </span>
                          <ArrowRight size={16} className="text-stone-300 group-hover:text-sage-500 transition-colors" />
                        </div>
                        <h6 className="font-bold text-stone-800 text-sm mb-1">{product.name}</h6>
                        <p className="text-xs text-stone-500 line-clamp-2 mb-3 flex-1">{product.reason}</p>
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {product.keyIngredients.slice(0, 2).map((ing, i) => (
                            <span key={i} className="text-[9px] bg-white border border-stone-200 text-stone-500 px-1.5 py-0.5 rounded-sm">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-amber-50/50 border border-amber-100/50 p-3 rounded-xl flex items-start gap-2">
                    <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      <strong>Budget Tip:</strong> You don't need to buy everything at once. Start with a <span className="font-bold">Cleanser</span> and <span className="font-bold">Moisturizer</span>, then add a <span className="font-bold">Treatment</span> specifically for {concern.name.toLowerCase()} when your budget allows.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
          </div>
        );
      })}
    </div>
  );
};

export default SkinIssuesOverview;
