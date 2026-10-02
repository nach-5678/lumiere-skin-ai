
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ArrowLeft, Check, Sparkles, Droplets, Sun, AlertCircle, Baby, ShieldCheck, HeartPulse } from 'lucide-react';
import { UserProfile, MedicalProfile } from '../types';
import { saveUserProfile } from '../services/storageService';

interface OnboardingQuizProps {
  user: UserProfile;
  onComplete: (updatedUser: UserProfile) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 'skinType', title: 'How does your skin usually feel?', subtitle: 'Select the one that describes you best.' },
  { id: 'sensitive', title: 'Is your skin sensitive?', subtitle: 'Does it turn red or sting easily with new products?' },
  { id: 'pregnancy', title: 'Are you currently pregnant or breastfeeding?', subtitle: 'This helps us filter out unsafe ingredients like Retinol.' },
  { id: 'medical', title: 'Any safety considerations?', subtitle: 'Select all that apply.' },
  { id: 'budget', title: 'What is your skincare budget?', subtitle: 'We will tailor product recommendations to your price range.' }
];

const OnboardingQuiz: React.FC<OnboardingQuizProps> = ({ user, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  
  // Quiz State
  const [skinType, setSkinType] = useState<string>('');
  const [isSensitive, setIsSensitive] = useState<boolean | null>(null);
  const [pregnancyStatus, setPregnancyStatus] = useState<'none' | 'pregnant' | 'breastfeeding'>('none');
  const [safetyFlags, setSafetyFlags] = useState<string[]>([]);
  const [budgetPreference, setBudgetPreference] = useState<'budget' | 'mid-range' | 'luxury' | 'any'>('any');

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection('forward');
      setCurrentStep(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep(prev => prev - 1);
    } else {
        onCancel();
    }
  };

  const finishQuiz = async () => {
    // Construct Medical Profile
    const medicalProfile: MedicalProfile = {
        isPregnant: pregnancyStatus === 'pregnant',
        isBreastfeeding: pregnancyStatus === 'breastfeeding',
        isSensitive: isSensitive === true,
        onAccutane: safetyFlags.includes('accutane'),
        hasNutAllergy: safetyFlags.includes('nut'),
        hasAspirinAllergy: safetyFlags.includes('aspirin')
    };

    const updatedUser: UserProfile = {
        ...user,
        selfReportedSkinType: skinType,
        budgetPreference,
        medicalProfile
    };

    await saveUserProfile(updatedUser);
    onComplete(updatedUser);
  };

  const SelectionButton = ({ label, selected, onClick, icon: Icon, subLabel }: any) => (
      <button 
        onClick={onClick}
        className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-300 flex items-center justify-between group ${
            selected 
            ? 'border-sage-500 bg-sage-50 shadow-md ring-1 ring-sage-500' 
            : 'border-stone-100 bg-white hover:border-sage-300 hover:shadow-sm'
        }`}
      >
          <div className="flex items-center gap-4">
               {Icon && (
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selected ? 'bg-sage-500 text-white' : 'bg-stone-100 text-stone-400 group-hover:bg-sage-100 group-hover:text-sage-500'}`}>
                       <Icon size={20} />
                   </div>
               )}
               <div>
                   <div className={`font-bold text-lg ${selected ? 'text-sage-900' : 'text-stone-700'}`}>{label}</div>
                   {subLabel && <div className="text-xs text-stone-400">{subLabel}</div>}
               </div>
          </div>
          {selected && (
              <div className="w-6 h-6 bg-sage-500 rounded-full flex items-center justify-center text-white">
                  <Check size={14} />
              </div>
          )}
          {!selected && <div className="w-6 h-6 rounded-full border-2 border-stone-200"></div>}
      </button>
  );

  const renderStepContent = () => {
      switch(currentStep) {
          case 0: // Skin Type
            return (
                <div className="space-y-3 animate-slide-up">
                    <SelectionButton 
                        label="Oily" 
                        subLabel="Shiny all over, enlarged pores"
                        icon={Droplets}
                        selected={skinType === 'Oily'} 
                        onClick={() => { setSkinType('Oily'); setTimeout(handleNext, 300); }} 
                    />
                    <SelectionButton 
                        label="Dry" 
                        subLabel="Tight, flaky, dull appearance"
                        icon={Sun}
                        selected={skinType === 'Dry'} 
                        onClick={() => { setSkinType('Dry'); setTimeout(handleNext, 300); }} 
                    />
                    <SelectionButton 
                        label="Combination" 
                        subLabel="Oily T-zone, dry cheeks"
                        icon={Sparkles}
                        selected={skinType === 'Combination'} 
                        onClick={() => { setSkinType('Combination'); setTimeout(handleNext, 300); }} 
                    />
                    <SelectionButton 
                        label="Normal" 
                        subLabel="Balanced, no major concerns"
                        icon={Check}
                        selected={skinType === 'Normal'} 
                        onClick={() => { setSkinType('Normal'); setTimeout(handleNext, 300); }} 
                    />
                </div>
            );
          
          case 1: // Sensitive
            return (
                <div className="space-y-3 animate-slide-up">
                    <SelectionButton 
                        label="Yes, Sensitive" 
                        subLabel="Prone to redness, stinging, or reactions"
                        icon={AlertCircle}
                        selected={isSensitive === true} 
                        onClick={() => { setIsSensitive(true); setTimeout(handleNext, 300); }} 
                    />
                    <SelectionButton 
                        label="No, Resilient" 
                        subLabel="My skin rarely reacts negatively"
                        icon={ShieldCheck}
                        selected={isSensitive === false} 
                        onClick={() => { setIsSensitive(false); setTimeout(handleNext, 300); }} 
                    />
                </div>
            );

          case 2: // Pregnancy
            return (
                <div className="space-y-3 animate-slide-up">
                    <SelectionButton 
                        label="No / Not Applicable" 
                        icon={Check}
                        selected={pregnancyStatus === 'none'} 
                        onClick={() => { setPregnancyStatus('none'); setTimeout(handleNext, 300); }} 
                    />
                    <SelectionButton 
                        label="I am Pregnant" 
                        subLabel="Strict avoidance of Retinoids & BHAs"
                        icon={Baby}
                        selected={pregnancyStatus === 'pregnant'} 
                        onClick={() => { setPregnancyStatus('pregnant'); setTimeout(handleNext, 300); }} 
                    />
                    <SelectionButton 
                        label="I am Breastfeeding" 
                        subLabel="Prefer gentle, safe formulations"
                        icon={HeartPulse}
                        selected={pregnancyStatus === 'breastfeeding'} 
                        onClick={() => { setPregnancyStatus('breastfeeding'); setTimeout(handleNext, 300); }} 
                    />
                </div>
            );

          case 3: // Medical Safety
            const toggleFlag = (flag: string) => {
                if (safetyFlags.includes(flag)) setSafetyFlags(prev => prev.filter(f => f !== flag));
                else setSafetyFlags(prev => [...prev, flag]);
            };
            return (
                <div className="space-y-3 animate-slide-up">
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800 text-xs mb-4 flex gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        We use this to strictly filter out dangerous ingredients from your routine.
                    </div>

                    <SelectionButton 
                        label="On Accutane (Isotretinoin)" 
                        subLabel="Requires extreme barrier repair focus"
                        icon={AlertCircle}
                        selected={safetyFlags.includes('accutane')} 
                        onClick={() => toggleFlag('accutane')} 
                    />
                    <SelectionButton 
                        label="Nut Allergy" 
                        subLabel="No Almond/Macadamia oils"
                        icon={AlertCircle}
                        selected={safetyFlags.includes('nut')} 
                        onClick={() => toggleFlag('nut')} 
                    />
                    <SelectionButton 
                        label="Aspirin Allergy" 
                        subLabel="Avoid Salicylic Acid"
                        icon={AlertCircle}
                        selected={safetyFlags.includes('aspirin')} 
                        onClick={() => toggleFlag('aspirin')} 
                    />
                     <SelectionButton 
                        label="None of the above" 
                        icon={Check}
                        selected={safetyFlags.length === 0} 
                        onClick={() => setSafetyFlags([])} 
                    />
                </div>
            );
          case 4: // Budget
            return (
                <div className="space-y-3 animate-slide-up">
                    <SelectionButton 
                        label="Budget-Friendly (₹)" 
                        subLabel="Affordable, drugstore options (Under ₹500)"
                        icon={Check}
                        selected={budgetPreference === 'budget'} 
                        onClick={() => { setBudgetPreference('budget'); setTimeout(handleNext, 300); }} 
                    />
                    <SelectionButton 
                        label="Mid-Range (₹₹)" 
                        subLabel="Quality ingredients, moderate price (₹500 - ₹1500)"
                        icon={Check}
                        selected={budgetPreference === 'mid-range'} 
                        onClick={() => { setBudgetPreference('mid-range'); setTimeout(handleNext, 300); }} 
                    />
                    <SelectionButton 
                        label="Luxury (₹₹₹)" 
                        subLabel="Premium formulations and brands (₹1500+)"
                        icon={Sparkles}
                        selected={budgetPreference === 'luxury'} 
                        onClick={() => { setBudgetPreference('luxury'); setTimeout(handleNext, 300); }} 
                    />
                     <SelectionButton 
                        label="Any Budget" 
                        subLabel="Just show me what works best"
                        icon={Check}
                        selected={budgetPreference === 'any'} 
                        onClick={() => { setBudgetPreference('any'); setTimeout(handleNext, 300); }} 
                    />
                </div>
            );
          default: return null;
      }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;

  // Validation to enable Next button
  let canProceed = false;
  if (currentStep === 0 && skinType) canProceed = true;
  if (currentStep === 1 && isSensitive !== null) canProceed = true;
  if (currentStep === 2) canProceed = true; // Default selected
  if (currentStep === 3) canProceed = true; // Can be empty
  if (currentStep === 4 && budgetPreference) canProceed = true;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-stone-50 flex flex-col animate-fade-in transition-colors duration-300">
        
        {/* Progress Bar */}
        <div className="h-1 bg-stone-200 w-full">
            <div className="h-full bg-sage-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Header */}
        <div className="p-6 flex justify-between items-center">
             <button onClick={handleBack} className="p-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors">
                 <ArrowLeft size={24} />
             </button>
             <div className="text-xs font-bold uppercase tracking-widest text-stone-400">
                 Step {currentStep + 1} of {STEPS.length}
             </div>
             <div className="w-10"></div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-32 px-6">
            <div className="max-w-lg mx-auto w-full flex flex-col justify-center min-h-full py-8">
                <div className="mb-8 text-center">
                    <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-3 leading-tight animate-slide-up">
                        {STEPS[currentStep].title}
                    </h2>
                    <p className="text-stone-500 text-lg animate-slide-up" style={{animationDelay: '100ms'}}>
                        {STEPS[currentStep].subtitle}
                    </p>
                </div>

                {renderStepContent()}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-stone-200 bg-white absolute bottom-0 w-full flex justify-end z-10">
            <button 
                onClick={handleNext}
                disabled={!canProceed}
                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:scale-105 active:scale-95 ${
                    canProceed 
                    ? 'bg-stone-900 text-white hover:bg-black hover:shadow-xl cursor-pointer' 
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
            >
                {isLastStep ? 'Complete Profile' : 'Next'} 
                <ArrowRight size={20} />
            </button>
        </div>
    </div>,
    document.body
  );
};

export default OnboardingQuiz;
