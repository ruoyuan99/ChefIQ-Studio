import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { uploadRecipeImage } from './storageService';

// 数据迁移服务
export class DataMigrationService {
  // 迁移所有数据
  static async migrateAllData() {
    console.log('🚀 开始数据迁移...');
    
    try {
      // 1. 迁移用户数据
      const userId = await this.migrateUsers();
      
      if (!userId) {
        console.log('⚠️ 无法获取用户ID，跳过其他数据迁移');
        return { success: false, message: '需要先迁移用户数据' };
      }
      
      // 2. 迁移菜谱数据
      await this.migrateRecipes(userId);
      
      // 3. 迁移收藏数据
      await this.migrateFavorites(userId);
      
      // 4. 迁移评论数据
      await this.migrateComments(userId);
      
      // 5. 迁移社交统计数据
      await this.migrateSocialStats(userId);
      
      console.log('✅ 数据迁移完成！');
      return { success: true, message: '所有数据迁移成功' };
      
    } catch (error: any) {
      console.error('❌ 数据迁移失败:', error);
      return { success: false, message: `迁移失败: ${error?.message || 'Unknown error'}` };
    }
  }

  // 迁移用户数据
  static async migrateUsers() {
    console.log('👤 迁移用户数据...');
    
    try {
      // 从AsyncStorage获取用户数据
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        console.log('📝 没有用户数据需要迁移');
        return null;
      }

      const user = JSON.parse(userData);
      
      // 检查当前是否有认证用户
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('👤 用户未认证，跳过用户数据迁移');
        return null;
      }

      // 检查用户是否已存在
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();

      if (existingUser) {
        console.log('👤 用户已存在，跳过迁移');
        return authUser.id;
      }

      // 创建用户资料
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email || user.email || `user-${Date.now()}@migrated.com`,
          name: user.name || authUser.user_metadata?.name || 'Migrated User',
          avatar_url: user.avatar_url || authUser.user_metadata?.avatar_url || null
        })
        .select()
        .single();

      if (error) {
        throw new Error(`用户创建失败: ${error.message}`);
      }

      console.log('✅ 用户数据迁移成功:', newUser.id);
      return newUser.id;
      
    } catch (error) {
      console.error('❌ 用户数据迁移失败:', error);
      throw error;
    }
  }

  // 迁移菜谱数据
  static async migrateRecipes(userId: string) {
    console.log('🍳 迁移菜谱数据...');
    
    try {
      // 从AsyncStorage获取菜谱数据
      const recipesData = await AsyncStorage.getItem('recipes');
      if (!recipesData) {
        console.log('📝 没有菜谱数据需要迁移');
        return [];
      }

      const recipes = JSON.parse(recipesData);
      const migratedRecipes = [];

      for (const recipe of recipes) {
        try {
          // 创建菜谱
          const { data: newRecipe, error: recipeError } = await supabase
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

          if (recipeError) {
            console.error(`❌ 菜谱创建失败: ${recipe.title}`, recipeError.message);
            continue;
          }

          // 迁移食材
          if (recipe.ingredients && recipe.ingredients.length > 0) {
            await this.migrateIngredients(newRecipe.id, recipe.ingredients);
          }

          // 迁移步骤
          if (recipe.instructions && recipe.instructions.length > 0) {
            await this.migrateInstructions(newRecipe.id, recipe.instructions);
          }

          // 迁移标签
          if (recipe.tags && recipe.tags.length > 0) {
            await this.migrateTags(newRecipe.id, recipe.tags);
          }

          migratedRecipes.push(newRecipe);
          console.log(`✅ 菜谱迁移成功: ${recipe.title || recipe.name || 'Untitled Recipe'}`);

        } catch (error) {
          console.error(`❌ 菜谱迁移失败: ${recipe.title}`, error);
        }
      }

      console.log(`✅ 菜谱数据迁移完成: ${migratedRecipes.length} 个菜谱`);
      return migratedRecipes;

    } catch (error) {
      console.error('❌ 菜谱数据迁移失败:', error);
      throw error;
    }
  }

  // 迁移食材数据
  static async migrateIngredients(recipeId: string, ingredients: any[]) {
    try {
      const ingredientsData = ingredients.map((ingredient, index) => ({
        recipe_id: recipeId,
        name: ingredient.name || ingredient.ingredient || 'Unknown',
        amount: ingredient.amount || ingredient.quantity || '1',
        unit: ingredient.unit || '个'
      }));

      const { error } = await supabase
        .from('ingredients')
        .insert(ingredientsData);

      if (error) {
        throw new Error(`食材创建失败: ${error.message}`);
      }

    } catch (error) {
      console.error('❌ 食材数据迁移失败:', error);
      throw error;
    }
  }

  // 迁移步骤数据
  static async migrateInstructions(recipeId: string, instructions: any[]) {
    try {
      const instructionsData = instructions.map((instruction, index) => ({
        recipe_id: recipeId,
        step_number: instruction.step || instruction.step_number || (index + 1),
        description: instruction.description || instruction.step || instruction.text || 'No description',
        image_url: instruction.image || instruction.imageUri || null
      }));

      const { error } = await supabase
        .from('instructions')
        .insert(instructionsData);

      if (error) {
        throw new Error(`步骤创建失败: ${error.message}`);
      }

    } catch (error) {
      console.error('❌ 步骤数据迁移失败:', error);
      throw error;
    }
  }

  // 迁移标签数据
  static async migrateTags(recipeId: string, tags: string[]) {
    try {
      const tagsData = tags.map(tag => ({
        recipe_id: recipeId,
        tag_name: tag
      }));

      const { error } = await supabase
        .from('tags')
        .insert(tagsData);

      if (error) {
        throw new Error(`标签创建失败: ${error.message}`);
      }

    } catch (error) {
      console.error('❌ 标签数据迁移失败:', error);
      throw error;
    }
  }

  // 迁移收藏数据
  static async migrateFavorites(userId: string) {
    console.log('❤️ 迁移收藏数据...');
    
    try {
      const favoritesData = await AsyncStorage.getItem('favorites');
      if (!favoritesData) {
        console.log('📝 没有收藏数据需要迁移');
        return;
      }

      const favorites = JSON.parse(favoritesData);
      
      // 获取所有菜谱ID映射
      const { data: recipes } = await supabase
        .from('recipes')
        .select('id, title')
        .eq('user_id', userId);

      const recipeMap = new Map(recipes?.map(r => [r.title, r.id]) || []);

      const favoritesDataToInsert = favorites
        .filter((fav: any) => recipeMap.has(fav.title))
        .map((fav: any) => ({
          user_id: userId,
          recipe_id: recipeMap.get(fav.title)
        }));

      if (favoritesDataToInsert.length > 0) {
        const { error } = await supabase
          .from('favorites')
          .insert(favoritesDataToInsert);

        if (error) {
          throw new Error(`收藏创建失败: ${error.message}`);
        }
      }

      console.log(`✅ 收藏数据迁移完成: ${favoritesDataToInsert.length} 个收藏`);

    } catch (error) {
      console.error('❌ 收藏数据迁移失败:', error);
      throw error;
    }
  }

  // 迁移评论数据
  static async migrateComments(userId: string) {
    console.log('💬 迁移评论数据...');
    
    try {
      const commentsData = await AsyncStorage.getItem('comments');
      if (!commentsData) {
        console.log('📝 没有评论数据需要迁移');
        return;
      }

      const comments = JSON.parse(commentsData);
      
      // 获取所有菜谱ID映射
      const { data: recipes } = await supabase
        .from('recipes')
        .select('id, title')
        .eq('user_id', userId);

      const recipeMap = new Map(recipes?.map(r => [r.title, r.id]) || []);

      for (const comment of comments) {
        const recipeId = recipeMap.get(comment.recipeTitle);
        if (!recipeId) continue;

        const { error } = await supabase
          .from('comments')
          .insert({
            recipe_id: recipeId,
            user_id: userId,
            content: comment.content || comment.text || '',
            likes_count: comment.likes || 0
          });

        if (error) {
          console.error(`❌ 评论创建失败: ${comment.content}`, error.message);
        }
      }

      console.log('✅ 评论数据迁移完成');

    } catch (error) {
      console.error('❌ 评论数据迁移失败:', error);
      throw error;
    }
  }

  // 迁移社交统计数据
  static async migrateSocialStats(userId: string) {
    console.log('📊 迁移社交统计数据...');
    
    try {
      const socialStatsData = await AsyncStorage.getItem('socialStats');
      if (!socialStatsData) {
        console.log('📝 没有社交统计数据需要迁移');
        return;
      }

      const socialStats = JSON.parse(socialStatsData);
      console.log(`📝 社交统计数据已记录: ${Object.keys(socialStats).length} 个菜谱的统计`);
      console.log('📝 注意: 由于RLS策略限制，实际数据迁移需要在用户认证后进行');

    } catch (error) {
      console.error('❌ 社交统计数据迁移失败:', error);
      throw error;
    }
  }

  // 上传本地菜谱图片到 Supabase Storage 并回填 recipes.image_url
  static async migrateRecipeImages(): Promise<{ success: boolean; uploaded: number; skipped: number; message: string }> {
    try {
      // 获取当前用户
      const { data: authData } = await supabase.auth.getUser();
      let userId: string | null = authData?.user?.id || null;
      if (!userId) {
        // 支持管理员账号离线登录
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u?.id) userId = u.id;
        }
      }
      if (!userId) {
        return { success: false, uploaded: 0, skipped: 0, message: 'User not authenticated' };
      }

      // 读取本地菜谱
      const recipesData = await AsyncStorage.getItem('recipes');
      if (!recipesData) {
        return { success: true, uploaded: 0, skipped: 0, message: 'No local recipes' };
      }
      const localRecipes = JSON.parse(recipesData);
      let uploaded = 0;
      let skipped = 0;

      for (const r of localRecipes) {
        const candidate = r?.image_url || r?.imageUri || r?.image;
        if (!candidate || (typeof candidate === 'string' && (candidate.startsWith('http://') || candidate.startsWith('https://')))) {
          skipped += 1;
          continue;
        }

        // 找到 Supabase 中对应的菜谱（按 title + user_id 匹配）
        const { data: found, error: findErr } = await supabase
          .from('recipes')
          .select('id, image_url')
          .eq('title', r.title || r.name)
          .eq('user_id', userId)
          .maybeSingle();
        if (findErr || !found) {
          skipped += 1;
          continue;
        }
        if (found.image_url) {
          skipped += 1;
          continue;
        }

        try {
          // 上传并更新 image_url
          const publicUrl = await uploadRecipeImage(candidate as string, userId);
          const { error: updateErr } = await supabase
            .from('recipes')
            .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
            .eq('id', found.id);
          if (!updateErr) {
            uploaded += 1;
          } else {
            skipped += 1;
          }
        } catch (_) {
          skipped += 1;
        }
      }

      return { success: true, uploaded, skipped, message: `Uploaded ${uploaded}, skipped ${skipped}` };
    } catch (e: any) {
      return { success: false, uploaded: 0, skipped: 0, message: e?.message || 'Image migration failed' };
    }
  }

  // 检查迁移状态
  static async checkMigrationStatus() {
    try {
      const migrationStatus = await AsyncStorage.getItem('migrationStatus');
      return migrationStatus ? JSON.parse(migrationStatus) : { migrated: false };
    } catch (error) {
      console.error('❌ 检查迁移状态失败:', error);
      return { migrated: false };
    }
  }

  // 标记迁移完成
  static async markMigrationComplete() {
    try {
      await AsyncStorage.setItem('migrationStatus', JSON.stringify({
        migrated: true,
        migratedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ 标记迁移完成失败:', error);
    }
  }

  // 清理AsyncStorage数据（可选）
  static async cleanupAsyncStorage() {
    try {
      const keysToRemove = [
        'recipes',
        'favorites',
        'comments',
        'socialStats',
        'userData'
      ];

      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ AsyncStorage数据清理完成');
    } catch (error) {
      console.error('❌ AsyncStorage数据清理失败:', error);
    }
  }
}
