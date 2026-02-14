import fs from 'fs';
import path from 'path';
import { MarketPrice } from '@/types';

const DATA_DIR = process.env.VERCEL || process.env.NODE_ENV === 'production'
    ? path.join('/tmp', 'data')
    : path.join(process.cwd(), 'data');
const PRICES_FILE = path.join(DATA_DIR, 'market-prices.json');

interface CachedData {
    prices: MarketPrice[];
    timestamp: string;
}

/**
 * Ensures the data directory exists
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Loads cached market prices from JSON file
 */
export function loadMarketPrices(): CachedData | null {
    try {
        if (!fs.existsSync(PRICES_FILE)) {
            console.log('[STORAGE] Prices file not found');
            return null;
        }

        const data = fs.readFileSync(PRICES_FILE, 'utf-8');
        console.log('[STORAGE] Loaded prices from file');
        return JSON.parse(data) as CachedData;
    } catch (error) {
        console.error('[STORAGE] Error loading market prices:', error);
        return null;
    }
}

/**
 * Saves market prices to JSON file with timestamp
 */
export function saveMarketPrices(prices: MarketPrice[], timestamp: string): void {
    try {
        ensureDataDir();

        const data: CachedData = {
            prices,
            timestamp,
        };

        fs.writeFileSync(PRICES_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`[STORAGE] Saved ${prices.length} prices to file with timestamp ${timestamp}`);
    } catch (error) {
        console.error('[STORAGE] Error saving market prices:', error);
    }
}

/**
 * Checks if the cache is stale (>60 minutes old or missing)
 */
export function isCacheStale(lastUpdate: string | null): boolean {
    if (!lastUpdate) return true;

    const lastUpdateTime = new Date(lastUpdate).getTime();
    const now = Date.now();
    const sixtyMinutes = 60 * 60 * 1000;

    return now - lastUpdateTime > sixtyMinutes;
}
