import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncResult {
  success: boolean;
  message: string;
  syncedCount?: number;
}

export class AutoSyncService {
  private static isSyncing = false;
  private static syncQueue: string[] = [];

  // 自动同步所有数据到Supabase
  static async syncAllDataToSupabase(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, message: '同步正在进行中...' };
    }

    this.isSyncing = true;
    console.log('🔄 开始自动同步数据到Supabase...');

    try {
      // 检查用户认证（支持管理员用户）
      const { data: { user } } = await supabase.auth.getUser();
      let userId: string;
      
      if (user) {
        userId = user.id;
      } else {
        // 检查是否是管理员用户（从AsyncStorage获取）
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.id === 'admin-user-id-12345') {
            userId = parsedUser.id;
            console.log('👤 使用管理员账户进行同步');
          } else {
            console.log('👤 用户未认证，跳过自动同步');
            return { success: false, message: '用户未认证' };
          }
        } else {
          console.log('👤 用户未认证，跳过自动同步');
          return { success: false, message: '用户未认证' };
        }
      }

      let syncedCount = 0;

      // 1. 同步用户数据
      await this.syncUserData(userId);
      syncedCount++;

      // 2. 同步菜谱数据
      const recipes = await this.syncRecipes(userId);
      syncedCount += recipes.length;

      // 3. 同步收藏数据
      await this.syncFavorites(userId);
      syncedCount++;

      // 4. 同步评论数据
      await this.syncComments(userId);
      syncedCount++;

      // 5. 同步社交统计数据
      await this.syncSocialStats(userId);
      syncedCount++;

      // 标记同步完成
      await this.markSyncComplete();

      console.log('✅ 自动同步完成！');
      return { 
        success: true, 
        message: '数据已自动同步到云端',
        syncedCount 
      };

    } catch (error) {
      console.error('❌ 自动同步失败:', error);
      return { 
        success: false, 
        message: `同步失败: ${error.message}` 
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // 同步用户数据
  private static async syncUserData(userId: string): Promise<void> {
    try {
      // 检查用户是否已存在
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingUser) {
        console.log('✅ 用户已存在，跳过用户数据同步');
        return;
      }

      // 获取用户数据
      let userData: any = {};
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        userData = JSON.parse(storedUserData);
      }

      // 如果是管理员用户，使用默认值
      if (userId === 'admin-user-id-12345') {
        userData = {
          name: 'Admin User',
          email: 'admin@admin.com',
          avatar_url: null
        };
      }

      // 创建用户
      await supabase
        .from('users')
        .insert({
          id: userId,
          name: userData.name || 'User',
          email: userData.email || `user-${Date.now()}@app.com`,
          avatar_url: userData.avatar_url || null
        });

      console.log('✅ 用户数据同步完成');
    } catch (error) {
      console.error('❌ 用户数据同步失败:', error);
    }
  }

  // 同步菜谱数据
  private static async syncRecipes(userId: string): Promise<any[]> {
    try {
      const recipesData = await AsyncStorage.getItem('recipes');
      if (!recipesData) return [];

      const recipes = JSON.parse(recipesData);
      const syncedRecipes = [];

      for (const recipe of recipes) {
        try {
          // 检查菜谱是否已存在
          const { data: existingRecipe } = await supabase
            .from('recipes')
            .select('id')
            .eq('title', recipe.title)
            .eq('user_id', userId)
            .single();

          let recipeId;
          if (existingRecipe) {
            // 更新现有菜谱
            const { data: updatedRecipe } = await supabase
              .from('recipes')
              .update({
                description: recipe.description || '',
                image_url: recipe.image || recipe.imageUri || null,
                cooking_time: recipe.cookingTime || recipe.cooking_time || '30分钟',
                servings: parseInt(recipe.servings) || 4,
                cookware: recipe.cookware || '',
                is_public: recipe.isPublic || false,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingRecipe.id)
              .select()
              .single();
            
            recipeId = updatedRecipe.id;
          } else {
            // 创建新菜谱
            const { data: newRecipe } = await supabase
              .from('recipes')
              .insert({
                title: recipe.title || recipe.name || 'Untitled Recipe',
                description: recipe.description || '',
                image_url: recipe.image || recipe.imageUri || null,
                cooking_time: recipe.cookingTime || recipe.cooking_time || '30分钟',
                servings: parseInt(recipe.servings) || 4,
                cookware: recipe.cookware || '',
                is_public: recipe.isPublic || false,
                user_id: userId
              })
              .select()
              .single();
            
            recipeId = newRecipe.id;
          }

          // 同步食材
          if (recipe.ingredients && recipe.ingredients.length > 0) {
            await this.syncIngredients(recipeId, recipe.ingredients);
          }

          // 同步步骤
          if (recipe.instructions && recipe.instructions.length > 0) {
            await this.syncInstructions(recipeId, recipe.instructions);
          }

          // 同步标签
          if (recipe.tags && recipe.tags.length > 0) {
            await this.syncTags(recipeId, recipe.tags);
          }

          syncedRecipes.push({ id: recipeId, title: recipe.title });
          console.log(`✅ 菜谱同步完成: ${recipe.title || recipe.name}`);

        } catch (error) {
          console.error(`❌ 菜谱同步失败: ${recipe.title}`, error);
        }
      }

      return syncedRecipes;
    } catch (error) {
      console.error('❌ 菜谱数据同步失败:', error);
      return [];
    }
  }

  // 同步食材数据
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

      console.log(`✅ 食材同步完成: ${ingredients.length} 个`);
    } catch (error) {
      console.error('❌ 食材同步失败:', error);
    }
  }

  // 同步步骤数据
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

      console.log(`✅ 步骤同步完成: ${instructions.length} 个`);
    } catch (error) {
      console.error('❌ 步骤同步失败:', error);
    }
  }

  // 同步标签数据
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

      console.log(`✅ 标签同步完成: ${tags.length} 个`);
    } catch (error) {
      console.error('❌ 标签同步失败:', error);
    }
  }

  // 同步收藏数据
  private static async syncFavorites(userId: string): Promise<void> {
    try {
      const favoritesData = await AsyncStorage.getItem('favorites');
      if (!favoritesData) return;

      const favorites = JSON.parse(favoritesData);
      
      // 删除现有收藏
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId);

      // 插入新收藏
      const favoritesList = favorites.map((favorite: any) => ({
        user_id: userId,
        recipe_id: favorite.id || favorite.recipeId,
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('favorites')
        .insert(favoritesList);

      console.log(`✅ 收藏同步完成: ${favorites.length} 个`);
    } catch (error) {
      console.error('❌ 收藏同步失败:', error);
    }
  }

  // 同步评论数据
  private static async syncComments(userId: string): Promise<void> {
    try {
      const commentsData = await AsyncStorage.getItem('comments');
      if (!commentsData) return;

      const comments = JSON.parse(commentsData);
      
      for (const [recipeId, recipeComments] of Object.entries(comments)) {
        if (Array.isArray(recipeComments)) {
          for (const comment of recipeComments) {
            await supabase
              .from('comments')
              .insert({
                recipe_id: recipeId,
                user_id: userId,
                content: comment.content || comment.text || '',
                likes_count: comment.likes || 0,
                created_at: comment.createdAt || new Date().toISOString()
              });
          }
        }
      }

      console.log('✅ 评论同步完成');
    } catch (error) {
      console.error('❌ 评论同步失败:', error);
    }
  }

  // 同步社交统计数据
  private static async syncSocialStats(userId: string): Promise<void> {
    try {
      const socialStatsData = await AsyncStorage.getItem('socialStats');
      if (!socialStatsData) return;

      const socialStats = JSON.parse(socialStatsData);
      
      for (const [recipeId, stats] of Object.entries(socialStats)) {
        await supabase
          .from('social_stats')
          .upsert({
            recipe_id: recipeId,
            likes_count: (stats as any).likes || 0,
            favorites_count: (stats as any).favorites || 0,
            tries_count: (stats as any).tries || 0,
            views_count: (stats as any).views || 0,
            updated_at: new Date().toISOString()
          });
      }

      console.log('✅ 社交统计同步完成');
    } catch (error) {
      console.error('❌ 社交统计同步失败:', error);
    }
  }

  // 标记同步完成
  private static async markSyncComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem('syncStatus', JSON.stringify({
        synced: true,
        syncedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ 标记同步状态失败:', error);
    }
  }

  // 检查是否需要同步
  static async needsSync(): Promise<boolean> {
    try {
      const syncStatus = await AsyncStorage.getItem('syncStatus');
      if (!syncStatus) return true;

      const status = JSON.parse(syncStatus);
      return !status.synced;
    } catch (error) {
      return true;
    }
  }

  // 清理AsyncStorage（可选）
  static async cleanupAsyncStorage(): Promise<void> {
    try {
      const keys = ['recipes', 'favorites', 'comments', 'socialStats', 'userData'];
      await AsyncStorage.multiRemove(keys);
      console.log('✅ AsyncStorage清理完成');
    } catch (error) {
      console.error('❌ AsyncStorage清理失败:', error);
    }
  }
}
