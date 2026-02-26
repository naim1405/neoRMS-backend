import { IngredientUnit } from '@prisma/client';

// Used when creating a RestaurantInventory entry.
// Either supply an existing ingredientId OR supply name+unit to create a new IngredientIngredient on the fly.
export interface ICreateRestaurantInventory {
    ingredientId?: string;   // provide if ingredient already exists in InventoryIngredient
    name?: string;           // required when ingredientId is NOT provided
    unit?: IngredientUnit;   // required when ingredientId is NOT provided
    availableQuantity: number;
    thresholdQuantity?: number;
}

export interface IUpdateRestaurantInventory {
    availableQuantity?: number;
    thresholdQuantity?: number;
}

export interface IAdjustQuantity {
    amount: number;
}
