import { useState, useCallback } from 'react';
import { ProfitabilityData } from '@/types';
import { formatPrice } from '@/lib/calculator';
import { Trophy, Copy, Check, HelpCircle } from 'lucide-react';
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
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-16 group relative cursor-help">
                                <span className="border-b border-dashed border-foreground/30">{t.rank}</span>
                                <div className="absolute left-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50">
                                    {t.tooltips.rank}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground group relative cursor-help">
                                <span className="border-b border-dashed border-foreground/30">{t.product}</span>
                                <div className="absolute left-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50">
                                    {t.tooltips.product}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-foreground group relative cursor-help">
                                <span className="border-b border-dashed border-foreground/30">{t.marketPrice}</span>
                                <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50 text-left">
                                    {t.tooltips.marketPrice}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-foreground group relative cursor-help">
                                <span className="border-b border-dashed border-foreground/30">{t.productionCost}</span>
                                <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50 text-left">
                                    {t.tooltips.productionCost}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-foreground group relative cursor-help">
                                <span className="border-b border-dashed border-foreground/30">{t.netProfit}</span>
                                <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50 text-left">
                                    {t.tooltips.netProfit}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-foreground group relative cursor-help">
                                <span className="border-b border-dashed border-foreground/30">{t.profitMargin}</span>
                                <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50 text-left">
                                    {t.tooltips.profitMargin}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-foreground group relative cursor-help">
                                <span className="border-b border-dashed border-foreground/30">{t.opportunity}</span>
                                <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-secondary text-xs text-foreground rounded shadow-xl border border-primary/20 invisible group-hover:visible z-50 text-left">
                                    {t.tooltips.opportunity}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => {
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
                                    <td className="px-4 py-3 text-center">
                                        <span className={`font-mono text-sm ${index < 3 ? 'font-bold text-primary' : 'text-foreground/60'}`}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        <div className="flex items-center gap-2 group relative w-fit">
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
