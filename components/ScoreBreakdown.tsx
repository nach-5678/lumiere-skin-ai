
import React from 'react';
import { SkinAnalysisResult } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Droplets, Shield, Sun, Activity, ScanLine, Clock, ArrowUpRight, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';

interface ScoreBreakdownProps {
  result: SkinAnalysisResult;
}

// Icon mapping helper
const getMetricIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('hydra')) return { icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50', bar: 'bg-blue-400' };
    if (n.includes('barrier')) return { icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50', bar: 'bg-emerald-400' };
    if (n.includes('oil')) return { icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50', bar: 'bg-amber-400' };
    if (n.includes('pigment') || n.includes('tone')) return { icon: Sun, color: 'text-violet-500', bg: 'bg-violet-50', bar: 'bg-violet-400' };
    if (n.includes('pore') || n.includes('text')) return { icon: ScanLine, color: 'text-pink-500', bg: 'bg-pink-50', bar: 'bg-pink-400' };
    if (n.includes('elast') || n.includes('wrink')) return { icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50', bar: 'bg-rose-400' };
    return { icon: Activity, color: 'text-stone-500', bg: 'bg-stone-50', bar: 'bg-stone-400' };
};

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ result }) => {
  const { reportData } = result;
  const metrics = reportData?.metricsBreakdown || [];

  // Transform data for Radar Chart
  const chartData = metrics.map(m => ({
      subject: m.name,
      A: m.score,
      fullMark: 100
  }));

  // Sort by score ascending to get the areas needing most help
  const priorityImprovements = [...metrics].sort((a, b) => a.score - b.score).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-stone-100 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sage-50 rounded-full blur-3xl -z-0 opacity-50 translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            
            {/* Left: Radar Chart */}
            <div className="w-full md:w-1/2 flex flex-col items-center">
                <h3 className="font-serif text-xl text-stone-800 mb-2 flex items-center gap-2">
                    <Activity size={20} className="text-sage-500" />
                    Skin Health Matrix
                </h3>
                <div className="h-[280px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#78716c', fontSize: 10, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="My Skin"
                                dataKey="A"
                                stroke="#8FA88F"
                                strokeWidth={3}
                                fill="#DAE5D0"
                                fillOpacity={0.5}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#57534e', fontWeight: 'bold' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                    
                    {/* Center Score Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-stone-100">
                             <span className="text-xl font-serif font-bold text-stone-900">{result.healthScore}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Metrics Grid */}
            <div className="w-full md:w-1/2">
                <div className="grid grid-cols-1 gap-4">
                    {metrics.map((item, idx) => {
                        const style = getMetricIcon(item.name);
                        const isGood = item.score >= 80;
                        const isAvg = item.score >= 60 && item.score < 80;
                        const MetricIcon = style.icon;
                        
                        return (
                            <div key={idx} className="flex items-center gap-4 group">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${style.bg} ${style.color}`}>
                                    <MetricIcon size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-sm font-bold text-stone-700">{item.name}</span>
                                        <span className="text-xs font-medium text-stone-400">{item.score}/100</span>
                                    </div>
                                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${style.bar}`} 
                                            style={{ width: `${item.score}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>

      {/* Ways to Improve Section */}
      <div className="bg-stone-900 text-stone-100 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sage-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
          
          <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                  <div>
                      <h3 className="font-serif text-2xl text-white mb-1 flex items-center gap-2">
                        <TrendingUp className="text-sage-300" /> Priority Improvements
                      </h3>
                      <p className="text-stone-400 text-sm">Focus on these areas to boost your skin health score.</p>
                  </div>
                  <div className="hidden sm:block">
                      <Sparkles className="text-amber-300 animate-pulse" size={24} />
                  </div>
              </div>

              <div className="grid gap-4">
                  {priorityImprovements.map((item, idx) => {
                      const style = getMetricIcon(item.name);
                      return (
                          <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-start hover:bg-white/10 transition-colors">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center font-serif font-bold text-stone-400 border border-stone-700 mt-1">
                                  {idx + 1}
                              </div>
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-bold text-stone-200 text-sm">{item.name}</h4>
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${item.score < 60 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                          Status: {item.status}
                                      </span>
                                  </div>
                                  <p className="text-sm text-stone-400 leading-relaxed italic">
                                      "{item.advice}"
                                  </p>
                              </div>
                              <div className="flex-shrink-0 self-center">
                                  <ArrowUpRight className="text-stone-600" size={20} />
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>
    </div>
  );
};

export default ScoreBreakdown;
