import { MarketPrice } from '@/types';

// Basic token decode helper
const decodeToken = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Use Buffer for Node environment (Server Actions)
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

const TOKEN = process.env.WARERA_TOKEN || '';
const FINGERPRINT = process.env.WARERA_FINGERPRINT || '4578fb52c7ad5811b524b1564f19e480';

export interface Employee {
    id: string;
    name: string;
    avatar: string;
    energy: number;
    production: number;
    fidelity: number;
    wage: number;
    joinedAt?: string;
}

export interface CompanyData {
    id: string; // company id
    name: string;
    product: string | null;
    level: number;
    storageLevel: number;
    employees: Employee[];
    production: number; // server-side production value
    stock: number; // current inventory count
    productionBonus: number; // region/country/party bonus
    region: string;
    country: string;
    itemCode: string;
}

export async function getHelpers() {
    return {
        getUserIdFromToken: (token: string) => {
            const decoded = decodeToken(token);
            if (!decoded) return null;
            return decoded.data?._id || decoded._id;
        }
    };
}

// Simple in-memory cache for resolved usernames (lives for the server process lifetime)
const usernameCacheMap: Map<string, string> = new Map();

/**
 * Resolves a WarEra username to a userId (case-insensitive).
 *
 * Strategy:
 * 1. Check in-memory cache (instant for repeat lookups)
 * 2. Fetch all ranking user IDs (~7000 users, 1 request)
 * 3. Resolve usernames in batches of 50, stopping as soon as the target is found
 *
 * No background warm-up, no extra processes. One search = a few API calls.
 */
export async function getUserIdByUsername(username: string): Promise<string | null> {
    const target = username.toLowerCase().trim();
    if (!target) return null;

    // Fast path: cache hit
    if (usernameCacheMap.has(target)) {
        const cached = usernameCacheMap.get(target)!;
        console.log(`[getUserIdByUsername] Cache hit: "${username}" -> ${cached}`);
        return cached;
    }

    try {
        console.log(`[getUserIdByUsername] Searching for "${username}"...`);

        // Step 1: Get all ranking user IDs (single request, ~7000 users)
        const rankRes = await trpcCall('ranking.getRanking', { rankingType: 'userLevel', limit: 10000 });
        const items: any[] = rankRes[0]?.result?.data?.items || [];
        const allUserIds: string[] = items.map((i: any) => i.user).filter(Boolean);

        if (allUserIds.length === 0) {
            console.log('[getUserIdByUsername] No users in ranking');
            return null;
        }

        // Step 2: Resolve usernames in batches of 50, stop when found
        const CHUNK_SIZE = 50;
        for (let i = 0; i < allUserIds.length; i += CHUNK_SIZE) {
            const chunk = allUserIds.slice(i, i + CHUNK_SIZE);
            const calls = chunk.map((id: string) => ({ procedure: 'user.getUserLite', input: { userId: id } }));

            let results: any[];
            try {
                results = await trpcBatchCall(calls);
            } catch {
                // Rate limited — wait 1s and retry once
                await new Promise(r => setTimeout(r, 1000));
                try {
                    results = await trpcBatchCall(calls);
                } catch {
                    console.warn(`[getUserIdByUsername] Chunk ${i} failed, skipping`);
                    continue;
                }
            }

            for (let j = 0; j < results.length; j++) {
                const profile = results[j]?.result?.data;
                if (!profile?.username) continue;
                // Cache every resolved username for future lookups
                usernameCacheMap.set(profile.username.toLowerCase(), chunk[j]);
                if (profile.username.toLowerCase() === target) {
                    console.log(`[getUserIdByUsername] Found "${username}" -> ${chunk[j]} (rank ~${i + j + 1})`);
                    return chunk[j];
                }
            }

            // Small pause every 5 chunks to avoid rate limiting
            if (i > 0 && (i / CHUNK_SIZE) % 5 === 0) {
                await new Promise(r => setTimeout(r, 150));
            }
        }

        console.log(`[getUserIdByUsername] "${username}" not found in ${allUserIds.length} ranking users`);
        return null;
    } catch (e) {
        console.error(`[getUserIdByUsername] Error:`, e);
        return null;
    }
}


// Global cache for static data (Regions, Countries) - 1 hour TTL
let _globalRegionMap: Record<string, any> = {};
let _globalCountryMap: Record<string, any> = {};
let _globalCacheTimestamp = 0;

async function ensureGlobalCache() {
    // Return if cache is fresh (1 hour) AND populated
    if (Date.now() - _globalCacheTimestamp < 3600 * 1000 && Object.keys(_globalRegionMap).length > 0) {
        return;
    }

    try {
        const [regions, countries] = await Promise.all([
            fetch('https://api2.warera.io/regions', { next: { revalidate: 3600 } }).then(r => r.ok ? r.json() : []),
            fetch('https://api2.warera.io/countries', { next: { revalidate: 3600 } }).then(r => r.ok ? r.json() : [])
        ]);

        const rMap: Record<string, any> = {};
        if (Array.isArray(regions)) {
            regions.forEach((r: any) => { if (r._id) rMap[r._id] = r; });
        }
        _globalRegionMap = rMap;

        const cMap: Record<string, any> = {};
        if (Array.isArray(countries)) {
            countries.forEach((c: any) => { if (c._id) cMap[c._id] = c; });
        }
        _globalCountryMap = cMap;

        _globalCacheTimestamp = Date.now();
        console.log(`[PlaygroundAPI] Global Cache: ${_globalRegionMap.size || Object.keys(_globalRegionMap).length} regions, ${_globalCountryMap.size || Object.keys(_globalCountryMap).length} countries.`);
    } catch (e) {
        console.error('[PlaygroundAPI] Failed to refresh global cache:', e);
    }
}

export async function fetchUserWorkers(userId: string): Promise<CompanyData[]> {
    if (!userId) return [];

    // 1. Get all companies where this user has workers (or owns)
    const workersRes = await trpcCall('worker.getWorkers', { userId });
    const workerData: any[] = workersRes[0]?.result?.data?.workersPerCompany || [];

    if (workerData.length === 0) return [];

    // Ensure we have global map data for bonus calculations
    await ensureGlobalCache();

    // 2. Data Gathering
    const allWorkerUserIds = new Set<string>();
    const companyIds: string[] = [];
    const productTypes = new Set<string>();

    workerData.forEach((w: any) => {
        companyIds.push(w.company._id);
        if (w.company.itemCode) productTypes.add(w.company.itemCode);
        (w.workers || []).forEach((worker: any) => {
            if (worker.user) allWorkerUserIds.add(worker.user);
        });
    });

    const companyCalls = companyIds.map(id => ({ procedure: 'company.getById', input: { companyId: id } }));
    const userCalls = Array.from(allWorkerUserIds).map(id => ({ procedure: 'user.getUserLite', input: { userId: id } }));

    // Fetch recommended regions (non-blocking, best-effort) to get EXACT bonuses for top regions
    let bonusResults: any[] = [];
    let validProducts: string[] = [];

    try {
        validProducts = Array.from(productTypes).filter(p => p && typeof p === 'string');
        if (validProducts.length > 0) {
            const bonusCalls = validProducts.map(code => ({
                procedure: 'company.getRecommendedRegionIdsByItemCode',
                input: { itemCode: code }
            }));
            // Parallel but independent from critical data
            bonusResults = await trpcBatchCall(bonusCalls).catch(() => []);
        }
    } catch (e) {
        console.warn('Bonus fetch failed', e);
    }

    const [companyResults, userResults] = await Promise.all([
        companyCalls.length > 0 ? trpcBatchCall(companyCalls) : Promise.resolve([]),
        userCalls.length > 0 ? trpcBatchCall(userCalls) : Promise.resolve([]),
    ]);

    // Build Maps
    const userMap: Record<string, any> = {};
    userResults.forEach((res: any, i: number) => {
        if (res?.result?.data) userMap[Array.from(allWorkerUserIds)[i]] = res.result.data;
    });

    // Bonus Map: ItemCode -> RegionId -> BonusValue (from recommendations)
    const recommendedBonusMap = new Map<string, Map<string, number>>();
    if (Array.isArray(bonusResults)) {
        bonusResults.forEach((res: any, i: number) => {
            const itemCode = validProducts[i];
            const recommendations = res?.result?.data;
            if (Array.isArray(recommendations)) {
                const regionBonusMap = new Map<string, number>();
                recommendations.forEach((rec: any) => {
                    if (rec.regionId && typeof rec.bonus === 'number') {
                        regionBonusMap.set(rec.regionId, rec.bonus);
                    }
                });
                recommendedBonusMap.set(itemCode, regionBonusMap);
            }
        });
    }

    // 3. Build CompanyData
    const companies: CompanyData[] = [];

    workerData.forEach((w: any, index: number) => {
        const companyDetail = companyResults[index]?.result?.data;
        if (!companyDetail) return;

        // Get Region and Country from global cache
        const region = _globalRegionMap[companyDetail.region];
        const countryId = region?.country || companyDetail.country;
        const country = _globalCountryMap[countryId];
        const itemCode = companyDetail.itemCode;

        // Calculate Production Bonus
        let bonus = 0;

        // Priority 1: Check exact server-calculated bonus from recommended list
        if (recommendedBonusMap.has(itemCode) && recommendedBonusMap.get(itemCode)?.has(companyDetail.region)) {
            bonus = recommendedBonusMap.get(itemCode)!.get(companyDetail.region)!;
        } else {
            // Priority 2: Manual fallback calculation using global cache
            // 1. Region Deposit Bonus (Approx 30% typically)
            if (region?.deposit?.type === itemCode) {
                const depBonus = region.deposit.bonusPercent || 30;
                bonus += depBonus;
            }
            // 2. Country Strategic Bonus (Approx 20% typically)
            if (country?.specializedItem === itemCode) {
                const stratBonus = country.strategicResources?.bonuses?.productionPercent || 20;
                bonus += stratBonus;
            }
        }

        const engineLevel = companyDetail.activeUpgradeLevels?.automatedEngine ?? 1;
        const storageLevel = companyDetail.activeUpgradeLevels?.storage ?? 1;

        const employees: Employee[] = [];
        (w.workers || []).forEach((worker: any) => {
            const profile = userMap[worker.user];
            if (!profile) return;
            const energyLevel = profile.skills?.energy?.level;
            const prodLevel = profile.skills?.production?.level;
            const skillEnergy = typeof energyLevel === 'number' ? (30 + energyLevel * 10) : (profile.skills?.energy?.total || 100);
            const skillProd = typeof prodLevel === 'number' ? (10 + prodLevel * 3) : (profile.skills?.production?.total || 10);

            employees.push({
                id: worker.user,
                name: profile.username || 'Unknown',
                avatar: profile.animatedAvatarUrl || profile.avatarUrl || '',
                energy: skillEnergy,
                production: skillProd,
                fidelity: worker.fidelity ?? 0,
                wage: worker.wage || 0,
                joinedAt: worker.joinedAt
            });
        });

        companies.push({
            id: companyDetail._id,
            name: companyDetail.name,
            product: itemCode,
            itemCode: itemCode,
            level: Math.max(1, Math.min(7, engineLevel)),
            storageLevel: Math.max(1, Math.min(7, storageLevel)),
            employees,
            production: companyDetail.production || 0,
            stock: companyDetail.production || 0,
            productionBonus: bonus,
            region: region?.name || 'Unknown',
            country: country?.name || 'Unknown'
        });
    });

    return companies;
}




export async function fetchMarketPrices() {
    // Usually getPrices likely takes no input or empty object
    // Using trpcCall might wrap it in {"0":{}} which is standard TRPC
    try {
        const res = await trpcCall('itemTrading.getPrices', {});
        // res is array for batched call? my trpcCall implementation forces batch=1
        // result.data is the price map
        return res[0]?.result?.data || {};
    } catch (e) {
        console.error('Failed to fetch prices', e);
        return {};
    }
}

async function trpcCall(procedure: string, input: any) {
    const encodedInput = encodeURIComponent(JSON.stringify({ "0": input }));
    const url = `https://api2.warera.io/trpc/${procedure}?batch=1&input=${encodedInput}`;

    // Helper to get headers with fresh token if needed (not implemented here, using static)
    const headers = {
        'authorization': `Bearer ${TOKEN}`,
        'x-fingerprint': FINGERPRINT,
        'content-type': 'application/json'
    };

    try {
        const res = await fetch(url, { headers, cache: 'no-store' });
        if (!res.ok) {
            console.error(`TRPC ${procedure} failed: ${res.status}`);
            return [];
        }
        return res.json();
    } catch (e) {
        console.error(`TRPC ${procedure} Error`, e);
        return [];
    }
}

async function trpcBatchCall(calls: { procedure: string, input: any }[]) {
    if (calls.length === 0) return [];

    const procedures = calls.map(c => c.procedure).join(',');
    const inputs = calls.reduce((acc, c, idx) => {
        acc[idx] = c.input;
        return acc;
    }, {} as any);

    const encodedInput = encodeURIComponent(JSON.stringify(inputs));
    const url = `https://api2.warera.io/trpc/${procedures}?batch=1&input=${encodedInput}`;

    const headers = {
        'authorization': `Bearer ${TOKEN}`,
        'x-fingerprint': FINGERPRINT,
        'content-type': 'application/json'
    };

    try {
        const res = await fetch(url, { headers, cache: 'no-store' });
        if (!res.ok) {
            console.error(`TRPC Batch failed: ${res.status}`);
            return [];
        }
        return res.json();
    } catch (e) {
        console.error(`TRPC Batch Error`, e);
        return [];
    }
}
