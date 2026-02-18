
'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { getPlaygroundData } from '@/app/actions/getPlaygroundData';
import { CompanyData } from '@/lib/playground-api';
import CompanyCard from '@/components/playground/CompanyCard';
import ResourceFlow from '@/components/playground/ResourceFlow';
import { RefreshCw, Search, User, X, CheckCircle, Loader2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { translations, Language } from '@/lib/i18n';

export default function PlaygroundPage() {
    const [language] = useLocalStorage<Language>('language', 'es');
    const t = translations[language];

    const [companies, setCompanies] = useState<CompanyData[]>([]);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Username search state
    const [usernameInput, setUsernameInput] = useState('');
    const [activeUsername, setActiveUsername] = useState<string | undefined>(undefined);

    // Autocomplete state
    const [suggestion, setSuggestion] = useState<{ username: string; found: boolean } | null>(null);
    const [checking, setChecking] = useState(false);
    const [showSuggestion, setShowSuggestion] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadData = async (username?: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getPlaygroundData(username);
            if (result.error) {
                setError(result.error);
                setCompanies([]);
            } else {
                setCompanies(result.companies as CompanyData[] || []);
                setPrices(result.marketPrices || {});
            }
        } catch (e) {
            console.error(e);
            setError(t.playground.error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-load behavior removed to prevent default user data exposure
    // useEffect(() => {
    //     loadData(activeUsername);
    // }, []);

    // Debounced username check for autocomplete
    const checkUsername = useCallback((value: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.trim().length < 2) {
            setSuggestion(null);
            setShowSuggestion(false);
            return;
        }

        setChecking(true);
        setShowSuggestion(true);

        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/playground/search-user?q=${encodeURIComponent(value.trim())}`);
                const data = await res.json();
                setSuggestion(data);
            } catch {
                setSuggestion(null);
            } finally {
                setChecking(false);
            }
        }, 500);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setUsernameInput(val);
        checkUsername(val);
    };

    const handleSelectSuggestion = (username: string) => {
        setUsernameInput(username);
        setSuggestion(null);
        setShowSuggestion(false);
        setActiveUsername(username);
        loadData(username);
    };

    const handleSearch = () => {
        const trimmed = usernameInput.trim();
        if (!trimmed) return;
        setShowSuggestion(false);
        setActiveUsername(trimmed);
        loadData(trimmed);
    };

    const handleClearUser = () => {
        setUsernameInput('');
        setActiveUsername(undefined);
        setSuggestion(null);
        setShowSuggestion(false);
        loadData(undefined);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
        if (e.key === 'Escape') setShowSuggestion(false);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current && !inputRef.current.contains(e.target as Node)) {
                setShowSuggestion(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleCompanyUpdate = (updated: CompanyData) => {
        setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
    };

    const summary = useMemo(() => {
        return { totalDailyProfit: 0, totalWages: 0, totalProduction: new Map() };
    }, [companies, prices]);

    return (
        <main className="min-h-screen p-4 md:p-8 relative overflow-hidden pb-20">
            {/* Background Layers */}
            <div className="fixed inset-0 mesh-gradient-bg" />
            <div className="fixed inset-0 tactical-grid" />
            <div className="fixed inset-0 particles" />

            <div className="max-w-7xl mx-auto space-y-6 relative z-10">
                {/* Header */}
                <header className="flex flex-col gap-4 border-b border-white/10 pb-6 backdrop-blur-sm rounded-xl p-4 bg-gray-900/30">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                                {t.playground.title}
                            </h1>
                            <p className="text-gray-400 mt-1 text-sm">{t.playground.subtitle}</p>
                        </div>

                        <button
                            onClick={() => loadData(activeUsername)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors border border-white/10 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            {t.playground.refresh}
                        </button>
                    </div>

                    {/* Username Search Bar with Autocomplete */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="relative flex-1 max-w-md">
                            {/* Input */}
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={usernameInput}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onFocus={() => usernameInput.trim().length >= 2 && setShowSuggestion(true)}
                                placeholder={language === 'es' ? 'Nombre de usuario en WarEra...' : 'WarEra username...'}
                                className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-10 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-black/60 transition-all"
                                autoComplete="off"
                            />
                            {/* Status icon inside input */}
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                {checking && <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />}
                                {!checking && suggestion?.found && (
                                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                                )}
                            </div>

                            {/* Dropdown suggestion */}
                            {showSuggestion && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute top-full left-0 right-0 mt-1 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-xl z-50"
                                >
                                    {checking ? (
                                        <div className="px-4 py-3 text-xs text-gray-500 flex items-center gap-2">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            {language === 'es' ? 'Buscando...' : 'Searching...'}
                                        </div>
                                    ) : suggestion?.found ? (
                                        <button
                                            onMouseDown={() => handleSelectSuggestion(suggestion.username)}
                                            className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-blue-500/20 transition-colors group"
                                        >
                                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                            <div>
                                                <span className="text-gray-200 font-medium">{suggestion.username}</span>
                                                <span className="text-gray-500 text-xs ml-2">
                                                    {language === 'es' ? '· Usuario encontrado' : '· User found'}
                                                </span>
                                            </div>
                                        </button>
                                    ) : suggestion && !suggestion.found ? (
                                        <div className="px-4 py-3 text-xs text-gray-500 flex items-center gap-2">
                                            <X className="w-3 h-3 text-red-400" />
                                            {language === 'es'
                                                ? `"${suggestion.username}" no encontrado`
                                                : `"${suggestion.username}" not found`}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSearch}
                            disabled={loading || !usernameInput.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-500/80 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm text-white font-medium transition-colors border border-blue-500/30"
                        >
                            <Search className="w-4 h-4" />
                            {language === 'es' ? 'Buscar' : 'Search'}
                        </button>

                        {/* Active user badge */}
                        {activeUsername && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
                                <User className="w-3.5 h-3.5" />
                                <span className="font-mono font-medium">{activeUsername}</span>
                                <button
                                    onClick={handleClearUser}
                                    className="hover:text-white transition-colors ml-1"
                                    title={language === 'es' ? 'Volver a mis datos' : 'Back to my data'}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl text-red-300 text-sm flex items-center gap-3">
                        <span className="text-red-400">⚠</span>
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading && companies.length === 0 ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-gray-400">{t.playground.loading}</span>
                    </div>
                ) : (
                    <>
                        {/* Resource Flow Module */}
                        <ResourceFlow companies={companies} />

                        {/* Companies Grid */}
                        {companies.length > 0 ? (
                            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {companies.map((c, idx) => (
                                    <CompanyCard
                                        key={c.id}
                                        index={idx}
                                        company={c}
                                        onChange={handleCompanyUpdate}
                                        marketPrices={prices}
                                    />
                                ))}
                            </section>
                        ) : !loading && (
                            <div className="text-center py-16 text-gray-500">
                                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">
                                    {language === 'es'
                                        ? 'No se encontraron empresas. Prueba con otro usuario.'
                                        : 'No companies found. Try a different username.'}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
