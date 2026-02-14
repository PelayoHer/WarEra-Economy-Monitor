'use client';

import { useState, useMemo } from 'react';
import { recipes, calculateProductionCost, formatPrice } from '@/lib/calculator';
import { Calculator } from 'lucide-react';
import { translations, Language } from '@/lib/i18n';

interface Props {
    salaryPerPT: number;
    onSalaryChange: (value: number) => void;
    prices: Record<string, number>;
    language: Language;
}

export default function ProfitCalculator({ salaryPerPT, onSalaryChange, prices, language }: Props) {
    const t = translations[language];
    const [workPoints, setWorkPoints] = useState(100);
    const [selectedProduct, setSelectedProduct] = useState('ammo');

    // Calculate profit for selected product
    const calculation = useMemo(() => {
        const recipe = recipes.find((r) => r.id === selectedProduct);
        if (!recipe) return null;

        const marketPrice = prices[selectedProduct] || 0;
        const productionCost = calculateProductionCost(selectedProduct, salaryPerPT, recipes, prices);
        const profitPerUnit = marketPrice - productionCost;
        const totalProfit = profitPerUnit * workPoints;

        return {
            recipe,
            marketPrice,
            productionCost,
            profitPerUnit,
            totalProfit,
        };
    }, [selectedProduct, salaryPerPT, workPoints, prices]);

    return (
        <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">{t.calculatorTitle}</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            {t.salaryPerWorkPoint}
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={salaryPerPT}
                            onChange={(e) => onSalaryChange(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2 bg-background border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            {t.workPoints}
                        </label>
                        <input
                            type="number"
                            step="1"
                            value={workPoints}
                            onChange={(e) => setWorkPoints(parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-2 bg-background border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            {t.selectProduct}
                        </label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full px-4 py-2 bg-background border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
                        >
                            {recipes.map((recipe) => (
                                <option key={recipe.id} value={recipe.id}>
                                    {(t.itemNames as Record<string, string>)[recipe.id] || recipe.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results */}
                {calculation && (
                    <div className="space-y-3 bg-secondary/30 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-primary">
                            {(t.itemNames as Record<string, string>)[calculation.recipe.id] || calculation.recipe.name}
                        </h3>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-foreground/70">{t.marketPrice}:</span>
                                <span className="font-mono">{formatPrice(calculation.marketPrice)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-foreground/70">{t.productionCost}:</span>
                                <span className="font-mono">{formatPrice(calculation.productionCost)}</span>
                            </div>

                            <div className="border-t border-secondary/50 pt-2 mt-2">
                                <div className="flex justify-between text-lg">
                                    <span className="font-semibold">{t.profit}/{t.product}:</span>
                                    <span className={`font-mono font-bold ${calculation.profitPerUnit > 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatPrice(calculation.profitPerUnit)}
                                    </span>
                                </div>

                                <div className="flex justify-between text-xl mt-3">
                                    <span className="font-semibold">{t.profit} Total:</span>
                                    <span className={`font-mono font-bold ${calculation.totalProfit > 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatPrice(calculation.totalProfit)}
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-foreground/50 mt-3">
                                {language === 'es' ? `Para ${workPoints} PT en una jornada` : `For ${workPoints} work points`}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
