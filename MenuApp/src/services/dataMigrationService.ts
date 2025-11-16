import AsyncStorage from '@react-native-async-storage/async-storage';
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

// 数据迁移服务
export class DataMigrationService {
  // 迁移所有数据
  static async migrateAllData() {
    console.log('🚀 Starting data migration...');
    
    try {
      // 1. Migrate user data
      const userId = await this.migrateUsers();
      
      if (!userId) {
        console.log('⚠️ Unable to get user ID, skipping other data migration');
        return { success: false, message: 'Need to migrate user data first' };
      }
      
      // 2. Migrate recipe data
      await this.migrateRecipes(userId);
      
      // 3. Migrate favorites data
      await this.migrateFavorites(userId);
      
      // 4. Migrate comments data
      await this.migrateComments(userId);
      
      // 5. Migrate social stats data
      await this.migrateSocialStats(userId);
      
      console.log('✅ Data migration completed!');
      return { success: true, message: 'All data migration succeeded' };
      
    } catch (error: any) {
      console.error('❌ Data migration failed:', error);
      return { success: false, message: `迁移失败: ${error?.message || 'Unknown error'}` };
    }
  }

  // 迁移用户数据
  static async migrateUsers() {
    console.log('👤 Migrating user data...');
    
    try {
      // Get user data from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        console.log('📝 No user data to migrate');
        return null;
      }

      const user = JSON.parse(userData);
      
      // Check if there is an authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('👤 User not authenticated, skipping user data migration');
        return null;
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();

      if (existingUser) {
        console.log('👤 User already exists, skipping migration');
        return authUser.id;
      }

      // Create user profile
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
        throw new Error(`User creation failed: ${error.message}`);
      }

      console.log('✅ User data migration succeeded:', newUser.id);
      return newUser.id;
      
    } catch (error) {
      console.error('❌ User data migration failed:', error);
      throw error;
    }
  }

  // 迁移菜谱数据
  static async migrateRecipes(userId: string) {
    console.log('🍳 Migrating recipe data...');
    
    try {
      // Get recipe data from AsyncStorage
      const recipesData = await AsyncStorage.getItem('recipes');
      if (!recipesData) {
        console.log('📝 No recipe data to migrate');
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
              cooking_time: toCookingTimeMinutes(recipe.cookingTime || recipe.cooking_time) ?? 30,
              servings: parseInt(recipe.servings) || 4,
              cookware: recipe.cookware || '',
              is_public: recipe.isPublic || false,
              user_id: userId
            })
            .select()
            .single();

          if (recipeError) {
            console.error(`❌ Recipe creation failed: ${recipe.title}`, recipeError.message);
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
          console.log(`✅ Recipe migration succeeded: ${recipe.title || recipe.name || 'Untitled Recipe'}`);

        } catch (error) {
          console.error(`❌ Recipe migration failed: ${recipe.title}`, error);
        }
      }

      console.log(`✅ Recipe data migration completed: ${migratedRecipes.length} recipes`);
      return migratedRecipes;

    } catch (error) {
      console.error('❌ Recipe data migration failed:', error);
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
        throw new Error(`Ingredient creation failed: ${error.message}`);
      }

    } catch (error) {
      console.error('❌ Ingredients data migration failed:', error);
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
        throw new Error(`Instruction creation failed: ${error.message}`);
      }

    } catch (error) {
      console.error('❌ Instructions data migration failed:', error);
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
        throw new Error(`Tag creation failed: ${error.message}`);
      }

    } catch (error) {
      console.error('❌ Tags data migration failed:', error);
      throw error;
    }
  }

  // 迁移收藏数据
  static async migrateFavorites(userId: string) {
    console.log('❤️ Migrating favorites data...');
    
    try {
      const favoritesData = await AsyncStorage.getItem('favorites');
      if (!favoritesData) {
        console.log('📝 No favorites data to migrate');
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
          throw new Error(`Favorite creation failed: ${error.message}`);
        }
      }

      console.log(`✅ Favorites data migration completed: ${favoritesDataToInsert.length} favorites`);

    } catch (error) {
      console.error('❌ Favorites data migration failed:', error);
      throw error;
    }
  }

  // 迁移评论数据
  static async migrateComments(userId: string) {
    console.log('💬 Migrating comments data...');
    
    try {
      const commentsData = await AsyncStorage.getItem('comments');
      if (!commentsData) {
        console.log('📝 No comments data to migrate');
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
          console.error(`❌ Comment creation failed: ${comment.content}`, error.message);
        }
      }

      console.log('✅ Comments data migration completed');

    } catch (error) {
      console.error('❌ Comments data migration failed:', error);
      throw error;
    }
  }

  // 迁移社交统计数据
  static async migrateSocialStats(userId: string) {
    console.log('📊 Migrating social stats data...');
    
    try {
      const socialStatsData = await AsyncStorage.getItem('socialStats');
      if (!socialStatsData) {
        console.log('📝 No social stats data to migrate');
        return;
      }

      const socialStats = JSON.parse(socialStatsData);
      console.log(`📝 Social stats data recorded: ${Object.keys(socialStats).length} recipe stats`);
      console.log('📝 Note: Due to RLS policy restrictions, actual data migration needs to be done after user authentication');

    } catch (error) {
      console.error('❌ Social stats data migration failed:', error);
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
      console.error('❌ Failed to check migration status:', error);
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
      console.error('❌ Failed to mark migration complete:', error);
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
      console.log('✅ AsyncStorage data cleanup completed');
    } catch (error) {
      console.error('❌ AsyncStorage data cleanup failed:', error);
    }
  }
}
