
import React, { useState } from 'react';
import { RoutineStep, SkincareProduct, UserProfile } from '../types';
import { Sun, Moon, Calendar, Check, ChevronDown, Clock, Info, Droplets, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';

interface RoutineViewerProps {
  routine: {
    morning: RoutineStep[];
    evening: RoutineStep[];
    weekly: RoutineStep[];
  };
  products: SkincareProduct[];
  user?: UserProfile | null;
}

const RoutineViewer: React.FC<RoutineViewerProps> = ({ routine, products, user }) => {
  const [activeTab, setActiveTab] = useState<'morning' | 'evening' | 'weekly'>('morning');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const toggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(completedSteps);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setCompletedSteps(newSet);
  };

  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('cleans')) return '💧';
    if (t.includes('toner')) return '✨';
    if (t.includes('serum')) return '🧪';
    if (t.includes('moisturizer') || t.includes('cream')) return '🧴';
    if (t.includes('sun')) return '☀️';
    if (t.includes('mask') || t.includes('exfolia')) return '🎭';
    if (t.includes('eye')) return '👁️';
    return '✨';
  };

  // Helper to find a matching product for the routine step
  const getSuggestedProduct = (stepType: string) => {
      // First check if user has a product in their shelf that matches
      if (user?.shelf) {
          const shelfMatch = user.shelf.find(p => 
              p.type.toLowerCase().includes(stepType.toLowerCase()) || 
              stepType.toLowerCase().includes(p.type.toLowerCase())
          );
          if (shelfMatch) {
              return {
                  name: shelfMatch.productName,
                  type: shelfMatch.type,
                  category: shelfMatch.type,
                  description: shelfMatch.usageAdvice,
                  keyIngredients: shelfMatch.activeIngredients,
                  reason: 'From your Smart Shelf',
                  isTopPick: false,
                  isFromShelf: true
              } as SkincareProduct & { isFromShelf?: boolean };
          }
      }

      // Fallback to AI recommendations
      const aiMatch = products.find(p => 
          p.type.toLowerCase().includes(stepType.toLowerCase()) || 
          p.category.toLowerCase().includes(stepType.toLowerCase()) ||
          stepType.toLowerCase().includes(p.category.toLowerCase())
      );
      
      if (aiMatch) {
          return { ...aiMatch, isFromShelf: false } as SkincareProduct & { isFromShelf?: boolean };
      }
      return undefined;
  };

  const currentRoutine = routine?.[activeTab] || [];

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden relative transition-colors duration-300">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sage-50 rounded-full blur-3xl -z-0 opacity-50 translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Header / Tabs */}
      <div className="bg-stone-50/80 backdrop-blur-md p-2 flex gap-1 border-b border-stone-100 sticky top-0 z-20">
        {[
          { id: 'morning', label: 'Morning', icon: Sun, color: 'text-amber-500' },
          { id: 'evening', label: 'Evening', icon: Moon, color: 'text-indigo-500' },
          { id: 'weekly', label: 'Weekly', icon: Calendar, color: 'text-teal-500' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setExpandedStep(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-300 font-bold text-sm ${
              activeTab === tab.id 
                ? 'bg-white shadow-md text-stone-800 scale-[1.02]' 
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
            }`}
          >
            <tab.icon size={16} className={activeTab === tab.id ? tab.color : 'text-stone-400'} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Routine Timeline */}
      <div className="p-6 md:p-8 relative min-h-[400px]">
        {currentRoutine.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-stone-400">
               <Sparkles className="mb-2 opacity-50" size={32} />
               <p>No steps scheduled for this time.</p>
           </div>
        ) : (
           <div className="space-y-6 relative">
              {/* Vertical Line */}
              <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-stone-100 -z-10"></div>

              {currentRoutine.map((step, idx) => {
                const stepId = `${activeTab}-${idx}`;
                const isCompleted = completedSteps.has(stepId);
                const isExpanded = expandedStep === idx;
                const suggestedProduct = getSuggestedProduct(step.productType);

                return (
                  <div 
                    key={idx}
                    onClick={() => setExpandedStep(isExpanded ? null : idx)}
                    className={`relative pl-16 transition-all duration-500 cursor-pointer group ${isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}`}
                  >
                    {/* Timeline Node */}
                    <div 
                        className={`absolute left-0 top-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border-2 transition-all duration-300 z-10 ${
                            isCompleted 
                            ? 'bg-sage-100 border-sage-200 scale-90' 
                            : isExpanded
                                ? 'bg-stone-900 border-stone-900 text-white scale-110 shadow-lg'
                                : 'bg-white border-stone-100 group-hover:border-sage-300 group-hover:scale-105'
                        }`}
                    >
                        {isCompleted ? <Check size={24} className="text-sage-600" /> : getIcon(step.productType)}
                    </div>

                    {/* Card Content */}
                    <div className={`bg-white border rounded-3xl p-5 transition-all duration-300 ${
                        isExpanded 
                        ? 'border-stone-200 shadow-xl ring-1 ring-stone-100' 
                        : 'border-stone-50 shadow-sm hover:shadow-md hover:border-stone-200'
                    }`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Step {idx + 1}</span>
                                    {isExpanded && <span className="bg-sage-50 text-sage-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{step.step}</span>}
                                </div>
                                <h4 className={`font-serif text-lg font-bold transition-colors ${isExpanded ? 'text-stone-900' : 'text-stone-700'}`}>
                                    {suggestedProduct ? `${step.productType} with ${suggestedProduct.name}` : step.productType}
                                </h4>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={(e) => toggleComplete(stepId, e)}
                                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                                        isCompleted 
                                        ? 'bg-sage-500 border-sage-500 text-white' 
                                        : 'border-stone-200 text-transparent hover:border-sage-400'
                                    }`}
                                >
                                    <Check size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Collapsed Instruction Preview */}
                        {!isExpanded && (
                            <p className="text-sm text-stone-500 mt-2 line-clamp-1 group-hover:text-stone-600">
                                {step.instruction}
                            </p>
                        )}

                        {/* Expanded Detail View */}
                        <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${isExpanded ? 'grid-rows-[1fr] mt-4 pt-4 border-t border-stone-100' : 'grid-rows-[0fr]'}`}>
                            <div className="overflow-hidden">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase tracking-wide mb-2">
                                            <Info size={14} className="text-sage-500" /> How to Apply
                                        </div>
                                        <p className="text-sm text-stone-600 leading-relaxed">
                                            {step.instruction}
                                        </p>
                                    </div>
                                    
                                    {/* Minimal Suggested Product */}
                                    {suggestedProduct && (
                                        <div className="mt-2 bg-stone-50 rounded-xl p-3 border border-stone-100 flex items-center gap-3 group/product hover:border-sage-200 transition-colors">
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-stone-300 border border-stone-100">
                                                <ShoppingBag size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`block text-[10px] font-bold uppercase ${suggestedProduct.isFromShelf ? 'text-indigo-500' : 'text-sage-600'}`}>
                                                    {suggestedProduct.isFromShelf ? 'From Shelf' : 'Recommended'}
                                                </span>
                                                <span className="block text-xs font-bold text-stone-800 truncate">{suggestedProduct.name}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(`https://www.amazon.in/s?k=${encodeURIComponent(suggestedProduct.name)}`, '_blank');
                                                }}
                                                className="p-2 text-stone-400 hover:text-stone-900"
                                            >
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="bg-stone-50 rounded-xl p-3 flex gap-3 items-start">
                                        <div className="bg-white p-1.5 rounded-lg shadow-sm text-amber-500 mt-0.5">
                                            <Sparkles size={14} />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-stone-800 mb-0.5">Pro Tip</span>
                                            <p className="text-xs text-stone-500 italic">
                                                {step.productType.includes('Cleanser') && "Massage for at least 60 seconds to fully break down debris."}
                                                {step.productType.includes('Moisturizer') && "Apply to slightly damp skin to lock in extra hydration."}
                                                {step.productType.includes('Serum') && "Press into skin rather than rubbing for better absorption."}
                                                {step.productType.includes('Sun') && "Don't forget your neck and ears. Reapply every 2 hours if outdoors."}
                                                {!step.productType.match(/Cleanser|Moisturizer|Serum|Sun/) && "Consistency is key for results."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center mt-2">
                             <ChevronDown size={16} className={`text-stone-300 transition-transform duration-300 ${isExpanded ? 'rotate-180 opacity-0' : 'group-hover:text-stone-400'}`} />
                        </div>
                    </div>
                  </div>
                );
              })}
           </div>
        )}
      </div>
    </div>
  );
};

export default RoutineViewer;
