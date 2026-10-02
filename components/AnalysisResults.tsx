
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { SkinAnalysisResult, ClinicResult, UserProfile } from '../types';
import HealingSlider from './HealingSlider';
import DermatologyReport from './DermatologyReport';
import DrLumiereChat from './DrLumiereChat';
import ScoreBreakdown from './ScoreBreakdown';
import SkinMapOverlay from './SkinMapOverlay';
import RoutineViewer from './RoutineViewer';
import ProductShowcase from './ProductShowcase';
import EnvironmentalMonitor from './EnvironmentalMonitor';
import SmartShelf from './SmartShelf';
import SkinIssuesOverview from './SkinIssuesOverview';
import ProfileSettings from './ProfileSettings'; // Imported
import ProductTrials from './ProductTrials'; // Imported
import { ArrowLeft, ArrowRight, Zap, Sun, Moon, Info, Volume2, MapPin, ExternalLink, Loader2, Search, Calendar, CheckCircle2, ShoppingBag, Star, Navigation, FileText, Phone, Clock, MessageCircle, X, Sparkles, UserCheck, Save, Check, Beaker, Copy, Stethoscope, Banknote, Leaf, Plus, Trash2, User, LogOut, History, HeartPulse } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_HISTORY } from '../constants';
import { speakSummary, findNearbyClinics, findClinicsByCity } from '../services/geminiService';
import { saveScan, getAllScans, saveUserProfile } from '../services/storageService';
import { SavedScan } from '../types';
import { createPortal } from 'react-dom';
import AuthModal from './AuthModal';

interface AnalysisResultsProps {
  result: SkinAnalysisResult;
  image: string;
  isExistingScan?: boolean;
  onReset: () => void;
  user: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onViewJourney: () => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, image, isExistingScan = false, onReset, user, onLogin, onLogout, onViewJourney }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'routine' | 'products' | 'clinics' | 'shelf' | 'report' | 'lab'>('overview');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [clinics, setClinics] = useState<ClinicResult | null>(null);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [cityInput, setCityInput] = useState('');
  
  // Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Chat Modal State
  const [showChat, setShowChat] = useState(false);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(user);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Referral Copied State
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Lifestyle State
  const [lifestyleFactors, setLifestyleFactors] = useState<string[]>([]);
  const [newFactor, setNewFactor] = useState('');
  const [isAddingFactor, setIsAddingFactor] = useState(false);
  const [historyData, setHistoryData] = useState<{date: string, score: number}[]>([]);
  const [showScoreModal, setShowScoreModal] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const scans = await getAllScans();
        const sorted = scans.sort((a, b) => a.timestamp - b.timestamp);
        let formatted = sorted.map(s => ({
          date: new Date(s.timestamp).toISOString().split('T')[0],
          score: s.score
        }));
        
        // If there's no history or just one, add the current score to make a trend
        if (formatted.length === 0) {
           formatted = [{ date: new Date().toISOString().split('T')[0], score: result.healthScore }];
        } else if (!formatted.find(f => f.date === new Date().toISOString().split('T')[0] && f.score === result.healthScore)) {
           // If the current scan isn't in history yet (e.g. before auto-save completes), add it for the chart
           formatted.push({ date: new Date().toISOString().split('T')[0], score: result.healthScore });
        }
        
        setHistoryData(formatted);
      } catch (e) {
        console.error("Failed to load history for chart", e);
        setHistoryData([{ date: new Date().toISOString().split('T')[0], score: result.healthScore }]);
      }
    };
    fetchHistory();
  }, [result]);

  useEffect(() => {
    if (result.reportData.lifestyleImpact) {
        setLifestyleFactors(result.reportData.lifestyleImpact);
    }
  }, [result]);

  const handleAddFactor = () => {
    if (newFactor.trim()) {
        setLifestyleFactors([...lifestyleFactors, newFactor.trim()]);
        setNewFactor('');
        setIsAddingFactor(false);
    }
  };

  const handleRemoveFactor = (index: number) => {
    const updated = [...lifestyleFactors];
    updated.splice(index, 1);
    setLifestyleFactors(updated);
  };

  // Auto-save if user is logged in
  useEffect(() => {
    if (currentUser && !isSaved && !isSaving && !isExistingScan) {
        const autoSave = async () => {
            setIsSaving(true);
            try {
                await saveScan(result, image);
                
                // Auto-track spots
                if (currentUser.watchlist && currentUser.watchlist.length > 0) {
                    const autoTrackedSpots = currentUser.watchlist.filter(s => s.autoTrack && s.coordinates);
                    
                    // Group by label to only track the latest one per label
                    const latestAutoTracked = autoTrackedSpots.reduce((acc, spot) => {
                        if (!acc[spot.label] || new Date(spot.dateAdded) > new Date(acc[spot.label].dateAdded)) {
                            acc[spot.label] = spot;
                        }
                        return acc;
                    }, {} as Record<string, any>);

                    const spotsToTrack = Object.values(latestAutoTracked);
                    
                    if (spotsToTrack.length > 0) {
                        const img = new Image();
                        img.onload = async () => {
                            const newSpots = [];
                            for (const spot of spotsToTrack) {
                                const canvas = document.createElement('canvas');
                                const coords = spot.coordinates;
                                const size = Math.max(coords.width * img.naturalWidth, coords.height * img.naturalHeight, 150);
                                canvas.width = size;
                                canvas.height = size;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                    const cx = (coords.x + coords.width/2) * img.naturalWidth;
                                    const cy = (coords.y + coords.height/2) * img.naturalHeight;
                                    ctx.drawImage(img, cx - size/2, cy - size/2, size, size, 0, 0, size, size);
                                    
                                    newSpots.push({
                                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                                        dateAdded: new Date().toISOString(),
                                        label: spot.label,
                                        imageCrop: canvas.toDataURL('image/jpeg', 0.8),
                                        autoTrack: true,
                                        coordinates: coords
                                    });
                                }
                            }
                            
                            if (newSpots.length > 0) {
                                const updatedUser = {
                                    ...currentUser,
                                    watchlist: [...(currentUser.watchlist || []), ...newSpots]
                                };
                                await saveUserProfile(updatedUser);
                                setCurrentUser(updatedUser);
                            }
                        };
                        img.src = image;
                    }
                }
                
                setIsSaved(true);
            } catch (e) {
                console.error("Auto-save failed", e);
            } finally {
                setIsSaving(false);
            }
        };
        autoSave();
    } else if (isExistingScan) {
        setIsSaved(true);
    }
  }, [currentUser, isSaved, isSaving, result, image, isExistingScan]);

  const handleSaveToJourney = async () => {
    if (!currentUser) {
        setShowAuthModal(true);
        return;
    }
    
    if (isSaved) return;

    setIsSaving(true);
    try {
        await saveScan(result, image);
        setIsSaved(true);
    } catch (e) {
        console.error("Save failed", e);
        alert("Could not save scan. Storage might be full.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const audioBufferData = await speakSummary(result.summary);
      const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (!audioContext) setAudioContext(ctx);

      const dataInt16 = new Int16Array(audioBufferData);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (error) {
      console.error("Audio failed", error);
      setIsSpeaking(false);
    }
  };

  const handleFindClinics = () => {
    setLoadingClinics(true);
    setActiveTab('clinics');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const concernNames = result.concerns.map(c => c.name);
        const data = await findNearbyClinics(pos.coords.latitude, pos.coords.longitude, concernNames);
        setClinics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingClinics(false);
      }
    }, () => {
      alert("Location access required to find nearby clinics. Try searching by city name instead.");
      setLoadingClinics(false);
    });
  };

  const handleCitySearch = async () => {
    if (!cityInput.trim()) return;
    setLoadingClinics(true);
    setActiveTab('clinics');
    try {
        const concernNames = result.concerns.map(c => c.name);
        const data = await findClinicsByCity(cityInput, concernNames);
        setClinics(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingClinics(false);
    }
  };

  const generateReferralText = () => {
    const text = `
MEDICAL HANDOVER NOTE
Generated by Lumière AI Dermatology

PATIENT PROFILE:
- Fitzpatrick: ${result.reportData.fitzpatrickType}

PRIMARY CONCERNS:
${result.concerns.map(c => `- ${c.name} (${c.severity})`).join('\n')}

CLINICAL OBSERVATIONS:
${result.summary}

This patient is seeking professional consultation for the above conditions.
    `;
    return text.trim();
  };

  const copyReferral = () => {
      navigator.clipboard.writeText(generateReferralText());
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
  };

  return (
    <div className="min-h-screen pb-20 animate-slide-up bg-cream text-stone-900 overflow-x-hidden transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-2 md:gap-3">
            <button onClick={onReset} className="p-2 -ml-2 text-stone-500 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100">
            <ArrowLeft size={20} />
            </button>
            <h2 className="font-serif text-lg md:text-xl text-stone-800 truncate max-w-[150px] md:max-w-none">Lumière Report</h2>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {currentUser && (
               <div className="flex items-center gap-1 md:gap-2">
                   <button onClick={onLogout} className="hidden md:block p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors" title="Log Out">
                       <LogOut size={18} />
                   </button>
                   <button onClick={onViewJourney} className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors" title="View History">
                       <History size={18} />
                   </button>
                   <button onClick={() => setShowProfileModal(true)} className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors" title="Profile">
                       <User size={18} />
                   </button>
               </div>
          )}

          <button 
            onClick={handleSaveToJourney}
            disabled={isSaving || isSaved}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                isSaved 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-stone-900 text-white hover:bg-black border border-stone-900'
            }`}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : isSaved ? <Check size={14} /> : <Save size={14} />}
            {isSaved ? 'Saved' : 'Save'}
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
                <span className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold">Skin Health</span>
                <span className="text-[10px] text-stone-900 font-bold">Score out of 100</span>
            </div>
            <button 
                onClick={() => setShowScoreModal(true)}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-stone-900 text-white flex items-center justify-center font-serif font-bold text-sm md:text-lg shadow-lg border-2 border-stone-100 flex-shrink-0 hover:scale-105 transition-transform cursor-pointer"
                title="View Score Details"
            >
                {result.healthScore}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 print:p-0 print:max-w-none overflow-x-hidden">
        
        <div className="print:hidden">
            <div className="flex p-1 bg-stone-100 rounded-xl sticky top-20 z-30 shadow-sm mx-auto overflow-x-auto no-scrollbar max-w-full md:max-w-2xl">
            {(['overview', 'routine', 'products', 'shelf', 'clinics', 'report'] as const).map((tab) => (
                <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[80px] py-2 px-2 text-xs font-medium rounded-lg capitalize transition-all whitespace-nowrap flex items-center justify-center gap-1 ${
                    activeTab === tab 
                    ? 'bg-white text-stone-800 shadow-sm' 
                    : 'text-stone-500 hover:text-stone-700'
                }`}
                >
                {tab === 'shelf' ? 'Smart Shelf' : tab === 'report' ? 'Pro Report' : tab}
                </button>
            ))}
            </div>
        </div>

        <div className="animate-fade-in min-h-[300px]">
          {activeTab === 'report' && (
             <DermatologyReport result={{...result, reportData: {...result.reportData, lifestyleImpact: lifestyleFactors}}} />
          )}

          {activeTab === 'shelf' && (
             <SmartShelf 
                result={result} 
                user={currentUser} 
                onUpdateUser={(u) => {
                    setCurrentUser(u);
                    onLogin(u);
                }}
             />
          )}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT COLUMN: Visual Analysis (Sticky on Desktop) */}
              <div className="lg:col-span-5 lg:sticky lg:top-32 h-fit space-y-6">
                  <section className="animate-fade-in">
                      <SkinMapOverlay 
                        image={image} 
                        result={result} 
                        user={currentUser}
                        onUpdateUser={(u) => {
                            setCurrentUser(u);
                            onLogin(u);
                        }}
                      />
                  </section>
                  
                  <section>
                    <HealingSlider originalImage={image} />
                  </section>
              </div>

              {/* RIGHT COLUMN: Data & Insights */}
              <div className="lg:col-span-7 space-y-8">
                  {/* Environmental Monitor Widget */}
                  <div className="animate-slide-up">
                     <EnvironmentalMonitor recommendedSunscreen={result.products.find(p => p.category === 'Sunscreen' && p.isTopPick) || result.products.find(p => p.category === 'Sunscreen')} />
                  </div>

                  {/* Skin Score Breakdown */}
                  <section className="animate-fade-in">
                      <ScoreBreakdown result={result} />
                  </section>

                  {/* Cycle Tracker Status */}
                  {currentUser?.cycleTracker?.isTracking && (
                      <section className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm animate-fade-in">
                          <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                                  <HeartPulse size={20} />
                              </div>
                              <div>
                                  <h3 className="font-serif text-lg font-bold text-stone-900">Hormonal Sync Active</h3>
                                  <p className="text-xs text-stone-500 font-medium">AI is monitoring your cycle for breakout predictions.</p>
                              </div>
                          </div>
                          <div className="bg-white/60 rounded-2xl p-4 text-sm text-stone-700 leading-relaxed border border-rose-50/50">
                              Based on your cycle data, Lumière adjusts your routine recommendations to proactively manage hormonal fluctuations. Check your routine for specific guidance.
                          </div>
                      </section>
                  )}

                  {/* Lifestyle Factors (New) */}
                  <section className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                       <div className="flex items-center gap-2 mb-4">
                            <Leaf size={18} className="text-green-600" />
                            <h3 className="font-serif text-lg font-bold">Lifestyle Impact</h3>
                       </div>
                       <div className="flex flex-wrap gap-2">
                             {lifestyleFactors.map((factor, idx) => (
                                 <div key={idx} className="bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-full text-xs font-medium text-stone-700 flex items-center gap-2 group">
                                     {factor}
                                     <button onClick={() => handleRemoveFactor(idx)} className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Trash2 size={12} />
                                     </button>
                                 </div>
                             ))}
                             {isAddingFactor ? (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={newFactor}
                                        onChange={(e) => setNewFactor(e.target.value)}
                                        placeholder="Add..."
                                        className="w-24 px-2 py-1 rounded-full border border-stone-300 text-xs focus:outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddFactor()}
                                        autoFocus
                                    />
                                    <button onClick={handleAddFactor} className="p-1 bg-stone-900 text-white rounded-full"><Check size={10} /></button>
                                    <button onClick={() => setIsAddingFactor(false)} className="p-1 bg-stone-200 text-stone-600 rounded-full"><X size={10} /></button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setIsAddingFactor(true)}
                                    className="px-3 py-1.5 rounded-full border border-dashed border-stone-300 text-stone-400 text-xs hover:border-sage-400 hover:text-sage-600 flex items-center gap-1 transition-colors"
                                >
                                    <Plus size={12} /> Add
                                </button>
                            )}
                       </div>
                  </section>
    
                  <section>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                        <h3 className="font-serif text-xl text-stone-800">Your Skin Analysis</h3>
                        <button 
                            onClick={handleSpeak}
                            disabled={isSpeaking}
                            className={`p-2 rounded-full transition-all ${isSpeaking ? 'bg-sage-100 text-sage-600 animate-pulse' : 'bg-stone-50 text-stone-400 hover:text-sage-500 hover:bg-sage-50'}`}
                        >
                            <Volume2 size={20} />
                        </button>
                        </div>
                        <p className="text-stone-600 leading-relaxed text-sm italic border-l-2 border-sage-200 pl-4 py-1">
                        "{result.summary}"
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full bg-sage-50 text-sage-700 text-xs font-medium border border-sage-100 uppercase tracking-tight">
                            Type: {result.skinType}
                        </span>
                        {result.concerns.some(c => c.severity === 'high') && (
                            <button 
                            onClick={handleFindClinics}
                            className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100 flex items-center gap-1 hover:bg-rose-100 transition-colors"
                            >
                            <MapPin size={12} /> Find Specialist
                            </button>
                        )}
                        </div>
                    </div>
                  </section>
    
                  {/* Daily Habits Section */}
                  {result.dailyTips && result.dailyTips.length > 0 && (
                    <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                      <h3 className="font-serif text-lg mb-4 text-stone-800 flex items-center gap-2">
                        <CheckCircle2 className="text-sage-500" size={20} />
                        Daily Good Habits
                      </h3>
                      <div className="space-y-3">
                        {result.dailyTips.map((tip, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-stone-600">
                            <div className="w-6 h-6 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {i + 1}
                            </div>
                            {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
    
                  {/* Comprehensive Skin Issues Overview */}
                  <SkinIssuesOverview 
                      concerns={result.concerns} 
                      products={result.products} 
                      onViewProduct={() => setActiveTab('products')} 
                  />

                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                    <h3 className="font-serif text-lg mb-6 text-stone-800">Skin Vitality Trend</h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historyData.length > 1 ? historyData : [...historyData, ...historyData]}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8FA88F" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8FA88F" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#A0937D'}} 
                            tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, {month:'short', day:'numeric'})} />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}} />
                          <Area type="monotone" dataKey="score" stroke="#8FA88F" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'routine' && (
             <div className="animate-fade-in">
                 <div className="mb-6">
                    <h3 className="font-serif text-2xl text-stone-800">Your Daily Protocol</h3>
                    <p className="text-stone-500 text-sm">Follow these steps consistently for optimal results.</p>
                 </div>
                 <RoutineViewer routine={result.routine} products={result.products} user={currentUser} />
             </div>
          )}

          {activeTab === 'products' && (
             <div className="animate-fade-in">
                 <div className="mb-6">
                    <h3 className="font-serif text-2xl text-stone-800">Curated Essentials</h3>
                    <p className="text-stone-500 text-sm">Products scientifically matched to your {result.skinType} skin.</p>
                 </div>
                 <ProductShowcase 
                    products={result.products} 
                    user={currentUser}
                    onUpdateUser={(u) => {
                        setCurrentUser(u);
                        onLogin(u);
                    }}
                 />
             </div>
          )}

          {activeTab === 'clinics' && (
            <div className="space-y-8 animate-fade-in">
               
               {/* --- 3. EXISTING CLINIC SEARCH (Moved to Top) --- */}
               <div className="space-y-4">
                   <div className="flex items-center justify-between mb-2">
                     <div>
                        <h3 className="font-serif text-2xl text-stone-800">Find Specialists</h3>
                        <p className="text-stone-500 text-sm">Locate top-rated clinics near you.</p>
                     </div>
                     <button onClick={() => { setCityInput(''); setClinics(null); }} className="text-sage-500 hover:text-sage-700 hover:underline text-sm font-medium flex items-center gap-1">
                       <Navigation size={14} /> Clear
                     </button>
                   </div>
                   
                   <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm mb-4">
                      <div className="flex gap-2 mb-3">
                           <input 
                              type="text" 
                              placeholder="Enter your city..." 
                              value={cityInput}
                              onChange={(e) => setCityInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
                              className="flex-1 px-4 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-sage-200"
                           />
                           <button 
                              onClick={handleCitySearch}
                              disabled={!cityInput.trim() || loadingClinics}
                              className="bg-stone-900 text-white px-4 py-2 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                           >
                              <Search size={18} />
                           </button>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="h-px bg-stone-100 flex-1"></div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase">OR</span>
                          <div className="h-px bg-stone-100 flex-1"></div>
                      </div>
                      <button 
                          onClick={handleFindClinics}
                          className="w-full mt-3 py-2 border border-stone-200 rounded-xl text-stone-600 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 flex items-center justify-center gap-2"
                      >
                          <MapPin size={14} /> Use Current Location
                      </button>
                   </div>

                   {loadingClinics ? (
                     <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-stone-50 rounded-3xl border border-stone-100">
                       <Loader2 className="animate-spin text-sage-400" size={40} />
                       <p className="text-stone-400 font-serif italic text-lg">Finding the best care...</p>
                     </div>
                   ) : clinics ? (
                     <div className="grid gap-6">
                        <div className="grid gap-3">
                             <div className="text-xs font-bold uppercase tracking-widest text-stone-400 px-2">Recommended Sections</div>
                             {clinics.links.length > 0 ? clinics.links.map((link, idx) => (
                                 <a 
                                   key={idx}
                                   href={link.maps?.uri || '#'}
                                   target="_blank"
                                   rel="noreferrer"
                                   className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between hover:border-sage-300 transition-all hover:shadow-md group"
                                 >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center group-hover:bg-sage-50 group-hover:text-sage-600 transition-colors">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-stone-800 text-sm">{link.maps?.title || "View on Maps"}</h4>
                                            <p className="text-xs text-stone-400">Open in Google Maps</p>
                                        </div>
                                    </div>
                                    <ExternalLink size={16} className="text-stone-300 group-hover:text-sage-500 transition-colors" />
                                 </a>
                             )) : (
                                 <div className="text-center py-4 text-stone-400 text-sm italic">
                                     No direct map links available. Please use the names above to search.
                                 </div>
                             )}
                        </div>
                     </div>
                   ) : (
                     <div className="text-center py-12 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
                        <MapPin className="mx-auto text-stone-300 mb-4" size={48} />
                        <p className="text-stone-400 font-medium">Search above to see results here.</p>
                     </div>
                   )}
                </div>

               {/* --- 1. SMART REFERRAL CARD --- */}
               <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sage-500/10 rounded-full blur-3xl -z-0"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
                                <Stethoscope className="text-sage-300" /> Medical Handover
                            </h3>
                            <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-sage-200 backdrop-blur-sm">
                                AI Generated
                            </div>
                        </div>
                        <p className="text-stone-300 text-sm mb-6 max-w-lg">
                            Doctors are busy. Use this AI-generated summary to instantly communicate your history and scan results to a receptionist or dermatologist.
                        </p>
                        
                        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10 font-mono text-xs text-stone-300 mb-6 relative group">
                            <pre className="whitespace-pre-wrap font-sans">{generateReferralText()}</pre>
                            <button 
                                onClick={copyReferral}
                                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                            >
                                {copiedReferral ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={copyReferral}
                                className="flex-1 bg-white text-stone-900 py-3 rounded-xl font-bold text-sm hover:bg-stone-100 transition-colors flex items-center justify-center gap-2"
                            >
                                {copiedReferral ? <Check size={16} /> : <Copy size={16} />}
                                {copiedReferral ? "Copied to Clipboard" : "Copy for Receptionist"}
                            </button>
                        </div>
                    </div>
               </div>

               {/* --- 2. TREATMENT ESTIMATOR --- */}
               {result.reportData.clinicalTreatments && result.reportData.clinicalTreatments.length > 0 && (
                   <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-100">
                       <h3 className="font-serif text-2xl text-stone-800 mb-2 flex items-center gap-2">
                            <Banknote className="text-amber-500" /> Treatment Estimator
                       </h3>
                       <p className="text-stone-500 text-sm mb-6">Estimated market rates for procedures relevant to your condition.</p>
                       
                       <div className="grid gap-4">
                           {result.reportData.clinicalTreatments.map((treatment, idx) => (
                               <div key={idx} className="border border-stone-100 rounded-2xl p-4 hover:border-sage-200 transition-colors group">
                                   <div className="flex justify-between items-start mb-2">
                                       <h4 className="font-bold text-lg text-stone-800">{treatment.name}</h4>
                                       <span className="bg-stone-100 text-stone-600 text-xs font-bold px-2 py-1 rounded">
                                           {treatment.estimatedCost}
                                       </span>
                                   </div>
                                   <p className="text-sm text-stone-500 italic mb-3">"{treatment.relevance}"</p>
                                   <div className="flex items-center gap-2 text-xs text-stone-400 font-medium bg-stone-50 px-3 py-1.5 rounded-lg w-fit">
                                       <Clock size={12} /> Downtime: {treatment.downtime}
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
            </div>
          )}
        </div>
      </main>
      
      {createPortal(
        <button 
            onClick={() => setShowChat(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-stone-900 rounded-full shadow-2xl flex items-center justify-center text-white z-[50] hover:scale-105 active:scale-95 transition-all group"
        >
            <MessageCircle size={28} className="group-hover:text-sage-300 transition-colors" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>,
        document.body
      )}

      {showChat && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6">
          <div 
             className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
             onClick={() => setShowChat(false)}
          />
          <div className="relative w-full sm:max-w-md h-[85vh] sm:h-[650px] bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
              <DrLumiereChat result={result} onClose={() => setShowChat(false)} />
          </div>
        </div>,
        document.body
      )}
      
      {showAuthModal && (
        <AuthModal 
            onComplete={(u) => {
                onLogin(u);
                setCurrentUser(u);
                setShowAuthModal(false);
                handleSaveToJourney();
            }}
            onCancel={() => setShowAuthModal(false)}
        />
      )}

      {/* Profile Settings Modal */}
      {showProfileModal && currentUser && (
        <ProfileSettings 
            user={currentUser}
            onClose={() => setShowProfileModal(false)}
            onUpdate={(u) => {
                setCurrentUser(u);
                onLogin(u);
            }}
        />
      )}

      {/* Score Details Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
            <div 
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
                onClick={() => setShowScoreModal(false)}
            />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up p-6 md:p-8">
                <button 
                    onClick={() => setShowScoreModal(false)}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100"
                >
                    <X size={20} />
                </button>
                
                <div className="text-center space-y-4 mb-8">
                    <h3 className="font-serif text-2xl text-stone-900">Skin Health Score</h3>
                    <div className="w-24 h-24 mx-auto rounded-full bg-stone-900 text-white flex items-center justify-center font-serif font-bold text-4xl shadow-lg border-4 border-stone-100">
                        {result.healthScore}
                    </div>
                    <p className="text-sm text-stone-600">
                        Your score is dynamically calculated based on the severity and number of identified skin concerns, taking into account your historical progress.
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Historical Trend</h4>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData.length > 1 ? historyData : [...historyData, ...historyData]}>
                                    <defs>
                                        <linearGradient id="scoreGradientModal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1c1917" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#1c1917" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e4" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis domain={[0, 100]} hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ color: '#78716c', fontSize: '12px' }}
                                        itemStyle={{ color: '#1c1917', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#1c1917" strokeWidth={2} fillOpacity={1} fill="url(#scoreGradientModal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Score Breakdown</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-stone-600">Base Analysis</span>
                                <span className="font-medium text-stone-900">Visual Scan</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-stone-600">Historical Comparison</span>
                                <span className="font-medium text-stone-900">{historyData.length > 1 ? 'Active' : 'Pending (Need more scans)'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-stone-600">Concerns Tracked</span>
                                <span className="font-medium text-stone-900">{result.concerns.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AnalysisResults;
