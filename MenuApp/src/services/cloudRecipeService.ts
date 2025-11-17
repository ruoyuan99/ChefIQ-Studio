import { supabase } from '../config/supabase';
import { Recipe, Ingredient, Instruction } from '../types';
import { sampleRecipes } from '../data/sampleRecipes';

// Admin user ID used for sample recipes in database
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

// Get set of sample recipe titles for quick lookup
const sampleRecipeTitles = new Set(sampleRecipes.map(r => r.title.toLowerCase().trim()));

/**
 * Check if a recipe is a sample recipe (from hardcoded sampleRecipes array)
 * This helps filter out duplicate sample recipes from database
 */
function isSampleRecipe(recipe: Recipe | any): boolean {
  // Check by title (case-insensitive)
  if (recipe.title) {
    const normalizedTitle = recipe.title.toLowerCase().trim();
    if (sampleRecipeTitles.has(normalizedTitle)) {
      return true;
    }
  }
  
  // Check by user_id (if it's from admin user, it's likely a sample recipe)
  // Note: This is a fallback check, primary check is by title
  if (recipe.user_id === ADMIN_USER_ID || (recipe.user && recipe.user.id === ADMIN_USER_ID)) {
    // Double-check by title to be sure
    if (recipe.title) {
      const normalizedTitle = recipe.title.toLowerCase().trim();
      if (sampleRecipeTitles.has(normalizedTitle)) {
        return true;
      }
    }
  }
  
  return false;
}

function mapDbToRecipe(row: any): Recipe {
  const ingredients: Ingredient[] = (row.ingredients || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((ing: any, idx: number) => ({
    id: ing.id || String(idx + 1),
    name: ing.name || '',
    amount: typeof ing.amount === 'number' ? ing.amount : parseFloat(ing.amount || '1'),
    unit: ing.unit || '',
  }));

  const instructions: Instruction[] = (row.instructions || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((ins: any, idx: number) => ({
    id: ins.id || String(idx + 1),
    step: ins.step_number || idx + 1,
    description: ins.description || '',
    imageUri: ins.image_url || null,
  }));

  const tags: string[] = (row.tags || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((t: any) => t.name).filter(Boolean);

  // Handle image URL - ensure empty strings are treated as null
  const imageUrl = row.image_url && typeof row.image_url === 'string' && row.image_url.trim() !== '' 
    ? row.image_url 
    : null;

  return {
    id: row.id,
    title: row.title || 'Untitled',
    description: row.description || '',
    items: [],
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    isPublic: !!row.is_public,
    image_url: imageUrl,
    imageUri: imageUrl, // Set imageUri to same value as image_url for consistency
    authorName: row.user?.name || undefined,
    authorAvatar: row.user?.avatar_url || undefined,
    tags,
    // Convert cooking_time (INTEGER minutes) to string format "X分钟"
    cookingTime: row.cooking_time ? `${row.cooking_time}分钟` : '',
    // Convert servings (INTEGER) to string
    servings: row.servings ? String(row.servings) : '',
    ingredients,
    instructions,
    cookware: row.cookware || '',
  };
}

export const CloudRecipeService = {
  async fetchUserRecipes(userId: string): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        id, title, description, image_url, cooking_time, servings, cookware, is_public, created_at, updated_at,
        ingredients:ingredients(id, name, amount, unit, order_index),
        instructions:instructions(id, step_number, description, image_url, order_index),
        tags:tags(id, name),
        user:users(name, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbToRecipe);
  },

  async fetchPublicRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        id, title, description, image_url, cooking_time, servings, cookware, is_public, created_at, updated_at,
        user_id,
        ingredients:ingredients(id, name, amount, unit, order_index),
        instructions:instructions(id, step_number, description, image_url, order_index),
        tags:tags(id, name),
        user:users(id, name, avatar_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Filter out sample recipes BEFORE mapping (to check user_id from raw data)
    // We only use hardcoded sampleRecipes array, not from database
    // This ensures a single source of truth for sample recipes
    const nonSampleData = (data || []).filter((row: any) => {
      // Check by title (primary check)
      if (row.title) {
        const normalizedTitle = row.title.toLowerCase().trim();
        if (sampleRecipeTitles.has(normalizedTitle)) {
          return false; // This is a sample recipe, filter it out
        }
      }
      
      // Check by user_id (if it's from admin user and title matches, it's a sample recipe)
      if (row.user_id === ADMIN_USER_ID || (row.user && row.user.id === ADMIN_USER_ID)) {
        if (row.title) {
          const normalizedTitle = row.title.toLowerCase().trim();
          if (sampleRecipeTitles.has(normalizedTitle)) {
            return false; // This is a sample recipe, filter it out
          }
        }
      }
      
      return true; // Keep this recipe
    });
    
    // Map remaining database rows to Recipe objects
    const recipes = nonSampleData.map(mapDbToRecipe);
    
    console.log(`📊 Fetched ${(data || []).length} public recipes, filtered out ${(data || []).length - recipes.length} sample recipes`);
    
    return recipes;
  },
};


