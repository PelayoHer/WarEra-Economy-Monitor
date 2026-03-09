import { NextResponse } from 'next/server';

const API_BASE = 'https://api2.warera.io';
const TOKEN = process.env.WARERA_TOKEN;
const FINGERPRINT = process.env.WARERA_FINGERPRINT || '4578fb52c7ad5811b524b1564f19e480';

export async function GET() {
    if (!TOKEN) {
        return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    try {
        // 1. Get list of all item codes from market to match warerastats.io behavior
        const pricesRes = await fetch(`${API_BASE}/trpc/itemTrading.getPrices?batch=1&input=${encodeURIComponent(JSON.stringify({ '0': {} }))}`, {
            headers: { 'authorization': `Bearer ${TOKEN}` }
        });
        const pricesData = await pricesRes.json();
        const allItems = Object.keys(pricesData[0]?.result?.data || {});

        if (allItems.length === 0) {
            return NextResponse.json({ rate: 0, items: [] });
        }

        // 2. Fetch details for all items in batches
        const results: any[] = [];
        const CHUNK_SIZE = 20;

        for (let i = 0; i < allItems.length; i += CHUNK_SIZE) {
            const chunk = allItems.slice(i, i + CHUNK_SIZE);
            const procs = chunk.map(_ => 'itemTrading.getItemTrading').join(',');
            const input: any = {};
            chunk.forEach((id, idx) => { input[idx] = { itemCode: id }; });

            const encodedInput = encodeURIComponent(JSON.stringify(input));
            const url = `${API_BASE}/trpc/${procs}?batch=1&input=${encodedInput}`;

            const res = await fetch(url, {
                headers: {
                    'authorization': `Bearer ${TOKEN}`,
                    'x-fingerprint': FINGERPRINT,
                    'content-type': 'application/json'
                },
                next: { revalidate: 3600 }
            });

            if (!res.ok) continue;

            const data = await res.json();
            data.forEach((itemRes: any) => {
                const item = itemRes?.result?.data;
                if (!item) return;

                const current = item.currentValue || 0;
                const history = item.values || [];
                if (history.length < 2) return;

                // Use the previous day's average (index -2) as the baseline for 24h inflation
                const prevAvg = history[history.length - 2]?.avgValue || 0;

                if (prevAvg > 0) {
                    const change = ((current - prevAvg) / prevAvg) * 100;
                    results.push({
                        name: item.itemCode,
                        change: change
                    });
                }
            });
        }

        if (results.length === 0) {
            return NextResponse.json({ rate: 0, items: [] });
        }

        const avgRate = results.reduce((acc, r) => acc + r.change, 0) / results.length;
        const sortedItems = [...results].sort((a, b) => b.change - a.change);

        return NextResponse.json({
            rate: avgRate,
            status: avgRate > 5 ? 'high' : avgRate < -2 ? 'low' : 'stable',
            items: sortedItems
        });

    } catch (e: any) {
        console.error('[API/MARKET-STATS] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
