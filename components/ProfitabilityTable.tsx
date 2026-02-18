import { useState, useCallback } from 'react';
import { ProfitabilityData } from '@/types';
import { formatPrice } from '@/lib/calculator';
import { Trophy, Copy, Check, HelpCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import ItemImage from '@/components/ItemImage';
import HelpModal from './HelpModal';
import { translations, Language } from '@/lib/i18n';

interface Props {
    data: ProfitabilityData[];
    language: Language;
}

export default function ProfitabilityTable({ data, language }: Props) {
    const t = translations[language];
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'netProfit',
        direction: 'desc'
    });

    const handleSort = (key: string) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
        }));
    };

    const sortedData = [...data].sort((a, b) => {
        const { key, direction } = sortConfig;
        const multiplier = direction === 'asc' ? 1 : -1;

        switch (key) {
            case 'product':
                const nameA = (t.itemNames as Record<string, string>)[a.recipe.id] || a.recipe.name;
                const nameB = (t.itemNames as Record<string, string>)[b.recipe.id] || b.recipe.name;
                return nameA.localeCompare(nameB) * multiplier;
            case 'marketPrice':
                return (a.marketPrice - b.marketPrice) * multiplier;
            case 'productionCost':
                return (a.productionCost - b.productionCost) * multiplier;
            case 'netProfit':
                return (a.netProfit - b.netProfit) * multiplier;
            case 'profitMargin':
                return (a.profitMargin - b.profitMargin) * multiplier;
            case 'opportunity':
                const oppA = a.productionCost < a.marketPrice ? 1 : 0;
                const oppB = b.productionCost < b.marketPrice ? 1 : 0;
                return (oppA - oppB) * multiplier;
            default:
                return 0;
        }
    });

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />;
    };

    const copyToClipboard = useCallback((text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    }, []);

    if (data.length === 0) {
        return (
            <div className="glass-card p-8 text-center text-foreground/50">
                {t.noData}
            </div>
        );
    }

    const topProduct = data[0]?.recipe.id || 'N/A';

    return (
        <div className="glass-card overflow-hidden">
            <div className="p-4 bg-secondary/30 border-b border-secondary/50">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-primary" />
                        {t.rankingTitle}
                        <button
                            onClick={() => setShowHelp(true)}
                            className="p-1.5 hover:bg-primary/20 rounded-full text-primary transition-colors"
                            title="Help / Info"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </h2>

                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold">{t.bestOption}</p>
                        <p className="text-sm font-bold text-success truncate max-w-[120px]">
                            {(t.itemNames as Record<string, string>)[topProduct] || topProduct}
                        </p>
                    </div>
                </div>
                <p className="text-sm text-foreground/60 mt-1">
                    {t.rankingSubtitle}
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-secondary/50 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>

                            <th
                                className="px-4 py-3 text-left text-sm font-semibold text-foreground group relative cursor-pointer select-none hover:bg-white/5 transition-colors"
                                onClick={() => handleSort('product')}
                            >
                                <div className="flex items-center gap-1">
                                    {t.product}
                                    <div className="absolute left-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50 font-normal cursor-help pointer-events-none">
                                        {t.tooltips.product}
                                    </div>
                                    <SortIcon columnKey="product" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right text-sm font-semibold text-foreground group relative cursor-pointer select-none hover:bg-white/5 transition-colors"
                                onClick={() => handleSort('marketPrice')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <SortIcon columnKey="marketPrice" />
                                    {t.marketPrice}
                                    <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50 font-normal text-left cursor-help pointer-events-none">
                                        {t.tooltips.marketPrice}
                                    </div>
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right text-sm font-semibold text-foreground group relative cursor-pointer select-none hover:bg-white/5 transition-colors"
                                onClick={() => handleSort('productionCost')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <SortIcon columnKey="productionCost" />
                                    {t.productionCost}
                                    <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50 font-normal text-left cursor-help pointer-events-none">
                                        {t.tooltips.productionCost}
                                    </div>
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right text-sm font-semibold text-foreground group relative cursor-pointer select-none hover:bg-white/5 transition-colors"
                                onClick={() => handleSort('netProfit')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <SortIcon columnKey="netProfit" />
                                    {t.netProfit}
                                    <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50 font-normal text-left cursor-help pointer-events-none">
                                        {t.tooltips.netProfit}
                                    </div>
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right text-sm font-semibold text-foreground group relative cursor-pointer select-none hover:bg-white/5 transition-colors"
                                onClick={() => handleSort('profitMargin')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <SortIcon columnKey="profitMargin" />
                                    {t.profitMargin}
                                    <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50 font-normal text-left cursor-help pointer-events-none">
                                        {t.tooltips.profitMargin}
                                    </div>
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-right text-sm font-semibold text-foreground group relative cursor-pointer select-none hover:bg-white/5 transition-colors"
                                onClick={() => handleSort('opportunity')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <SortIcon columnKey="opportunity" />
                                    {t.opportunity}
                                    <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50 font-normal text-left cursor-help pointer-events-none">
                                        {t.tooltips.opportunity}
                                    </div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((item, index) => {
                            const isProfit = item.netProfit > 0;
                            const profitColor = isProfit ? 'text-success' : 'text-danger';
                            const isCheaperToProduce = item.productionCost < item.marketPrice;
                            const recommendation = isCheaperToProduce ? t.produce : t.buy;
                            const recColor = isCheaperToProduce ? 'bg-success/20 text-success border-success/30' : 'bg-primary/20 text-primary border-primary/30';

                            return (
                                <tr
                                    key={item.recipe.id}
                                    className={`table-row-modern border-t border-secondary/20 transition-smooth ${index < 3 ? 'bg-gradient-to-r from-success/5 to-transparent' : ''}`}
                                >

                                    <td className="px-4 py-3 font-medium">
                                        <div className="flex items-center gap-2 group relative w-fit">
                                            <ItemImage itemId={item.recipe.id} itemName={(t.itemNames as Record<string, string>)[item.recipe.id] || item.recipe.name} size={32} />
                                            <span className="border-b border-dashed border-foreground/30 cursor-help">
                                                {(t.itemNames as Record<string, string>)[item.recipe.id] || item.recipe.name}
                                            </span>
                                            {!isProfit && (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-danger/20 text-danger border border-danger/30 hidden sm:inline-block">
                                                    {t.loss}
                                                </span>
                                            )}
                                            {/* Item Description Tooltip */}
                                            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50 pointer-events-none text-left">
                                                <p className="font-semibold mb-1 text-primary">
                                                    {(t.itemNames as Record<string, string>)[item.recipe.id] || item.recipe.name}
                                                </p>
                                                {(t.itemDescriptions as Record<string, string>)[item.recipe.id] || (t.itemDescriptions as Record<string, string>)['default']}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-foreground/80 font-mono">
                                        <div className="flex items-center justify-end gap-2 group/copy">
                                            <button
                                                onClick={() => copyToClipboard(item.marketPrice.toString(), item.recipe.id)}
                                                className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                                                title="Copy Price"
                                            >
                                                {copiedId === item.recipe.id ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-foreground/50" />}
                                            </button>
                                            {formatPrice(item.marketPrice)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-foreground/80 font-mono">
                                        {formatPrice(item.productionCost)}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold font-mono ${profitColor}`}>
                                        {isProfit ? '+' : ''}{formatPrice(item.netProfit)}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-semibold font-mono ${profitColor}`}>
                                        {formatPrice(item.profitMargin, 1)}%
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`px-2 py-1 text-xs font-bold rounded border ${recColor}`}>
                                            {recommendation}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-secondary/20 border-t border-secondary/50 text-sm text-foreground/60">
                <p className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    {data.filter(d => d.netProfit > 0).length} {t.profitableSummary} {data.length} {t.analyzed}
                </p>
            </div>
            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                language={language}
            />
        </div>
    );
}
