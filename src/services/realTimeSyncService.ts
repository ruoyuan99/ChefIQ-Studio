import { supabase } from '../config/supabase';
import { uploadRecipeImage } from './storageService';

export class RealTimeSyncService {
  // 实时同步菜谱到Supabase
  static async syncRecipe(recipe: any, userId: string): Promise<void> {
    try {
      // Require a valid Supabase session (mock admin has no session)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.log('⚠️ Skipping Supabase sync: no authenticated session');
        console.log('ℹ️ Provided userId:', userId, 'title:', recipe?.title);
        return;
      }
      console.log('✅ Supabase session present. auth.user.id =', sessionData.session.user.id, 'app userId =', userId);

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
      const { data: existingRecipe } = await supabase
        .from('recipes')
        .select('id')
        .eq('title', recipe.title)
        .eq('user_id', userId)
        .single();

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
      } else {
        // 创建新菜谱
        const { data: newRecipe, error: insertError } = await supabase
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
        console.log('🆕 Recipe inserted with id:', newRecipe?.id);

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
    } catch (error) {
      console.error('❌ 菜谱实时同步失败:', error);
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
      // 删除现有食材
      await supabase
        .from('ingredients')
        .delete()
        .eq('recipe_id', recipeId);

      // 插入新食材
      const ingredientsData = ingredients.map((ingredient, index) => ({
        recipe_id: recipeId,
        name: ingredient.name || ingredient.ingredient || '',
        amount: ingredient.amount || '1',
        unit: ingredient.unit || '',
        order_index: index
      }));

      await supabase
        .from('ingredients')
        .insert(ingredientsData);
    } catch (error) {
      console.error('❌ 食材同步失败:', error);
    }
  }

  // 同步步骤
  private static async syncInstructions(recipeId: string, instructions: any[]): Promise<void> {
    try {
      // 删除现有步骤
      await supabase
        .from('instructions')
        .delete()
        .eq('recipe_id', recipeId);

      // 插入新步骤
      const instructionsData = instructions.map((instruction, index) => ({
        recipe_id: recipeId,
        step_number: index + 1,
        description: instruction.description || instruction.step || '',
        image_url: instruction.imageUri || instruction.image || null,
        order_index: index
      }));

      await supabase
        .from('instructions')
        .insert(instructionsData);
    } catch (error) {
      console.error('❌ 步骤同步失败:', error);
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
