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
import InflationBox from '@/components/market/InflationBox';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkline } from '@/components/market/Sparkline';
import MarketItemDetail from '@/components/market/MarketItemDetail';
import { Recipe } from '@/types';

export default function MarketPage() {
    const [language] = useLocalStorage<Language>('language', 'es');
    const t = translations[language];
    const dateLocale = language === 'es' ? es : enUS;

    const [prices, setPrices] = useState<MarketPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<Recipe | null>(null);

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

    const getPrice = useCallback((id: string) => {
        return prices.find(p => p.productId === id);
    }, [prices]);

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
    }, [recipes, prices, searchTerm, t.itemNames, getPrice]);

    // Ticker items (Top 10 by price)
    const tickerItems = useMemo(() => {
        return [...recipes]
            .map(r => ({ ...r, price: getPrice(r.id)?.averagePrice || 0 }))
            .sort((a, b) => b.price - a.price)
            .slice(0, 10);
    }, [recipes, prices, getPrice]);

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
                        {filteredRecipes.map((recipe, index) => {
                            const mp = getPrice(recipe.id);
                            const price = mp ? mp.averagePrice : 0;
                            const hasPrice = !!mp;

                            return (
                                <motion.div
                                    key={recipe.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index % 12 * 0.05 }}
                                    className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 flex flex-col justify-between hover:border-primary/50 hover:bg-slate-800/80 transition-all group relative overflow-hidden shadow-xl hover:shadow-primary/10"
                                >
                                    {/* Sparkline Background */}
                                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
                                        {mp && mp.history && (
                                            <Sparkline data={mp.history} />
                                        )}
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <ItemImage
                                                    itemId={recipe.id}
                                                    itemName={(t.itemNames as Record<string, string>)[recipe.id] || recipe.name}
                                                    size={56}
                                                    className="relative z-10 drop-shadow-2xl brightness-110 group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>

                                            {hasPrice && mp.change24h !== undefined && (
                                                <div className={`px-2 py-1 rounded-lg text-[10px] font-black font-mono border ${mp.change24h >= 0 ? 'bg-success/10 border-success/30 text-success' : 'bg-red-500/10 border-red-500/30 text-red-400'} shadow-lg backdrop-blur-md`}>
                                                    {mp.change24h >= 0 ? '+' : ''}{mp.change24h.toFixed(1)}%
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-black text-slate-100 text-xl leading-tight group-hover:text-primary transition-colors uppercase italic tracking-tighter">
                                                {(t.itemNames as Record<string, string>)[recipe.id] || recipe.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">
                                                    ID: {recipe.id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-6 pt-4 border-t border-white/5 space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black italic">Precio Actual</span>
                                                <div className="text-2xl font-mono font-black text-slate-100 tracking-tighter mt-1">
                                                    {hasPrice ? price.toFixed(2) : '-.--'}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black italic text-right">Volumen 24h</span>
                                                <div className="text-sm font-mono font-bold text-slate-400 mt-1">
                                                    {mp?.volume24h ? (mp.volume24h / 1000).toFixed(1) + 'K' : '0.0K'} <span className="text-[8px] opacity-30 italic font-mono uppercase tracking-tighter">QTY</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedItem(recipe)}
                                            className="w-full py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-primary/20 hover:border-transparent italic"
                                        >
                                            Analizar Datos
                                        </button>
                                    </div>

                                    {/* Scanline effect */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 pointer-events-none" />
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                <InflationBox language={language} />

                <Footer language={language} />
            </div>

            <AnimatePresence>
                {selectedItem && (
                    <MarketItemDetail
                        item={selectedItem}
                        price={getPrice(selectedItem.id)}
                        onClose={() => setSelectedItem(null)}
                        t={t}
                        language={language}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}
