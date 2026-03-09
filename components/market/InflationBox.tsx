'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, ChevronRight } from 'lucide-react';
import { translations, Language } from '@/lib/i18n';
import ItemImage from '../ItemImage';

interface InflationItem {
    name: string;
    change: number;
}

interface InflationStats {
    rate: number;
    status: 'high' | 'low' | 'stable';
    items: InflationItem[];
}

export default function InflationBox({ language = 'es' }: { language?: Language }) {
    const t = translations[language].inflation;
    const itemNames = translations[language].itemNames as Record<string, string>;
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
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-8 mt-12 mb-8 animate-pulse text-center">
            <div className="h-6 w-48 bg-white/10 rounded mx-auto mb-4" />
            <div className="h-32 w-full bg-white/5 rounded" />
        </div>
    );

    if (!stats || !stats.items) return null;

    const isPositive = stats.rate > 0;
    const isNegative = stats.rate < 0;

    return (
        <section className="mt-12 mb-12 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-white/5 pb-4">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 group">
                        <TrendingUp className={`w-5 h-5 ${isPositive ? 'text-red-400' : isNegative ? 'text-green-400' : 'text-blue-400'}`} />
                        {language === 'es' ? 'Inflación' : 'Inflation'}
                        <span className={`ml-2 px-2 py-0.5 rounded text-sm font-mono ${isPositive ? 'bg-red-400/10 text-red-400' : isNegative ? 'bg-green-400/10 text-green-400' : 'bg-white/5 text-slate-400'
                            }`}>
                            {isPositive ? '+' : ''}{stats.rate.toFixed(2)}%
                        </span>
                    </h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        {(t as any).dailyChange || 'Daily price level change'}
                    </p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] text-slate-500 font-mono">
                    <Info className="w-3 h-3" />
                    {((t as any).basketCount || '12 goods basket').toUpperCase()}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-4">
                {stats.items.map((item, idx) => {
                    const change = item.change;
                    const pos = change > 0;
                    const neg = change < 0;

                    return (
                        <div key={item.name} className="flex items-center justify-between group py-1.5 border-b border-white/[0.03] hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <ItemImage
                                    itemId={item.name}
                                    itemName={itemNames[item.name] || item.name}
                                    size={20}
                                    className="grayscale group-hover:grayscale-0 transition-all opacity-70 group-hover:opacity-100"
                                />
                                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors truncate">
                                    {(itemNames[item.name] || item.name).toUpperCase()}
                                </span>
                            </div>
                            <div className={`text-[11px] font-mono font-bold flex items-center gap-1 ${pos ? 'text-red-400' : neg ? 'text-green-400' : 'text-slate-600'
                                }`}>
                                {pos ? '↑' : neg ? '↓' : ''}
                                {Math.abs(change).toFixed(1)}%
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Accent light on bottom right */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
        </section>
    );
}
