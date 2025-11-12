import { supabase } from '../config/supabase';
import { uploadRecipeImage } from './storageService';

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

      // Prepare image URL (upload if local path)
      let imageUrl: string | null = null;
      const candidate = recipe.image_url || recipe.image || recipe.imageUri;
      if (candidate) {
        const isRemote = typeof candidate === 'string' && (candidate.startsWith('http://') || candidate.startsWith('https://'));
        if (isRemote) {
          imageUrl = candidate as string;
        } else {
          try {
            imageUrl = await uploadRecipeImage(candidate as string, userId);
          } catch (_) {
            imageUrl = null;
          }
        }
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
        console.log('🔍 通过 UUID 查找 recipe:', recipe.id);
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
        console.log('🔍 新 recipe（时间戳 ID），检查是否已存在相同标题的 recipe');
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
          console.log('⚠️ 发现同名 recipe，但这是新创建的 recipe，将创建新记录而不是更新');
          existingRecipe = null; // 强制创建新记录
        }
      }

      if (existingRecipe) {
        // 更新现有菜谱
        const { error: updateError } = await supabase
          .from('recipes')
          .update({
            description: recipe.description || '',
            image_url: imageUrl,
            cooking_time: recipe.cookingTime || recipe.cooking_time || '30分钟',
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
        const { data: insertedRecipe, error: insertError } = await supabase
          .from('recipes')
          .insert({
            title: recipe.title || recipe.name || 'Untitled Recipe',
            description: recipe.description || '',
            image_url: imageUrl,
            cooking_time: recipe.cookingTime || recipe.cooking_time || '30分钟',
            servings: parseInt(recipe.servings) || 4,
            cookware: recipe.cookware || '',
            is_public: recipe.isPublic || false,
            user_id: userId
          })
          .select()
          .single();
        if (insertError) throw insertError;
        newRecipe = insertedRecipe; // 赋值给外部声明的变量
        console.log('🆕 Recipe inserted with id:', newRecipe?.id);
        
        // 重要：返回数据库生成的 ID，以便后续更新本地 recipe
        // 这样下次同步时就能找到正确的 recipe

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

      console.log('✅ 菜谱实时同步完成:', recipe.title, 'is_public:', recipe?.isPublic === true);
      
      // 返回数据库中的recipe ID（用于更新本地recipe ID）
      return existingRecipe ? existingRecipe.id : (newRecipe?.id || null);
    } catch (error) {
      console.error('❌ 菜谱实时同步失败:', error);
      throw error; // 重新抛出错误
    }
  }

  // 删除菜谱（及其子表）
  static async deleteRecipeByTitleForUser(title: string, userId: string): Promise<void> {
    try {
      const { data: recipe, error } = await supabase
        .from('recipes')
        .select('id')
        .eq('title', title)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!recipe?.id) return; // nothing to delete

      // Cascade deletes should handle children if FK is ON DELETE CASCADE.
      await supabase
        .from('recipes')
        .delete()
        .eq('id', recipe.id);

      console.log('✅ 菜谱删除已同步:', title);
    } catch (err) {
      console.error('❌ 菜谱删除同步失败:', err);
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

      console.log('✅ 收藏实时同步完成');
    } catch (error) {
      console.error('❌ 收藏实时同步失败:', error);
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

      console.log('✅ 评论实时同步完成');
    } catch (error) {
      console.error('❌ 评论实时同步失败:', error);
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

      console.log('✅ 社交统计实时同步完成');
    } catch (error) {
      console.error('❌ 社交统计实时同步失败:', error);
    }
  }

  // 同步食材
  private static async syncIngredients(recipeId: string, ingredients: any[]): Promise<void> {
    try {
      console.log(`🔄 同步食材 - recipeId: ${recipeId}, count: ${ingredients.length}`);
      
      // 删除现有食材
      const { error: deleteError } = await supabase
        .from('ingredients')
        .delete()
        .eq('recipe_id', recipeId);
      
      if (deleteError) {
        console.error('❌ 删除现有食材失败:', deleteError);
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

      console.log('📝 准备插入食材数据:', ingredientsData);

      const { error: insertError, data } = await supabase
        .from('ingredients')
        .insert(ingredientsData)
        .select();
      
      if (insertError) {
        console.error('❌ 插入食材失败:', insertError);
        throw insertError;
      }
      
      console.log(`✅ 食材同步成功 - 插入了 ${data?.length || 0} 条记录`);
    } catch (error) {
      console.error('❌ 食材同步失败:', error);
      throw error; // 重新抛出错误，让调用者知道同步失败
    }
  }

  // 同步步骤
  private static async syncInstructions(recipeId: string, instructions: any[]): Promise<void> {
    try {
      console.log(`🔄 同步步骤 - recipeId: ${recipeId}, count: ${instructions.length}`);
      
      // 删除现有步骤
      const { error: deleteError } = await supabase
        .from('instructions')
        .delete()
        .eq('recipe_id', recipeId);
      
      if (deleteError) {
        console.error('❌ 删除现有步骤失败:', deleteError);
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

      console.log('📝 准备插入步骤数据:', instructionsData);

      const { error: insertError, data } = await supabase
        .from('instructions')
        .insert(instructionsData)
        .select();
      
      if (insertError) {
        console.error('❌ 插入步骤失败:', insertError);
        throw insertError;
      }
      
      console.log(`✅ 步骤同步成功 - 插入了 ${data?.length || 0} 条记录`);
    } catch (error) {
      console.error('❌ 步骤同步失败:', error);
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
      console.error('❌ 标签同步失败:', error);
    }
  }
}
