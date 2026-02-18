
'use client';

import { useState, useMemo } from 'react';
import { CompanyData, Employee } from '@/lib/playground-api';
import { Building2, TrendingUp, Users, ArrowUpCircle, ChevronUp, ChevronDown } from 'lucide-react';
import ItemImage from '@/components/ItemImage';
import EmployeeManager from './EmployeeManager';
import { getItemRecipe, getAllItems, calculateWorkerProduction, PROD_CONSTANT, ENGINE_WP_PER_LEVEL } from '@/lib/game-data';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { translations, Language } from '@/lib/i18n';

interface CompanyCardProps {
    company: CompanyData;
    index?: number;
    onChange: (company: CompanyData) => void;
    marketPrices: Record<string, number>;
}

export default function CompanyCard({ company, index, onChange, marketPrices }: CompanyCardProps) {
    const [language] = useLocalStorage<Language>('language', 'es');
    const t = translations[language];

    // 1. Calculate Base Production (Work Points)
    // Formula: Sum(Energy * Production * 0.24 * (1 + Fidelity/100))
    const totalWorkPoints = useMemo(() => {
        const employeeWP = company.employees.reduce((sum, emp) => {
            // Use imported constant and ensure production value is correct
            // Note: emp.production is usually the skill *base* (10 + L*3) from API
            return sum + calculateWorkerProduction(emp.energy, emp.production, emp.fidelity); // 0.24 constant handled in helper
        }, 0);

        // Automated Engine Production: Level * Constant
        const engineWP = (company.level || 1) * ENGINE_WP_PER_LEVEL;

        return employeeWP + engineWP;
    }, [company.employees, company.level]);

    // 2. Identify Product & Recipe
    // Allow user to treat the company as producing a different item
    const currentItemCode = company.itemCode || 'unknown';
    // If user changed product locally, we need state? 
    // Or we update company.itemCode? 
    // The user said "Possibility to see... if any other resource was produced".
    // This implies changing the target product for calculation.
    // Let's update the company.itemCode via onChange so it persists in the session.

    const recipe = getItemRecipe(currentItemCode);
    const itemWorkPoints = recipe?.work_points || 1; // Default to 1 to avoid NaN

    // 3. Calculate Item Output
    // Output = (TotalWorkPoints * (1 + Bonus/100)) / ItemWorkPoints
    const bonus = company.productionBonus || 0;
    const productionOutput = (totalWorkPoints * (1 + (bonus / 100))) / itemWorkPoints;

    // 4. Financials
    // Revenue = Output * Price
    const itemPrice = marketPrices[currentItemCode] || 0;
    const dailyRevenue = productionOutput * itemPrice;

    // Costs
    // a. Wages: Paid per Work Point (Energy Spent effectively)
    // Formula: Sum(WorkPoints * WageRate)
    const dailyWages = company.employees.reduce((sum, emp) => {
        // Wage is Paid per Work Point (Energy Spent effectively)
        // Confirmed by comparison: Wage Rate * Work Points = Daily Wage Cost
        const empWP = calculateWorkerProduction(emp.energy, emp.production, emp.fidelity);
        return sum + (empWP * (emp.wage || 0));
    }, 0);

    // b. Inputs (Recipe Costs)
    let dailyInputCosts = 0;
    if (recipe && recipe.inputs) {
        recipe.inputs.forEach(input => {
            const inputPrice = marketPrices[input.id] || 0;
            // Qty needed per item * Output
            dailyInputCosts += (input.qty * productionOutput * inputPrice);
        });
    }

    const totalDailyCosts = dailyWages + dailyInputCosts;
    const dailyNet = dailyRevenue - totalDailyCosts;

    // 5. Max Sustainable Wage (Theoretical)
    // MaxWage = (Revenue - InputCosts) / TotalWP
    // Revenue = Output * Price
    // InputCosts = Output * UnitInputCost
    // Output = WP * (1 + Bonus/100) / Difficulty
    // MaxWage = [ (WP * (1+Bonus)/Diff) * (Price - UnitCost) ] / WP
    // MaxWage = ( (1+Bonus)/Diff ) * (Price - UnitCost)

    const unitInputCost = recipe?.inputs?.reduce((acc, input) => {
        return acc + (input.qty * (marketPrices[input.id] || 0));
    }, 0) || 0;

    const profitPerItem = itemPrice - unitInputCost;
    const itemsPerWP = (1 + (bonus / 100)) / itemWorkPoints;

    // If profit is negative, Max Wage is effectively 0 (or negative, showing loss)
    // We display it raw to show how much you lose, or clamp to 0?
    // Usually investors want to know "Break Even". If negative, it's impossible.
    const maxSustainableWage = profitPerItem * itemsPerWP;

    // Handlers
    const handleEmployeesUpdate = (updatedEmployees: Employee[]) => {
        onChange({ ...company, employees: updatedEmployees });
    };

    const handleLevelChange = (type: 'engine' | 'storage', delta: number) => {
        if (type === 'engine') {
            const newLevel = Math.max(1, Math.min(20, company.level + delta));
            onChange({ ...company, level: newLevel });
        } else {
            const newLevel = Math.max(1, Math.min(20, (company.storageLevel || 1) + delta)); // Default storageLevel to 1 if undefined
            onChange({ ...company, storageLevel: newLevel });
        }
    };

    const handleBonusChange = (val: number) => {
        onChange({ ...company, productionBonus: val });
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange({ ...company, itemCode: e.target.value });
    };

    const allItems = getAllItems();

    return (
        <div className="backdrop-blur-md bg-gray-900/60 border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-lg transition-all hover:shadow-blue-500/20 hover:border-blue-500/30 group/card relative">
            {/* Decorative Corner (HUD Style) */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/5 rounded-tr-xl group-hover:border-blue-500/50 transition-colors pointer-events-none" />

            {/* Header / Top Section */}
            <div className="p-3 bg-white/5 border-b border-white/10 flex flex-col gap-3 relative z-10">

                {/* ID & Region */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center border border-white/10 shadow-inner">
                            <ItemImage itemId={currentItemCode} itemName={currentItemCode} size={32} />
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="font-bold text-gray-200 truncate">{company.name}</h3>
                                <span className="text-gray-500 text-xs font-mono">#{index !== undefined ? index + 1 : '?'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                <span className="truncate max-w-[80px]">{company.region}</span>
                                <span className="text-gray-600">|</span>
                                <span className="truncate max-w-[80px]">{company.country}</span>
                            </div>
                        </div>
                    </div>
                    {/* Delete button usually here in ref app, skipping for playground */}
                </div>

                {/* Product Dropdown */}
                <select
                    value={currentItemCode}
                    onChange={handleProductChange}
                    className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                >
                    {allItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>

                {/* Upgrades (Engine / Storage / Bonus) */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                    {/* Engine */}
                    <div className="bg-black/30 p-1.5 rounded border border-white/10 flex flex-col items-center">
                        <span className="text-gray-500 mb-1 scale-90 uppercase">{t.playground.card.engine}</span>
                        <div className="flex items-center gap-1">
                            <span className="font-mono text-blue-300">Lv {company.level}</span>
                            <div className="flex flex-col -gap-1">
                                <button onClick={() => handleLevelChange('engine', 1)} className="hover:text-white text-gray-500"><ChevronUp className="w-3 h-3" /></button>
                                <button onClick={() => handleLevelChange('engine', -1)} className="hover:text-white text-gray-500"><ChevronDown className="w-3 h-3" /></button>
                            </div>
                        </div>
                    </div>
                    {/* Storage */}
                    <div className="bg-black/30 p-1.5 rounded border border-white/10 flex flex-col items-center">
                        <span className="text-gray-500 mb-1 scale-90 uppercase">{t.playground.card.storage}</span>
                        <div className="flex items-center gap-1">
                            <span className="font-mono text-gray-300">Lv {company.storageLevel || 1}</span>
                            <div className="flex flex-col -gap-1">
                                <button onClick={() => handleLevelChange('storage', 1)} className="hover:text-white text-gray-500"><ChevronUp className="w-3 h-3" /></button>
                                <button onClick={() => handleLevelChange('storage', -1)} className="hover:text-white text-gray-500"><ChevronDown className="w-3 h-3" /></button>
                            </div>
                        </div>
                    </div>
                    {/* Bonus */}
                    <div className="bg-black/30 p-1.5 rounded border border-white/10 flex flex-col items-center">
                        <span className="text-gray-500 mb-1 scale-90 uppercase">{t.playground.card.bonus}</span>
                        <input
                            type="number"
                            value={bonus}
                            onChange={(e) => handleBonusChange(Number(e.target.value))}
                            className="w-full bg-transparent text-center font-mono text-yellow-500 focus:text-yellow-400 outline-none"
                        />
                    </div>
                </div>

                {/* Storage Bar */}
                <div className="space-y-1">
                    {(() => {
                        const capacity = (company.storageLevel || 1) * 200;
                        const currentStock = Math.round(company.stock || 0);
                        const progress = Math.min(100, (currentStock / capacity) * 100);

                        // Time to Full
                        let timeString = '--';
                        if (productionOutput > 0 && currentStock < capacity) {
                            const remaining = capacity - currentStock;
                            const hourlyProd = productionOutput / 24;
                            const hours = remaining / hourlyProd;

                            if (hours < 24) {
                                const h = Math.floor(hours);
                                const m = Math.floor((hours - h) * 60);
                                timeString = `${h}h ${m}m`;
                            } else {
                                const d = Math.floor(hours / 24);
                                const h = Math.floor(hours % 24);
                                timeString = `${d}d ${h}h`;
                            }
                        } else if (currentStock >= capacity) {
                            timeString = t.playground.card.full;
                        }

                        return (
                            <>
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>{t.playground.card.stock}</span>
                                    <span>{currentStock.toLocaleString()} / {capacity.toLocaleString()}</span>
                                </div>
                                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                    <div style={{ width: `${progress}%` }} className={`h-full ${progress >= 100 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Max Sustain Wage */}
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 text-[10px] uppercase">{t.playground.card.maxWage}:</span>
                    <span className="font-mono font-bold text-yellow-500">
                        {maxSustainableWage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} G
                    </span>
                </div>
            </div>

            {/* Employee Manager */}
            <div className="p-3 bg-gray-950/30">
                <EmployeeManager
                    employees={company.employees}
                    onUpdate={handleEmployeesUpdate}
                />
            </div>

            {/* Financial Summary Footer */}
            <div className="mt-auto bg-gray-950/60 border-t border-white/10 p-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono">
                <div className="flex justify-between">
                    <span className="text-gray-500">{t.playground.card.yield}</span>
                    <span className="font-mono text-gray-200">{productionOutput.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">{t.playground.card.revenue}</span>
                    <span className="font-mono text-green-400">+{dailyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">{t.playground.card.inputs} + {t.playground.card.wages}</span>
                    <span className="font-mono text-red-400">-{totalDailyCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-gray-800 pt-1">
                    <span className="text-gray-400 font-bold">{t.playground.card.net}</span>
                    <span className={`font-mono font-bold ${dailyNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {dailyNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
}
