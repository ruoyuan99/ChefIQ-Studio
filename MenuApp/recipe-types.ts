/**
 * Recipe Data Types for Recipe App
 * 
 * This file contains all the TypeScript interfaces and types
 * used in the Recipe App for data validation and type safety.
 */

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface Instruction {
  id: string;
  step: number;
  description: string;
  imageUri?: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  items: MenuItem[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  shareCode?: string;
  imageUri?: string | null;
  tags: string[];
  cookingTime: string;
  servings: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export type RootStackParamList = {
  Home: undefined;
  RecipeList: undefined;
  RecipeName: undefined;
  CreateRecipe: { recipeName?: string };
  EditRecipe: { recipeId: string };
  RecipeDetail: { recipeId: string };
  ShareRecipe: { recipeId: string };
};

// Utility types for form data
export type CreateRecipeData = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateRecipeData = Recipe;

// Common cooking time options
export const COOKING_TIME_OPTIONS = [
  'Under 15 minutes',
  '15-30 minutes',
  '30-45 minutes',
  '45-60 minutes',
  '1-2 hours',
  '2-4 hours',
  '4+ hours',
  'Overnight'
] as const;

// Common serving options
export const SERVINGS_OPTIONS = [
  '1 serving',
  '2 servings',
  '3-4 servings',
  '4-6 servings',
  '6-8 servings',
  '8-10 servings',
  '10+ servings'
] as const;

// Common unit options for ingredients
export const UNIT_OPTIONS = [
  'cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
  'pound', 'pounds', 'ounce', 'ounces', 'gram', 'grams', 'kilogram', 'kilograms',
  'pint', 'pints', 'quart', 'quarts', 'gallon', 'gallons',
  'piece', 'pieces', 'slice', 'slices', 'clove', 'cloves',
  'can', 'cans', 'bottle', 'bottles', 'package', 'packages',
  'pinch', 'dash', 'to taste', 'as needed'
] as const;

// Common tags for recipes
export const COMMON_TAGS = [
  'Quick & Easy', 'Healthy', 'Vegetarian', 'Vegan', 'Gluten-Free',
  'Low-Carb', 'High-Protein', 'Comfort Food', 'Spicy', 'Sweet',
  'Savory', 'Crispy', 'Creamy', 'Fresh', 'Homemade',
  'Traditional', 'Modern', 'Fusion', 'Mediterranean', 'Asian',
  'Italian', 'Mexican', 'Indian', 'Chinese', 'Japanese'
] as const;

// Type guards for runtime validation
export function isMenuItem(obj: any): obj is MenuItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.price === 'number' &&
    typeof obj.category === 'string' &&
    typeof obj.isAvailable === 'boolean'
  );
}

export function isIngredient(obj: any): obj is Ingredient {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.unit === 'string'
  );
}

export function isInstruction(obj: any): obj is Instruction {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.step === 'number' &&
    typeof obj.description === 'string'
  );
}

export function isRecipe(obj: any): obj is Recipe {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    Array.isArray(obj.items) &&
    obj.items.every(isMenuItem) &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date &&
    typeof obj.isPublic === 'boolean' &&
    Array.isArray(obj.tags) &&
    obj.tags.every((tag: any) => typeof tag === 'string') &&
    typeof obj.cookingTime === 'string' &&
    typeof obj.servings === 'string' &&
    Array.isArray(obj.ingredients) &&
    obj.ingredients.every(isIngredient) &&
    Array.isArray(obj.instructions) &&
    obj.instructions.every(isInstruction)
  );
}
