'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { recipes } from '@/lib/calculator';
import { translations, Language } from '@/lib/i18n';
import ItemImage from '@/components/ItemImage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Coins, TrendingUp, Activity, Search, RefreshCw } from 'lucide-react';
import Footer from '@/components/Footer';
import LoadingIndicator from '@/components/LoadingIndicator';
import { MarketPrice } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { StockBackground } from '@/components/StockBackground';

export default function MarketPage() {
    const [language] = useLocalStorage<Language>('language', 'es');
    const t = translations[language];
    const dateLocale = language === 'es' ? es : enUS;

    const [prices, setPrices] = useState<MarketPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch prices
    const fetchPrices = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/market-data');
            const data = await response.json();

            if (data.prices) {
                setPrices(data.prices);
            }
            if (data.timestamp) {
                setLastUpdate(data.timestamp);
            }
        } catch (error) {
            console.error('Failed to fetch prices', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrices();
    }, [fetchPrices]);

    const getPrice = (id: string) => {
        return prices.find(p => p.productId === id);
    };

    // Filter and Sort
    const filteredRecipes = useMemo(() => {
        return recipes
            .filter(r => {
                const name = (t.itemNames as Record<string, string>)[r.id] || r.name;
                return name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => {
                const priceA = getPrice(a.id)?.averagePrice || 0;
                const priceB = getPrice(b.id)?.averagePrice || 0;
                // Sort by price descending, then name
                if (priceA !== priceB) return priceB - priceA;

                const nameA = (t.itemNames as Record<string, string>)[a.id] || a.name;
                const nameB = (t.itemNames as Record<string, string>)[b.id] || b.name;
                return nameA.localeCompare(nameB);
            });
    }, [recipes, prices, searchTerm, t.itemNames]);

    // Ticker items (Top 10 by price)
    const tickerItems = useMemo(() => {
        return [...recipes]
            .map(r => ({ ...r, price: getPrice(r.id)?.averagePrice || 0 }))
            .sort((a, b) => b.price - a.price)
            .slice(0, 10);
    }, [recipes, prices]);

    return (
        <main className="min-h-screen bg-[#0a0f1c] relative text-slate-300 font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,24,38,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.9)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-blue-900/10 pointer-events-none" />
            <StockBackground />

            <div className="max-w-7xl mx-auto p-4 md:p-8 pt-8 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/5 pb-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Activity className="w-6 h-6 text-primary animate-pulse" />
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                {t.marketTitle}
                            </h1>
                        </div>
                        <p className="text-slate-400 max-w-xl">
                            {t.marketSubtitle}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {lastUpdate && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-white/5 px-2 py-1 rounded">
                                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                {t.lastUpdate} {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true, locale: dateLocale })}
                            </div>
                        )}

                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-28 z-30 bg-[#0a0f1c]/95 backdrop-blur py-2 -mx-2 px-2 border-b border-white/5 md:border-none md:bg-transparent md:backdrop-filter-none md:static">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder as string}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                        />
                    </div>

                    <button
                        onClick={() => fetchPrices()}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors border border-primary/20 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {t.refresh as string || 'Refresh'}
                    </button>
                </div>

                {/* Market Table */}
                {loading && filteredRecipes.length === 0 ? (
                    <div className="h-60 flex items-center justify-center">
                        <LoadingIndicator />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredRecipes.map((recipe) => {
                            const mp = getPrice(recipe.id);
                            const price = mp ? mp.averagePrice : 0;
                            const hasPrice = !!mp;

                            return (
                                <div
                                    key={recipe.id}
                                    className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-4 flex flex-col justify-between hover:border-primary/50 hover:bg-slate-800/80 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{recipe.id}</div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <ItemImage
                                                itemId={recipe.id}
                                                itemName={(t.itemNames as Record<string, string>)[recipe.id] || recipe.name}
                                                size={48}
                                                className="relative z-10 drop-shadow-lg"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-200 text-lg leading-tight group-hover:text-primary transition-colors">
                                                {(t.itemNames as Record<string, string>)[recipe.id] || recipe.name}
                                            </h3>
                                            <span className="text-xs text-slate-500 font-mono">
                                                WARERA: {recipe.id.substring(0, 3).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{t.currentPrice || 'PRICE'}</span>
                                            {hasPrice ? (
                                                <div className="text-right flex items-center gap-2">
                                                    <div className="text-2xl font-mono font-bold text-success tracking-tight leading-none">
                                                        {price.toFixed(2)}
                                                    </div>
                                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" className="text-warning text-xl filter drop-shadow-black"><path d="M12 5C7.031 5 2 6.546 2 9.5S7.031 14 12 14c4.97 0 10-1.546 10-4.5S16.97 5 12 5zm-5 9.938v3c1.237.299 2.605.482 4 .541v-3a21.166 21.166 0 0 1-4-.541zm6 .54v3a20.994 20.994 0 0 0 4-.541v-3a20.994 20.994 0 0 1-4 .541zm6-1.181v3c1.801-.755 3-1.857 3-3.297v-3c0 1.44-1.199 2.542-3 3.297zm-14 3v-3C3.2 13.542 2 12.439 2 11v3c0 1.439 1.2 2.542 3 3.297z"></path></svg>
                                                </div>
                                            ) : (
                                                <span className="text-slate-600 font-mono text-xl">-</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Scanline effect */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 pointer-events-none" />
                                </div>
                            );
                        })}
                    </div>
                )}

                <Footer language={language} />
            </div>
        </main>
    );
}
