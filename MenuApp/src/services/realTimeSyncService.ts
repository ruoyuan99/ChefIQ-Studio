import { supabase } from '../config/supabase';
import { uploadRecipeImage } from './storageService';

// Convert cookingTime string (e.g., "25分钟", "25", "20-30 minutes") to integer minutes
function toCookingTimeMinutes(v: any): number | null {
  if (!v) return null;
  
  // If already a number, return it (clamped to 1-999)
  if (typeof v === 'number') {
    return Math.min(999, Math.max(1, Math.round(v)));
  }
  
  const str = String(v).trim();
  
  // Extract number from formats like "25分钟", "25", "20-30 minutes"
  const numberMatch = str.match(/(\d+)/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1], 10);
    if (Number.isFinite(num) && num > 0) {
      return Math.min(999, Math.max(1, num));
    }
  }
  
  return null;
}

export class RealTimeSyncService {
  // 实时同步菜谱到Supabase
  static async syncRecipe(recipe: any, userId: string): Promise<string | null> {
    try {
      // Require a valid Supabase session (mock admin has no session)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.log('⚠️ Skipping Supabase sync: no authenticated session');
        console.log('ℹ️ Provided userId:', userId, 'title:', recipe?.title);
        return null;
      }
      console.log('✅ Supabase session present. auth.user.id =', sessionData.session.user.id, 'app userId =', userId);
      
      // 调试信息：检查 ingredients 和 instructions
      console.log('📦 syncRecipe - Recipe data:', {
        title: recipe.title,
        ingredientsCount: recipe.ingredients?.length || 0,
        instructionsCount: recipe.instructions?.length || 0,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
      });

      // Prepare image URL (upload to Supabase Storage)
      // Priority: imageUri (new local/remote image) > image_url (existing remote URL) > image (fallback)
      // For imported recipes from websites, we download and upload the remote image to our own storage
      // This ensures all images are stored in our database and won't break if the original source is removed
      let imageUrl: string | null = null;
      
      // Check if there's a new image (local path or remote URL)
      const hasNewImage = recipe.imageUri && 
        typeof recipe.imageUri === 'string' && 
        recipe.imageUri.trim() !== '';
      
      // Priority: new imageUri > existing image_url > image (fallback)
      const candidate = hasNewImage 
        ? recipe.imageUri 
        : (recipe.image_url || recipe.image);
      
      if (candidate && typeof candidate === 'string' && candidate.trim() !== '') {
        const isRemote = candidate.startsWith('http://') || candidate.startsWith('https://');
        const isLocalPath = !isRemote && (candidate.startsWith('file://') || candidate.startsWith('/'));
        
        // For remote URLs (e.g., from website imports), download and upload to our storage
        // For local paths, upload directly
        // For existing Supabase URLs, check if they're already in our storage
        const isOurStorageUrl = candidate.includes('supabase.co/storage');
        
        console.log('🖼️ [SYNC] Image processing decision:');
        console.log('   - Candidate:', candidate);
        console.log('   - Is remote URL:', isRemote);
        console.log('   - Is local path:', isLocalPath);
        console.log('   - Is our storage URL:', isOurStorageUrl);
        
        if (isOurStorageUrl) {
          // Already in our storage, use as-is
          imageUrl = candidate;
          console.log('✅ [SYNC] Using existing Supabase Storage URL:', imageUrl);
        } else if (isRemote || isLocalPath) {
          // Upload to our storage (will download if remote, upload if local)
          try {
            console.log('🔄 [SYNC] Starting image upload process...');
            console.log('   - Source type:', isRemote ? 'Remote URL (will download first)' : 'Local file');
            const startTime = Date.now();
            imageUrl = await uploadRecipeImage(candidate, userId);
            const duration = Date.now() - startTime;
            console.log('✅ [SYNC] Recipe image uploaded successfully to our storage');
            console.log('   - New URL:', imageUrl);
            console.log('   - Upload duration:', duration, 'ms');
          } catch (error) {
            console.error('❌ [SYNC] Failed to upload recipe image:', error);
            // If upload fails, fall back to existing image_url if available
            imageUrl = recipe.image_url || null;
            if (imageUrl) {
              console.log('⚠️ [SYNC] Falling back to existing image_url:', imageUrl);
            } else {
              console.warn('⚠️ [SYNC] No fallback image URL available');
            }
          }
        } else {
          // Unknown format, try to use as-is
          console.warn('⚠️ [SYNC] Unknown image format, using as-is:', candidate);
          imageUrl = candidate;
        }
      } else {
        console.log('ℹ️ [SYNC] No image candidate found');
      }
      // 检查菜谱是否已存在
      // 优先通过 recipe.id 查找（如果 recipe 有数据库 UUID）
      // 注意：新创建的 recipe 使用时间戳 ID，不是 UUID，所以应该创建新记录
      let existingRecipe = null;
      let newRecipe = null; // 声明变量，用于存储新创建的recipe
      
      // 检查 recipe.id 是否是 UUID 格式（数据库 ID）
      const isUUID = recipe.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipe.id);
      
      if (isUUID) {
        // recipe.id 是 UUID（数据库 ID），尝试直接查找
        console.log('🔍 Searching recipe by UUID:', recipe.id);
        const { data: recipeById } = await supabase
          .from('recipes')
          .select('id')
          .eq('id', recipe.id)
          .eq('user_id', userId)
          .maybeSingle();
        existingRecipe = recipeById;
      } else {
        // recipe.id 是时间戳（新创建的本地 ID），应该创建新记录
        // 但为了安全，也检查一下是否真的不存在（避免重复导入）
        console.log('🔍 New recipe (timestamp ID), checking if recipe with same title exists');
        const { data: recipeByTitle } = await supabase
          .from('recipes')
          .select('id')
          .eq('title', recipe.title)
          .eq('user_id', userId)
          .maybeSingle();
        
        // 只有在明确需要更新时才使用已存在的 recipe
        // 对于新创建的 recipe（时间戳 ID），总是创建新记录
        // 这样可以避免覆盖用户之前保存的同名 recipe
        if (recipeByTitle) {
          console.log('⚠️ Found recipe with same name, but this is a newly created recipe, will create new record instead of updating');
          existingRecipe = null; // 强制创建新记录
        }
      }

      if (existingRecipe) {
        // 更新现有菜谱
        const { error: updateError } = await supabase
          .from('recipes')
          .update({
            title: recipe.title || recipe.name || 'Untitled Recipe',
            description: recipe.description || '',
            image_url: imageUrl,
            cooking_time: toCookingTimeMinutes(recipe.cookingTime || recipe.cooking_time) ?? 30,
            servings: parseInt(recipe.servings) || 4,
            cookware: recipe.cookware || '',
            is_public: recipe.isPublic || false,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecipe.id);
        if (updateError) throw updateError;
        
        // 同步食材（更新时也要同步）
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          await this.syncIngredients(existingRecipe.id, recipe.ingredients);
        }

        // 同步步骤（更新时也要同步）
        if (recipe.instructions && recipe.instructions.length > 0) {
          await this.syncInstructions(existingRecipe.id, recipe.instructions);
        }

        // 同步标签（更新时也要同步）
        if (recipe.tags && recipe.tags.length > 0) {
          await this.syncTags(existingRecipe.id, recipe.tags);
        }
      } else {
        // 创建新菜谱
        // 如果 recipe.id 是 UUID，使用它；否则让数据库生成
        const insertData: any = {
          title: recipe.title || recipe.name || 'Untitled Recipe',
          description: recipe.description || '',
          image_url: imageUrl,
          cooking_time: toCookingTimeMinutes(recipe.cookingTime || recipe.cooking_time) ?? 30,
          servings: parseInt(recipe.servings) || 4,
          cookware: recipe.cookware || '',
          is_public: recipe.isPublic || false,
          user_id: userId
        };
        
        // 如果 recipe.id 是有效的 UUID，使用它作为数据库 ID
        if (isUUID && recipe.id) {
          insertData.id = recipe.id;
          console.log('🆕 Creating recipe with locally generated UUID:', recipe.id);
        }
        
        const { data: insertedRecipe, error: insertError } = await supabase
          .from('recipes')
          .insert(insertData)
          .select()
          .single();
        if (insertError) throw insertError;
        newRecipe = insertedRecipe; // 赋值给外部声明的变量
        console.log('🆕 Recipe inserted with id:', newRecipe?.id);
        
        // 如果使用了本地UUID，验证数据库返回的ID与本地ID一致
        if (isUUID && recipe.id && newRecipe.id !== recipe.id) {
          console.warn('⚠️ Database returned ID does not match local UUID:', {
            local: recipe.id,
            database: newRecipe.id
          });
        }

        // 同步食材
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          await this.syncIngredients(newRecipe.id, recipe.ingredients);
        }

        // 同步步骤
        if (recipe.instructions && recipe.instructions.length > 0) {
          await this.syncInstructions(newRecipe.id, recipe.instructions);
        }

        // 同步标签
        if (recipe.tags && recipe.tags.length > 0) {
          await this.syncTags(newRecipe.id, recipe.tags);
        }
      }

      console.log('✅ Recipe real-time sync completed:', recipe.title, 'is_public:', recipe?.isPublic === true);
      
      // Fetch the updated recipe from database to get the latest data (including new image_url)
      const recipeId = existingRecipe ? existingRecipe.id : (newRecipe?.id || null);
      if (recipeId) {
        try {
          const { data: updatedRecipeData, error: fetchError } = await supabase
            .from('recipes')
            .select(`
              id, title, description, image_url, cooking_time, servings, cookware, is_public, created_at, updated_at,
              ingredients:ingredients(id, name, amount, unit, order_index),
              instructions:instructions(id, step_number, description, image_url, order_index),
              tags:tags(id, name)
            `)
            .eq('id', recipeId)
            .single();
          
          if (!fetchError && updatedRecipeData) {
            // Map database format to Recipe format
            const ingredients = (updatedRecipeData.ingredients || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((ing: any, idx: number) => ({
              id: ing.id || String(idx + 1),
              name: ing.name || '',
              amount: typeof ing.amount === 'number' ? ing.amount : parseFloat(ing.amount || '1'),
              unit: ing.unit || '',
            }));

            const instructions = (updatedRecipeData.instructions || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((ins: any, idx: number) => ({
              id: ins.id || String(idx + 1),
              step: ins.step_number || idx + 1,
              description: ins.description || '',
              imageUri: ins.image_url || null,
            }));

            const tags = (updatedRecipeData.tags || []).map((t: any) => t.name).filter(Boolean);

            const updatedRecipe = {
              id: updatedRecipeData.id,
              title: updatedRecipeData.title || 'Untitled',
              description: updatedRecipeData.description || '',
              items: [],
              createdAt: updatedRecipeData.created_at ? new Date(updatedRecipeData.created_at) : new Date(),
              updatedAt: updatedRecipeData.updated_at ? new Date(updatedRecipeData.updated_at) : new Date(),
              isPublic: !!updatedRecipeData.is_public,
              image_url: updatedRecipeData.image_url || null,
              imageUri: updatedRecipeData.image_url || null,
              tags,
              cookingTime: updatedRecipeData.cooking_time ? `${updatedRecipeData.cooking_time}分钟` : '',
              servings: updatedRecipeData.servings ? String(updatedRecipeData.servings) : '',
              ingredients,
              instructions,
              cookware: updatedRecipeData.cookware || '',
            };
            
            console.log('✅ Fetched updated recipe with new image_url:', updatedRecipe.image_url);
            return updatedRecipe;
          }
        } catch (error) {
          console.error('❌ Failed to fetch updated recipe:', error);
        }
      }
      
      // Fallback: return recipe ID if fetch fails
      return recipeId;
    } catch (error) {
      console.error('❌ Recipe real-time sync failed:', error);
      throw error; // 重新抛出错误
    }
  }

  // 删除菜谱（及其子表）- 基于ID
  static async deleteRecipeById(recipeId: string): Promise<void> {
    try {
      // 直接通过ID删除菜谱（Cascade deletes should handle children if FK is ON DELETE CASCADE）
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;

      console.log(`✅ Recipe deletion synced: recipeId=${recipeId}`);
    } catch (err) {
      console.error('❌ Recipe deletion sync failed:', err);
    }
  }

  // 删除菜谱（及其子表）- 基于标题（保留以兼容旧代码，但不推荐使用）
  static async deleteRecipeByTitleForUser(title: string, userId: string): Promise<void> {
    try {
      // 获取所有匹配的菜谱（可能有多个同名菜谱）
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('id')
        .eq('title', title)
        .eq('user_id', userId);

      if (error) throw error;
      if (!recipes || recipes.length === 0) return; // nothing to delete

      // 删除所有匹配的菜谱（Cascade deletes should handle children if FK is ON DELETE CASCADE）
      const recipeIds = recipes.map(r => r.id);
      const { error: deleteError } = await supabase
        .from('recipes')
        .delete()
        .in('id', recipeIds);

      if (deleteError) throw deleteError;

      console.log(`✅ Recipe deletion synced: ${title} (deleted ${recipes.length} records)`);
    } catch (err) {
      console.error('❌ Recipe deletion sync failed:', err);
    }
  }

  // 实时同步收藏
  static async syncFavorite(recipeId: string, userId: string, isFavorite: boolean): Promise<void> {
    try {
      if (isFavorite) {
        // 添加收藏
        await supabase
          .from('favorites')
          .upsert({
            user_id: userId,
            recipe_id: recipeId,
            created_at: new Date().toISOString()
          });
      } else {
        // 移除收藏
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('recipe_id', recipeId);
      }

      console.log('✅ Favorite real-time sync completed');
    } catch (error) {
      console.error('❌ Favorite real-time sync failed:', error);
    }
  }

  // 实时同步评论
  static async syncComment(recipeId: string, userId: string, comment: any): Promise<void> {
    try {
      await supabase
        .from('comments')
        .insert({
          recipe_id: recipeId,
          user_id: userId,
          content: comment.content || comment.text || '',
          likes_count: comment.likes || 0,
          created_at: comment.createdAt || new Date().toISOString()
        });

      console.log('✅ Comment real-time sync completed');
    } catch (error) {
      console.error('❌ Comment real-time sync failed:', error);
    }
  }

  // 实时同步社交统计
  static async syncSocialStats(recipeId: string, stats: any): Promise<void> {
    try {
      await supabase
        .from('social_stats')
        .upsert({
          recipe_id: recipeId,
          likes_count: stats.likes || 0,
          favorites_count: stats.favorites || 0,
          tries_count: stats.tries || 0,
          views_count: stats.views || 0,
          updated_at: new Date().toISOString()
        });

      console.log('✅ Social stats real-time sync completed');
    } catch (error) {
      console.error('❌ Social stats real-time sync failed:', error);
    }
  }

  // 同步食材
  private static async syncIngredients(recipeId: string, ingredients: any[]): Promise<void> {
    try {
      console.log(`🔄 Syncing ingredients - recipeId: ${recipeId}, count: ${ingredients.length}`);
      
      // 删除现有食材
      const { error: deleteError } = await supabase
        .from('ingredients')
        .delete()
        .eq('recipe_id', recipeId);
      
      if (deleteError) {
        console.error('❌ Failed to delete existing ingredients:', deleteError);
        throw deleteError;
      }

      // 插入新食材
      const ingredientsData = ingredients.map((ingredient, index) => ({
        recipe_id: recipeId,
        name: ingredient.name || ingredient.ingredient || '',
        amount: typeof ingredient.amount === 'number' ? ingredient.amount : parseFloat(ingredient.amount || '1'),
        unit: ingredient.unit || '',
        order_index: index
      }));

      console.log('📝 Preparing to insert ingredients data:', ingredientsData);

      const { error: insertError, data } = await supabase
        .from('ingredients')
        .insert(ingredientsData)
        .select();
      
      if (insertError) {
        console.error('❌ Failed to insert ingredients:', insertError);
        throw insertError;
      }
      
      console.log(`✅ Ingredients sync succeeded - inserted ${data?.length || 0} records`);
    } catch (error) {
      console.error('❌ Ingredients sync failed:', error);
      throw error; // 重新抛出错误，让调用者知道同步失败
    }
  }

  // 同步步骤
  private static async syncInstructions(recipeId: string, instructions: any[]): Promise<void> {
    try {
      console.log(`🔄 Syncing instructions - recipeId: ${recipeId}, count: ${instructions.length}`);
      
      // 删除现有步骤
      const { error: deleteError } = await supabase
        .from('instructions')
        .delete()
        .eq('recipe_id', recipeId);
      
      if (deleteError) {
        console.error('❌ Failed to delete existing instructions:', deleteError);
        throw deleteError;
      }

      // 插入新步骤
      const instructionsData = instructions.map((instruction, index) => ({
        recipe_id: recipeId,
        step_number: index + 1,
        description: typeof instruction === 'string' 
          ? instruction 
          : (instruction.description || instruction.step || instruction.text || ''),
        image_url: instruction.imageUri || instruction.image || null,
        order_index: index
      }));

      console.log('📝 Preparing to insert instructions data:', instructionsData);

      const { error: insertError, data } = await supabase
        .from('instructions')
        .insert(instructionsData)
        .select();
      
      if (insertError) {
        console.error('❌ Failed to insert instructions:', insertError);
        throw insertError;
      }
      
      console.log(`✅ Instructions sync succeeded - inserted ${data?.length || 0} records`);
    } catch (error) {
      console.error('❌ Instructions sync failed:', error);
      throw error; // 重新抛出错误，让调用者知道同步失败
    }
  }

  // 同步标签
  private static async syncTags(recipeId: string, tags: string[]): Promise<void> {
    try {
      // 删除现有标签
      await supabase
        .from('tags')
        .delete()
        .eq('recipe_id', recipeId);

      // 插入新标签
      const tagsData = tags.map(tag => ({
        recipe_id: recipeId,
        name: tag.trim()
      }));

      await supabase
        .from('tags')
        .insert(tagsData);
    } catch (error) {
      console.error('❌ Tags sync failed:', error);
    }
  }
}
