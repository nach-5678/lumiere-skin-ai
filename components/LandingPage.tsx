import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  Sparkles, ArrowRight, Scan, Activity, Zap, 
  ArrowUpRight, Fingerprint, Microscope, Layers, 
  ShieldCheck, Droplets, Clock, BrainCircuit, 
  CheckCircle2, Play, Search, User, LogIn, LogOut, MapPin, Star, Mail, Instagram, Twitter, Linkedin,
  Camera, Sparkle, HeartHandshake, Quote
} from 'lucide-react';
import { UserProfile } from '../types';
import ProfileSettings from './ProfileSettings';
import CompareSlider from './CompareSlider';

interface LandingPageProps {
  onStart: () => void;
  user: UserProfile | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onJourneyClick: () => void;
  onSecretClick?: () => void;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const LandingPage: React.FC<LandingPageProps> = ({ onStart, user, onLoginClick, onLogoutClick, onJourneyClick, onSecretClick }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(user);
  
  const { scrollYProgress } = useScroll();
  const yPos = useTransform(scrollYProgress, [0, 1], [0, 300]);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
        const offset = 100;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen font-sans text-stone-900 selection:bg-sage-300 selection:text-stone-900 overflow-x-hidden relative transition-colors duration-300">
      
      {/* Global Grain & Ambient Light */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[0]" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
      <div className="fixed top-0 left-0 w-full h-[800px] bg-gradient-to-b from-white to-transparent pointer-events-none z-[0]"></div>

      {/* --- FLOATING NAVBAR --- */}
      <nav className={`fixed top-4 sm:top-6 left-0 right-0 z-50 px-4 md:px-6 transition-all duration-500`}>
        <div className={`max-w-6xl mx-auto rounded-full transition-all duration-300 ${
            scrolled 
            ? 'bg-white/80 backdrop-blur-xl border border-stone-200/50 shadow-lg py-3 px-4 sm:px-6' 
            : 'bg-transparent py-4 px-0'
        } flex items-center justify-between`}>
            
            <div className="flex items-center gap-2 cursor-pointer group flex-shrink-0" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
                <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12">
                    <Sparkles size={16} />
                </div>
                <span className={`font-serif text-xl font-bold tracking-tight text-stone-900`}>Lumière</span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-stone-900">
                <button onClick={() => scrollToSection('how-it-works')} className="hover:text-sage-600 transition-colors">How it Works</button>
                <button onClick={() => scrollToSection('science')} className="hover:text-sage-600 transition-colors">Science</button>
                <button onClick={() => scrollToSection('results')} className="hover:text-sage-600 transition-colors">Results</button>
                <button onClick={() => scrollToSection('testimonials')} className="hover:text-sage-600 transition-colors">Stories</button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {currentUser ? (
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={onLogoutClick}
                            className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-900 hover:bg-stone-200 transition-colors shadow-sm"
                            title="Log Out"
                         >
                             <LogOut size={16} />
                         </button>
                         <button 
                            onClick={() => setShowProfileModal(true)}
                            className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-900 hover:bg-stone-200 transition-colors shadow-sm"
                            title="Profile"
                         >
                             <User size={16} />
                         </button>
                         <button 
                            onClick={onJourneyClick}
                            className="hidden sm:flex px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold transition-colors border border-stone-200"
                         >
                            My Skin
                         </button>
                    </div>
                ) : (
                    <button 
                        onClick={onLoginClick}
                        className="text-xs font-bold uppercase tracking-widest text-stone-900 hover:text-black px-4 py-2.5 bg-white border border-stone-200 rounded-full hover:bg-stone-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <LogIn size={14} className="sm:hidden" />
                        <span className="hidden sm:inline">Sign In</span>
                    </button>
                )}
                
                <button 
                    onClick={onStart}
                    className="group relative overflow-hidden rounded-full bg-stone-900 px-5 sm:px-6 py-2.5 text-white shadow-xl transition-all hover:bg-black hover:scale-105 active:scale-95"
                >
                    <div className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        Scan <span className="hidden sm:inline">Now</span> <Scan size={14} className="group-hover:rotate-90 transition-transform duration-500" />
                    </div>
                </button>
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="relative z-10 text-center lg:text-left space-y-8"
            >
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sage-300 bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-sage-900 shadow-sm ring-1 ring-sage-100">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sage-600"></span>
                    </span>
                    AI Model v3.5 Live
                </motion.div>
                
                <motion.h1 variants={fadeInUp} className="font-serif text-6xl sm:text-7xl lg:text-8xl text-stone-900 leading-[1.05] tracking-tight drop-shadow-sm">
                    Dermatology <br/>
                    <span className="relative inline-block mt-2 sm:mt-0">
                        <span className="relative z-10 italic text-stone-900 pr-4">Reimagined.</span>
                        <svg className="absolute w-full h-4 -bottom-2 left-0 z-0 text-sage-300" viewBox="0 0 100 10" preserveAspectRatio="none">
                             <motion.path 
                               initial={{ pathLength: 0 }}
                               animate={{ pathLength: 1 }}
                               transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
                               d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" className="opacity-80" 
                             />
                        </svg>
                    </span>
                </motion.h1>
                
                <motion.p variants={fadeInUp} className="text-lg md:text-xl text-stone-600 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed mt-4">
                    Identify concerns, check product safety, and visualize your skin's future with <span className="text-stone-900 font-bold underline decoration-sage-400 decoration-2 underline-offset-2">98.5% clinical accuracy</span>.
                </motion.p>

                <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                    <button 
                        onClick={onStart}
                        className="h-14 px-8 rounded-full bg-stone-900 text-white font-bold shadow-xl hover:shadow-2xl hover:translate-y-[-2px] hover:bg-black transition-all flex items-center gap-3 group w-full sm:w-auto justify-center tracking-wide"
                    >
                        Start Analysis
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <div className="flex items-center gap-3 text-sm font-bold text-stone-800 bg-white/80 px-4 py-2 rounded-full border border-stone-200 backdrop-blur-sm shadow-sm hover:border-stone-300 transition-colors cursor-pointer">
                        <div className="flex -space-x-2">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-stone-200 overflow-hidden shadow-sm">
                                    <img src={`https://i.pravatar.cc/100?img=${i+25}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <p>2M+ Users</p>
                    </div>
                </motion.div>
            </motion.div>

            {/* 3D Phone Scanner Animation */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: -6 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="relative h-[550px] sm:h-[650px] flex items-center justify-center lg:justify-end"
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sage-200/40 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>

                <div className="relative w-[280px] sm:w-[320px] h-[580px] sm:h-[640px] bg-stone-900 rounded-[3.5rem] p-3 shadow-2xl transform hover:rotate-0 transition-transform duration-700 border-4 border-stone-800 z-10">
                    <div className="relative w-full h-full bg-stone-100 rounded-[2.8rem] overflow-hidden">
                         <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-40"></div>

                         <div className="relative w-full h-full">
                             <img 
                                src="https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=800&q=80" 
                                className="w-full h-full object-cover grayscale-[0.2]" 
                                alt="Skin Analysis" 
                             />
                             
                             <div className="absolute top-[30%] left-[30%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)] animate-ping"></div>
                             <div className="absolute top-[32%] right-[35%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]"></div>
                             <div className="absolute top-[45%] left-[25%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]"></div>
                             
                             <div className="absolute top-0 left-0 right-0 h-1 bg-sage-400 shadow-[0_0_30px_rgba(143,168,143,1)] z-20 animate-[scan_3s_ease-in-out_infinite]"></div>
                             
                             <motion.div 
                               animate={{ y: [0, -10, 0] }}
                               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                               className="absolute top-40 right-4 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-xl flex items-center gap-2 z-30 border border-stone-100"
                             >
                                 <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                                 <span className="text-[10px] font-bold uppercase tracking-wide text-stone-900">Pigmentation</span>
                             </motion.div>

                             <motion.div 
                               animate={{ y: [0, -10, 0] }}
                               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                               className="absolute bottom-48 left-4 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-xl flex items-center gap-2 z-30 border border-stone-100"
                             >
                                 <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                 <span className="text-[10px] font-bold uppercase tracking-wide text-stone-900">Dehydration</span>
                             </motion.div>
                         </div>

                         <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 flex flex-col justify-end">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center animate-spin-slow">
                                      <Activity size={16} className="text-sage-400" />
                                  </div>
                                  <div>
                                      <div className="text-[10px] text-sage-300 font-mono uppercase tracking-widest">Processing</div>
                                      <div className="text-white font-serif text-lg">Analysis in Progress...</div>
                                  </div>
                              </div>
                         </div>
                    </div>
                </div>

                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-20 -left-6 sm:-left-12 bg-white p-4 rounded-2xl shadow-xl border border-stone-100 flex items-center gap-3 z-20"
                >
                     <div className="w-12 h-12 bg-sage-50 rounded-full flex items-center justify-center text-sage-600 border border-sage-100">
                         <ShieldCheck size={24} />
                     </div>
                     <div>
                         <div className="text-xl font-bold text-stone-900">98.5%</div>
                         <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Clinical Accuracy</div>
                     </div>
                </motion.div>
            </motion.div>
        </div>
      </header>

      {/* --- STATS / TRUST --- */}
      <section className="bg-white py-16 border-y border-stone-100 shadow-sm relative z-10">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
              {[
                  { label: "Active Scans", value: "2M+", icon: Scan },
                  { label: "Products Index", value: "45k+", icon: Search },
                  { label: "AI Precision", value: "99%", icon: BrainCircuit },
                  { label: "Dermatologists", value: "Verified", icon: ShieldCheck },
              ].map((stat, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="flex flex-col items-center text-center group cursor-default"
                  >
                      <div className="w-14 h-14 rounded-2xl bg-stone-50 text-stone-600 flex items-center justify-center mb-4 group-hover:bg-sage-50 group-hover:text-sage-600 transition-colors shadow-sm border border-stone-100 group-hover:scale-110 duration-300">
                           <stat.icon size={28} />
                      </div>
                      <div className="text-4xl font-serif font-medium text-stone-900 mb-1 tracking-tight">{stat.value}</div>
                      <div className="text-xs font-bold uppercase tracking-widest text-stone-500">{stat.label}</div>
                  </motion.div>
              ))}
          </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
              <span className="text-sage-600 font-bold uppercase tracking-widest text-xs border border-sage-200 px-3 py-1 rounded-full bg-sage-50">The Process</span>
              <h2 className="font-serif text-5xl md:text-6xl text-stone-900">Three Steps to Clarity</h2>
              <p className="text-stone-600 text-lg max-w-xl mx-auto font-medium leading-relaxed">
                  Our seamless process takes you from uncertainty to a clinical-grade routine in under 60 seconds.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                  {
                      icon: Camera,
                      title: "1. Scan Your Face",
                      desc: "Take a quick selfie. Our AI analyzes your skin across 12 distinct parameters, mapping everything from hydration to deep pigmentation.",
                      color: "bg-blue-50 text-blue-600 border-blue-100"
                  },
                  {
                      icon: BrainCircuit,
                      title: "2. AI Processing",
                      desc: "The multi-spectral engine cross-references your scan with millions of clinical data points to identify your exact skin profile and concerns.",
                      color: "bg-purple-50 text-purple-600 border-purple-100"
                  },
                  {
                      icon: Sparkle,
                      title: "3. Custom Protocol",
                      desc: "Receive a personalized AM/PM routine, product safety checks, and a visual projection of your skin's future health.",
                      color: "bg-sage-50 text-sage-600 border-sage-100"
                  }
              ].map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: i * 0.2, duration: 0.6 }}
                    className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden group"
                  >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${step.color} group-hover:scale-110 transition-transform duration-500`}>
                          <step.icon size={32} />
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-stone-900 mb-3">{step.title}</h3>
                      <p className="text-stone-600 leading-relaxed">{step.desc}</p>
                      
                      {/* Decorative SVG background */}
                      <svg className="absolute -bottom-10 -right-10 w-40 h-40 opacity-5 group-hover:opacity-10 transition-opacity duration-500" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="currentColor" className="text-stone-900" />
                      </svg>
                  </motion.div>
              ))}
          </div>
      </section>

      {/* --- REDESIGNED BENTO GRID (SCIENCE) --- */}
      <section id="science" className="py-32 px-4 md:px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
              <span className="text-sage-600 font-bold uppercase tracking-widest text-xs border border-sage-200 px-3 py-1 rounded-full bg-sage-50">The Science</span>
              <h2 className="font-serif text-5xl md:text-6xl text-stone-900">Beyond the Surface</h2>
              <p className="text-stone-600 text-lg max-w-xl mx-auto font-medium leading-relaxed">
                  Our multi-spectral engine analyzes 12 distinct skin parameters to build your unique profile.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-6 h-auto md:h-[900px]">
              
              {/* CARD 1: MAIN ANALYSIS (Tall Left) */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="md:col-span-2 md:row-span-2 bg-stone-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl"
              >
                  <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700">
                      <img src="https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover grayscale" alt="Science" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                  
                  <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                              <Microscope size={24} className="text-sage-300" />
                          </div>
                          <div className="bg-sage-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                              Core Engine
                          </div>
                      </div>
                      
                      <div>
                          <h3 className="font-serif text-4xl mb-3">Molecular Mapping</h3>
                          <p className="text-stone-300 max-w-md leading-relaxed font-medium">
                              We don't just see acne. We map the underlying inflammation, hydration levels, and barrier health to predict future breakouts.
                          </p>
                          <div className="mt-8 flex gap-2">
                               {['Sebum', 'Moisture', 'Elasticity'].map((tag, i) => (
                                   <motion.span 
                                     key={tag} 
                                     initial={{ opacity: 0, x: -10 }}
                                     whileInView={{ opacity: 1, x: 0 }}
                                     transition={{ delay: 0.3 + (i * 0.1) }}
                                     className="px-3 py-1 rounded-lg border border-white/20 text-xs text-stone-200 bg-white/10 font-bold backdrop-blur-sm"
                                   >
                                       {tag}
                                   </motion.span>
                               ))}
                          </div>
                      </div>
                  </div>
              </motion.div>

              {/* CARD 2: SMART SHELF (Square Top Right) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="md:col-span-1 md:row-span-1 bg-white rounded-[2.5rem] p-6 border border-stone-100 shadow-sm hover:shadow-xl hover:border-stone-200 transition-all group overflow-hidden relative"
              >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="relative z-10 h-full flex flex-col">
                      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
                          <Zap size={20} />
                      </div>
                      <h3 className="font-serif text-2xl text-stone-900 mb-2">Smart Shelf</h3>
                      <p className="text-sm text-stone-500 leading-relaxed mb-4 font-medium">
                          Snap a photo of your products. We'll flag toxic ingredients and conflicts instantly.
                      </p>
                      
                      <div className="flex items-center gap-2 mt-auto">
                           <div className="flex -space-x-2">
                               <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-200 shadow-sm"></div>
                               <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-300 shadow-sm"></div>
                           </div>
                           <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">2 Conflicts Found</span>
                      </div>
                  </div>
              </motion.div>

              {/* CARD 3: TIME TRAVEL (Square Top Right) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="md:col-span-1 md:row-span-1 bg-sage-50 rounded-[2.5rem] p-6 border border-sage-100 relative overflow-hidden group cursor-pointer hover:border-sage-200 transition-all" 
                onClick={onStart}
              >
                   <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                       <Clock size={120} />
                   </div>
                   <div className="relative z-10 flex flex-col h-full">
                       <div className="flex justify-between items-start">
                           <Clock className="text-sage-600" size={24} />
                           <ArrowUpRight className="text-sage-500" size={20} />
                       </div>
                       <div className="mt-auto">
                           <h3 className="font-serif text-2xl text-stone-900 mb-1">Time Travel</h3>
                           <p className="text-xs font-bold text-sage-800 leading-relaxed">Visualize your skin 6 months from now with consistent care.</p>
                       </div>
                   </div>
              </motion.div>

              {/* CARD 4: ROUTINE (Wide Middle) */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="md:col-span-2 md:row-span-1 bg-gradient-to-br from-indigo-50 to-white rounded-[2.5rem] p-8 border border-indigo-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all relative overflow-hidden flex items-center justify-between group"
              >
                  <div className="relative z-10 max-w-sm">
                      <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-2">
                          <Layers size={12} /> Daily Protocol
                      </div>
                      <h3 className="font-serif text-3xl text-stone-900 mb-2">Algorithm-Generated Routine</h3>
                      <p className="text-sm text-stone-600 font-medium leading-relaxed">
                          A step-by-step AM/PM guide built specifically for your lifestyle and skin type.
                      </p>
                  </div>
                  
                  <div className="hidden md:flex gap-4 pr-8 relative">
                       <motion.div 
                         animate={{ y: [0, -5, 0] }}
                         transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                         className="w-16 h-24 bg-white rounded-xl border border-stone-200 shadow-lg transform rotate-[-6deg] group-hover:rotate-[-12deg] transition-transform"
                       ></motion.div>
                       <motion.div 
                         animate={{ y: [0, -5, 0] }}
                         transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                         className="w-16 h-24 bg-indigo-100 rounded-xl border border-indigo-200 shadow-lg transform rotate-[6deg] group-hover:rotate-[12deg] transition-transform z-10"
                       ></motion.div>
                  </div>
              </motion.div>

              {/* CARD 5: PRIVACY (Bottom Wide) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="md:col-span-4 md:row-span-1 bg-white rounded-[2.5rem] p-8 border border-stone-100 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-sm"
              >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sage-300 to-transparent opacity-50"></div>
                  <div className="relative z-10">
                      <h3 className="font-serif text-3xl text-stone-900 flex items-center gap-3">
                          <Fingerprint className="text-stone-400" />
                          Privacy First Architecture
                      </h3>
                      <p className="text-stone-500 font-medium mt-2 max-w-2xl leading-relaxed">
                          Your face data is encrypted and processed locally where possible. We never sell your biometric data. 
                          Your journey is yours alone.
                      </p>
                  </div>
                  <div className="flex gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 rounded-full border border-stone-100 shadow-sm text-xs font-bold text-stone-700">
                          <ShieldCheck size={14} className="text-green-500" /> SOC2 Compliant
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 rounded-full border border-stone-100 shadow-sm text-xs font-bold text-stone-700">
                          <CheckCircle2 size={14} className="text-green-500" /> End-to-End Encrypted
                      </div>
                  </div>
              </motion.div>
          </div>
      </section>

      {/* --- RESULTS SECTION --- */}
      <section id="results" className="bg-stone-900 text-white py-32 px-6 rounded-t-[3rem] mt-[-2rem] relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
          <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                      <span className="text-sage-400 font-bold uppercase tracking-widest text-xs mb-2 block">Clinical Results</span>
                      <h2 className="font-serif text-5xl md:text-6xl text-white">Proven Progress</h2>
                  </motion.div>
                  <motion.p 
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-stone-300 max-w-sm text-sm leading-relaxed font-medium"
                  >
                      See what's possible. Our users see a 45% reduction in active acne within 4 weeks of following their AI-prescribed routine.
                  </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }}
                     whileInView={{ opacity: 1, scale: 1 }}
                     viewport={{ once: true }}
                     transition={{ duration: 0.6 }}
                     className="bg-white/5 p-4 rounded-[2.5rem] border border-white/10 backdrop-blur-sm"
                   >
                        <CompareSlider 
                             leftImage="https://images.unsplash.com/photo-1554151228-14d9def656ec?auto=format&fit=crop&w=800&q=80" 
                             rightImage="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80"
                             leftLabel="Day 1"
                             rightLabel="Day 90"
                             className="rounded-[2rem]"
                        />
                   </motion.div>
                   <div className="space-y-8">
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors"
                        >
                             <div className="text-4xl font-serif text-sage-300 mb-2">92%</div>
                             <h4 className="text-lg font-bold mb-2 text-white">Improvement in Texture</h4>
                             <p className="text-stone-300 text-sm font-medium">Users reported smoother skin surface after 3 weeks of the recommended barrier repair protocol.</p>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                          className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors"
                        >
                             <div className="text-4xl font-serif text-sage-300 mb-2">87%</div>
                             <h4 className="text-lg font-bold mb-2 text-white">Reduction in Redness</h4>
                             <p className="text-stone-300 text-sm font-medium">Significant decrease in erythema and inflammation markers for sensitive skin profiles.</p>
                        </motion.div>
                        <motion.button 
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.6 }}
                          onClick={onStart} 
                          className="text-white border-b border-sage-500 pb-1 hover:text-sage-400 transition-colors font-bold text-sm"
                        >
                            Start Your Journey
                        </motion.button>
                   </div>
              </div>
          </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section id="testimonials" className="py-32 px-6 bg-[#FAF9F6]">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20 space-y-4">
                  <span className="text-sage-600 font-bold uppercase tracking-widest text-xs border border-sage-200 px-3 py-1 rounded-full bg-sage-50">Community</span>
                  <h2 className="font-serif text-5xl md:text-6xl text-stone-900">Real Stories</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                      {
                          quote: "I spent thousands on dermatologists. Lumière figured out my barrier was compromised in 30 seconds and fixed my routine.",
                          author: "Elena R.",
                          role: "Verified User",
                          img: "https://i.pravatar.cc/150?img=44"
                      },
                      {
                          quote: "The Smart Shelf feature saved me from mixing Retinol with Vitamin C. My skin has never looked better.",
                          author: "Marcus T.",
                          role: "Verified User",
                          img: "https://i.pravatar.cc/150?img=11"
                      },
                      {
                          quote: "As a skincare enthusiast, the molecular mapping blew my mind. It's like having a clinical lab in your pocket.",
                          author: "Sophia L.",
                          role: "Beauty Editor",
                          img: "https://i.pravatar.cc/150?img=5"
                      }
                  ].map((testimonial, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2, duration: 0.6 }}
                        className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm relative hover:shadow-xl transition-shadow duration-300"
                      >
                          <Quote className="text-sage-200 w-12 h-12 absolute top-6 right-6 opacity-50" />
                          <p className="text-stone-700 font-medium leading-relaxed mb-8 relative z-10">"{testimonial.quote}"</p>
                          <div className="flex items-center gap-4">
                              <img src={testimonial.img} alt={testimonial.author} className="w-12 h-12 rounded-full border-2 border-sage-100" />
                              <div>
                                  <div className="font-bold text-stone-900">{testimonial.author}</div>
                                  <div className="text-xs text-stone-500">{testimonial.role}</div>
                              </div>
                          </div>
                      </motion.div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- CLINICS SECTION --- */}
      <section id="clinics" className="bg-white py-32 px-6 border-t border-stone-100">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
               <motion.div 
                 initial={{ opacity: 0, x: -40 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8 }}
                 className="w-full md:w-1/2"
               >
                   <div className="relative">
                       <div className="absolute -top-10 -left-10 w-40 h-40 bg-sage-100 rounded-full blur-3xl opacity-50"></div>
                       <div className="relative z-10 bg-[#FAF9F6] rounded-[2.5rem] p-8 border border-stone-200 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                           <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex items-center gap-4 border border-stone-100">
                               <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center">
                                   <MapPin size={24} className="text-rose-500" />
                               </div>
                               <div>
                                   <div className="font-bold text-stone-900">Dr. Sarah Chen</div>
                                   <div className="text-xs text-stone-500 flex items-center gap-1">
                                       <Star size={10} className="fill-amber-400 text-amber-400" /> 4.9 • Dermatology
                                   </div>
                               </div>
                               <button className="ml-auto bg-stone-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-black transition-colors">Book</button>
                           </div>
                           <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 opacity-60 scale-95 border border-stone-100">
                               <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center">
                                   <MapPin size={24} className="text-stone-400" />
                               </div>
                               <div>
                                   <div className="font-bold text-stone-900">Skin Health Center</div>
                                   <div className="text-xs text-stone-500 flex items-center gap-1">
                                       <Star size={10} className="fill-amber-400 text-amber-400" /> 4.8 • Clinic
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </motion.div>
               <motion.div 
                 initial={{ opacity: 0, x: 40 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8 }}
                 className="w-full md:w-1/2 space-y-6"
               >
                   <span className="text-sage-600 font-bold uppercase tracking-widest text-xs">Care Network</span>
                   <h2 className="font-serif text-5xl text-stone-900 leading-tight">Expert Care,<br/>Nearby.</h2>
                   <p className="text-stone-600 text-lg font-medium leading-relaxed">
                       When AI isn't enough, we connect you with vetted specialists. Our "Find Care" engine locates the top-rated dermatologists in your city, filtered by your specific skin condition.
                   </p>
                   <div className="flex gap-4 pt-4">
                       <button onClick={() => { onStart(); }} className="px-8 py-4 bg-stone-900 text-white rounded-full font-bold shadow-xl hover:bg-black transition-all hover:scale-105">
                           Scan to Find Clinics
                       </button>
                   </div>
               </motion.div>
           </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-stone-950 text-stone-300 py-20 px-6 relative overflow-hidden">
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-sage-900/20 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-white/10 pb-16 mb-12">
                  
                  <div className="md:col-span-4 space-y-6">
                      <div className="flex items-center gap-2 text-white">
                          <div className="w-8 h-8 bg-white text-stone-950 rounded-lg flex items-center justify-center">
                              <Sparkles size={16} />
                          </div>
                          <span className="font-serif text-2xl">Lumière AI</span>
                      </div>
                      <p className="text-stone-400 text-sm leading-relaxed max-w-sm font-medium">
                          The world's most advanced AI dermatologist. Democratizing clinical-grade skin analysis for everyone, everywhere.
                      </p>
                      <div className="flex gap-4">
                          <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"><Twitter size={18} /></a>
                          <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"><Instagram size={18} /></a>
                          <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"><Linkedin size={18} /></a>
                      </div>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                      <h4 className="text-white font-bold uppercase tracking-widest text-xs">Platform</h4>
                      <ul className="space-y-4 text-sm text-stone-400">
                          <li><button onClick={() => scrollToSection('science')} className="hover:text-white transition-colors">Technology</button></li>
                          <li><button onClick={() => scrollToSection('results')} className="hover:text-white transition-colors">Clinical Results</button></li>
                          <li><button onClick={onStart} className="hover:text-white transition-colors">Get Analyzed</button></li>
                          <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                      </ul>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                      <h4 className="text-white font-bold uppercase tracking-widest text-xs">Company</h4>
                      <ul className="space-y-4 text-sm text-stone-400">
                          <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                          <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                          <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                          <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                      </ul>
                  </div>

                  <div className="md:col-span-4 space-y-6">
                      <h4 className="text-white font-bold uppercase tracking-widest text-xs">Stay Updated</h4>
                      <p className="text-xs text-stone-400 font-medium">Get the latest skin science and AI updates.</p>
                      <div className="flex gap-2">
                          <input 
                             type="email" 
                             placeholder="Enter your email" 
                             className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sage-500 w-full placeholder:text-stone-500"
                          />
                          <button className="bg-sage-600 text-white px-4 py-3 rounded-xl hover:bg-sage-500 transition-colors shadow-lg">
                              <Mail size={18} />
                          </button>
                      </div>
                  </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center text-xs text-stone-500 gap-4">
                  <div className="flex items-center gap-2">
                      &copy; 2024 Lumière AI Inc. All rights reserved.
                      <button 
                          onClick={onSecretClick} 
                          className="w-1.5 h-1.5 rounded-full bg-stone-700/30 hover:bg-stone-500 transition-colors"
                          aria-label="System Info"
                      />
                  </div>
                  <div className="flex gap-8">
                      <a href="#" className="hover:text-stone-400 transition-colors">Privacy Policy</a>
                      <a href="#" className="hover:text-stone-400 transition-colors">Terms of Service</a>
                      <a href="#" className="hover:text-stone-400 transition-colors">Cookie Settings</a>
                  </div>
              </div>
          </div>
      </footer>

      {showProfileModal && currentUser && (
          <ProfileSettings 
            user={currentUser}
            onClose={() => setShowProfileModal(false)}
            onUpdate={(u) => setCurrentUser(u)}
          />
      )}
      
      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
