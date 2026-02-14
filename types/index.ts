export interface RecipeInput {
    id: string;
    qty: number;
}

export interface Recipe {
    id: string;
    name: string;
    inputs: RecipeInput[];
    work_points: number;
    is_base?: boolean;
}

export interface MarketPrice {
    productId: string;
    averagePrice: number;
    lastUpdated: string;
}

export interface PriceOverrides {
    [productId: string]: number;
}

export interface ProfitabilityData {
    recipe: Recipe;
    marketPrice: number;
    productionCost: number;
    netProfit: number;
    profitMargin: number;
}

export interface ScrapingResult {
    success: boolean;
    prices?: MarketPrice[];
    error?: string;
    timestamp?: string;
}

export interface MarketDataResponse {
    prices: MarketPrice[];
    timestamp: string;
    wasUpdated: boolean;
    error?: string;
}
