'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { recipes } from '@/lib/calculator';
import { translations, Language } from '@/lib/i18n';
import ItemImage from '@/components/ItemImage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MarketPrice } from '@/types';

export default function MarketTicker() {
    const [language] = useLocalStorage<Language>('language', 'es');
    const t = translations[language];

    const [prices, setPrices] = useState<MarketPrice[]>([]);

    const fetchPrices = useCallback(async () => {
        try {
            const response = await fetch('/api/market-data');
            const data = await response.json();
            if (data.prices) {
                setPrices(data.prices);
            }
        } catch (error) {
            console.error('Ticker fetch error:', error);
        }
    }, []);

    useEffect(() => {
        fetchPrices();
    }, [fetchPrices]);

    const tickerItems = useMemo(() => {
        return [...recipes]
            .map(r => {
                const mp = prices.find(p => p.productId === r.id);
                return { ...r, price: mp?.averagePrice || 0 };
            })
            .filter(r => r.price > 0)
            .sort((a, b) => b.price - a.price)
            .slice(0, 15); // Top 15 items
    }, [recipes, prices]);

    if (tickerItems.length === 0) return null;

    return (
        <div className="fixed top-16 left-0 right-0 h-10 bg-black/80 border-b border-primary/20 overflow-hidden flex items-center z-40 backdrop-blur-sm pointer-events-none">
            <div className="animate-ticker flex whitespace-nowrap gap-8 px-4 pointer-events-auto pause-on-hover">
                {/* Duplicate items to create seamless loop effect (x4 should be enough for wide screens) */}
                {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
                    <div key={`${item.id}-${i}`} className="flex items-center gap-2">
                        <ItemImage
                            itemId={item.id}
                            itemName={(t.itemNames as Record<string, string>)[item.id] || item.name}
                            size={16}
                        />
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                            {(t.itemNames as Record<string, string>)[item.id] || item.name}
                        </span>
                        <span className="font-mono text-success text-sm">
                            {item.price.toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
