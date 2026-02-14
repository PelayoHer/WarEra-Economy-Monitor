import { Recipe, MarketPrice, ProfitabilityData, PriceOverrides } from '@/types';

/**
 * Merges scraped market prices with manual overrides
 * Manual prices always take priority (nullish coalescing)
 */
export function mergeMarketPrices(
    scrapedPrices: MarketPrice[],
    manualOverrides: PriceOverrides
): Record<string, number> {
    const merged: Record<string, number> = {};

    scrapedPrices.forEach((price) => {
        // Manual price ?? Scraped price
        merged[price.productId] = manualOverrides[price.productId] ?? price.averagePrice;
    });

    return merged;
}

/**
 * Recursively calculates production cost for a product
 * Includes both input material costs and work point costs
 */
export function calculateProductionCost(
    recipeId: string,
    salaryPerPT: number,
    recipes: Recipe[],
    prices: Record<string, number>
): number {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return 0;

    // Cost of work points
    const laborCost = recipe.work_points * salaryPerPT;

    // Cost of input materials (recursive)
    const inputCost = recipe.inputs.reduce((total, input) => {
        const inputPrice = prices[input.id];
        if (inputPrice !== undefined) {
            // Use market price if available
            return total + inputPrice * input.qty;
        } else {
            // Recursively calculate if not in market
            const recursiveCost = calculateProductionCost(input.id, salaryPerPT, recipes, prices);
            return total + recursiveCost * input.qty;
        }
    }, 0);

    return laborCost + inputCost;
}

/**
 * Calculates profitability for a single recipe
 */
export function calculateProfitability(
    recipe: Recipe,
    salaryPerPT: number,
    prices: Record<string, number>
): ProfitabilityData {
    const marketPrice = prices[recipe.id] || 0;
    const productionCost = calculateProductionCost(recipe.id, salaryPerPT, Object.values(recipes), prices);
    const netProfit = marketPrice - productionCost;
    const profitMargin = marketPrice > 0 ? (netProfit / marketPrice) * 100 : 0;

    return {
        recipe,
        marketPrice,
        productionCost,
        netProfit,
        profitMargin,
    };
}

/**
 * Ranks all products by profitability (highest to lowest)
 */
export function rankProductsByProfit(
    recipes: Recipe[],
    salaryPerPT: number,
    prices: Record<string, number>
): ProfitabilityData[] {
    const profitability = recipes.map((recipe) =>
        calculateProfitability(recipe, salaryPerPT, prices)
    );

    return profitability.sort((a, b) => b.netProfit - a.netProfit);
}

/**
 * Formats a number to fixed decimal places for display
 */
export function formatPrice(value: number, decimals: number = 3): string {
    return value.toFixed(decimals);
}

// Import recipes for use in calculations
import recipesData from '@/data/recipes.json';
export const recipes = recipesData.recipes as Recipe[];
