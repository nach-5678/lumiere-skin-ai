
import React, { useEffect, useState } from 'react';
import { CloudSun, Loader2, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getEnvironmentalData } from '../services/weatherService';
import { WeatherData, SkincareProduct } from '../types';

interface EnvironmentalMonitorProps {
  recommendedSunscreen?: SkincareProduct;
}

const EnvironmentalMonitor: React.FC<EnvironmentalMonitorProps> = ({ recommendedSunscreen }) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const result = await getEnvironmentalData(pos.coords.latitude, pos.coords.longitude);
          setData(result);
        } catch (e) {
          setError("Failed to load");
        } finally {
          setLoading(false);
        }
      }, () => {
        setError("No location");
        setLoading(false);
      });
    } else {
        setLoading(false);
    }
  }, []);

  if (loading) return (
      <div className="bg-white rounded-2xl p-4 border border-stone-100 flex items-center justify-center gap-2 text-stone-400 text-xs transition-colors duration-300">
          <Loader2 className="animate-spin" size={12} /> Syncing environment...
      </div>
  );

  if (error || !data) return (
    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 flex items-center gap-2 text-stone-400 text-xs transition-colors duration-300">
         <MapPin size={14} />
         <span>Enable location for weather insights.</span>
    </div>
  );

  const isHighRisk = data.uvIndex > 5 || data.humidity < 30;

  return (
    <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${isHighRisk ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-stone-100 shadow-sm'}`}>
        <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isHighRisk ? 'bg-amber-100 text-amber-600' : 'bg-sage-50 text-sage-600'}`}>
                 <CloudSun size={20} />
             </div>
             <div>
                 <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1">
                     Environmental Shield
                 </div>
                 <div className="text-sm font-bold text-stone-700 leading-tight mt-0.5 max-w-md">
                     {data.advice}
                     {data.uvIndex > 3 && (
                         <button 
                             onClick={() => window.open(`https://www.amazon.in/s?k=sunscreen+spf+50`, '_blank')}
                             className="ml-2 inline-flex items-center gap-1 text-[10px] bg-stone-900 text-white px-2 py-1 rounded hover:bg-black transition-colors"
                         >
                             Buy Sunscreen
                         </button>
                     )}
                 </div>
             </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 border-t sm:border-t-0 sm:border-l border-stone-100 pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto items-start sm:items-center">
            <div className="flex gap-6">
                <div>
                    <span className="text-stone-400 block uppercase text-[10px] font-bold mb-0.5">UV Index</span>
                    <span className={`text-lg font-serif font-bold ${data.uvIndex > 5 ? 'text-rose-500' : 'text-stone-800'}`}>
                        {data.uvIndex}
                    </span>
                </div>
                <div>
                    <span className="text-stone-400 block uppercase text-[10px] font-bold mb-0.5">Humidity</span>
                    <span className={`text-lg font-serif font-bold ${data.humidity < 30 ? 'text-amber-500' : 'text-stone-800'}`}>
                        {data.humidity}%
                    </span>
                </div>
                <div>
                    <span className="text-stone-400 block uppercase text-[10px] font-bold mb-0.5">Temp</span>
                    <span className="text-lg font-serif font-bold text-stone-800">
                        {Math.round(data.temperature)}°
                    </span>
                </div>
            </div>
            
            {data.uvIndex > 3 && (
                <a 
                    href={recommendedSunscreen?.purchaseUrl || `https://www.amazon.com/s?k=${encodeURIComponent(recommendedSunscreen?.name || 'best sunscreen for face')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 sm:mt-0 bg-stone-900 hover:bg-stone-800 text-white text-[10px] uppercase tracking-wider font-bold py-2 px-4 rounded-full transition-colors whitespace-nowrap"
                >
                    Buy Recommended Sunscreen
                </a>
            )}
        </div>
    </div>
  );
};

export default EnvironmentalMonitor;
