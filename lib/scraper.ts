import fs from 'fs';
import path from 'path';
import { Recipe, MarketPrice } from '@/types';

interface ScrapeResult {
    success: boolean;
    prices?: MarketPrice[];
    timestamp?: string;
    error?: string;
}

// Main scraping function
export async function scrapeAllPrices(recipes: Recipe[]): Promise<ScrapeResult> {
    const prices: MarketPrice[] = [];
    const token = process.env.WARERA_TOKEN;

    if (!token) {
        console.error('[SCRAPER] No token found (WARERA_TOKEN is empty)');
        return { success: false, error: 'Token not configured' };
    }

    try {
        // Only scrape base items (those with inputs) or specific base resources
        // Filter unique base items to scrape to avoid duplicates
        const itemsToScrape = new Set<string>();

        recipes.forEach(recipe => {
            // Add inputs (raw materials)
            if (recipe.inputs) {
                recipe.inputs.forEach(input => itemsToScrape.add(input.id));
            }
            // Add the product itself to check its market price
            itemsToScrape.add(recipe.id);
        });

        const itemIds = Array.from(itemsToScrape);
        console.log(`Scraping ${itemIds.length} items...`);

        // Batch requests to avoid rate limits (if any)
        // For now, simple sequential loop with slight delay
        for (const id of itemIds) {
            try {
                const price = await scrapePrice(id, token);
                if (price !== null) {
                    prices.push({
                        productId: id,
                        averagePrice: price,
                        lastUpdated: new Date().toISOString()
                    });
                }
                // Small delay to be nice to the server
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error: any) {
                console.error(`Error scraping item ${id}:`, error);
                if (error.message === 'TOKEN_EXPIRED') {
                    return { success: false, error: 'TOKEN_EXPIRED' };
                }
            }
        }

        return {
            success: true,
            prices,
            timestamp: new Date().toISOString()
        };

    } catch (error: any) {
        console.error('Scraping error:', error);
        return { success: false, error: error.message };
    }
}

async function scrapePrice(itemId: string, token: string): Promise<number | null> {
    try {
        // tRPC endpoint parameters
        const input = { "0": { "itemCode": itemId } };
        const encodedInput = encodeURIComponent(JSON.stringify(input));
        const url = `https://api2.warera.io/trpc/itemTrading.getItemTrading?batch=1&input=${encodedInput}`;

        const fingerprint = process.env.WARERA_FINGERPRINT;

        const response = await fetch(url, {
            headers: {
                'authorization': `Bearer ${token}`, // Header name 'authorization' lowercase usually for tRPC/HTTP2
                'x-fingerprint': fingerprint,
                'origin': 'https://app.warera.io',
                'referer': 'https://app.warera.io/',
                'content-type': 'application/json'
            },
            next: { revalidate: 0 }
        });

        if (response.status === 401 || response.status === 403) {
            throw new Error('TOKEN_EXPIRED');
        }

        if (!response.ok) {
            console.warn(`[SCRAPER] Failed to fetch item ${itemId}: ${response.status}`);
            return null;
        }

        const data = await response.json();

        // tRPC returns an array for batch requests
        // Structure is [{ result: { data: { itemCode, currentValue, ... } } }]
        const itemResult = data[0]?.result?.data;

        if (!itemResult) {
            console.warn(`[SCRAPER] Invalid tRPC structure for ${itemId}`, JSON.stringify(data));
            return null;
        }

        const price = itemResult.currentValue || itemResult.lastPrice || 0;

        // Log specifically if price is 0 to verify it's real 0 or missing
        if (price === 0) {
            // console.log(`[SCRAPER] Price for ${itemId} is 0`, itemData);
        }

        return typeof price === 'number' ? price : parseFloat(price);

    } catch (error: any) {
        if (error.message === 'TOKEN_EXPIRED') throw error;
        console.error(`[SCRAPER] Exception fetching ${itemId}:`, error.message);
        return null;
    }
}

/**
 * Checks if cached prices should be refreshed (>60 minutes old or missing)
 */
export function shouldRefreshPrices(lastUpdate: string | null): boolean {
    if (!lastUpdate) return true;

    const lastUpdateTime = new Date(lastUpdate).getTime();
    const now = Date.now();
    const sixtyMinutes = 60 * 60 * 1000;

    return now - lastUpdateTime > sixtyMinutes;
}
