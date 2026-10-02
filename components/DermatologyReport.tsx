
import React, { useRef, useState, useEffect } from 'react';
import { SkinAnalysisResult } from '../types';
import { 
  Activity, AlertTriangle, CheckCircle, Target, Sun, Moon, 
  Download, Printer, Loader2, Dna, Clock, Leaf, Plus, X, 
  CheckCircle2, Sparkles, Fingerprint, LucideIcon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReportProps {
  result: SkinAnalysisResult;
}

const DermatologyReport: React.FC<ReportProps> = ({ result }) => {
  const { reportData } = result;
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  
  // OPTIMIZATION: Initialize state directly from props
  const [lifestyleFactors, setLifestyleFactors] = useState<string[]>(reportData?.lifestyleImpact || []);
  const [newFactor, setNewFactor] = useState('');
  const [isAddingFactor, setIsAddingFactor] = useState(false);

  useEffect(() => {
      if (reportData?.lifestyleImpact && reportData.lifestyleImpact.length !== lifestyleFactors.length) {
          const isDifferent = reportData.lifestyleImpact.some((f, i) => f !== lifestyleFactors[i]);
          if (isDifferent) setLifestyleFactors(reportData.lifestyleImpact);
      }
  }, [reportData?.lifestyleImpact]);

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setDownloading(true);

    try {
      const originalElement = reportRef.current;
      const clone = originalElement.cloneNode(true) as HTMLElement;
      
      // Container for off-screen rendering
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-10000px';
      container.style.left = '-10000px';
      container.style.width = '1200px'; 
      container.style.zIndex = '-1000';
      
      // Styling adjustment for PDF capture
      clone.classList.remove('max-w-4xl', 'mx-auto', 'shadow-2xl', 'rounded-[3rem]', 'my-8', 'md:p-8');
      clone.classList.add('w-full', 'bg-white', 'p-8');
      clone.style.height = 'auto';
      clone.style.overflow = 'visible';
      clone.style.transform = 'none';

      const noPrint = clone.querySelectorAll('.no-print');
      noPrint.forEach(b => (b as HTMLElement).style.display = 'none');

      container.appendChild(clone);
      document.body.appendChild(container);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(clone, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        width: 1200,
        height: clone.scrollHeight,
        windowWidth: 1200,
        windowHeight: clone.scrollHeight,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; 
      const pageHeight = 297; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -(imgHeight - heightLeft), imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Lumiere_Report_${reportData?.reportId || 'Analysis'}.pdf`);

    } catch (e) {
      console.error("PDF generation failed", e);
      alert("Could not generate PDF. Try the Print -> Save as PDF option.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-stone-100 min-h-screen p-0 md:p-8 font-sans text-stone-800 transition-colors duration-300">
       
       <div ref={reportRef} className="relative z-10 w-full max-w-5xl mx-auto bg-white shadow-xl md:shadow-2xl md:rounded-[3rem] overflow-hidden border-none md:border border-stone-100 print:shadow-none print:border-none print:rounded-none print:w-full animate-enter">
          
          {/* --- HERO HEADER --- */}
          <div className="bg-stone-900 text-cream p-6 md:p-16 relative overflow-hidden print:bg-white print:text-black print:p-0 print:border-b-2 print:border-black print:pb-8">
             {/* Abstract blobs */}
             <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-sage-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
             
             <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div className="animate-enter w-full" style={{animationDelay: '100ms'}}>
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 md:w-10 md:h-10 border border-white/20 rounded-full flex items-center justify-center">
                         <Sparkles size={16} className="text-sage-300 md:w-[18px]" />
                      </div>
                      <span className="text-xs font-bold tracking-[0.3em] uppercase text-stone-400">Lumière AI</span>
                   </div>
                   <h1 className="font-serif text-5xl md:text-7xl text-white leading-[0.9] tracking-tight mb-4">
                      Clinical <br/>
                      <span className="text-sage-300 italic font-light">Analysis</span>
                   </h1>
                   <p className="text-stone-400 font-light max-w-md mt-4 text-sm leading-relaxed hidden md:block">
                       Comprehensive dermatological assessment powered by generative AI. 
                       Not a medical diagnosis. Consult a professional.
                   </p>
                </div>
                
                <div className="w-full lg:w-auto flex items-center gap-6 md:gap-8 bg-white/5 backdrop-blur-sm p-4 md:p-6 rounded-3xl border border-white/10 print:bg-transparent print:border-none print:p-0 animate-enter" style={{animationDelay: '200ms'}}>
                   <div className="text-right flex-1 lg:flex-none">
                      <div className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Skin Health Score</div>
                      <div className="font-serif text-5xl md:text-6xl text-white font-medium">{result.healthScore}</div>
                   </div>
                   <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-sage-500/20 flex items-center justify-center relative flex-shrink-0">
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="8" fill="none" className="text-sage-900/50" />
                          <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="8" fill="none" className="text-sage-400" 
                                  strokeDasharray="289" strokeDashoffset={289 - (289 * result.healthScore) / 100} strokeLinecap="round" />
                      </svg>
                      <Activity size={24} className="text-sage-300 md:w-[28px]" />
                   </div>
                </div>
             </div>

             {/* Metadata Bar */}
             <div className="mt-8 md:mt-16 pt-6 border-t border-white/10 flex flex-wrap gap-x-8 gap-y-4 text-[10px] font-bold text-stone-500 uppercase tracking-widest print:text-black print:border-black/20 animate-enter" style={{animationDelay: '300ms'}}>
                <div className="min-w-[120px]">Report ID <span className="text-white ml-2 print:text-black block md:inline">{reportData?.reportId}</span></div>
                <div className="min-w-[120px]">Date <span className="text-white ml-2 print:text-black block md:inline">{new Date().toLocaleDateString()}</span></div>
             </div>
          </div>

          <div className="p-6 md:p-16 space-y-12 md:space-y-16 print:p-0 print:mt-8">
            
            {/* 1. CLASSIFICATION CARDS */}
            <section className="print-break-inside animate-enter" style={{animationDelay: '400ms'}}>
               <div className="flex items-end gap-4 mb-6 md:mb-8">
                   <h3 className="font-serif text-2xl md:text-3xl text-stone-900">Your Skin Profile</h3>
                   <div className="h-px bg-stone-200 flex-1 mb-2 hidden md:block"></div>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <ProfileCard 
                    label="Sun Sensitivity" 
                    value={reportData?.fitzpatrickType} 
                    sub="Sun Sensitivity" 
                    icon={Sun} 
                    description="How your skin reacts to the sun."
                  />
                  <ProfileCard 
                    label="Skin Personality" 
                    value={reportData?.baumannType} 
                    sub="Skin Personality" 
                    icon={Fingerprint} 
                    description="Your unique mix of oil, sensitivity, and tone."
                  />
               </div>
            </section>

            {/* 2. SPLIT ANALYSIS: Metrics & Concerns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 print:block print:space-y-8">
                
                {/* Metrics Column */}
                <section className="print-break-inside animate-enter" style={{animationDelay: '500ms'}}>
                   <h3 className="font-serif text-2xl text-stone-900 mb-6 flex items-center gap-2">
                       <Target size={20} className="text-sage-500" /> Skin Health Metrics
                   </h3>
                   <div className="space-y-6">
                      {reportData?.metricsBreakdown?.map((m, i) => (
                         <div key={i} className="group">
                             <div className="flex justify-between items-end mb-2">
                                 <span className="font-bold text-sm text-stone-700">{m.name}</span>
                                 <span className="text-xs font-mono text-stone-400 group-hover:text-sage-600 transition-colors">{m.score}/100</span>
                             </div>
                             <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                        m.score > 80 ? 'bg-sage-400' : m.score > 60 ? 'bg-amber-400' : 'bg-rose-400'
                                    }`} 
                                    style={{ width: `${m.score}%` }}
                                 />
                             </div>
                             <p className="text-xs text-stone-400 mt-2 italic group-hover:text-stone-500 transition-colors">"{m.advice}"</p>
                         </div>
                      ))}
                   </div>
                </section>

                {/* Concerns Column */}
                <section className="print-break-inside animate-enter" style={{animationDelay: '600ms'}}>
                   <h3 className="font-serif text-2xl text-stone-900 mb-6 flex items-center gap-2">
                       <AlertTriangle size={20} className="text-amber-500" /> Main Areas of Focus
                   </h3>
                   <div className="space-y-4">
                      {result.concerns.map((concern, i) => (
                         <div key={i} className="bg-stone-50 p-5 md:p-6 rounded-3xl border border-stone-100 transition-shadow hover:shadow-md">
                            <div className="flex flex-wrap items-start justify-between mb-2 gap-2">
                                <h4 className="font-serif text-xl text-stone-900">{concern.name}</h4>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                    concern.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {concern.severity}
                                </span>
                            </div>
                            <p className="text-sm text-stone-600 leading-relaxed mb-3">{concern.clinicalOverview}</p>
                            <div className="flex items-center gap-2 text-xs text-stone-400 font-medium">
                                <Activity size={12} /> {concern.visualIndicators}
                            </div>
                         </div>
                      ))}
                   </div>
                </section>
            </div>

            {/* 3. MOLECULAR MATRIX - Dark Mode Section */}
            {reportData.ingredientScience && (
               <section className="bg-stone-900 text-stone-200 p-6 md:p-12 rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden shadow-2xl print:bg-white print:text-black print:border print:border-stone-200 print:shadow-none print-break-inside animate-enter" style={{animationDelay: '700ms'}}>
                  {/* Decorative */}
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>

                  <div className="relative z-10">
                     <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 print:border-black/10 print:bg-stone-100">
                            <Dna className="text-sage-300 print:text-stone-900" size={24} />
                        </div>
                        <div>
                            <h3 className="font-serif text-2xl md:text-3xl text-white print:text-stone-900">How Your Ingredients Work</h3>
                            <p className="text-stone-400 text-sm mt-1 print:text-stone-500">Understanding your recommended products</p>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reportData.ingredientScience.map((item, i) => (
                           <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors group print:bg-stone-50 print:border-stone-200 flex flex-col h-full">
                              <div className="flex justify-between items-start mb-6">
                                  <div className="text-sage-300 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors print:text-sage-700">{item.ingredient}</div>
                                  <div className="w-2 h-2 rounded-full bg-sage-500 animate-pulse"></div>
                              </div>
                              
                              <p className="font-serif text-lg md:text-xl leading-snug mb-6 text-white print:text-stone-900 flex-1">"{item.mechanism}"</p>
                              
                              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 print:bg-white print:border-stone-100 mt-auto">
                                 <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase mb-1 font-bold tracking-wider">
                                    <Target size={10} /> Targeted Concern
                                 </div>
                                 <div className="text-sm font-medium text-stone-200 print:text-stone-800 break-words">{item.targetConcern}</div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </section>
            )}

            {/* 4. LIFESTYLE (Editable) */}
             <section className="print-break-inside animate-enter" style={{animationDelay: '800ms'}}>
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-2">
                    <Leaf size={20} className="text-green-600" />
                    <h3 className="font-serif text-2xl text-stone-900">Lifestyle Factors</h3>
                  </div>
                  <button onClick={() => setIsAddingFactor(true)} className="text-xs font-bold uppercase tracking-widest text-sage-600 hover:text-sage-800 flex items-center gap-1 no-print border border-sage-200 px-3 py-1.5 rounded-full hover:bg-sage-50 transition-colors">
                     <Plus size={12} /> Add Factor
                  </button>
               </div>
               
               <div className="bg-stone-50 p-6 md:p-8 rounded-[2rem] border border-stone-100">
                   <div className="flex flex-wrap gap-3">
                      {lifestyleFactors.map((factor, idx) => (
                         <span key={idx} className="px-5 py-2.5 rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-600 shadow-sm flex items-center gap-2 group hover:border-sage-300 transition-colors hover:shadow-md">
                            {factor}
                            <button onClick={() => handleRemoveFactor(idx)} className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                               <X size={14} />
                            </button>
                         </span>
                      ))}
                      {isAddingFactor && (
                         <div className="flex items-center gap-2 bg-white border border-sage-300 rounded-full px-4 py-2 shadow-sm animate-fade-in w-full sm:w-auto">
                            <input 
                               type="text" 
                               value={newFactor}
                               onChange={(e) => setNewFactor(e.target.value)}
                               className="bg-transparent border-none text-sm focus:outline-none w-full sm:w-32 font-medium"
                               placeholder="Type factor..."
                               onKeyDown={(e) => e.key === 'Enter' && handleAddFactor()}
                               autoFocus
                            />
                            <button onClick={handleAddFactor} className="p-1 hover:bg-sage-100 rounded-full text-sage-600 flex-shrink-0"><CheckCircle2 size={16} /></button>
                            <button onClick={() => setIsAddingFactor(false)} className="p-1 hover:bg-stone-100 rounded-full text-stone-400 flex-shrink-0"><X size={16} /></button>
                         </div>
                      )}
                      {lifestyleFactors.length === 0 && !isAddingFactor && (
                          <span className="text-stone-400 text-sm italic">No specific lifestyle factors noted. Add some to customize your report.</span>
                      )}
                   </div>
               </div>
            </section>

            {/* 5. RECOVERY TIMELINE */}
            {reportData.recoveryTimeline && (
               <section className="relative py-8 print-break-inside animate-enter" style={{animationDelay: '900ms'}}>
                  <div className="text-center mb-8 md:mb-12">
                      <h3 className="font-serif text-3xl text-stone-900 inline-flex items-center gap-3">
                        <Clock className="text-amber-500" /> What to Expect
                      </h3>
                  </div>
                  
                  <div className="relative">
                      {/* Central Line - Hidden on Mobile */}
                      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-stone-200 via-sage-300 to-stone-200"></div>
                      
                      <div className="space-y-6 md:space-y-12">
                         {reportData.recoveryTimeline.map((phase, i) => (
                            <div key={i} className={`flex flex-col md:flex-row items-center gap-4 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                               <div className="hidden md:block w-1/2"></div>
                               
                               {/* Marker */}
                               <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-white border-4 border-sage-100 shadow-lg flex items-center justify-center text-sage-700 font-serif font-bold text-lg group-hover:scale-110 transition-transform">
                                  {i+1}
                               </div>
                               
                               {/* Card */}
                               <div className="w-full md:w-1/2 pl-0 md:pl-16 md:pr-16">
                                  <div className={`bg-white p-6 rounded-3xl border border-stone-100 shadow-sm relative group hover:shadow-xl transition-all hover:-translate-y-1 hover:border-sage-200 text-center md:text-left`}>
                                     {/* Connector Line for Desktop */}
                                     <div className={`hidden md:block absolute top-1/2 w-16 h-0.5 bg-stone-200 -z-10 ${i % 2 === 0 ? '-left-16' : '-right-16'}`}></div>

                                     <div className="text-[10px] font-bold uppercase tracking-widest text-sage-600 mb-2 bg-sage-50 inline-block px-2 py-1 rounded-md">{phase.phase}</div>
                                     <h4 className="font-serif text-xl font-bold text-stone-900 mb-2">{phase.focus}</h4>
                                     <p className="text-sm text-stone-500 leading-relaxed">{phase.whatToExpect}</p>
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                  </div>
               </section>
            )}

            {/* 6. ROUTINE (Simplified) */}
            <section className="bg-stone-50 rounded-[2rem] md:rounded-[3rem] p-6 md:p-16 border border-stone-100 print-break-inside animate-enter" style={{animationDelay: '1000ms'}}>
               <h3 className="font-serif text-3xl text-stone-900 mb-10 text-center">Your Daily Routine</h3>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <RoutineColumn title="Morning Ritual" icon={Sun} steps={result.routine?.morning || []} color="text-amber-500" />
                  <RoutineColumn title="Evening Ritual" icon={Moon} steps={result.routine?.evening || []} color="text-indigo-500" />
               </div>
            </section>
          </div>
          
          {/* Footer Actions */}
          <div className="bg-stone-900 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print md:rounded-b-[3rem] animate-enter" style={{animationDelay: '1100ms'}}>
             <div className="text-stone-500 text-xs font-mono text-center md:text-left">
                GENERATED BY LUMIÈRE AI V3.5 • {new Date().getFullYear()}
             </div>
             <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <button onClick={handleDownloadPDF} disabled={downloading} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10">
                   {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} 
                   Download PDF
                </button>
                <button onClick={handlePrint} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-stone-900 font-bold hover:bg-stone-200 transition-colors shadow-lg">
                   <Printer size={16} /> Print Report
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const ProfileCard = ({ label, value, sub, icon: Icon, description }: { label: string, value: string | undefined, sub: string, icon: LucideIcon, description?: string }) => (
    <div className="bg-white border border-stone-100 rounded-3xl p-6 text-center hover:border-sage-300 transition-colors hover:shadow-lg group flex flex-col h-full">
        <div className="w-12 h-12 rounded-2xl bg-stone-50 text-stone-400 mx-auto flex items-center justify-center mb-4 group-hover:bg-sage-50 group-hover:text-sage-500 transition-colors flex-shrink-0">
            <Icon size={20} />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">{sub}</div>
        <div className="font-serif text-2xl text-stone-900 font-bold mb-2">{value || 'N/A'}</div>
        {description && <p className="text-xs text-stone-400 leading-relaxed px-2 flex-1">{description}</p>}
    </div>
);

const RoutineColumn = ({ title, icon: Icon, steps, color }: { title: string, icon: LucideIcon, steps: any[], color: string }) => (
    <div>
        <div className="flex items-center justify-center gap-3 mb-8">
            <Icon className={color} size={24} />
            <h4 className="font-serif text-2xl text-stone-800">{title}</h4>
        </div>
        <div className="space-y-6 relative">
             {/* Dotted Line */}
             <div className="absolute left-[15px] top-4 bottom-4 w-0.5 border-l-2 border-dotted border-stone-200"></div>
             
             {steps.map((step, i) => (
                <div key={i} className="flex gap-4 md:gap-6 relative">
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-stone-200 flex items-center justify-center text-xs font-bold text-stone-400 z-10 shadow-sm flex-shrink-0">
                        {i + 1}
                    </div>
                    <div className="flex-1 pt-1">
                        <div className="font-bold text-stone-800 text-sm mb-1">{step.productType}</div>
                        <p className="text-xs text-stone-500 leading-relaxed break-words">{step.instruction}</p>
                    </div>
                </div>
             ))}
        </div>
    </div>
);

export default DermatologyReport;
