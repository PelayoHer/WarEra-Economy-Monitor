'use client';

import { useState, useMemo } from 'react';
import { CompanyData, Employee } from '@/lib/playground-api';
import { Building2, TrendingUp, Users, ArrowUpCircle, ChevronUp, ChevronDown } from 'lucide-react';
import ItemImage from '@/components/ItemImage';
import EmployeeManager from './EmployeeManager';
import { getItemRecipe, getAllItems, calculateWorkerProduction, ENGINE_WP_PER_LEVEL } from '@/lib/game-data';
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
            return sum + calculateWorkerProduction(emp.energy, emp.production, emp.fidelity);
        }, 0);

        // Automated Engine Production: Level * Constant (Defined in game-data.ts)
        const engineWP = (company.level || 1) * ENGINE_WP_PER_LEVEL;

        return employeeWP + engineWP;
    }, [company.employees, company.level]);

    // 2. Identify Product & Recipe
    const currentItemCode = company.itemCode || 'unknown';
    const recipe = getItemRecipe(currentItemCode);
    const itemWorkPoints = recipe?.work_points || 1;

    // 3. Dynamic Production Bonus Calculation (Toolbox Mirror)
    const industrialistItems = useMemo(() => new Set(['ammo', 'lightAmmo', 'heavyAmmo', 'lead', 'steel', 'concrete', 'iron', 'oil', 'petroleum']), []);
    const agrarianItems = useMemo(() => new Set(['coca', 'grain', 'livestock', 'fish']), []);

    const dynamicBonus = useMemo(() => {
        const itemCode = (currentItemCode || '').toLowerCase();

        // a. Deposit Bonus (%)
        const metaDepType = company.metaRegionDepositType?.toLowerCase();
        const dep = metaDepType === itemCode ? company.metaRegionDepositBonus : 0;

        // b. Specialization Bonus (%) 
        const metaSpecItem = company.metaCountrySpecializedItem?.toLowerCase();
        const spec = metaSpecItem === itemCode ? company.metaCountrySpecializedBonus : 0;

        // c. Political Bonus (%) - Industrialist vs Agrarian based on economy axis
        let pol = 0;
        const econ = company.metaPartyEconomyAxis || 0;
        if (econ !== 0) {
            const tierBonus = Math.abs(econ) >= 2 ? 30 : 10;
            if (industrialistItems.has(itemCode) && econ > 0) pol = tierBonus;
            else if (agrarianItems.has(itemCode) && econ < 0) pol = tierBonus;
        }

        return { dep, spec, pol, total: dep + spec + pol };
    }, [currentItemCode, company.metaRegionDepositType, company.metaRegionDepositBonus, company.metaCountrySpecializedItem, company.metaCountrySpecializedBonus, company.metaPartyEconomyAxis, industrialistItems, agrarianItems]);

    const { dep: bonusDeposit, spec: bonusSpecialized, pol: bonusPolitical, total: additiveBonusPercent } = dynamicBonus;

    // 3.1 Multipliers (found in toolbox Qk)
    // Imperialism (government axis) is a MULTIPLIER, not an addition
    const govAxisMap: Record<number, number> = { 2: 1.3, 1: 1.1, 0: 1.0, [-1]: 1.0, [-2]: 1.0 };
    const axialMultiplier = govAxisMap[company.metaPartyGovernmentAxis] || 1.0;

    // Break Room: Assuming 5% bonus per level (Standard game mechanic)
    const roomMultiplier = 1 + (company.breakRoomLevel * 0.05);

    const totalMultiplier = (1 + (additiveBonusPercent / 100)) * axialMultiplier * roomMultiplier;
    const totalBonusDisplay = (totalMultiplier - 1) * 100;

    // Output = (TotalWorkPoints / ItemDifficulty) * Multipliers
    const productionOutput = (totalWorkPoints / itemWorkPoints) * totalMultiplier;

    // 4. Financials
    const itemPrice = marketPrices[currentItemCode] || 0;
    const dailyRevenue = productionOutput * itemPrice;

    // Costs
    const dailyWages = company.employees.reduce((sum, emp) => {
        const empWP = calculateWorkerProduction(emp.energy, emp.production, emp.fidelity);
        return sum + (empWP * (emp.wage || 0));
    }, 0);

    let dailyInputCosts = 0;
    if (recipe && recipe.inputs) {
        recipe.inputs.forEach(input => {
            const inputPrice = marketPrices[input.id] || 0;
            dailyInputCosts += (input.qty * productionOutput * inputPrice);
        });
    }

    const totalDailyCosts = dailyWages + dailyInputCosts;
    const dailyNet = dailyRevenue - totalDailyCosts;

    // 5. Max Sustainable Wage
    const unitInputCost = recipe?.inputs?.reduce((acc: number, input: { id: string, qty: number }) => {
        return acc + (input.qty * (marketPrices[input.id] || 0));
    }, 0) || 0;

    const profitPerItem = itemPrice - unitInputCost;
    const maxSustainableWage = profitPerItem * (totalMultiplier / itemWorkPoints);

    // Handlers
    const handleEmployeesUpdate = (updatedEmployees: Employee[]) => {
        onChange({ ...company, employees: updatedEmployees });
    };

    const handleLevelChange = (type: 'engine' | 'storage', delta: number) => {
        if (type === 'engine') {
            const newLevel = Math.max(1, Math.min(20, company.level + delta));
            onChange({ ...company, level: newLevel });
        } else {
            const newLevel = Math.max(1, Math.min(20, (company.storageLevel || 1) + delta));
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

    const BonusRow = ({ label, value, colorClass = 'text-green-400' }: { label: string, value: number, colorClass?: string }) => (
        <div className="flex justify-between gap-4">
            <span className="text-gray-400">{label}</span>
            <span className={`font-mono ${value > 0 ? colorClass : 'text-gray-600'}`}>
                {value > 0 ? `+${value}%` : '—'}
            </span>
        </div>
    );

    return (
        <div className="backdrop-blur-md bg-gray-900/60 border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-lg transition-all hover:shadow-blue-500/20 hover:border-blue-500/30 group/card relative">
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/5 rounded-tr-xl group-hover:border-blue-500/50 transition-colors pointer-events-none" />

            <div className="p-3 bg-white/5 border-b border-white/10 flex flex-col gap-3 relative z-10">
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
                </div>

                <select
                    value={currentItemCode}
                    onChange={handleProductChange}
                    className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                >
                    {allItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>

                <div className="grid grid-cols-3 gap-2 text-xs">
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
                    <div className="bg-black/30 p-1.5 rounded border border-white/10 flex flex-col items-center relative group/bonus">
                        <span className="text-gray-500 mb-1 scale-90 uppercase">{t.playground.card.bonus}</span>
                        <span className="font-mono text-yellow-400 font-bold text-sm cursor-default">
                            {totalBonusDisplay.toFixed(1)}%
                        </span>
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50
                                        hidden group-hover/bonus:flex flex-col gap-1
                                        bg-gray-900 border border-white/15 rounded-lg p-2.5 shadow-xl
                                        text-[10px] whitespace-nowrap min-w-[170px]">
                            <div className="text-gray-400 font-semibold mb-1 uppercase tracking-wider text-center border-b border-white/5 pb-1">Desglose Multiplicativo</div>
                            <BonusRow label="🏔 Yacimiento" value={bonusDeposit} colorClass="text-green-400" />
                            <BonusRow label="⭐ País espec." value={bonusSpecialized} colorClass="text-blue-400" />
                            <BonusRow label="🏛 Político (Ec.)" value={bonusPolitical} colorClass="text-purple-400" />
                            <div className="flex justify-between items-center pt-1 border-t border-white/5 text-blue-400">
                                <span>Base Aditiva</span>
                                <span>+{(additiveBonusPercent).toFixed(1)}%</span>
                            </div>
                            {axialMultiplier !== 1 && (
                                <div className="flex justify-between items-center text-amber-400">
                                    <span>👑 Imperialismo</span>
                                    <span>x{axialMultiplier.toFixed(1)}</span>
                                </div>
                            )}
                            {company.breakRoomLevel > 0 && (
                                <div className="flex justify-between items-center text-emerald-400">
                                    <span>☕ Break Room</span>
                                    <span>x{roomMultiplier.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-1 border-t border-white/10 mt-0.5 text-yellow-400 font-bold">
                                <span className="uppercase">Total Final</span>
                                <span>+{totalBonusDisplay.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    {(() => {
                        const capacity = (company.storageLevel || 1) * 200;
                        const currentStock = Math.round(company.stock || 0);
                        const progress = Math.min(100, (currentStock / capacity) * 100);
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

                <div className="mt-2 p-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider text-xs">{t.playground.card.maxWage}</span>
                    </div>
                    <span className={`font-mono font-bold text-sm ${maxSustainableWage >= 0 ? 'text-purple-200' : 'text-red-400'}`}>
                        {maxSustainableWage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-purple-400/50">G</span>
                    </span>
                </div>
            </div>

            <div className="p-3 bg-gray-950/30">
                <EmployeeManager
                    employees={company.employees}
                    onUpdate={handleEmployeesUpdate}
                />
            </div>

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
                    <span className="text-gray-400 font-bold text-xs">{t.playground.card.net}</span>
                    <span className={`font-mono font-bold ${dailyNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {dailyNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
}
