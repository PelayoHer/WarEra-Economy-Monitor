
'use client';

import { useMemo } from 'react';
import { CompanyData } from '@/lib/playground-api';
import { getItemRecipe, calculateWorkerProduction } from '@/lib/game-data';
import ItemImage from '@/components/ItemImage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { translations, Language } from '@/lib/i18n';
import { ArrowRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface ResourceFlowProps {
    companies: CompanyData[];
}

export default function ResourceFlow({ companies }: ResourceFlowProps) {
    const [language] = useLocalStorage<Language>('language', 'es');
    const t = translations[language];

    const flowData = useMemo(() => {
        const production = new Map<string, number>();
        const consumption = new Map<string, number>();
        const items = new Set<string>();

        companies.forEach(company => {
            const itemCode = company.itemCode || 'unknown';
            items.add(itemCode);

            // Calculate Output
            const totalWP = company.employees.reduce((sum, emp) => {
                return sum + calculateWorkerProduction(emp.energy, emp.production, emp.fidelity);
            }, 0) + ((company.level || 1) * 24); // Include Engine WP (24 per level)

            const bonus = company.productionBonus || 0;
            const recipe = getItemRecipe(itemCode);
            const itemWP = recipe?.work_points || 1;
            const output = (totalWP * (1 + (bonus / 100))) / itemWP;

            // Add to Production
            production.set(itemCode, (production.get(itemCode) || 0) + output);

            // Calculate Consumption
            if (recipe && recipe.inputs) {
                recipe.inputs.forEach(input => {
                    items.add(input.id);
                    const needed = input.qty * output;
                    consumption.set(input.id, (consumption.get(input.id) || 0) + needed);
                });
            }
        });

        // Convert to array and sort
        return Array.from(items).map(item => {
            const prod = production.get(item) || 0;
            const cons = consumption.get(item) || 0;
            const net = prod - cons;
            return { item, prod, cons, net };
        }).sort((a, b) => b.prod - a.prod); // Sort by production volume? Or Net?

    }, [companies]);

    // Filter out items with 0 flow
    const activeFlows = flowData.filter(f => f.prod > 0 || f.cons > 0);

    return (
        <div className="backdrop-blur-sm bg-gray-900/40 border border-white/10 rounded-xl p-6 shadow-lg mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <h2 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                {t.playground.flow.title}
            </h2>

            {activeFlows.length === 0 ? (
                <div className="text-gray-500 text-sm font-mono text-center py-4">{t.playground.noData || 'No active production chains.'}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
                    {activeFlows.map(flow => (
                        <div key={flow.item} className="bg-white/5 border border-white/10 rounded-lg p-3 relative overflow-hidden transition-all hover:bg-white/10">
                            {/* Background Bar for Visual Balance? Too complex for now. */}

                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <ItemImage itemId={flow.item} itemName={flow.item} size={24} />
                                    <span className="font-bold text-gray-200 text-sm capitalize">{flow.item}</span>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${flow.net > 0 ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                    flow.net < 0 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                        'bg-gray-700 border-gray-600 text-gray-400'
                                    }`}>
                                    {flow.net > 0 ? t.playground.flow.surplus : flow.net < 0 ? t.playground.flow.deficit : t.playground.flow.balanced}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-green-400/80">{t.playground.flow.production}</span>
                                    <span className="font-mono text-green-400">+{flow.prod.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-red-400/80">{t.playground.flow.consumption}</span>
                                    <span className="font-mono text-red-400">-{flow.cons.toFixed(1)}</span>
                                </div>
                                <div className="h-px bg-gray-700 my-1" />
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-400">{t.playground.flow.netFlow}</span>
                                    <span className={`font-mono ${flow.net > 0 ? 'text-green-400' : flow.net < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                        {flow.net > 0 ? '+' : ''}{flow.net.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
