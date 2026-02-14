'use client';

import { TrendingUp, TrendingDown, Award } from 'lucide-react';
import { translations, Language } from '@/lib/i18n';

interface StatsData {
    totalProducts: number;
    profitableCount: number;
    avgProfit: number;
    topProduct: string;
    worstProduct: string;
}

interface Props {
    stats: StatsData;
    language: Language;
}

export default function StatsCards({ stats, language }: Props) {
    const t = translations[language];
    const profitPercentage = ((stats.profitableCount / stats.totalProducts) * 100).toFixed(0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Profitable */}
            <div className="premium-card p-4 transition-smooth group">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-foreground/60">{t.profitableProducts}</p>
                        <p className="text-2xl font-bold text-success mt-1">
                            {stats.profitableCount}/{stats.totalProducts}
                            <span className="text-sm ml-2 text-foreground/60">({profitPercentage}%)</span>
                        </p>
                    </div>
                    <div className="p-3 rounded-full bg-success/20 group-hover:bg-success/30 transition-smooth">
                        <TrendingUp className="w-6 h-6 text-success" />
                    </div>
                </div>
            </div>

            {/* Best Product */}
            <div className="premium-card p-4 transition-smooth group border-success/30 shadow-[0_0_15px_-5px_hsla(var(--success),0.3)]">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-foreground/60">{t.bestOption}</p>
                        <p className="text-lg font-bold text-success mt-1 truncate">{stats.topProduct}</p>
                    </div>
                    <div className="p-3 rounded-full bg-success/20 group-hover:bg-success/30 transition-smooth">
                        <Award className="w-6 h-6 text-success animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Worst Product */}
            <div className="premium-card p-4 transition-smooth group border-danger/30 shadow-[0_0_15px_-5px_hsla(var(--danger),0.3)]">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-foreground/60">{t.worstOption}</p>
                        <p className="text-lg font-bold text-danger mt-1 truncate">{stats.worstProduct}</p>
                    </div>
                    <div className="p-3 rounded-full bg-danger/20 group-hover:bg-danger/30 transition-smooth">
                        <TrendingDown className="w-6 h-6 text-danger" />
                    </div>
                </div>
            </div>
        </div>
    );
}
