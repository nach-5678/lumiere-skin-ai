
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Scanner from './components/Scanner';
import AnalysisResults from './components/AnalysisResults';
import LandingPage from './components/LandingPage';
import SkinJourney from './components/SkinJourney';
import AuthModal from './components/AuthModal';
import OnboardingQuiz from './components/OnboardingQuiz';
import { analyzeSkinImage } from './services/geminiService';
import { getUserProfile, clearUserProfile, saveUserProfile } from './services/storageService';
import { AppState, SkinAnalysisResult, UserProfile } from './types';
import { Sparkles, Activity, Lightbulb } from 'lucide-react';
import { auth, onAuthStateChanged } from './services/firebase';

const SKIN_FACTS = [
  "Did you know? Your skin renews itself every 28 days.",
  "Hydrated skin heals 30% faster than dry skin.",
  "Sun damage accounts for 80% of visible skin aging.",
  "Your skin is the body's largest organ, weighing about 8 lbs.",
  "Sleeping on your back can prevent sleep wrinkles.",
  "Vitamin C boosts sunscreen effectiveness when layered under it.",
];

const App = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [isExistingScan, setIsExistingScan] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [loadingFact, setLoadingFact] = useState<string>(SKIN_FACTS[0]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  
  // Secret Menu State
  const [secretClicks, setSecretClicks] = useState(0);
  const [showSecretMenu, setShowSecretMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('lumiere_model') || 'gemini-3.1-pro-preview');

  const handleSecretClick = () => {
      setSecretClicks(prev => {
          const newCount = prev + 1;
          if (newCount >= 5) {
              setShowSecretMenu(true);
              return 0;
          }
          return newCount;
      });
  };

  const handleModelChange = (model: string) => {
      setSelectedModel(model);
      localStorage.setItem('lumiere_model', model);
      setShowSecretMenu(false);
  };

  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
             const profile = await getUserProfile();
             if (profile) {
                 setUser(profile);
             } else {
                 // If new user from Google, create a basic profile
                 const newUser: UserProfile = {
                     name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                     email: firebaseUser.email || '',
                     joinedDate: new Date().toISOString(),
                     avatarUrl: firebaseUser.photoURL || undefined
                 };
                 await saveUserProfile(newUser);
                 setUser(newUser);
             }
             setShowAuthModal(false);
        } else {
            setUser(null);
            setAppState(AppState.LANDING);
        }
    });

    return () => {
        unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
      await clearUserProfile();
      setUser(null);
      setAppState(AppState.LANDING);
      setResult(null);
      setImage(null);
  };

  const handleStartScan = () => {
      if (!user) {
          setShowAuthModal(true);
      } else if (!user.medicalProfile || !user.selfReportedSkinType) {
          // If logged in but missing profile data, show quiz
          setShowQuiz(true);
      } else {
          setAppState(AppState.SCANNING);
      }
  };

  const handleCapture = async (capturedImage: string) => {
    setImage(capturedImage);
    setIsExistingScan(false);
    setAppState(AppState.ANALYZING);
    
    // Orchestrate fake loading steps for better UX
    const steps = [
      "Scanning facial geometry...",
      "Analyzing medical constraints...", 
      "Mapping pigmentation...",
      "Generating healing plan..."
    ];
    
    let stepIndex = 0;
    setLoadingStep(steps[0]);
    
    // Cycle Steps
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setLoadingStep(steps[stepIndex]);
      }
    }, 1000);

    // Cycle Facts
    let factIndex = 0;
    const factInterval = setInterval(() => {
        factIndex = (factIndex + 1) % SKIN_FACTS.length;
        setLoadingFact(SKIN_FACTS[factIndex]);
    }, 4500);

    try {
      const analysis = await analyzeSkinImage(capturedImage, user?.medicalProfile, user?.selfReportedSkinType, user?.cycleTracker, user?.budgetPreference);
      setResult(analysis);
      clearInterval(stepInterval);
      clearInterval(factInterval);
      setAppState(AppState.RESULTS);
    } catch (error) {
      console.error(error);
      clearInterval(stepInterval);
      clearInterval(factInterval);
      alert("Something went wrong with the analysis. Please try again.");
      setAppState(AppState.LANDING);
    }
  };

  const handleReset = () => {
    if (isExistingScan) {
      setImage(null);
      setResult(null);
      setIsExistingScan(false);
      setAppState(AppState.JOURNEY);
    } else {
      setImage(null);
      setResult(null);
      setIsExistingScan(false);
      setAppState(AppState.LANDING);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-stone-800 font-sans selection:bg-sage-200 overflow-x-hidden relative transition-colors duration-300">
      
      {showSecretMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full">
                <h3 className="font-serif text-xl font-bold mb-4 text-stone-900">Secret Settings</h3>
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-stone-700">Image Analysis Model</label>
                    <select 
                        value={selectedModel}
                        onChange={(e) => handleModelChange(e.target.value)}
                        className="w-full border border-stone-200 rounded-lg p-2 text-sm bg-white text-stone-900"
                    >
                        <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                        <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    </select>
                </div>
                <button 
                    onClick={() => setShowSecretMenu(false)}
                    className="mt-6 w-full bg-stone-900 text-white py-2 rounded-xl font-bold hover:bg-black transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
      )}

      {appState === AppState.LANDING && (
        <LandingPage 
            onStart={handleStartScan} 
            user={user}
            onLoginClick={() => setShowAuthModal(true)}
            onLogoutClick={handleLogout}
            onJourneyClick={() => setAppState(AppState.JOURNEY)}
            onSecretClick={handleSecretClick}
        />
      )}

      {appState === AppState.SCANNING && (
        <Scanner onCapture={handleCapture} onCancel={() => setAppState(AppState.LANDING)} />
      )}

      {appState === AppState.ANALYZING && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 relative overflow-hidden text-white">
          
          {/* Background Ambient Glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sage-900/30 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-900/20 rounded-full blur-[128px]"></div>

          {/* Main Visual: Scanned Image with Interactive Overlays */}
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-stone-800 shadow-2xl mb-12 z-10 bg-black">
               {image && (
                   <img 
                    src={image} 
                    className="absolute inset-0 w-full h-full object-cover opacity-50 filter grayscale contrast-125" 
                    alt="Processing" 
                   />
               )}
               {/* Grid Overlay */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(143,168,143,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(143,168,143,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
               
               {/* Moving Scanner Line */}
               <div className="absolute left-0 right-0 h-0.5 bg-sage-400 shadow-[0_0_20px_rgba(143,168,143,1)] animate-[scan_2s_ease-in-out_infinite] z-20"></div>

               {/* Random Data Points appearing */}
               <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-sage-400 rounded-full animate-ping"></div>
               <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-amber-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
               <div className="absolute top-1/2 left-1/2 w-20 h-20 border border-white/30 rounded-full flex items-center justify-center animate-pulse">
                   <div className="w-16 h-16 border border-white/50 rounded-full"></div>
               </div>
          </div>
          
          <div className="z-10 flex flex-col items-center space-y-8 max-w-md w-full px-6">
            
            <div className="text-center space-y-3">
              <h2 className="font-serif text-4xl animate-pulse flex items-center justify-center gap-3 text-stone-200">
                 <Activity className="text-sage-400" size={28} /> Analyzing...
              </h2>
              <div className="inline-block">
                <p className="text-sage-300 font-mono text-xs uppercase tracking-[0.2em] bg-stone-900/80 border border-stone-800 px-4 py-2 rounded-full backdrop-blur-md">
                  {loadingStep}
                </p>
              </div>
            </div>

            {/* UPGRADED FACT CARD */}
            <div className="w-full relative">
                <div 
                  key={loadingFact} // Key forces re-render for animation
                  className="bg-stone-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group animate-fact-slide-up"
                >
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 h-1 bg-sage-500/50 w-full">
                         <div className="h-full bg-sage-400 animate-[progress_4.5s_linear_forwards] origin-left"></div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-900/20">
                            <Lightbulb size={20} className="text-amber-700" />
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1">
                                <Sparkles size={10} className="text-sage-400" /> Did you know?
                            </span>
                            <p className="text-stone-200 font-serif text-lg leading-relaxed">
                                "{loadingFact}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

          </div>
          
          <style>{`
            @keyframes scan {
                0% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
            @keyframes fact-slide-up {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes progress {
                0% { width: 0%; }
                100% { width: 100%; }
            }
          `}</style>
        </div>
      )}

      {appState === AppState.RESULTS && result && image && (
        <AnalysisResults 
            result={result} 
            image={image} 
            isExistingScan={isExistingScan}
            onReset={handleReset} 
            user={user} 
            onLogin={(u) => setUser(u)}
            onLogout={handleLogout}
            onViewJourney={() => setAppState(AppState.JOURNEY)}
        />
      )}

      {appState === AppState.JOURNEY && user && (
        <SkinJourney 
            user={user}
            onBack={() => {
                if (image && result && !isExistingScan) {
                    setAppState(AppState.RESULTS);
                } else {
                    setImage(null);
                    setResult(null);
                    setIsExistingScan(false);
                    setAppState(AppState.LANDING);
                }
            }}
            onLogout={handleLogout}
            onViewReport={(scan) => {
                setResult(scan.analysis);
                setImage(scan.thumbnailUrl);
                setIsExistingScan(true);
                setAppState(AppState.RESULTS);
            }}
        />
      )}

      {/* Global Auth Modal for Landing Page trigger */}
      {showAuthModal && (
        <AuthModal 
            onComplete={(u) => {
                setUser(u);
                setShowAuthModal(false);
                // Immediately check if we need to show quiz
                if (!u.medicalProfile) setShowQuiz(true);
                else setAppState(AppState.SCANNING);
            }}
            onCancel={() => setShowAuthModal(false)}
        />
      )}

      {/* Onboarding Quiz - Triggers if logged in but no profile set */}
      {showQuiz && user && (
          <OnboardingQuiz
             user={user}
             onComplete={(u) => {
                 setUser(u);
                 setShowQuiz(false);
                 setAppState(AppState.SCANNING);
             }}
             onCancel={() => setShowQuiz(false)}
          />
      )}
    </div>
  );
};

export default App;
