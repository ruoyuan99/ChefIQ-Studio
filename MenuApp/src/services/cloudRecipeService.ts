import { supabase } from '../config/supabase';
import { Recipe, Ingredient, Instruction } from '../types';

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

  return {
    id: row.id,
    title: row.title || 'Untitled',
    description: row.description || '',
    items: [],
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    isPublic: !!row.is_public,
    image_url: row.image_url || null,
    imageUri: row.image_url || null,
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
        ingredients:ingredients(id, name, amount, unit, order_index),
        instructions:instructions(id, step_number, description, image_url, order_index),
        tags:tags(id, name),
        user:users(name, avatar_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbToRecipe);
  },
};


