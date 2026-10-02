
import React, { useRef, useState } from 'react';
import { Camera, Upload, AlertTriangle, Check, X, Loader2, Beaker, ScanLine } from 'lucide-react';
import { analyzeShelfProduct } from '../services/geminiService';
import { SmartShelfItem, SkinAnalysisResult, UserProfile } from '../types';
import { saveUserProfile } from '../services/storageService';
import Scanner from './Scanner';

interface SmartShelfProps {
  result: SkinAnalysisResult;
  user?: UserProfile | null;
  onUpdateUser?: (u: UserProfile) => void;
}

const SmartShelf: React.FC<SmartShelfProps> = ({ result, user, onUpdateUser }) => {
  const products = user?.shelf || [];
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (base64: string) => {
    setIsAnalyzing(true);
    try {
        const context = `
            User Skin Type: ${result.skinType}.
            Concerns: ${result.concerns.map(c => c.name).join(', ')}.
            Current Recommended Routine Ingredients: ${result.products.flatMap(p => p.keyIngredients).join(', ')}.
        `;
        
        const newItem = await analyzeShelfProduct(base64, context);
        
        if (user && onUpdateUser) {
            const updatedUser = { ...user, shelf: [newItem, ...products] };
            await saveUserProfile(updatedUser);
            onUpdateUser(updatedUser);
        }
    } catch (error) {
        alert("Could not analyze product. Please try a clearer image of the label.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const removeProduct = async (id: string) => {
      if (user && onUpdateUser) {
          const updatedUser = { ...user, shelf: products.filter(p => p.id !== id) };
          await saveUserProfile(updatedUser);
          onUpdateUser(updatedUser);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const base64 = event.target?.result as string;
        processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  if (showCamera) {
      return (
        <Scanner 
            mode="product"
            onCapture={(img) => {
                setShowCamera(false);
                processImage(img);
            }}
            onCancel={() => setShowCamera(false)}
        />
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-stone-100 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                    <h3 className="font-serif text-2xl text-stone-900 flex items-center gap-2">
                        <Beaker className="text-sage-500" /> My Smart Shelf
                    </h3>
                    <p className="text-stone-500 text-sm mt-1">Check your existing products for conflicts.</p>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                        onClick={() => setShowCamera(true)}
                        disabled={isAnalyzing || !user}
                        className="flex-1 sm:flex-none bg-stone-900 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-70 shadow-lg"
                        title={!user ? "Log in to save products" : ""}
                    >
                        {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                        {isAnalyzing ? "Scanning..." : "Scan Bottle"}
                    </button>
                    
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzing || !user}
                        className="px-4 py-3 border border-stone-200 rounded-xl hover:bg-stone-50 text-stone-600 transition-colors disabled:opacity-50"
                        title={!user ? "Log in to save products" : ""}
                    >
                        <Upload size={20} />
                    </button>
                </div>
            </div>

            {!user ? (
                 <div className="text-center py-8 bg-stone-50 rounded-2xl border border-stone-200">
                     <p className="text-stone-500 text-sm">Please log in to manage your Smart Shelf.</p>
                 </div>
            ) : products.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-stone-100 rounded-3xl bg-stone-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-stone-300">
                        <ScanLine size={24} />
                    </div>
                    <h4 className="font-serif text-lg text-stone-600 mb-1">Your shelf is empty</h4>
                    <p className="text-stone-400 text-sm max-w-xs mx-auto">
                        Take a photo of a product label to identify ingredients and check for routine conflicts.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 w-full">
                    {products.map((item) => (
                        <div key={item.id} className="bg-white border border-stone-200 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-start shadow-sm hover:shadow-md transition-shadow w-full overflow-hidden">
                            <div className="w-full sm:w-20 h-48 sm:h-20 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                                <img src={item.image} className="w-full h-full object-cover" alt="Product" />
                                <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${item.isCompatible ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                            
                            <div className="flex-1 min-w-0 w-full">
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0 flex-1 pr-2">
                                        <h4 className="font-bold text-stone-900 text-sm truncate">{item.productName}</h4>
                                        <p className="text-xs text-stone-500 capitalize truncate">{item.type}</p>
                                    </div>
                                    <button onClick={() => removeProduct(item.id)} className="text-stone-300 hover:text-stone-500 flex-shrink-0">
                                        <X size={16} />
                                    </button>
                                </div>
                                
                                <div className="mt-3 flex items-start gap-2 text-sm w-full">
                                    {item.isCompatible ? (
                                        <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                                    ) : (
                                        <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <span className={`font-bold text-xs uppercase tracking-wide ${item.isCompatible ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.isCompatible ? 'Safe Match' : 'Caution'}
                                        </span>
                                        <p className="text-stone-600 text-xs mt-1 leading-relaxed break-words">
                                            {item.isCompatible ? item.usageAdvice : item.conflictReason}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-1">
                                    {item.activeIngredients.map((ing, i) => (
                                        <span key={i} className="text-[10px] bg-stone-50 text-stone-400 px-2 py-0.5 rounded border border-stone-100 truncate max-w-full">
                                            {ing}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default SmartShelf;
