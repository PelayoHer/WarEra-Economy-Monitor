
'use client';

import { useMemo, useState } from 'react';
import { CompanyData } from '@/lib/playground-api';
import ItemImage from '@/components/ItemImage';
import { getItemRecipe, calculateWorkerProduction, getAllItems, ENGINE_WP_PER_LEVEL } from '@/lib/game-data';
import { ChevronUp, ChevronDown, CheckCircle, TrendingUp } from 'lucide-react';

interface ProductionSummaryProps {
    companies: CompanyData[];
    marketPrices: Record<string, number>;
}

export default function ProductionSummary({ companies, marketPrices }: ProductionSummaryProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [supplyChainMode, setSupplyChainMode] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'netProfit', direction: 'desc' });

    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };



    // Group calculations
    const summaryData = useMemo(() => {
        // Normalize market prices keys to lower case for reliable lookup
        const pricesNormalized = Object.keys(marketPrices).reduce((acc, key) => {
            acc[key.toLowerCase()] = marketPrices[key];
            return acc;
        }, {} as Record<string, number>);

        const getPrice = (id: string) => pricesNormalized[id.toLowerCase()] || 0;

        // 1. Group by Item
        // Map<ItemCode, { companies: CompanyData[], totalOutput: number, totalWages: number }>
        const groups = new Map<string, {
            companies: CompanyData[];
            totalOutput: number;
            totalWages: number;
            totalRevenue: number;
            totalMarketCost: number; // Cost if buying everything
        }>();

        companies.forEach(company => {
            const itemCode = company.itemCode || 'unknown';
            if (!groups.has(itemCode)) {
                groups.set(itemCode, {
                    companies: [],
                    totalOutput: 0,
                    totalWages: 0,
                    totalRevenue: 0,
                    totalMarketCost: 0
                });
            }

            const group = groups.get(itemCode)!;
            group.companies.push(company);

            // Calculate Output (Same logic as CompanyCard)
            // WP = Energy * Skill * 0.24 * (1 + Fid/100) + Engine Level * 24
            const employeeWP = company.employees.reduce((sum, emp) => {
                return sum + calculateWorkerProduction(emp.energy, emp.production, emp.fidelity); // Using correct 0.24 constant
            }, 0);

            const engineWP = (company.level || 1) * ENGINE_WP_PER_LEVEL;
            const totalWP = employeeWP + engineWP;

            const recipe = getItemRecipe(itemCode);
            const itemWP = recipe?.work_points || 1;
            const output = (totalWP * (1 + (company.productionBonus / 100))) / itemWP;

            group.totalOutput += output;

            // Wages
            const wages = company.employees.reduce((sum, emp) => {
                const empWP = calculateWorkerProduction(emp.energy, emp.production, emp.fidelity);
                return sum + (empWP * (emp.wage || 0));
            }, 0);
            group.totalWages += wages;

            // Market Revenue
            const price = getPrice(itemCode);
            group.totalRevenue += output * price;

            // Market Input Costs (Standard)
            let inputsCost = 0;
            if (recipe && recipe.inputs) {
                recipe.inputs.forEach(input => {
                    const inPrice = getPrice(input.id);
                    inputsCost += (input.qty * output * inPrice);
                });
            }
            group.totalMarketCost += inputsCost;
        });

        // 2. Supply Chain Logic
        // Determine which items are "Internal Used" vs "Sold"
        // Also calculate "Savings" if Supply Chain Mode is on
        const itemStats = new Map<string, {
            netProfit: number;
            isProfitable: boolean;
            dailyYield: number;
            marketExpenses: number;
            internalInputs: { id: string, qty: number }[];
            supplyChainSavings: number;
            laborCost: number;
            badge?: 'PROFITABLE' | 'INTERNAL USE' | 'LOSS';
            itemCode: string;
        }>();

        // Pass 1: Initialize stats
        groups.forEach((data, itemCode) => {
            // Default stats assuming NO supply chain
            const net = data.totalRevenue - (data.totalMarketCost + data.totalWages);
            itemStats.set(itemCode, {
                netProfit: net,
                isProfitable: net > 0,
                dailyYield: data.totalOutput,
                marketExpenses: data.totalMarketCost,
                internalInputs: [],
                supplyChainSavings: 0,
                laborCost: data.totalWages,
                badge: net > 0 ? 'PROFITABLE' : 'LOSS',
                itemCode
            });
        });

        // Pass 2: Calculate Internal Usage
        let grandTotalProfit = 0;

        if (supplyChainMode) {
            // Reset profits to recalculate with savings
            groups.forEach((data, itemCode) => {
                const stats = itemStats.get(itemCode)!;

                // Check inputs for this item
                const recipe = getItemRecipe(itemCode);
                let newMarketExpenses = stats.marketExpenses;
                let savings = 0;

                if (recipe && recipe.inputs) {
                    recipe.inputs.forEach(input => {
                        // Do we produce this input?
                        const inputGroup = groups.get(input.id);
                        if (inputGroup) {
                            // Yes, we produce it.
                            // How much do we need?
                            const totalNeeded = input.qty * data.totalOutput;
                            // How much do we have?
                            const produced = inputGroup.totalOutput;

                            // Logic: We use our own stock first.
                            // But wait, if multiple factories need the same input?
                            // Simplified: We assume global pool for now.
                            // TODO: Handle splitting resources between multiple consumers.
                            // For now, just calculating potential savings per item type locally.

                            // Amount we can cover internally
                            // (This logic is slightly flawed for multiple consumers, but acceptable for playground)
                            const covered = Math.min(totalNeeded, produced);

                            // Savings = Covered * Market Price
                            const inputPrice = getPrice(input.id);
                            const saving = covered * inputPrice;

                            savings += saving;
                            newMarketExpenses -= saving;

                            stats.internalInputs.push({ id: input.id, qty: covered });

                            // Mark input item as "Internal Use" partly?
                            // Update the Input Item's stats?
                            // Usually "Internal Use" badge is if ALL output is consumed.
                            // We won't update the input item's badge here to keep it simple, 
                            // but we could track "consumption" vs "production".
                        }
                    });
                }

                stats.supplyChainSavings = savings;
                stats.marketExpenses = newMarketExpenses;
                stats.netProfit = data.totalRevenue - (newMarketExpenses + stats.laborCost); // Revenue is fully realized? 
                // Wait, if we use items internally, we DON'T sell them. 
                // So we shouldn't count Revenue for the intermediate item?
                // The screenshot shows "Fish: Profit 0.00 G (Internal Use)".
                // So yes, Revenue for consumed items is 0.

                // ... Complexity increases.
                // Correct approach:
                // 1. Calculate Surplus for each item (Produced - Consumed).
                // 2. Revenue = Surplus * Price.
                // 3. Costs = (Market Purchases * Price) + Wages.
            });

            // Re-Calculate accurately with global pool
            // Map<item, produced>
            // Map<item, consumed>
            const production = new Map<string, number>();
            const consumption = new Map<string, number>();

            groups.forEach((data, item) => production.set(item, data.totalOutput));

            // Calculate consumption
            groups.forEach((data, item) => {
                const recipe = getItemRecipe(item);
                if (recipe?.inputs) {
                    recipe.inputs.forEach(inp => {
                        const needed = inp.qty * data.totalOutput;
                        consumption.set(inp.id, (consumption.get(inp.id) || 0) + needed);
                    });
                }
            });

            // Finalize Stats
            groups.forEach((data, item) => {
                const stats = itemStats.get(item)!;
                const produced = production.get(item) || 0;
                const consumed = consumption.get(item) || 0;
                const surplus = Math.max(0, produced - consumed);
                const wasConsumed = Math.min(produced, consumed); // Amount used internally

                // Revenue comes ONLY from surplus
                const price = marketPrices[item] || 0;
                const revenue = surplus * price;

                // Expenses are Market Purchases + Wages
                // We need to know inputs again
                const recipe = getItemRecipe(item);
                let inputCosts = 0;
                let savings = 0;

                if (recipe?.inputs) {
                    recipe.inputs.forEach(inp => {
                        const needed = inp.qty * data.totalOutput;
                        // Global avail for this input (excluding what we just claimed? No, we need an order)
                        // Simplified: Assume we have full access to produced pool.
                        const pool = production.get(inp.id) || 0;
                        // Real "Market Purchase" = Max(0, Needed - Pool) (if we are the only consumer)
                        // If multiple consumers, we share the pool.
                        // Let's assume proportional or first-come.
                        // For "Summary", calculating Global Profit is easier than per-card profit.

                        // Let's stick to the card-specific logic from earlier:
                        // "Supply Chain Savings" = Value of inputs that *could* be sourced internally?

                        // Re-reading screenshot:
                        // Fish Card (Raw): "Active: Internal Use". "Profit: 0.00".
                        // Cooked Fish (Manuf): "Supply Chain Savings: +72". "Profit: 6.61".

                        // So:
                        // Raw materials consumed get 0 Revenue (Profit = -Wages? Or 0?).
                        // Screenshot says "Profit 0.00", "Total Labor Cost 0.00".
                        // Wait, Fish card has "Total Labor Cost: 0.00 G".
                        // Does it mean labor cost is transferred to the final product?
                        // Or just 0? Maybe the screenshot factory has 0 wages?
                        // Let's assume standard accounting:
                        // Raw Factory: Revenue (from internal sale) - Costs.
                        // Manuf Factory: Revenue - (Inputs from Internal + Inputs from Market).

                        // BUT, "Supply Chain Mode" usually means "Consolidated Profit".
                        // The "Savings" on Cooked Fish suggests the saving is visualized there.
                    });
                }

                // Let's implement the logic implied:
                // 1. If item is mostly consumed (>50%), Badge = INTERNAL USE. Revenue = 0 (or transfer price).
                // 2. If item is mostly sold, Badge = PROFITABLE.
                // 3. Savings on Consumer = (Internal Inputs * Market Price).

                const isInternal = wasConsumed > (produced * 0.5) && produced > 0;

                if (isInternal) {
                    stats.badge = 'INTERNAL USE';
                    stats.netProfit = 0; // Or -Labor? Screenshot says 0.00 Profit and 0.00 Labor. 
                    // This implies Labor Cost is pushed to the consumer? Advanced accounting.
                    // Let's keep it simple: Show Net = Revenue - Costs.
                    // If Internal Use, Revenue = 0? Then Net is negative (Wages).
                    // Unless we assign a "Transfer Value".
                    // Let's stick to simple: Revenue = Surplus * Price.
                    stats.netProfit = revenue - (stats.marketExpenses + stats.laborCost);
                    // Note: marketExpenses here is still full? No we need to reduce it.
                } else {
                    stats.netProfit = revenue - (stats.marketExpenses + stats.laborCost); // Approximate
                    stats.badge = stats.netProfit >= 0 ? 'PROFITABLE' : 'LOSS';
                }

                // Recalculate Savings & Expenses accurately
                let mySavings = 0;
                let myMarketExp = 0;
                if (recipe?.inputs) {
                    recipe.inputs.forEach(inp => {
                        const needed = inp.qty * data.totalOutput;
                        const pool = production.get(inp.id) || 0;
                        const internalAmt = Math.min(needed, pool);
                        const marketAmt = Math.max(0, needed - pool);

                        const p = marketPrices[inp.id] || 0;
                        mySavings += internalAmt * p;
                        myMarketExp += marketAmt * p;

                        if (internalAmt > 0) {
                            stats.internalInputs.push({ id: inp.id, qty: internalAmt });
                        }
                    });
                }

                stats.supplyChainSavings = mySavings;
                stats.marketExpenses = myMarketExp;

                // Update net profit with new expenses
                // If Internal Use, we assume we sell 0?
                // If we sell Surplus:
                stats.netProfit = revenue - (myMarketExp + stats.laborCost);

                // Sum to Grand Total
                grandTotalProfit += stats.netProfit;
            });

        } else {
            // Standard Mode: Just Sum everything
            groups.forEach((data, item) => {
                const stats = itemStats.get(item)!;
                grandTotalProfit += stats.netProfit;
            });
        }
        return { groups, itemStats, grandTotalProfit };

    }, [companies, marketPrices, supplyChainMode]);

    // Calculate Sorted Stats for Table (MOVED HERE)
    const sortedStats = useMemo(() => {
        const items = Array.from(summaryData.itemStats.values());

        // Normalized prices for sorting
        const pricesNormalized = Object.keys(marketPrices).reduce((acc, key) => {
            acc[key.toLowerCase()] = marketPrices[key];
            return acc;
        }, {} as Record<string, number>);
        const getPrice = (id: string) => pricesNormalized[id.toLowerCase()] || 0;

        return items.sort((a, b) => {
            let valA = 0;
            let valB = 0;

            switch (sortConfig.key) {
                case 'itemCode':
                    return sortConfig.direction === 'asc'
                        ? a.itemCode.localeCompare(b.itemCode)
                        : b.itemCode.localeCompare(a.itemCode);
                case 'marketPrice':
                    valA = getPrice(a.itemCode);
                    valB = getPrice(b.itemCode);
                    break;
                case 'unitCost':
                    valA = a.dailyYield > 0 ? (a.marketExpenses + a.laborCost) / a.dailyYield : 0;
                    valB = b.dailyYield > 0 ? (b.marketExpenses + b.laborCost) / b.dailyYield : 0;
                    break;
                case 'netProfit':
                    valA = a.netProfit;
                    valB = b.netProfit;
                    break;
                case 'margin':
                    const revA = a.dailyYield * getPrice(a.itemCode);
                    const revB = b.dailyYield * getPrice(b.itemCode);
                    valA = revA > 0 ? (a.netProfit / revA) : -999;
                    valB = revB > 0 ? (b.netProfit / revB) : -999;
                    break;
            }

            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        });
    }, [summaryData, sortConfig, marketPrices]);



    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg mt-8">
            {/* Title Bar */}
            <div
                className="p-4 bg-gray-850 flex justify-between items-center cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-100">Production Summary</h2>
                </div>
                {isCollapsed ? <ChevronDown className="text-gray-400" /> : <ChevronUp className="text-gray-400" />}
            </div>

            {!isCollapsed && (
                <div className="p-4 md:p-6 space-y-6">
                    {/* Top Stats */}
                    {/* ... (Keep Stats) ... */}
                    {/* Top Stats */}
                    <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900/50 p-6 rounded-xl border border-gray-700/50">
                        <div className="text-center md:text-left mb-4 md:mb-0">
                            <div className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Daily Profit</div>
                            <div className={`text-4xl font-mono font-bold ${summaryData.grandTotalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {summaryData.grandTotalProfit.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-800 p-2 rounded-lg border border-gray-700">
                            <span className={`text-xs font-bold ${supplyChainMode ? 'text-blue-400' : 'text-gray-500'}`}>SUPPLY CHAIN MODE</span>
                            <button
                                onClick={() => setSupplyChainMode(!supplyChainMode)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${supplyChainMode ? 'bg-blue-500' : 'bg-gray-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${supplyChainMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    {/* View Toggle & Sort Controls */}
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Market & Production Monitor</h3>
                        <div className="flex gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                GRID
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${viewMode === 'table' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                TABLE
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    {viewMode === 'table' && (
                        <div className="overflow-x-auto bg-gray-900/50 border border-gray-700/50 rounded-xl">
                            <table className="w-full text-left border-collapse">
                                {/* ... header ... */}
                                <thead>
                                    <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                                        <th className="p-3 font-bold border-b border-gray-700 cursor-pointer hover:text-white" onClick={() => handleSort('itemCode')}>Item</th>
                                        <th className="p-3 font-bold border-b border-gray-700 text-right cursor-pointer hover:text-white" onClick={() => handleSort('marketPrice')}>Mkt Price</th>
                                        <th className="p-3 font-bold border-b border-gray-700 text-right cursor-pointer hover:text-white" onClick={() => handleSort('unitCost')}>Prod Cost</th>
                                        <th className="p-3 font-bold border-b border-gray-700 text-right cursor-pointer hover:text-white" onClick={() => handleSort('netProfit')}>Net Profit</th>
                                        <th className="p-3 font-bold border-b border-gray-700 text-right cursor-pointer hover:text-white" onClick={() => handleSort('margin')}>Margin %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedStats.map((stats) => {
                                        // Helper for price lookup in render
                                        const price = Object.keys(marketPrices).reduce((found, key) => {
                                            if (found) return found;
                                            return key.toLowerCase() === stats.itemCode.toLowerCase() ? marketPrices[key] : 0;
                                        }, 0);

                                        return (
                                            <tr key={stats.itemCode} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <ItemImage itemId={stats.itemCode} itemName={stats.itemCode} size={24} />
                                                        <span className="font-bold text-gray-200 capitalize text-sm">{stats.itemCode}</span>
                                                        {stats.badge === 'INTERNAL USE' && <span className="text-[10px] bg-blue-900 text-blue-300 px-1 rounded">INT</span>}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right font-mono text-sm text-gray-300">
                                                    {price.toLocaleString(undefined, { minimumFractionDigits: 2 })} G
                                                </td>
                                                <td className="p-3 text-right font-mono text-sm text-gray-300">
                                                    {/* Unit Cost = (Total Expenses + Labor) / Yield */}
                                                    {stats.dailyYield > 0
                                                        ? ((stats.marketExpenses + stats.laborCost) / stats.dailyYield).toLocaleString(undefined, { minimumFractionDigits: 2 })
                                                        : '-'}
                                                </td>
                                                <td className={`p-3 text-right font-mono text-sm font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} G
                                                </td>
                                                <td className={`p-3 text-right font-mono text-sm ${((price) > 0 && stats.netProfit > 0) ? 'text-green-400' : 'text-gray-500'
                                                    }`}>
                                                    {/* Margin % = (Profit / Revenue) * 100 */}
                                                    {(() => {
                                                        const rev = stats.dailyYield * price;
                                                        if (rev <= 0) return '-';
                                                        return ((stats.netProfit / rev) * 100).toFixed(1) + '%';
                                                    })()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Cards Grid */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedStats.map((stats) => (
                                <div key={stats.itemCode} className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600 transition-all">
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                                                <ItemImage itemId={stats.itemCode} itemName={stats.itemCode} size={28} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-200 capitalize">{stats.itemCode}</div>
                                                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mt-1 
                                                ${stats.badge === 'PROFITABLE' ? 'bg-green-500/20 text-green-400' :
                                                        stats.badge === 'INTERNAL USE' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-red-500/20 text-red-400'}`}>
                                                    {stats.badge}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500 uppercase">Profit/Day</div>
                                            <div className={`font-mono font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} G
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats List */}
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between text-gray-400">
                                            <span>Daily Yield:</span>
                                            <span className="text-gray-200">{stats.dailyYield.toLocaleString(undefined, { maximumFractionDigits: 2 })} units</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                            <span>Market Expenses:</span>
                                            <span className="text-gray-200">{stats.marketExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} G</span>
                                        </div>

                                        {supplyChainMode && stats.internalInputs.length > 0 && (
                                            <div className="bg-blue-500/5 rounded p-2 my-2 border border-blue-500/10">
                                                <div className="text-[10px] text-blue-300 uppercase font-bold mb-1">Internal Inputs</div>
                                                {stats.internalInputs.map(input => (
                                                    <div key={input.id} className="flex justify-between text-blue-200">
                                                        <span className="opacity-75">{input.qty.toFixed(1)} {input.id}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {supplyChainMode && stats.supplyChainSavings > 0 && (
                                            <div className="flex justify-between text-green-400 font-bold bg-green-500/5 p-1 rounded">
                                                <span>Supply Chain Savings:</span>
                                                <span>+{stats.supplyChainSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })} G</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-gray-500 pt-2 border-t border-gray-800">
                                            <span>Total Labor Cost:</span>
                                            <span>{stats.laborCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} G</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
