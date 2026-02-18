'use client';

import { recipes } from '@/lib/calculator';
import { translations, Language } from '@/lib/i18n';
import ItemImage from '@/components/ItemImage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Hammer, Layers, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';

export default function ProductionPage() {
    const [language] = useLocalStorage<Language>('language', 'es');
    const t = translations[language];

    // Sort: Base items first, then by complexity (work points)
    const sortedRecipes = [...recipes].sort((a, b) => {
        if (a.is_base && !b.is_base) return -1;
        if (!a.is_base && b.is_base) return 1;
        return a.work_points - b.work_points;
    });

    return (
        <main className="min-h-screen p-4 md:p-8 relative overflow-hidden">
            {/* Background Layers */}
            <div className="fixed inset-0 mesh-gradient-bg" />
            <div className="fixed inset-0 tactical-grid" />

            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                <div className="text-center space-y-3 mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold animate-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] text-gradient-animate">
                        {t.productionTitle}
                    </h1>
                    <p className="text-foreground/70 text-lg">
                        {t.productionSubtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedRecipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            className="glass-card p-6 flex flex-col gap-4 hover:border-primary/50 transition-all duration-300 group"
                        >
                            {/* Header: Product Info */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <ItemImage
                                            itemId={recipe.id}
                                            itemName={(t.itemNames as Record<string, string>)[recipe.id] || recipe.name}
                                            size={56}
                                            className="relative z-10 drop-shadow-lg"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">
                                            {(t.itemNames as Record<string, string>)[recipe.id] || recipe.name}
                                        </h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${recipe.is_base ? 'bg-success/10 text-success border-success/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                            {recipe.is_base ? (language === 'es' ? 'Recurso Base' : 'Base Resource') : (language === 'es' ? 'Manufacturado' : 'Manufactured')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-2xl font-bold text-foreground/90 font-mono">
                                        {recipe.work_points}
                                    </span>
                                    <span className="text-xs text-foreground/50 uppercase tracking-wider font-semibold">
                                        {t.workPointsAbbr}
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-foreground/60 border-b border-white/5 pb-4">
                                {(t.itemDescriptions as Record<string, string>)[recipe.id] || (t.itemDescriptions as Record<string, string>)['default']}
                            </p>

                            {/* Ingredients / Inputs */}
                            <div className="flex-1">
                                <p className="text-xs text-foreground/50 uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                                    {recipe.is_base ? (
                                        <>
                                            <Layers className="w-3 h-3" />
                                            {language === 'es' ? 'Extracción Directa' : 'Direct Extraction'}
                                        </>
                                    ) : (
                                        <>
                                            <Hammer className="w-3 h-3" />
                                            {t.inputs}
                                        </>
                                    )}
                                </p>

                                {recipe.inputs && recipe.inputs.length > 0 ? (
                                    <div className="space-y-2">
                                        {recipe.inputs.map((input) => (
                                            <div key={input.id} className="flex items-center justify-between p-2 rounded bg-secondary/30 border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <ItemImage
                                                        itemId={input.id}
                                                        itemName={(t.itemNames as Record<string, string>)[input.id] || input.id}
                                                        size={28}
                                                    />
                                                    <span className="text-sm font-medium text-foreground/80">
                                                        {(t.itemNames as Record<string, string>)[input.id] || input.id}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-mono font-bold text-foreground">
                                                        {input.qty}x
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-3 rounded bg-secondary/20 border border-dashed border-white/10 text-center">
                                        <p className="text-sm text-foreground/40 italic">
                                            {language === 'es' ? 'No requiere materiales' : 'No materials required'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <Footer language={language} />
            </div>
        </main>
    );
}
