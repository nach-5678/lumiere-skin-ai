
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Mail, Save, X, ShieldCheck, Baby, HeartPulse, Pill, Ban, AlertCircle, Scan, Trash2, Calendar, Target, Clock, ChevronRight, Play } from 'lucide-react';
import { UserProfile, MedicalProfile, WatchedSpot, SavedScan } from '../types';
import { saveUserProfile, getAllScans } from '../services/storageService';
import SpotJourneyModal from './SpotJourneyModal';

interface ProfileSettingsProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (user: UserProfile) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'medical' | 'watchlist' | 'history' | 'cycle'>('general');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [history, setHistory] = useState<SavedScan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSpotGroup, setSelectedSpotGroup] = useState<string | null>(null);
  
  // Medical State
  const [medical, setMedical] = useState<MedicalProfile>(user.medicalProfile || {
      isPregnant: false,
      isBreastfeeding: false,
      onAccutane: false,
      hasNutAllergy: false,
      hasAspirinAllergy: false,
      isSensitive: false
  });

  // Cycle State
  const [cycle, setCycle] = useState(user.cycleTracker || {
      lastPeriodDate: new Date().toISOString().split('T')[0],
      averageCycleLength: 28,
      isTracking: false
  });

  React.useEffect(() => {
      if (activeTab === 'history') {
          setLoadingHistory(true);
          getAllScans(user.email).then(scans => {
              setHistory(scans.sort((a, b) => b.timestamp - a.timestamp));
              setLoadingHistory(false);
          });
      }
  }, [activeTab, user.email]);

  const handleSave = async () => {
    const updatedUser: UserProfile = {
        ...user,
        name,
        email,
        medicalProfile: medical,
        cycleTracker: cycle
    };
    await saveUserProfile(updatedUser);
    onUpdate(updatedUser);
    onClose();
  };

  const deleteSpotGroup = async (label: string) => {
      if(!user.watchlist) return;
      const updatedWatchlist = user.watchlist.filter(s => s.label !== label);
      const updatedUser = { ...user, watchlist: updatedWatchlist };
      await saveUserProfile(updatedUser);
      onUpdate(updatedUser);
      
      if (selectedSpotGroup === label) {
          setSelectedSpotGroup(null);
      }
  };

  const deleteSpot = async (id: string) => {
      if(!user.watchlist) return;
      const updatedWatchlist = user.watchlist.filter(s => s.id !== id);
      const updatedUser = { ...user, watchlist: updatedWatchlist };
      await saveUserProfile(updatedUser);
      onUpdate(updatedUser);
      
      // If we deleted the last spot in a group, close the modal
      if (selectedSpotGroup) {
          const remainingInGroup = updatedWatchlist.filter(s => s.label === selectedSpotGroup);
          if (remainingInGroup.length === 0) {
              setSelectedSpotGroup(null);
          }
      }
  };

  const toggleAutoTrack = async (label: string, currentStatus: boolean) => {
      if (!user.watchlist) return;
      const updatedWatchlist = user.watchlist.map(s => s.label === label ? { ...s, autoTrack: !currentStatus } : s);
      const updatedUser = { ...user, watchlist: updatedWatchlist };
      await saveUserProfile(updatedUser);
      onUpdate(updatedUser);
  };

  const groupedSpots = user.watchlist?.reduce((acc, spot) => {
      if (!acc[spot.label]) acc[spot.label] = [];
      acc[spot.label].push(spot);
      return acc;
  }, {} as Record<string, WatchedSpot[]>) || {};

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden animate-slide-up relative">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-stone-100 flex justify-between items-center z-10">
            <h2 className="font-serif text-2xl text-stone-900">My Profile</h2>
            <button onClick={onClose} className="p-2 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-2 bg-stone-50/50 border-b border-stone-100 overflow-x-auto no-scrollbar">
            {[
                { id: 'general', label: 'General Info', icon: User },
                { id: 'medical', label: 'Safety Profile', icon: ShieldCheck },
                { id: 'watchlist', label: 'Spot Watch', icon: Target },
                { id: 'history', label: 'History', icon: Clock },
                { id: 'cycle', label: 'Cycle Tracker', icon: HeartPulse },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'border-stone-900 text-stone-900' 
                        : 'border-transparent text-stone-400 hover:text-stone-600'
                    }`}
                >
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50">
            
            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="space-y-6 max-w-md mx-auto">
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-sage-100 flex items-center justify-center text-sage-600 text-3xl font-serif font-bold border-4 border-white shadow-lg">
                            {name.charAt(0)}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 text-stone-400" size={18} />
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white border border-stone-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-sage-200 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 text-stone-400" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white border border-stone-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-sage-200 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-stone-200 mt-6">
                         <div className="flex items-center gap-3 text-stone-500 text-xs bg-stone-100 p-4 rounded-xl">
                             <Calendar size={16} />
                             Member since {new Date(user.joinedDate).toLocaleDateString()}
                         </div>
                    </div>
                </div>
            )}

            {/* Medical Tab */}
            {activeTab === 'medical' && (
                <div className="space-y-3 max-w-md mx-auto">
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-xs text-amber-800 mb-4 flex gap-3">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <p>These settings directly alter your AI routine recommendations to avoid contraindicated ingredients.</p>
                    </div>

                    <ToggleItem label="Pregnancy" sub="No Retinoids/BHA" icon={Baby} value={medical.isPregnant} onChange={(v:boolean) => setMedical(p => ({...p, isPregnant: v}))} />
                    <ToggleItem label="Breastfeeding" sub="Safety-first formulation" icon={HeartPulse} value={medical.isBreastfeeding} onChange={(v:boolean) => setMedical(p => ({...p, isBreastfeeding: v}))} />
                    <ToggleItem label="On Accutane" sub="Barrier repair only" icon={Pill} value={medical.onAccutane} onChange={(v:boolean) => setMedical(p => ({...p, onAccutane: v}))} />
                    <ToggleItem label="Nut Allergy" sub="No nut oils" icon={Ban} value={medical.hasNutAllergy} onChange={(v:boolean) => setMedical(p => ({...p, hasNutAllergy: v}))} />
                    <ToggleItem label="Aspirin Allergy" sub="No Salicylic Acid" icon={AlertCircle} value={medical.hasAspirinAllergy} onChange={(v:boolean) => setMedical(p => ({...p, hasAspirinAllergy: v}))} />
                </div>
            )}

            {/* Watchlist Tab */}
            {activeTab === 'watchlist' && (
                <div>
                     {!user.watchlist || user.watchlist.length === 0 ? (
                         <div className="text-center py-20 flex flex-col items-center opacity-50">
                             <Target size={48} className="mb-4 text-stone-300" />
                             <p className="font-bold text-stone-400">No tracked spots yet.</p>
                             <p className="text-xs text-stone-400 mt-2 max-w-xs">
                                 Go to Analysis Results {'>'} Defect Mapping and click on a spot to pin it here.
                             </p>
                         </div>
                     ) : (
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                             {Object.entries(groupedSpots).map(([label, spots]) => {
                                 const latestSpot = spots.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())[0];
                                 return (
                                     <div 
                                         key={label} 
                                         onClick={() => setSelectedSpotGroup(label)}
                                         className="bg-white p-3 rounded-2xl shadow-sm border border-stone-200 group relative cursor-pointer hover:border-stone-300 transition-all"
                                     >
                                         <div className="aspect-square bg-stone-900 rounded-xl overflow-hidden mb-3 relative">
                                             <img src={latestSpot.imageCrop} className="w-full h-full object-cover scale-150" alt="Spot" />
                                             <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl"></div>
                                             {spots.length > 1 && (
                                                 <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-white font-bold flex items-center gap-1">
                                                     <Play size={10} className="fill-current" /> {spots.length}
                                                 </div>
                                             )}
                                         </div>
                                         <div className="flex justify-between items-start">
                                             <div>
                                                 <div className="font-bold text-sm text-stone-800">{label}</div>
                                                 <div className="text-[10px] text-stone-400">Last updated {new Date(latestSpot.dateAdded).toLocaleDateString()}</div>
                                             </div>
                                         </div>
                                         
                                         <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                                             <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Auto-Track</span>
                                             <button
                                                 onClick={(e) => {
                                                     e.stopPropagation();
                                                     toggleAutoTrack(label, !!latestSpot.autoTrack);
                                                 }}
                                                 className={`w-8 h-4 rounded-full relative transition-colors ${latestSpot.autoTrack ? 'bg-sage-500' : 'bg-stone-300'}`}
                                             >
                                                 <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${latestSpot.autoTrack ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                             </button>
                                         </div>

                                         <button 
                                             onClick={(e) => {
                                                 e.stopPropagation();
                                                 deleteSpotGroup(label);
                                             }}
                                             className="absolute top-2 right-2 p-1.5 bg-white/90 text-stone-400 hover:text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                         >
                                             <Trash2 size={14} />
                                         </button>
                                     </div>
                                 );
                             })}
                         </div>
                     )}
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div>
                     {loadingHistory ? (
                         <div className="flex justify-center py-20">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
                         </div>
                     ) : history.length === 0 ? (
                         <div className="text-center py-20 flex flex-col items-center opacity-50">
                             <Clock size={48} className="mb-4 text-stone-300" />
                             <p className="font-bold text-stone-400">No scan history yet.</p>
                             <p className="text-xs text-stone-400 mt-2">Start your first analysis to see it here.</p>
                         </div>
                     ) : (
                         <div className="space-y-3">
                             {history.map((scan) => (
                                 <div key={scan.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4 hover:border-stone-300 transition-all">
                                     <div className="w-16 h-16 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                                         {scan.thumbnailUrl ? (
                                             <img src={scan.thumbnailUrl} className="w-full h-full object-cover" alt="Scan" />
                                         ) : (
                                             <div className="w-full h-full flex items-center justify-center text-stone-400">
                                                 <Scan size={20} />
                                             </div>
                                         )}
                                         <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl"></div>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <div className="flex justify-between items-start">
                                             <div>
                                                 <div className="font-bold text-stone-800 text-sm">Skin Analysis</div>
                                                 <div className="text-xs text-stone-400">{new Date(scan.timestamp).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                                             </div>
                                             <div className="flex flex-col items-end">
                                                 <div className="text-lg font-serif font-bold text-stone-900">{scan.score}</div>
                                                 <div className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Score</div>
                                             </div>
                                         </div>
                                         <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                             {scan.analysis.concerns.slice(0, 3).map((c, i) => (
                                                 <span key={i} className="text-[10px] px-2 py-1 bg-stone-50 text-stone-500 rounded-full border border-stone-100 whitespace-nowrap">
                                                     {c.name}
                                                 </span>
                                             ))}
                                             {scan.analysis.concerns.length > 3 && (
                                                 <span className="text-[10px] px-2 py-1 bg-stone-50 text-stone-400 rounded-full border border-stone-100 whitespace-nowrap">
                                                     +{scan.analysis.concerns.length - 3} more
                                                 </span>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                </div>
            )}

            {/* Cycle Tracker Tab */}
            {activeTab === 'cycle' && (
                <div className="space-y-6 max-w-md mx-auto">
                    <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                            <HeartPulse size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-stone-900 mb-1">Hormonal Sync</h3>
                            <p className="text-sm text-stone-600 leading-relaxed">
                                Track your cycle to get AI predictions for hormonal acne flare-ups on your chin and jawline. We'll adjust your routine automatically.
                            </p>
                        </div>
                    </div>

                    <ToggleItem 
                        label="Enable Cycle Tracking" 
                        sub="Allow AI to predict hormonal breakouts" 
                        icon={HeartPulse} 
                        value={cycle.isTracking} 
                        onChange={(val: boolean) => setCycle({ ...cycle, isTracking: val })} 
                    />

                    {cycle.isTracking && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Last Period Start Date</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-3.5 text-stone-400" size={18} />
                                    <input 
                                        type="date" 
                                        value={cycle.lastPeriodDate}
                                        onChange={(e) => setCycle({ ...cycle, lastPeriodDate: e.target.value })}
                                        className="w-full bg-white border border-stone-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-rose-200 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Average Cycle Length (Days)</label>
                                <div className="relative group">
                                    <Clock className="absolute left-4 top-3.5 text-stone-400" size={18} />
                                    <input 
                                        type="number" 
                                        min="20"
                                        max="45"
                                        value={cycle.averageCycleLength}
                                        onChange={(e) => setCycle({ ...cycle, averageCycleLength: parseInt(e.target.value) || 28 })}
                                        className="w-full bg-white border border-stone-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-rose-200 outline-none"
                                    />
                                </div>
                                <p className="text-xs text-stone-400 ml-1">Usually between 21 and 35 days.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-stone-100 flex justify-end gap-3 z-10">
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-50 transition-colors">
                Cancel
            </button>
            <button onClick={handleSave} className="px-8 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-black transition-transform hover:scale-105 shadow-lg flex items-center gap-2">
                <Save size={18} /> Save Changes
            </button>
        </div>

        {selectedSpotGroup && (
            <SpotJourneyModal 
                label={selectedSpotGroup}
                spots={groupedSpots[selectedSpotGroup] || []}
                onClose={() => setSelectedSpotGroup(null)}
                onDeleteSpot={deleteSpot}
            />
        )}

      </div>
    </div>,
    document.body
  );
};

export default ProfileSettings;
