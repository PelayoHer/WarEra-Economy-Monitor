'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { translations, Language } from '@/lib/i18n';

interface InflationStats {
    rate: number;
    status: 'high' | 'low' | 'stable';
    basketSize: number;
    topInflated: { name: string; change: number }[];
    topDeflated: { name: string; change: number }[];
}

export default function InflationBox({ language = 'es' }: { language?: Language }) {
    const t = translations[language].inflation;
    const [stats, setStats] = useState<InflationStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/market-stats');
                const data = await res.json();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch inflation stats', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) return (
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6 animate-pulse">
            <div className="h-4 w-32 bg-white/10 rounded mb-4" />
            <div className="h-8 w-24 bg-white/10 rounded" />
        </div>
    );

    if (!stats) return null;

    const isPositive = stats.rate > 0;
    const isNegative = stats.rate < 0;

    return (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group mt-12 mb-8">
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-20 transition-colors ${isPositive ? 'bg-red-500' : isNegative ? 'bg-green-500' : 'bg-blue-500'
                }`} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                        <TrendingUp className="w-4 h-4" />
                        <span className="uppercase tracking-wider">{t.title}</span>
                        <div className="group/info relative">
                            <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-900/95 backdrop-blur-md text-[10px] rounded border border-white/10 opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50 text-slate-300">
                                {t.subtitle}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-5xl font-bold font-mono tracking-tighter ${isPositive ? 'text-red-400' : isNegative ? 'text-green-400' : 'text-slate-200'
                            }`}>
                            {isPositive ? '+' : ''}{stats.rate.toFixed(2)}%
                        </span>
                        <span className="text-slate-500 text-xs font-mono">/ 24H</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 backdrop-blur-sm">
                        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">
                            {t.statusTitle}
                        </div>
                        <div className="text-sm font-bold flex items-center gap-2">
                            {isPositive ? (
                                <span className="text-red-400 uppercase flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> {t.status.high}</span>
                            ) : isNegative ? (
                                <span className="text-green-400 uppercase flex items-center gap-1.5"><TrendingDown className="w-4 h-4" /> {t.status.low}</span>
                            ) : (
                                <span className="text-blue-400 uppercase flex items-center gap-1.5"><Minus className="w-4 h-4" /> {t.status.stable}</span>
                            )}
                        </div>
                    </div>

                    <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 backdrop-blur-sm">
                        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">
                            {t.basketTitle}
                        </div>
                        <div className="flex gap-2">
                            {stats.topInflated.slice(0, 1).map((item, i) => (
                                <div key={i} className="text-[10px] font-bold text-red-300 bg-red-400/10 px-1.5 py-1 rounded border border-red-400/20 shadow-sm">
                                    ↑ {(translations[language].itemNames as any)[item.name]?.toUpperCase() || item.name.toUpperCase()} (+{item.change.toFixed(1)}%)
                                </div>
                            ))}
                            {stats.topDeflated.slice(0, 1).map((item, i) => (
                                <div key={i} className="text-[10px] font-bold text-green-300 bg-green-400/10 px-1.5 py-1 rounded border border-green-400/20 shadow-sm">
                                    ↓ {(translations[language].itemNames as any)[item.name]?.toUpperCase() || item.name.toUpperCase()} ({item.change.toFixed(1)}%)
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
