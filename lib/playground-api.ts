import { MarketPrice } from '@/types';

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

const decodeToken = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

const TOKEN = process.env.WARERA_TOKEN || '';
const FINGERPRINT = process.env.WARERA_FINGERPRINT;
const API_BASE = 'https://api2.warera.io';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

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
    id: string;
    name: string;
    product: string | null;
    level: number;
    storageLevel: number;
    employees: Employee[];
    production: number;
    stock: number;
    productionBonus: number;   // total bonus %
    region: string;
    country: string;
    itemCode: string;
    // Bonus breakdown for UI transparency
    bonusDeposit: number;
    bonusSpecialized: number;
    bonusPolitical: number;
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

// ---------------------------------------------------------------------------
// tRPC helpers
// ---------------------------------------------------------------------------

const DEFAULT_HEADERS = () => ({
    'authorization': `Bearer ${TOKEN}`,
    ...(FINGERPRINT ? { 'x-fingerprint': FINGERPRINT } : {}),
    'content-type': 'application/json',
});

async function trpcCall(procedure: string, input: any): Promise<any[]> {
    const encodedInput = encodeURIComponent(JSON.stringify({ '0': input }));
    const url = `${API_BASE}/trpc/${procedure}?batch=1&input=${encodedInput}`;
    try {
        const res = await fetch(url, { headers: DEFAULT_HEADERS(), cache: 'no-store' });
        if (!res.ok) { console.error(`TRPC ${procedure} failed: ${res.status}`); return []; }
        return res.json();
    } catch (e) {
        console.error(`TRPC ${procedure} Error`, e);
        return [];
    }
}

async function trpcBatchCall(calls: { procedure: string; input: any }[]): Promise<any[]> {
    if (calls.length === 0) return [];
    const procedures = calls.map(c => c.procedure).join(',');
    const inputs = calls.reduce((acc, c, idx) => { acc[idx] = c.input; return acc; }, {} as any);
    const encodedInput = encodeURIComponent(JSON.stringify(inputs));
    const url = `${API_BASE}/trpc/${procedures}?batch=1&input=${encodedInput}`;
    try {
        const res = await fetch(url, { headers: DEFAULT_HEADERS(), cache: 'no-store' });
        if (!res.ok) { console.error(`TRPC Batch failed: ${res.status}`); return []; }
        return res.json();
    } catch (e) {
        console.error(`TRPC Batch Error`, e);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Global static-data cache  (regions + countries, TTL 1h)
// ---------------------------------------------------------------------------

let _regionMap: Record<string, any> = {};
let _countryMap: Record<string, any> = {};
let _cacheTs = 0;

async function ensureGlobalCache() {
    if (Date.now() - _cacheTs < 3_600_000 && Object.keys(_regionMap).length > 0) return;

    try {
        // region.getRegionsObject returns a plain keyed object -> convert to map by _id
        const [regionObj, countriesArr] = await Promise.all([
            trpcCall('region.getRegionsObject', {}).then(r => r[0]?.result?.data ?? {}),
            trpcCall('country.getAllCountries', {}).then(r => r[0]?.result?.data ?? []),
        ]);

        const rMap: Record<string, any> = {};
        if (regionObj && typeof regionObj === 'object' && !Array.isArray(regionObj)) {
            Object.values(regionObj).forEach((r: any) => { if (r?._id) rMap[r._id] = r; });
        }
        _regionMap = rMap;

        const cMap: Record<string, any> = {};
        if (Array.isArray(countriesArr)) {
            countriesArr.forEach((c: any) => { if (c?._id) cMap[c._id] = c; });
        }
        _countryMap = cMap;

        _cacheTs = Date.now();
        console.log(`[PlaygroundAPI] Cache: ${Object.keys(_regionMap).length} regions, ${Object.keys(_countryMap).length} countries`);
    } catch (e) {
        console.error('[PlaygroundAPI] Cache error:', e);
    }
}

// ---------------------------------------------------------------------------
// Party ethics cache  (party._id -> economy axis value)
// ---------------------------------------------------------------------------

interface PartyAxes { war: number; foreign: number; economy: number; government: number; }

const _partyCache = new Map<string, PartyAxes | null>();

/**
 * Exact replica of toolbox Sy(ethics) function (lines 67218-67230).
 * Maps the party ethics object to numeric axis values.
 *
 * Axis mappings (vce array, lines 67183-67204):
 *   war:        militarism(+1/+2)   / pacifism(-1/-2)
 *   foreign:    isolationism(+1/+2) / diplomacy(-1/-2)
 *   government: imperialism(+1/+2)  / republicanism(-1/-2)
 *   economy:    industrialism(+1/+2)/ agrarianism(-1/-2)
 *
 * Positive value = positive pole active, negative = negative pole active.
 */
function parsePartyAxes(ethics: any): PartyAxes {
    const axes: PartyAxes = { war: 0, foreign: 0, economy: 0, government: 0 };

    const AXES_MAP = [
        { axis: 'war', positive: 'militarism', negative: 'pacifism' },
        { axis: 'foreign', positive: 'isolationism', negative: 'diplomacy' },
        { axis: 'government', positive: 'imperialism', negative: 'republicanism' },
        { axis: 'economy', positive: 'industrialism', negative: 'agrarianism' },
    ];

    for (const { axis, positive, negative } of AXES_MAP) {
        const pos = ethics?.[positive];
        const neg = ethics?.[negative];
        if (typeof pos === 'number') (axes as any)[axis] = pos;
        else if (typeof neg === 'number') (axes as any)[axis] = -neg;
        else (axes as any)[axis] = 0;
    }
    return axes;
}

async function fetchPartyAxesBatch(partyIds: string[]): Promise<void> {
    const missing = partyIds.filter(id => id && !_partyCache.has(id));
    if (missing.length === 0) return;

    const CHUNK = 100;
    for (let i = 0; i < missing.length; i += CHUNK) {
        const chunk = missing.slice(i, i + CHUNK);
        const calls = chunk.map(id => ({ procedure: 'party.getById', input: { partyId: id } }));
        try {
            const results = await trpcBatchCall(calls);
            results.forEach((res: any, j: number) => {
                const party = res?.result?.data;
                _partyCache.set(chunk[j], party?.ethics ? parsePartyAxes(party.ethics) : null);
            });
        } catch {
            chunk.forEach(id => _partyCache.set(id, null));
        }
    }
}

// ---------------------------------------------------------------------------
// Production bonus formula — exact replica of toolbox Rd() / _ce() / Cce() / BR()
//
// Source refs (index.js):
//   xce table        lines 67206-67211
//   BR(axis, value)  lines 67212-67216  -> bonus table lookup
//   _ce(axes, item)  lines 67243-67247  -> industrialist bonus (economy > 0)
//   Cce(axes, item)  lines 67248-67252  -> agrarian bonus      (economy < 0)
//   Rd({...})        lines 67253-67264  -> total = specialized + deposit + industrialist + agrarian
//
// Industrialist items (yce set): ammo, lightAmmo, heavyAmmo, lead, steel, concrete, iron, oil, petroleum
// Agrarian items      (wce set): coca, grain, livestock, fish
// ---------------------------------------------------------------------------

const INDUSTRIALIST_ITEMS = new Set([
    'ammo', 'lightAmmo', 'heavyAmmo', 'lead', 'steel', 'concrete', 'iron', 'oil', 'petroleum'
]);
const AGRARIAN_ITEMS = new Set(['coca', 'grain', 'livestock', 'fish']);

/** Exact replica of toolbox BR(axisKey, axisValue) */
function BR(axisKey: string, axisValue: number): number {
    if (!axisValue) return 0;
    const tier = Math.abs(axisValue) === 2 ? 'fanatic' : 'normal';
    const TABLE: Record<string, Record<string, number>> = {
        war: { normal: 5, fanatic: 15 },
        foreign: { normal: 5, fanatic: 15 },
        economy: { normal: 10, fanatic: 30 },
        government: { normal: 10, fanatic: 30 },
    };
    return TABLE[axisKey]?.[tier] ?? 0;
}

/** Exact replica of toolbox _ce(axes, itemCode) — industrialist bonus */
function calcIndustrialistBonus(axes: PartyAxes | null | undefined, itemCode: string): number {
    if (!itemCode || !INDUSTRIALIST_ITEMS.has(itemCode)) return 0;
    const econ = axes?.economy ?? 0;
    return econ <= 0 ? 0 : BR('economy', econ);
}

/** Exact replica of toolbox Cce(axes, itemCode) — agrarian bonus */
function calcAgrarianBonus(axes: PartyAxes | null | undefined, itemCode: string): number {
    if (!itemCode || !AGRARIAN_ITEMS.has(itemCode)) return 0;
    const econ = axes?.economy ?? 0;
    return econ >= 0 ? 0 : BR('economy', econ);
}

/**
 * Exact replica of toolbox Rd({axes, itemCode, specializedItemBonus, depositBonus}).
 * total = industrialistBonus + agrarianBonus + specializedItemBonus + depositBonus
 */
function calcProductionBonus(
    itemCode: string,
    regionId: string,
    countryId: string,
    partyAxes: PartyAxes | null | undefined,
): { deposit: number; specialized: number; political: number; total: number } {
    const region = _regionMap[regionId] ?? null;
    const country = _countryMap[countryId] ?? null;

    // 1. Deposit bonus: region.deposit.type must match the produced item
    //    "P = w.deposit?.type === A, V = P ? w.deposit.bonusPercent : 0"  (line 67583-67585)
    const isDepositMatch = region?.deposit?.type === itemCode;
    const deposit = isDepositMatch
        ? (typeof region!.deposit.bonusPercent === 'number' ? region!.deposit.bonusPercent : 0)
        : 0;

    // 2. Specialized item bonus: only when country.specializedItem === produced item
    //    "F = M ? (C.specializedItemBonus ?? 0) : 0"  (line 67584)
    const isSpecialized = country?.specializedItem === itemCode;
    const specialized = isSpecialized
        ? (country?.strategicResources?.bonuses?.productionPercent ?? 0)
        : 0;

    // 3. Political bonus = industrialist + agrarian (only one can be > 0 at a time)
    const industrialist = calcIndustrialistBonus(partyAxes, itemCode);
    const agrarian = calcAgrarianBonus(partyAxes, itemCode);
    const political = industrialist + agrarian;

    const total = specialized + deposit + political;
    return { deposit, specialized, political, total };
}

// ---------------------------------------------------------------------------
// Username resolution
// ---------------------------------------------------------------------------

const usernameCacheMap = new Map<string, string>();

export async function getUserIdByUsername(username: string): Promise<string | null> {
    const target = username.toLowerCase().trim();
    if (!target) return null;

    if (usernameCacheMap.has(target)) return usernameCacheMap.get(target)!;

    try {
        const rankRes = await trpcCall('ranking.getRanking', { rankingType: 'userLevel', limit: 10000 });
        const items: any[] = rankRes[0]?.result?.data?.items || [];
        const allUserIds = items.map((i: any) => i.user).filter(Boolean);
        if (!allUserIds.length) return null;

        const CHUNK = 50;
        for (let i = 0; i < allUserIds.length; i += CHUNK) {
            const chunk = allUserIds.slice(i, i + CHUNK);
            const calls = chunk.map((id: string) => ({ procedure: 'user.getUserLite', input: { userId: id } }));
            let results: any[];
            try {
                results = await trpcBatchCall(calls);
            } catch {
                await new Promise(r => setTimeout(r, 1000));
                try { results = await trpcBatchCall(calls); } catch { continue; }
            }
            for (let j = 0; j < results.length; j++) {
                const profile = results[j]?.result?.data;
                if (!profile?.username) continue;
                usernameCacheMap.set(profile.username.toLowerCase(), chunk[j]);
                if (profile.username.toLowerCase() === target) return chunk[j];
            }
            if (i > 0 && (i / CHUNK) % 5 === 0) await new Promise(r => setTimeout(r, 150));
        }
        return null;
    } catch (e) {
        console.error('[getUserIdByUsername] Error:', e);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Main data fetcher
// ---------------------------------------------------------------------------

export async function fetchUserWorkers(userId: string): Promise<CompanyData[]> {
    if (!userId) return [];

    // 1. Workers per company
    const workersRes = await trpcCall('worker.getWorkers', { userId });
    const workerData: any[] = workersRes[0]?.result?.data?.workersPerCompany || [];
    if (!workerData.length) return [];

    // 2. Warm up static caches in parallel with company/user batches
    const companyIds = workerData.map((w: any) => w.company._id).filter(Boolean);
    const allWorkerUserIdsSet = new Set<string>();
    workerData.forEach((w: any) =>
        (w.workers || []).forEach((wk: any) => { if (wk.user) allWorkerUserIdsSet.add(wk.user); })
    );
    const allWorkerUserIds = Array.from(allWorkerUserIdsSet);

    const companyCalls = companyIds.map(id => ({ procedure: 'company.getById', input: { companyId: id } }));
    const userCalls = allWorkerUserIds.map(id => ({ procedure: 'user.getUserLite', input: { userId: id } }));

    const [, [companyResults, userResults]] = await Promise.all([
        ensureGlobalCache(),
        Promise.all([
            companyCalls.length ? trpcBatchCall(companyCalls) : Promise.resolve([]),
            userCalls.length ? trpcBatchCall(userCalls) : Promise.resolve([]),
        ]),
    ]);

    // 3. Collect rulingParty IDs from all relevant countries -> batch-fetch party ethics
    const partyIds = new Set<string>();
    companyResults.forEach((res: any) => {
        const cd = res?.result?.data;
        if (!cd) return;
        const region = _regionMap[cd.region] ?? null;
        const countryId = region?.country || cd.country;
        const country = _countryMap[countryId] ?? null;
        if (country?.rulingParty) partyIds.add(country.rulingParty);
    });
    await fetchPartyAxesBatch(Array.from(partyIds));

    // Build user lookup map
    const userMap: Record<string, any> = {};
    userResults.forEach((res: any, i: number) => {
        if (res?.result?.data) userMap[allWorkerUserIds[i]] = res.result.data;
    });

    // 4. Build CompanyData
    const companies: CompanyData[] = [];

    workerData.forEach((w: any, index: number) => {
        const companyDetail = companyResults[index]?.result?.data;
        if (!companyDetail) return;

        const itemCode = companyDetail.itemCode ?? '';
        const region = _regionMap[companyDetail.region] ?? null;
        const countryId = region?.country || companyDetail.country;
        const country = _countryMap[countryId] ?? null;
        const partyAxes = country?.rulingParty ? (_partyCache.get(country.rulingParty) ?? null) : null;

        const { deposit, specialized, political, total } =
            calcProductionBonus(itemCode, companyDetail.region, countryId, partyAxes);

        const engineLevel = companyDetail.activeUpgradeLevels?.automatedEngine ?? 1;
        const storageLevel = companyDetail.activeUpgradeLevels?.storage ?? 1;

        const employees: Employee[] = [];
        (w.workers || []).forEach((worker: any) => {
            const profile = userMap[worker.user];
            if (!profile) return;
            const energyLevel = profile.skills?.energy?.level;
            const prodLevel = profile.skills?.production?.level;
            const skillEnergy = typeof energyLevel === 'number' ? 30 + energyLevel * 10 : (profile.skills?.energy?.total || 100);
            const skillProd = typeof prodLevel === 'number' ? 10 + prodLevel * 3 : (profile.skills?.production?.total || 10);
            employees.push({
                id: worker.user,
                name: profile.username || 'Unknown',
                avatar: profile.animatedAvatarUrl || profile.avatarUrl || '',
                energy: skillEnergy,
                production: skillProd,
                fidelity: worker.fidelity ?? 0,
                wage: worker.wage || 0,
                joinedAt: worker.joinedAt,
            });
        });

        companies.push({
            id: companyDetail._id,
            name: companyDetail.name,
            product: itemCode,
            itemCode,
            level: Math.max(1, Math.min(7, engineLevel)),
            storageLevel: Math.max(1, Math.min(7, storageLevel)),
            employees,
            production: companyDetail.production || 0,
            stock: companyDetail.production || 0,
            productionBonus: total,
            bonusDeposit: deposit,
            bonusSpecialized: specialized,
            bonusPolitical: political,
            region: region?.name || 'Unknown',
            country: country?.name || 'Unknown',
        });
    });

    return companies;
}

// ---------------------------------------------------------------------------
// Market prices
// ---------------------------------------------------------------------------

export async function fetchMarketPrices() {
    try {
        const res = await trpcCall('itemTrading.getPrices', {});
        return res[0]?.result?.data || {};
    } catch (e) {
        console.error('Failed to fetch prices', e);
        return {};
    }
}
