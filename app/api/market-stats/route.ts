import { NextResponse } from 'next/server';

const API_BASE = 'https://api2.warera.io';
const TOKEN = process.env.WARERA_TOKEN;
const FINGERPRINT = process.env.WARERA_FINGERPRINT || '4578fb52c7ad5811b524b1564f19e480';

const BASKET = [
    'steel', 'ammo', 'heavyAmmo', 'lightAmmo', 'grain',
    'bread', 'iron', 'lead', 'oil', 'concrete', 'fish', 'livestock'
];

export async function GET() {
    if (!TOKEN) {
        return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    try {
        // Build tRPC batch call for getItemTrading for each item in the basket
        const procs = BASKET.map(_ => 'itemTrading.getItemTrading').join(',');
        const input: any = {};
        BASKET.forEach((id, i) => { input[i] = { itemCode: id }; });

        const encodedInput = encodeURIComponent(JSON.stringify(input));
        const url = `${API_BASE}/trpc/${procs}?batch=1&input=${encodedInput}`;

        const res = await fetch(url, {
            headers: {
                'authorization': `Bearer ${TOKEN}`,
                'x-fingerprint': FINGERPRINT,
                'content-type': 'application/json'
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!res.ok) {
            return NextResponse.json({ error: `TRPC failed: ${res.status}` }, { status: 500 });
        }

        const data = await res.json();
        const results: any[] = [];

        data.forEach((itemRes: any) => {
            const item = itemRes?.result?.data;
            if (!item) return;

            const current = item.currentValue || 0;
            // Get previous day's average (last entry in 'values' or second to last if latest is current date)
            const history = item.values || [];
            if (history.length < 2) return;

            // Simple delta: (Current - PrevDayAvg) / PrevDayAvg
            // Most recent average is likely at the end.
            const lastAvg = history[history.length - 1]?.avgValue || 0;
            const prevAvg = history[history.length - 2]?.avgValue || lastAvg;

            if (prevAvg > 0) {
                const change = ((current - prevAvg) / prevAvg) * 100;
                results.push({
                    name: item.itemCode,
                    change: change
                });
            }
        });

        if (results.length === 0) {
            return NextResponse.json({ rate: 0, items: [] });
        }

        const avgRate = results.reduce((acc, r) => acc + r.change, 0) / results.length;
        // Sort by magnitude of change or just alphabetical? Sort by change desc looks better.
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
