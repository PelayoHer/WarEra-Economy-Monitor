import { NextResponse } from 'next/server';
import { scrapeAllPrices } from '@/lib/scraper';
import { loadMarketPrices, saveMarketPrices, isCacheStale } from '@/lib/storage';
import recipes from '@/data/recipes.json';

// ISR: Revalidate every hour (3600 seconds)
// Next.js will serve cached data and regenerate in background
export const revalidate = 3600;

// Allow this route to run for up to 60 seconds (for slow API calls)
export const maxDuration = 60;

export async function GET(request: Request) {
    console.log('[API] GET /api/market-data hit');
    try {
        // Check for force refresh param
        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get('force') === 'true';
        console.log(`[API] Force refresh: ${forceRefresh}`);

        // Load cached data
        const cached = loadMarketPrices();
        const lastUpdate = cached?.timestamp || null;
        console.log(`[API] Cached data timestamp: ${lastUpdate}`);

        // Check if we need to refresh
        const needsRefresh = isCacheStale(lastUpdate);
        console.log(`[API] Needs refresh (stale): ${needsRefresh}`);

        if (!needsRefresh && cached && !forceRefresh) {
            console.log('[API] Serving cached data');
            // Return cached data
            return NextResponse.json({
                prices: cached.prices,
                timestamp: cached.timestamp,
                wasUpdated: false,
            });
        }

        // Need to scrape new data
        console.log('[API] Initiating scrape...');
        // recipes is an object { recipes: [...] }, so we need to access items.recipes
        const result = await scrapeAllPrices(recipes.recipes as any);
        console.log('[API] Scrape result:', { success: result.success, error: result.error, pricesCount: result.prices?.length });

        if (result.success && result.prices && result.timestamp) {
            // Save successful scrape
            console.log('[API] Saving new data to cache');
            saveMarketPrices(result.prices, result.timestamp);

            return NextResponse.json({
                prices: result.prices,
                timestamp: result.timestamp,
                wasUpdated: true,
            });
        }

        // Scraping failed
        if (result.error === 'TOKEN_EXPIRED') {
            console.warn('[API] Token expired during scrape');
            // Return cached data with error flag
            return NextResponse.json({
                prices: cached?.prices || [],
                timestamp: cached?.timestamp || new Date().toISOString(),
                wasUpdated: false,
                error: 'TOKEN_EXPIRED',
            });
        }

        // Other error
        console.error(`[API] Scrape failed with error: ${result.error}`);
        return NextResponse.json({
            prices: cached?.prices || [],
            timestamp: cached?.timestamp || new Date().toISOString(),
            wasUpdated: false,
            error: result.error || 'Unknown error',
        });

    } catch (error: any) {
        console.error('[API] Server Error:', error);
        return NextResponse.json({
            prices: [],
            timestamp: new Date().toISOString(),
            wasUpdated: false,
            error: error.message || 'Server error',
        }, { status: 500 });
    }
}
