
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
// Based on WarEra Toolbox analysis: 
// 1. Worker Energy spent -> WorkPoints: Floor((2.4 * EnergyValue - 5) / 10)
// 2. Total WorkPoints = WorkPoints * ProductionSkill
// 3. Output = (TotalWorkPoints * (1 + Bonus/100)) / ItemWorkPoints

export const ENGINE_WP_PER_LEVEL = 23; // Level 1 engine = 100 "Energy" equiv = 23 WorkPoints

export const calculateWorkerProduction = (energy: number, skill: number, fidelity: number) => {
    // energy: typically 30 - 1100+
    // skill: typical 10 - 50+
    // fidelity: 0 - 100 (percent)

    // a. Energy conversion to work points per skill point
    const energyWorkPoints = Math.max(0, Math.floor((2.4 * energy - 5) / 10));

    // b. Skill acts as a direct multiplier to work effort
    // Note: Skill total (profile.skills.production.total) is expected here.
    const baseWorkPoints = energyWorkPoints * skill;

    // c. Fidelity is a separate multiplier
    return baseWorkPoints * (1 + (fidelity / 100));
};
