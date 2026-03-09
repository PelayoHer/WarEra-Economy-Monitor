import { NextResponse } from 'next/server';

const API_BASE = 'https://api2.warera.io';
const TOKEN = process.env.WARERA_TOKEN;
const FINGERPRINT = process.env.WARERA_FINGERPRINT || '4578fb52c7ad5811b524b1564f19e480';
const SPAIN_ID = '6813b6d446e731854c7ac7a8';

export async function GET() {
    if (!TOKEN) {
        return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    try {
        // 1. Fetch all citizens of Spain
        console.log('[API/INTELLIGENCE] Fetching Spanish citizens');
        const usersRes = await fetch(`${API_BASE}/trpc/user.getUsersByCountry?batch=1&input=${encodeURIComponent(JSON.stringify({ '0': { countryId: SPAIN_ID } }))}`, {
            headers: { 'authorization': `Bearer ${TOKEN}`, 'x-fingerprint': FINGERPRINT }
        });
        const usersData = await usersRes.json();
        // The structure we saw was result.data.items[]._id
        const userItems = usersData[0]?.result?.data?.items || [];
        const userIds = userItems.map((u: any) => u._id);

        if (userIds.length === 0) {
            return NextResponse.json({ mus: [] });
        }

        // 2. Fetch full details for all citizens in batches
        // Note: WarEra limits batch sized. 20 is safe.
        const allUserDetails: any[] = [];
        const CHUNK = 20;

        for (let i = 0; i < userIds.length; i += CHUNK) {
            const chunk = userIds.slice(i, i + CHUNK);
            const procs = chunk.map(_ => 'user.getUserLite').join(',');
            const input: any = {};
            chunk.forEach((id, idx) => { input[idx] = { userId: id }; });

            const res = await fetch(`${API_BASE}/trpc/${procs}?batch=1&input=${encodeURIComponent(JSON.stringify(input))}`, {
                headers: { 'authorization': `Bearer ${TOKEN}`, 'x-fingerprint': FINGERPRINT }
            });

            if (!res.ok) continue;

            const data = await res.json();
            data.forEach((u: any) => {
                if (u.result?.data) {
                    allUserDetails.push(u.result.data);
                }
            });
            // Don't overwhelm the API in one request
            if (allUserDetails.length >= 200) break; // Limit to 200 for performance/safety
        }

        // 3. Extract unique MU IDs
        const muIdsRaw = [...new Set(allUserDetails.map(u => u.mu).filter(Boolean))];

        // 4. Fetch MU details (names/avatars)
        const muDetails: Record<string, any> = {};
        for (let i = 0; i < muIdsRaw.length; i += CHUNK) {
            const chunk = muIdsRaw.slice(i, i + CHUNK);
            const procs = chunk.map(_ => 'mu.getById').join(',');
            const input: any = {};
            chunk.forEach((id, idx) => { input[idx] = { muId: id }; });

            const res = await fetch(`${API_BASE}/trpc/${procs}?batch=1&input=${encodeURIComponent(JSON.stringify(input))}`, {
                headers: { 'authorization': `Bearer ${TOKEN}`, 'x-fingerprint': FINGERPRINT }
            });
            if (!res.ok) continue;

            const data = await res.json();
            data.forEach((m: any) => {
                if (m.result?.data) {
                    muDetails[m.result.data._id] = m.result.data;
                }
            });
        }

        // 5. Build final grouped structure
        const groupedMus: Record<string, any> = {};

        // Default "Civilian" group
        groupedMus['no-mu'] = {
            id: 'no-mu',
            name: 'Civiles / Otros',
            avatar: null,
            members: []
        };

        allUserDetails.forEach(user => {
            const mid = user.mu || 'no-mu';
            if (mid !== 'no-mu' && !groupedMus[mid]) {
                const muInfo = muDetails[mid];
                groupedMus[mid] = {
                    id: mid,
                    name: muInfo?.name || 'MU Desconocida',
                    avatar: muInfo?.avatarUrl || null,
                    members: []
                };
            }

            groupedMus[mid].members.push({
                id: user._id,
                username: user.username,
                avatar: user.avatarUrl,
                health: user.skills?.health?.currentBarValue || 0,
                hunger: user.skills?.hunger?.currentBarValue || 0,
                energy: user.skills?.energy?.currentBarValue || 0,
                level: user.leveling?.level || 0,
                rank: user.militaryRank || 0,
                lastActive: user.dates?.lastConnectionAt
            });
        });

        // Convert to array and sort by member count
        const result = Object.values(groupedMus).sort((a: any, b: any) => b.members.length - a.members.length);

        return NextResponse.json({ mus: result });

    } catch (e: any) {
        console.error('[API/INTELLIGENCE] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
