import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { SkincareProduct, UserProfile, SmartShelfItem } from '../types';
import { ShoppingBag, Sparkles, ChevronDown, Check, Scale, ArrowRight, Zap, Info, X, ShieldCheck, Droplets, Layers, Clock, Plus } from 'lucide-react';
import AuthModal from './AuthModal';

interface ProductShowcaseProps {
  products: SkincareProduct[];
  user?: UserProfile | null;
  onUpdateUser?: (user: UserProfile) => void;
}

const CATEGORY_ORDER = ['Cleanser', 'Toner', 'Treatment', 'Moisturizer', 'Sunscreen', 'Other'];

const ProductShowcase: React.FC<ProductShowcaseProps> = ({ products, user, onUpdateUser }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [comparisonSelection, setComparisonSelection] = useState<SkincareProduct[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Group products by category
  const groupedProducts = CATEGORY_ORDER.reduce((acc, cat) => {
      const items = (products || []).filter(p => (p.category || p.type).toLowerCase().includes(cat.toLowerCase()));
      if (items.length > 0) acc[cat] = items;
      return acc;
  }, {} as Record<string, SkincareProduct[]>);

  // Catch-all for uncategorized
  const others = (products || []).filter(p => !CATEGORY_ORDER.some(cat => (p.category || p.type).toLowerCase().includes(cat.toLowerCase())));
  if (others.length > 0) groupedProducts['Other'] = others;

  const toggleComparison = (product: SkincareProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    if (comparisonSelection.find(p => p.name === product.name)) {
        setComparisonSelection(prev => prev.filter(p => p.name !== product.name));
    } else {
        if (comparisonSelection.length < 2) {
            setComparisonSelection(prev => [...prev, product]);
        }
    }
  };

  const getProductImage = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('serum') || t.includes('treatment') || t.includes('essence')) return 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80';
    if (t.includes('cleanser') || t.includes('wash') || t.includes('micellar')) return 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=600&q=80';
    if (t.includes('moisturizer') || t.includes('cream') || t.includes('lotion')) return 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&w=600&q=80';
    if (t.includes('sun') || t.includes('spf')) return 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80';
    if (t.includes('toner') || t.includes('mist')) return 'https://images.unsplash.com/photo-1615397323783-5e8848c1216c?auto=format&fit=crop&w=600&q=80';
    if (t.includes('mask') || t.includes('peel')) return 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=600&q=80';
    return 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80';
  };

  const handleAddToShelf = (product: SkincareProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // Check if already in shelf
    const currentShelf = user.shelf || [];
    if (currentShelf.some(item => item.productName === product.name)) {
      return; // Already added
    }

    const newItem: SmartShelfItem = {
      id: Math.random().toString(36).substr(2, 9),
      image: getProductImage(product.type),
      productName: product.name,
      type: product.type,
      activeIngredients: product.keyIngredients,
      isCompatible: true,
      conflictReason: null,
      usageAdvice: product.usageTiming || 'Follow standard routine instructions.'
    };

    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        shelf: [...currentShelf, newItem]
      });
    }
  };

  const handleAddMultipleToShelf = (productsToAdd: SkincareProduct[]) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    const currentShelf = user.shelf || [];
    const newItems: SmartShelfItem[] = [];

    productsToAdd.forEach(product => {
      if (!currentShelf.some(item => item.productName === product.name)) {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          image: getProductImage(product.type),
          productName: product.name,
          type: product.type,
          activeIngredients: product.keyIngredients,
          isCompatible: true,
          conflictReason: null,
          usageAdvice: product.usageTiming || 'Follow standard routine instructions.'
        });
      }
    });

    if (newItems.length > 0 && onUpdateUser) {
      onUpdateUser({
        ...user,
        shelf: [...currentShelf, ...newItems]
      });
    }
    setComparisonSelection([]); // Clear selection after adding
  };

  const isProductInShelf = (productName: string) => {
    return user?.shelf?.some(item => item.productName === productName) || false;
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedProducts).map(([category, items]) => {
          const isExpanded = expandedCategory === category;
          const topPick = items.find(p => p.isTopPick) || items[0];

          return (
            <div key={category} className={`bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden ${isExpanded ? 'border-stone-200 shadow-xl ring-1 ring-stone-50' : 'border-stone-100 shadow-sm hover:shadow-md'}`}>
                
                {/* Collapsed/Header View */}
                <div 
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                    className="p-6 cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-8 bg-stone-800 rounded-full"></span>
                            <h3 className="font-serif text-2xl text-stone-900">{category}</h3>
                            <span className="bg-stone-100 text-stone-500 text-xs font-bold px-2 py-1 rounded-full">{items.length} Options</span>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-stone-50 text-stone-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-stone-900 text-white' : ''}`}>
                            <ChevronDown size={20} />
                        </div>
                    </div>

                    {!isExpanded && (
                        <div className="flex items-center gap-4 animate-fade-in">
                            <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                                <img src={getProductImage(topPick.type)} alt={topPick.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={12} className="text-sage-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-sage-600">Top Recommendation</span>
                                </div>
                                <h4 className="font-bold text-stone-800">{topPick.name}</h4>
                                <div className="flex items-center gap-2 mt-1 mb-2">
                                    {topPick.estimatedPrice && (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            ₹{topPick.estimatedPrice.toFixed(0)}
                                        </span>
                                    )}
                                    {topPick.priceRange && (
                                        <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                                            {topPick.priceRange}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-stone-500 line-clamp-1">{topPick.reason}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Expanded View */}
                <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                        <div className="p-6 pt-0 space-y-6">
                            <p className="text-sm text-stone-500 border-l-2 border-stone-200 pl-4 italic">
                                "We found {items.length} matches for this category. Compare to find your preference."
                            </p>

                            <div className="grid gap-4">
                                {[...items].sort((a, b) => (b.isTopPick ? 1 : 0) - (a.isTopPick ? 1 : 0)).map((product, idx) => {
                                    const isSelected = comparisonSelection.find(p => p.name === product.name);
                                    const isTopPick = product.isTopPick || (idx === 0 && !items.some(p => p.isTopPick));
                                    const inShelf = isProductInShelf(product.name);

                                    return (
                                        <div 
                                            key={idx} 
                                            className={`relative rounded-2xl border p-4 transition-all flex flex-col md:flex-row gap-4 ${isSelected ? 'border-sage-500 bg-sage-50/50' : 'border-stone-100 bg-white hover:border-stone-300'}`}
                                            onClick={(e) => toggleComparison(product, e)}
                                        >
                                            {/* Product Image */}
                                            <div className="w-full md:w-32 h-32 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 relative">
                                                <img src={getProductImage(product.type)} alt={product.name} className="w-full h-full object-cover" />
                                                {isTopPick && <div className="absolute top-2 left-2 bg-stone-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">#1 Pick</div>}
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-lg text-stone-900 mb-1">{product.name}</h4>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {product.estimatedPrice && (
                                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                                    ₹{product.estimatedPrice.toFixed(0)}
                                                                </span>
                                                            )}
                                                            {product.priceRange && (
                                                                <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                                                                    {product.priceRange}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-sage-500 border-sage-500 text-white' : 'border-stone-300 text-transparent'}`}>
                                                        <Check size={14} />
                                                    </div>
                                                </div>
                                                <p className="text-sm text-stone-600 mb-3">{product.description}</p>
                                                
                                                {/* Reason Badge */}
                                                <div className="bg-white/50 inline-block rounded-lg p-2 border border-stone-100 mb-3">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                                                        <Zap size={10} className="text-amber-500" /> AI Reasoning
                                                    </div>
                                                    <p className="text-xs text-stone-700 italic">"{product.reason}"</p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {product.keyIngredients.slice(0,3).map((ing, i) => (
                                                        <span key={i} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded-md">{ing}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <div className="md:w-36 flex flex-col justify-end gap-2">
                                                <button 
                                                    onClick={(e) => handleAddToShelf(product, e)}
                                                    className={`w-full py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${inShelf ? 'bg-sage-100 text-sage-700 border border-sage-200' : 'bg-white border-2 border-stone-200 text-stone-700 hover:border-stone-400'}`}
                                                >
                                                    {inShelf ? <><Check size={12} /> In Shelf</> : <><Plus size={12} /> Mark as Bought</>}
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`https://www.amazon.in/s?k=${encodeURIComponent(product.name + ' ' + product.type)}`, '_blank');
                                                    }}
                                                    className="w-full py-2 bg-stone-900 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-black"
                                                >
                                                    <ShoppingBag size={12} /> Buy Now
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          );
      })}

      {/* Comparison Floating Action - Portal ensures fixed positioning works relative to viewport */}
      {comparisonSelection.length > 0 && createPortal(
          <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-4 z-[9999] animate-slide-up pointer-events-none">
              {comparisonSelection.length >= 2 && (
                  <button 
                      onClick={() => setShowComparisonModal(true)}
                      className="bg-stone-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold hover:scale-105 transition-transform border border-stone-700 pointer-events-auto"
                  >
                      <Scale size={20} /> Compare {comparisonSelection.length}
                  </button>
              )}
              <button 
                  onClick={() => handleAddMultipleToShelf(comparisonSelection)}
                  className="bg-sage-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold hover:scale-105 transition-transform border border-sage-700 pointer-events-auto"
              >
                  <Plus size={20} /> Mark {comparisonSelection.length} as Bought
              </button>
          </div>,
          document.body
      )}

      {/* Comparison Modal - Portal ensures full viewport coverage */}
      {showComparisonModal && createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fade-in" onClick={() => setShowComparisonModal(false)}>
              <div className="bg-white rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                  
                  {/* Header */}
                  <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-white z-10">
                      <div>
                          <h3 className="font-serif text-3xl text-stone-900">Product Comparison</h3>
                          <p className="text-stone-500 text-sm mt-1">Side-by-side analysis of your selected options.</p>
                      </div>
                      <button onClick={() => setShowComparisonModal(false)} className="p-3 bg-stone-100 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Body */}
                  <div className="overflow-y-auto flex-1 p-6 md:p-8 bg-stone-50">
                      
                      {/* Top Cards Comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto mb-10">
                          {comparisonSelection.map((product, idx) => {
                             const isWinner = product.isTopPick || (idx === 0 && !comparisonSelection.some(p => p.isTopPick)); 
                             const inShelf = isProductInShelf(product.name);
                             
                             return (
                                <div key={idx} className={`bg-white p-6 rounded-[2rem] shadow-sm border flex flex-col h-full relative group transition-colors ${isWinner ? 'border-sage-300 ring-4 ring-sage-50' : 'border-stone-200/60'}`}>
                                    
                                    <div className="h-56 rounded-[1.5rem] bg-stone-100 overflow-hidden mb-6 border border-stone-100 relative">
                                         <img src={getProductImage(product.type)} alt={product.name} className="w-full h-full object-cover" />
                                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                         
                                         {/* Winner Badge - Fixed Position inside Image container to avoid clipping */}
                                         {isWinner && (
                                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-sage-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg z-20 flex items-center gap-1.5 whitespace-nowrap">
                                                <Sparkles size={12} /> Top Match
                                            </div>
                                         )}
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="font-serif text-2xl font-bold text-stone-900 mb-2 leading-tight">{product.name}</h4>
                                        <div className="flex items-center gap-2 mb-4">
                                            {product.estimatedPrice && (
                                                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                                    ₹{product.estimatedPrice.toFixed(0)}
                                                </span>
                                            )}
                                            {product.priceRange && (
                                                <span className="text-sm font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                                                    {product.priceRange}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-stone-500 mb-6">{product.description}</p>

                                        <div className="space-y-6">
                                            <div className={`p-4 rounded-2xl border ${isWinner ? 'bg-sage-50/50 border-sage-100' : 'bg-stone-50 border-stone-100'}`}>
                                                <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isWinner ? 'text-sage-600' : 'text-stone-400'}`}>
                                                    <Zap size={12} className="fill-current" /> AI Verdict
                                                </div>
                                                <p className="text-sm text-stone-700 italic leading-relaxed">"{product.reason}"</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-stone-100 space-y-3">
                                        <button 
                                            onClick={(e) => handleAddToShelf(product, e)}
                                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${inShelf ? 'bg-sage-100 text-sage-700 border border-sage-200' : 'bg-white border-2 border-stone-200 text-stone-700 hover:border-stone-400'}`}
                                        >
                                            {inShelf ? <><Check size={16} /> Added to Shelf</> : <><Plus size={16} /> Mark as Bought</>}
                                        </button>
                                        <button 
                                            onClick={() => window.open(`https://www.amazon.in/s?k=${encodeURIComponent(product.name + ' ' + product.type)}`, '_blank')}
                                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:translate-y-[-2px] ${
                                                isWinner 
                                                ? 'bg-stone-900 text-white hover:bg-black hover:shadow-stone-500/30' 
                                                : 'bg-stone-800 text-white hover:bg-stone-900'
                                            }`}
                                        >
                                            <ShoppingBag size={16} /> Buy Now
                                        </button>
                                    </div>
                                </div>
                             );
                          })}
                      </div>

                      {/* Detailed Comparison Table */}
                      <div className="bg-white rounded-[2rem] border border-stone-200 p-8 shadow-sm">
                         <div className="flex items-center gap-2 mb-6 pb-4 border-b border-stone-100">
                             <Scale className="text-stone-400" size={24} />
                             <h4 className="font-serif text-2xl text-stone-800">The Nitty Gritty</h4>
                         </div>
                         
                         <div className="grid grid-cols-3 gap-x-8 gap-y-8 text-sm">
                             {/* Headers */}
                             <div className="font-bold text-xs uppercase tracking-widest text-stone-400 py-2">Feature</div>
                             {comparisonSelection.map((p, i) => (
                                 <div key={i} className={`font-bold text-lg text-stone-900 pb-2 ${p.isTopPick || (i === 0 && !comparisonSelection.some(x => x.isTopPick)) ? 'text-sage-700' : ''}`}>
                                     {p.isTopPick || (i === 0 && !comparisonSelection.some(x => x.isTopPick)) ? 'Top Pick' : 'Alternative'}
                                 </div>
                             ))}

                             {/* Row: Product Type */}
                             <div className="font-medium text-stone-500 flex items-center gap-2">
                                <Layers size={14} /> Product Type
                             </div>
                             {comparisonSelection.map((p, i) => (
                                 <div key={i} className="text-stone-700 font-medium capitalize">{p.type}</div>
                             ))}

                             {/* Row: Key Ingredients */}
                             <div className="font-medium text-stone-500 flex items-center gap-2">
                                <Droplets size={14} /> Key Actives
                             </div>
                             {comparisonSelection.map((p, i) => (
                                 <div key={i} className="flex flex-wrap gap-1">
                                     {p.keyIngredients.map((ing, idx) => (
                                         <span key={idx} className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs font-medium">
                                             {ing}
                                         </span>
                                     ))}
                                 </div>
                             ))}

                             {/* Row: Primary Benefit */}
                             <div className="font-medium text-stone-500 flex items-center gap-2">
                                <ShieldCheck size={14} /> Main Benefit
                             </div>
                             {comparisonSelection.map((p, i) => (
                                 <div key={i} className="text-stone-600 leading-relaxed">
                                     {p.description}
                                 </div>
                             ))}
                             
                             {/* Row: Usage */}
                             <div className="font-medium text-stone-500 flex items-center gap-2">
                                <Clock size={14} /> When to Use
                             </div>
                             {comparisonSelection.map((p, i) => (
                                 <div key={i} className="text-stone-600">
                                     {p.usageTiming || (p.category === 'Sunscreen' ? 'Morning Only' : p.category === 'Cleanser' ? 'AM & PM' : 'Follow Routine')}
                                 </div>
                             ))}
                         </div>
                      </div>

                  </div>
              </div>
          </div>,
          document.body
      )}

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onLogin={(u) => {
            if (onUpdateUser) onUpdateUser(u);
            setShowAuthModal(false);
          }} 
        />
      )}
    </div>
  );
};

export default ProductShowcase;
