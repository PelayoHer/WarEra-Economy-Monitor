'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { MarketPrice, PriceOverrides } from '@/types';
import { recipes, mergeMarketPrices, rankProductsByProfit } from '@/lib/calculator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { translations, Language } from '@/lib/i18n';
import ProfitabilityTable from '@/components/ProfitabilityTable';
import ProfitCalculator from '@/components/ProfitCalculator';
import ManualPriceInputs from '@/components/ManualPriceInputs';
import LoadingIndicator from '@/components/LoadingIndicator';
import StatsCards from '@/components/StatsCards';
import LanguageToggle from '@/components/LanguageToggle';
import ExportButtons from '@/components/ExportButtons';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import Footer from '@/components/Footer';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { AlertCircle, Clock, Check } from 'lucide-react';

export default function Home() {
    const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
    const [timestamp, setTimestamp] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // LocalStorage for manual overrides, salary, and language
    const [manualPrices, setManualPrices] = useLocalStorage<PriceOverrides>('manualPrices', {});
    const [salaryPerPT, setSalaryPerPT] = useLocalStorage<number>('salaryPerPT', 1.5);
    const [language, setLanguage] = useLocalStorage<Language>('language', 'es');

    // Auto-refresh state
    const [nextUpdateMinutes, setNextUpdateMinutes] = useState<number | null>(null);
    const lastAutoRefreshRef = useRef<string | null>(null);
    const [refreshStatus, setRefreshStatus] = useState<'idle' | 'success' | 'no-change'>('idle');

    // Get translations
    const t = translations[language];
    const dateLocale = language === 'es' ? es : enUS;

    // Fetch market data
    const fetchMarketData = async (forceRefresh: boolean = false) => {
        console.log(`[CLIENT] fetchMarketData called. Force: ${forceRefresh}`);
        try {
            setLoading(true);
            setError(null);
            setRefreshStatus('idle');

            const currentTimestamp = timestamp; // Capture current timestamp

            const url = forceRefresh ? '/api/market-data?force=true' : '/api/market-data';
            console.log(`[CLIENT] Fetching URL: ${url}`);

            const response = await fetch(url);
            console.log(`[CLIENT] Response status: ${response.status}`);

            const data = await response.json();
            console.log('[CLIENT] Data received:', {
                timestamp: data.timestamp,
                pricesCount: data.prices?.length,
                wasUpdated: data.wasUpdated,
                error: data.error
            });

            setMarketPrices(data.prices || []);
            setTimestamp(data.timestamp);

            // Set feedback status
            if (data.timestamp !== currentTimestamp && data.error !== 'TOKEN_EXPIRED') {
                setRefreshStatus('success');
            } else {
                setRefreshStatus('no-change');
            }

            // Clear status after 3 seconds
            setTimeout(() => setRefreshStatus('idle'), 3000);

            if (data.error === 'TOKEN_EXPIRED') {
                console.warn('[CLIENT] Token expired error received');
                setError('TOKEN_EXPIRED');
            } else if (data.error) {
                console.error(`[CLIENT] Server returned error: ${data.error}`);
                setError(data.error);
            }
        } catch (err) {
            console.error('[CLIENT] Fetch error:', err);
            setError('Error loading market data');
        } finally {
            setLoading(false);
            console.log('[CLIENT] Fetch finished, loading set to false');
        }
    };

    // Calculate minutes until next update
    useEffect(() => {
        if (!timestamp) return;

        const checkUpdate = () => {
            const now = new Date();
            const lastUpdate = new Date(timestamp);
            // Default update interval is 1 hour
            const nextUpdate = new Date(lastUpdate.getTime() + 60 * 60 * 1000);
            const diffMs = nextUpdate.getTime() - now.getTime();
            const minutesUntil = Math.max(0, Math.floor(diffMs / (1000 * 60)));

            setNextUpdateMinutes(minutesUntil);

            // Logic: If we are past the update time (or close to it), we should try to refresh.
            // We retry every minute if the timestamp hasn't changed yet.
            if (diffMs <= 0 && !loading) {
                // If we haven't tried refreshing recently (e.g. in the last 60s), try now.
                // Or simply rely on the fact that if we just fetched and timestamp didn't change, we wait for next interval.
                // We'll use a simple throttle: don't fetch if we fetched < 1min ago?
                // For simplicity: If minutesUntil is 0, we try to fetch. The fetchMarketData has internal loading state to prevent parallel requests.
                // We pass forceRefresh=true to bypass some caches if needed, or rely on standard revalidation.
                // To avoid spamming, we can check if lastAutoRefreshRef is less than 1 minute ago.
                const nowTime = Date.now();
                const lastTry = lastAutoRefreshRef.current ? parseInt(lastAutoRefreshRef.current) : 0;

                if (nowTime - lastTry > 60000) { // Retry every 60 seconds
                    console.log('[AUTO-REFRESH] Triggering auto-update check...');
                    lastAutoRefreshRef.current = nowTime.toString();
                    fetchMarketData();
                }
            }
        };

        checkUpdate();
        const interval = setInterval(checkUpdate, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [timestamp, loading]);

    // Load data on mount
    useEffect(() => {
        fetchMarketData();
    }, []);

    // Merge prices with manual overrides
    const mergedPrices = useMemo(() => {
        return mergeMarketPrices(marketPrices, manualPrices);
    }, [marketPrices, manualPrices]);

    // Calculate profitability rankings
    const profitabilityData = useMemo(() => {
        return rankProductsByProfit(recipes, salaryPerPT, mergedPrices);
    }, [salaryPerPT, mergedPrices]);

    // Calculate stats
    const stats = useMemo(() => {
        const profitableCount = profitabilityData.filter(p => p.netProfit > 0).length;
        const topProduct = profitabilityData[0]?.recipe.name || 'N/A';
        const worstProduct = profitabilityData[profitabilityData.length - 1]?.recipe.name || 'N/A';

        return {
            totalProducts: profitabilityData.length,
            profitableCount,
            avgProfit: profitabilityData.reduce((sum, p) => sum + p.netProfit, 0) / profitabilityData.length,
            topProduct,
            worstProduct,
        };
    }, [profitabilityData]);

    // Format timestamp
    const formattedTime = timestamp
        ? formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: dateLocale })
        : '';

    // Calculate market mood (bullish if > 50% products are profitable)
    const marketMood = useMemo(() => {
        if (profitabilityData.length === 0) return 'neutral';
        const profitableCount = profitabilityData.filter(p => p.netProfit > 0).length;
        const ratio = profitableCount / profitabilityData.length;
        return ratio > 0.5 ? 'bullish' : 'bearish';
    }, [profitabilityData]);

    const [zenMode, setZenMode] = useState(false);

    return (
        <main className="min-h-screen p-4 md:p-8 relative overflow-hidden">
            {/* Background Layers */}
            <div className="fixed inset-0 mesh-gradient-bg" />
            <div className="fixed inset-0 tactical-grid" />
            <div className="fixed inset-0 particles" />

            {/* Dynamic Market Mood Overlay */}
            <div className={`mood-overlay ${marketMood === 'bullish' ? 'mood-bullish' : marketMood === 'bearish' ? 'mood-bearish' : ''}`} />

            {/* Zen Mode Toggle - Fixed at bottom right or top right */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setZenMode(!zenMode)}
                    className={`p-3 rounded-full shadow-lg transition-all duration-300 ${zenMode ? 'bg-primary text-background' : 'glass-card text-foreground/50 hover:text-foreground'}`}
                    title={zenMode ? (language === 'es' ? "Salir Modo Zen" : "Exit Zen Mode") : (language === 'es' ? "Modo Zen" : "Zen Mode")}
                >
                    {zenMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>
                    )}
                </button>
            </div>

            <div className={`max-w-7xl mx-auto space-y-6 transition-all duration-500 relative z-10 ${zenMode ? 'pt-10' : ''}`}>
                {/* Header */}
                <div className={`text-center space-y-3 transition-all duration-500 ${zenMode ? 'opacity-80 scale-95' : ''}`}>
                    <div className={`flex justify-end gap-2 mb-2 ${zenMode ? 'zen-mode-hidden' : ''}`}>
                        <LanguageToggle language={language} onLanguageChange={setLanguage} />
                    </div>

                    <h1 className={`text-4xl md:text-5xl font-bold animate-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] text-gradient-animate transition-all duration-500 ${zenMode ? 'text-3xl md:text-4xl' : ''}`}>
                        {t.title}
                    </h1>
                    <p className={`text-foreground/70 text-lg ${zenMode ? 'zen-mode-hidden' : ''}`}>
                        {t.subtitle}
                    </p>

                    {timestamp && (
                        <div className={`flex flex-wrap items-center justify-center gap-3 text-sm ${zenMode ? 'opacity-60' : ''}`}>
                            <div className="flex items-center gap-1.5 glass-card px-3 py-1.5">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="text-foreground/80">
                                    {t.lastUpdate} {formattedTime}
                                </span>
                            </div>
                            {nextUpdateMinutes !== null && !zenMode && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary">
                                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                                    <span className="font-semibold text-xs">
                                        {t.nextUpdate} {nextUpdateMinutes}min
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Disclaimer Banner */}
                <div className={zenMode ? 'zen-mode-hidden' : ''}>
                    <DisclaimerBanner language={language} />
                </div>

                {/* Loading Indicator */}
                {loading && <LoadingIndicator />}

                {/* Error Banner */}
                {error === 'TOKEN_EXPIRED' && (
                    <div className="glass-card p-4 border-danger/50 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
                        <p className="text-danger">
                            {t.tokenExpired}
                        </p>
                    </div>
                )}

                {!loading && (
                    <>
                        {/* Stats Cards */}
                        <div className={zenMode ? 'zen-mode-hidden' : ''}>
                            <StatsCards stats={stats} language={language} />
                        </div>

                        {/* Export Buttons */}
                        <div className={zenMode ? 'zen-mode-hidden' : ''}>
                            <ExportButtons data={profitabilityData} language={language} />
                        </div>

                        {/* Manual Price Inputs */}
                        <div className={zenMode ? 'zen-mode-hidden' : ''}>
                            <ManualPriceInputs
                                marketPrices={marketPrices}
                                manualPrices={manualPrices}
                                onPricesChange={setManualPrices}
                                language={language}
                            />
                        </div>

                        {/* Calculator */}
                        <div className={zenMode ? 'zen-mode-hidden' : ''}>
                            <ProfitCalculator
                                salaryPerPT={salaryPerPT}
                                onSalaryChange={setSalaryPerPT}
                                prices={mergedPrices}
                                language={language}
                            />
                        </div>

                        {/* Profitability Table */}
                        <ProfitabilityTable data={profitabilityData} language={language} />
                    </>
                )}

                {/* Footer */}
                <div className={zenMode ? 'zen-mode-hidden' : ''}>
                    <Footer language={language} />
                </div>
            </div>
        </main>
    );
}
