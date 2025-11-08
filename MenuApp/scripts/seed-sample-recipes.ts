import { createClient } from '@supabase/supabase-js';
import { seedRecipes } from './seed-data';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-side only
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001'; // your admin uid used in app

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const toServings = (v: any) => {
  if (!v) return 4;
  const num = parseFloat(String(v).replace(/[^\d.]/g, ''));
  return Number.isFinite(num) && num > 0 ? Math.min(99, Math.max(1, Math.round(num))) : 4;
};

async function upsertRecipe(r: any) {
  const payload = {
    title: r.title,
    description: r.description || '',
    image_url: r.image_url || null,
    cooking_time: r.cookingTime || '30分钟',
    servings: toServings(r.servings),
    cookware: r.cookware || '',
    is_public: true,
    user_id: ADMIN_USER_ID,
  };

  const { data: exists } = await db
    .from('recipes')
    .select('id')
    .eq('title', r.title)
    .eq('user_id', ADMIN_USER_ID)
    .maybeSingle();

  let recipeId: string;
  if (exists?.id) {
    const { data, error } = await db
      .from('recipes')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', exists.id)
      .select('id')
      .single();
    if (error) throw error;
    recipeId = data!.id;
  } else {
    const { data, error } = await db
      .from('recipes')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    recipeId = data!.id;
  }

  // Rebuild sub tables for idempotency
  await db.from('ingredients').delete().eq('recipe_id', recipeId);
  await db.from('instructions').delete().eq('recipe_id', recipeId);
  await db.from('tags').delete().eq('recipe_id', recipeId);

  if (Array.isArray(r.ingredients) && r.ingredients.length) {
    const rows = r.ingredients.map((ing: any, i: number) => ({
      recipe_id: recipeId,
      name: ing.name || ing.ingredient || '',
      amount: ing.amount != null ? String(ing.amount) : '1',
      unit: ing.unit || '',
      order_index: i,
    }));
    const { error } = await db.from('ingredients').insert(rows);
    if (error) throw error;
  }

  if (Array.isArray(r.instructions) && r.instructions.length) {
    const rows = r.instructions.map((ins: any, i: number) => ({
      recipe_id: recipeId,
      step_number: i + 1,
      description: ins.description || ins.step || '',
      image_url: ins.image_url || null,
      order_index: i,
    }));
    const { error } = await db.from('instructions').insert(rows);
    if (error) throw error;
  }

  if (Array.isArray(r.tags) && r.tags.length) {
    const rows = r.tags.map((t: string) => ({ recipe_id: recipeId, name: t.trim() }));
    const { error } = await db.from('tags').insert(rows);
    if (error) throw error;
  }
}

(async () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  let ok = 0, fail = 0;
  for (const r of seedRecipes) {
    try { await upsertRecipe(r); ok++; console.log('✓', r.title); }
    catch (e: any) { fail++; console.error('✗', r.title, e?.message || e); }
  }
  console.log(`Done. success=${ok}, failed=${fail}`);
})();


