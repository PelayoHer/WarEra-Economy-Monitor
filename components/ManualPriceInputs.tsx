'use client';

import { useState } from 'react';
import { MarketPrice, PriceOverrides } from '@/types';
import { recipes } from '@/lib/calculator';
import { Bot, PencilLine, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import ItemImage from '@/components/ItemImage';
import { translations, Language } from '@/lib/i18n';

interface Props {
    marketPrices: MarketPrice[];
    manualPrices: PriceOverrides;
    onPricesChange: (prices: PriceOverrides) => void;
    language: Language;
}

export default function ManualPriceInputs({ marketPrices, manualPrices, onPricesChange, language }: Props) {
    const t = translations[language];
    const [isExpanded, setIsExpanded] = useState(false);

    // Get base resources only
    const baseResources = recipes.filter((r) => r.is_base);

    const handlePriceChange = (productId: string, value: string) => {
        const numValue = parseFloat(value);

        if (value === '' || isNaN(numValue)) {
            // Remove manual override
            const updated = { ...manualPrices };
            delete updated[productId];
            onPricesChange(updated);
        } else {
            // Set manual override
            onPricesChange({
                ...manualPrices,
                [productId]: numValue,
            });
        }
    };

    const handleReset = () => {
        onPricesChange({});
    };

    const getAutomaticPrice = (productId: string): number | null => {
        const price = marketPrices.find((p) => p.productId === productId);
        return price ? price.averagePrice : null;
    };

    const hasManualOverrides = Object.keys(manualPrices).length > 0;

    return (
        <div className="glass-card overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/20 transition-smooth"
            >
                <div className="flex items-center gap-3">
                    <PencilLine className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">{t.manualPricesTitle}</h2>
                    {hasManualOverrides && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            {Object.keys(manualPrices).length} {language === 'es' ? 'activos' : 'active'}
                        </span>
                    )}
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {isExpanded && (
                <div className="p-6 border-t border-secondary/30 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-foreground/70">
                            {t.manualPricesSubtitle}
                        </p>
                        {hasManualOverrides && (
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 px-4 py-2 bg-danger/20 hover:bg-danger/30 text-danger rounded-lg transition-smooth"
                            >
                                <RotateCcw className="w-4 h-4" />
                                {t.resetAll}
                            </button>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {baseResources.map((resource) => {
                            const automaticPrice = getAutomaticPrice(resource.id);
                            const manualPrice = manualPrices[resource.id];
                            const isManual = manualPrice !== undefined;

                            return (
                                <div key={resource.id} className="space-y-2">
                                    <label
                                        htmlFor={`price-${resource.id}`}
                                        className="block text-sm font-medium text-foreground/80 flex items-center gap-2"
                                    >
                                        <ItemImage
                                            itemId={resource.id}
                                            itemName={(t.itemNames as Record<string, string>)[resource.id] || resource.name}
                                            size={24}
                                        />
                                        {(t.itemNames as Record<string, string>)[resource.id] || resource.name}
                                    </label>

                                    <div className="flex items-center gap-2">
                                        {isManual ? (
                                            <PencilLine className="w-4 h-4 text-primary flex-shrink-0" />
                                        ) : (
                                            <Bot className="w-4 h-4 text-foreground/40 flex-shrink-0" />
                                        )}

                                        <input
                                            id={`price-${resource.id}`}
                                            name={`price-${resource.id}`}
                                            type="number"
                                            step="0.001"
                                            placeholder={automaticPrice ? automaticPrice.toFixed(3) : 'N/A'}
                                            value={manualPrice !== undefined ? manualPrice : ''}
                                            onChange={(e) => handlePriceChange(resource.id, e.target.value)}
                                            className={`flex-1 px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 transition-smooth ${isManual
                                                ? 'border-primary focus:ring-primary/50'
                                                : 'border-secondary focus:ring-secondary/50'
                                                }`}
                                        />
                                    </div>

                                    {automaticPrice && (
                                        <p className="text-xs text-foreground/50 flex items-center gap-1">
                                            <Bot className="w-3 h-3" />
                                            {t.automatic}: {automaticPrice.toFixed(3)}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
