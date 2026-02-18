
import recipesData from '@/data/recipes.json';

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

export const recipes: Recipe[] = recipesData.recipes;

export const getItemRecipe = (itemId: string): Recipe | undefined => {
    return recipes.find(r => r.id.toLowerCase() === itemId.toLowerCase());
};

export const getAllItems = (): Recipe[] => {
    return recipes;
};

// Production Constants
// Based on analysis: RawOutput = Energy * Skill * 0.24
// ItemOutput = RawOutput / WorkPoints
export const PROD_CONSTANT = 0.24;
export const ENGINE_WP_PER_LEVEL = 24;

export const calculateWorkerProduction = (energy: number, skill: number, fidelity: number) => {
    // Energy is 0-100
    // Skill is 1-20+
    // Fidelity is 0-100 (percent bonus?)
    // output = (Energy * Skill * CONSTANT) * (1 + Fidelity/100)
    const base = energy * skill * PROD_CONSTANT;
    return base * (1 + (fidelity / 100));
};
