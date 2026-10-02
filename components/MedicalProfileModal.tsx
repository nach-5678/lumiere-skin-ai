
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, Baby, Pill, Ban, HeartPulse, X } from 'lucide-react';
import { saveUserProfile } from '../services/storageService';
import { UserProfile, MedicalProfile } from '../types';

interface MedicalProfileModalProps {
  user: UserProfile;
  onComplete: (updatedUser: UserProfile) => void;
  onCancel: () => void;
}

const MedicalProfileModal: React.FC<MedicalProfileModalProps> = ({ user, onComplete, onCancel }) => {
  const [profile, setProfile] = useState<MedicalProfile>({
      isPregnant: false,
      isBreastfeeding: false,
      onAccutane: false,
      hasNutAllergy: false,
      hasAspirinAllergy: false,
      isSensitive: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const updatedUser = { ...user, medicalProfile: profile };
    await saveUserProfile(updatedUser);
    setIsSubmitting(false);
    onComplete(updatedUser);
  };

  const ToggleItem = ({ label, sub, icon: Icon, value, onChange }: any) => (
      <div 
        onClick={() => onChange(!value)}
        className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${value ? 'bg-sage-50 border-sage-500 shadow-sm' : 'bg-white border-stone-200 hover:border-stone-300'}`}
      >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${value ? 'bg-sage-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
              <Icon size={20} />
          </div>
          <div className="flex-1">
              <div className="font-bold text-stone-800 text-sm">{label}</div>
              <div className="text-xs text-stone-500">{sub}</div>
          </div>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${value ? 'border-sage-500 bg-sage-500' : 'border-stone-300'}`}>
              {value && <div className="w-2 h-2 bg-white rounded-full" />}
          </div>
      </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-slide-up relative ring-1 ring-white/20 max-h-[90vh] flex flex-col transition-colors duration-300">
        
        {/* Header */}
        <div className="bg-sage-900 p-8 relative overflow-hidden flex-shrink-0">
             <div className="absolute top-0 right-0 w-32 h-32 bg-sage-500/20 rounded-full blur-2xl"></div>
             <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                     <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-sage-200 border border-white/10">
                         <ShieldCheck size={24} />
                     </div>
                     <button onClick={onCancel} className="p-2 bg-black/20 text-white/60 hover:text-white rounded-full hover:bg-black/40 transition-colors">
                         <X size={16} />
                     </button>
                 </div>
                 <h2 className="font-serif text-2xl text-white font-bold">Safety Check</h2>
                 <p className="text-sage-200 text-xs mt-2 leading-relaxed max-w-xs">
                     To ensure your routine is safe, please flag any medical conditions. This filters out dangerous ingredients like Retinoids.
                 </p>
             </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-3 flex-1 bg-stone-50 transition-colors duration-300">
            <ToggleItem 
                label="Pregnancy" 
                sub="Excludes Retinoids & BHA" 
                icon={Baby} 
                value={profile.isPregnant}
                onChange={(v: boolean) => setProfile(p => ({...p, isPregnant: v}))}
            />
            <ToggleItem 
                label="Breastfeeding" 
                sub="Safety-first formulation" 
                icon={HeartPulse} 
                value={profile.isBreastfeeding}
                onChange={(v: boolean) => setProfile(p => ({...p, isBreastfeeding: v}))}
            />
             <ToggleItem 
                label="On Accutane (Isotretinoin)" 
                sub="Zero actives, barrier focus" 
                icon={Pill} 
                value={profile.onAccutane}
                onChange={(v: boolean) => setProfile(p => ({...p, onAccutane: v}))}
            />
             <ToggleItem 
                label="Nut Allergy" 
                sub="No almond/macadamia oils" 
                icon={Ban} 
                value={profile.hasNutAllergy}
                onChange={(v: boolean) => setProfile(p => ({...p, hasNutAllergy: v}))}
            />
             <ToggleItem 
                label="Aspirin Allergy" 
                sub="No Salicylic Acid" 
                icon={AlertCircle} 
                value={profile.hasAspirinAllergy}
                onChange={(v: boolean) => setProfile(p => ({...p, hasAspirinAllergy: v}))}
            />
        </div>

        {/* Footer */}
        <div className="p-6 pt-2 bg-stone-50 border-t border-stone-200 flex-shrink-0 transition-colors duration-300">
            <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-stone-900 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg disabled:opacity-70"
            >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <span className="flex items-center gap-2">Confirm Profile <ArrowRight size={16} /></span>}
            </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default MedicalProfileModal;
