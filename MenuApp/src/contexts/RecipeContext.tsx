import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, MenuItem } from '../types';
import { AutoSyncService } from '../services/autoSyncService';
import { CloudRecipeService } from '../services/cloudRecipeService';
import { RealTimeSyncService } from '../services/realTimeSyncService';
import { useAuth } from './AuthContext';
import * as Crypto from 'expo-crypto';

// Helper function to generate UUID
function generateUUID(): string {
  // Use expo-crypto if available
  try {
    if (Crypto && typeof Crypto.randomUUID === 'function') {
      return Crypto.randomUUID();
    }
  } catch (e) {
    console.warn('expo-crypto randomUUID not available, using fallback');
  }
  
  // Fallback: generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface RecipeState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  loading: boolean;
}

type RecipeAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RECIPES'; payload: Recipe[] }
  | { type: 'ADD_RECIPE'; payload: Recipe }
  | { type: 'UPDATE_RECIPE'; payload: Recipe }
  | { type: 'DELETE_RECIPE'; payload: string }
  | { type: 'SET_CURRENT_RECIPE'; payload: Recipe | null }
  | { type: 'UPDATE_RECIPE_ID'; payload: { oldId: string; newId: string; recipe: Recipe } };

const initialState: RecipeState = {
  recipes: [],
  currentRecipe: null,
  loading: false,
};

const recipeReducer = (state: RecipeState, action: RecipeAction): RecipeState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_RECIPES':
      return { ...state, recipes: action.payload };
    case 'ADD_RECIPE':
      return { ...state, recipes: [...state.recipes, action.payload] };
    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map(recipe =>
          recipe.id === action.payload.id ? action.payload : recipe
        ),
      };
    case 'DELETE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.filter(recipe => recipe.id !== action.payload),
      };
    case 'SET_CURRENT_RECIPE':
      return { ...state, currentRecipe: action.payload };
    case 'UPDATE_RECIPE_ID':
      // 检查是否已经存在新ID的recipe，避免重复添加
      const existingWithNewId = state.recipes.find(r => r.id === action.payload.newId);
      if (!existingWithNewId) {
        // 先删除旧的，再添加新的
        const filteredRecipes = state.recipes.filter(r => r.id !== action.payload.oldId);
        return { ...state, recipes: [...filteredRecipes, action.payload.recipe] };
      } else {
        // 如果已经存在新ID的recipe，只删除旧ID的recipe
        return {
          ...state,
          recipes: state.recipes.filter(r => r.id !== action.payload.oldId)
        };
      }
    default:
      return state;
  }
};

interface RecipeContextType {
  state: RecipeState;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Recipe>;
  updateRecipe: (recipe: Recipe) => Promise<Recipe | null>;
  deleteRecipe: (recipeId: string) => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  getRecipeById: (recipeId: string) => Recipe | undefined;
  reloadRecipes: () => Promise<void>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(recipeReducer, initialState);
  const { user } = useAuth();
  const previousUserIdRef = useRef<string | null>(null);

  // 自动同步数据到Supabase
  useEffect(() => {
    if (user?.id && previousUserIdRef.current !== user.id) {
      AsyncStorage.removeItem('recipes').catch(console.error);
      dispatch({ type: 'SET_RECIPES', payload: [] });
    }
    if (!user && previousUserIdRef.current) {
      dispatch({ type: 'SET_RECIPES', payload: [] });
    }
    previousUserIdRef.current = user?.id || null;

    const autoSync = async () => {
      if (user) {
        try {
          console.log('🔄 User logged in, starting automatic data sync...');
          const needsSync = await AutoSyncService.needsSync();
          
          if (needsSync) {
            console.log('📤 Local data detected, starting sync to Supabase...');
            const result = await AutoSyncService.syncAllDataToSupabase();
            
            if (result.success) {
              console.log('✅ Automatic sync completed:', result.message);
              
              // 验证数据已成功同步到数据库后，清除所有同类的历史数据
              setTimeout(async () => {
                try {
                  // 验证菜谱数据已在数据库中
                  const cloudRecipes = await CloudRecipeService.fetchUserRecipes(user.id);
                  
                  // 如果数据库中有菜谱数据，说明同步成功，清除所有本地 AsyncStorage 中的菜谱数据（包括历史数据）
                  if (cloudRecipes && cloudRecipes.length > 0) {
                    await AsyncStorage.removeItem('recipes');
                    console.log('✅ Cleared all recipes from AsyncStorage after successful sync (including historical data)');
                  }
                } catch (error) {
                  console.error('Error verifying sync and clearing AsyncStorage:', error);
                }
              }, 2000); // 延迟 2 秒确保数据库已更新
            } else {
              console.log('⚠️ Automatic sync failed:', result.message);
            }
          } else {
            console.log('✅ Data already synced, no need to sync again');
          }

          // Pull from cloud and overwrite as authoritative data
          try {
            const cloudRecipes = await CloudRecipeService.fetchUserRecipes(user.id);
            console.log('☁️ Loaded recipes from cloud:', cloudRecipes.length);
            dispatch({ type: 'SET_RECIPES', payload: cloudRecipes });
          } catch (e) {
            console.error('❌ Failed to load recipes from cloud:', e);
          }
        } catch (error) {
          console.error('❌ Automatic sync error:', error);
        }
      }
    };

    autoSync();
  }, [user]);

  // 未登录时，从本地缓存加载（离线/首次）
  useEffect(() => {
    if (!user) {
      const loadRecipes = async () => {
        try {
          const storedRecipes = await AsyncStorage.getItem('recipes');
          if (storedRecipes) {
            const recipes = JSON.parse(storedRecipes);
            const parsedRecipes = recipes.map((recipe: any) => ({
              ...recipe,
              createdAt: new Date(recipe.createdAt),
              updatedAt: new Date(recipe.updatedAt),
            }));
            dispatch({ type: 'SET_RECIPES', payload: parsedRecipes });
          }
        } catch (error) {
          console.error('Failed to load recipes from storage', error);
        }
      };
      loadRecipes();
    }
  }, [user]);

  // 保存recipes到AsyncStorage
  useEffect(() => {
    const saveRecipes = async () => {
      if (state.recipes.length > 0) {
        try {
          // 转换Date对象为字符串，以便JSON序列化
          const recipesToSave = state.recipes.map(recipe => ({
            ...recipe,
            createdAt: recipe.createdAt.toISOString(),
            updatedAt: recipe.updatedAt.toISOString(),
          }));
          await AsyncStorage.setItem('recipes', JSON.stringify(recipesToSave));
          console.log('Recipes saved to storage:', recipesToSave.length);
        } catch (error) {
          console.error('Failed to save recipes to storage', error);
        }
      }
    };
    saveRecipes();
  }, [state.recipes]);

  const addRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Generate UUID locally before creating recipe
    // Ensure we never use sample recipe IDs (sample_1, sample_2, etc.)
    let recipeId = generateUUID();
    
    // Safety check: if somehow a sample ID was passed, generate a new UUID
    if (recipeId.startsWith('sample_')) {
      console.warn('⚠️ Generated ID starts with "sample_", regenerating...');
      recipeId = generateUUID();
    }
    
    const newRecipe: Recipe = {
      ...recipeData,
      id: recipeId, // Use UUID instead of timestamp
      createdAt: new Date(),
      updatedAt: new Date(),
      authorName: user?.name || (user?.email ? user.email.split('@')[0] : 'Chef'),
      authorAvatar: user?.avatar_url || null,
    };
    
    console.log('RecipeContext - Adding recipe with UUID:', {
      id: newRecipe.id,
      title: newRecipe.title,
      ingredients: newRecipe.ingredients?.length || 0,
      instructions: newRecipe.instructions?.length || 0,
      imageUri: newRecipe.imageUri ? 'Has image' : 'No image'
    });
    
    // 详细调试信息
    console.log('RecipeContext - Full newRecipe object:', JSON.stringify(newRecipe, null, 2));
    console.log('RecipeContext - Ingredients details:', newRecipe.ingredients);
    console.log('RecipeContext - Instructions details:', newRecipe.instructions);
    
    dispatch({ type: 'ADD_RECIPE', payload: newRecipe });
    
    // 实时同步到Supabase（使用本地生成的UUID）
    // 由于ID已经是UUID，不需要更新ID了
    if (user) {
      RealTimeSyncService.syncRecipe(newRecipe, user.id)
        .then((dbRecipeId) => {
          console.log('✅ Sync completed, database recipe ID:', dbRecipeId);
          // Note: dbRecipeId should match newRecipe.id since we're using the same UUID
          if (dbRecipeId && dbRecipeId !== newRecipe.id) {
            console.warn('⚠️ Database returned ID does not match local UUID:', {
              local: newRecipe.id,
              database: dbRecipeId
            });
          }
          
          // After sync completes, refresh data from cloud (with delay to ensure DB is updated)
          setTimeout(async () => {
            try {
              const cloudRecipes = await CloudRecipeService.fetchUserRecipes(user.id);
              console.log('☁️ Loaded recipes from cloud after sync:', cloudRecipes.length);
              dispatch({ type: 'SET_RECIPES', payload: cloudRecipes });
              
              // After verifying data is successfully saved to database, clear all recipe data from AsyncStorage
              if (cloudRecipes && cloudRecipes.length > 0) {
                await AsyncStorage.removeItem('recipes');
                console.log('✅ Cleared all recipes from AsyncStorage after successful sync');
              }
            } catch (e) {
              console.error('❌ Failed to load recipes from cloud after sync:', e);
            }
          }, 1000); // 1 second delay to ensure DB is updated
        })
        .catch(error => {
          console.error('❌ Failed to sync to Supabase:', error);
          // 即使同步失败，也继续返回 recipe，因为本地已保存
        });
    }
    
    return newRecipe; // 返回创建的recipe对象（ID是UUID，不会改变）
  };

  const updateRecipe = async (recipe: Recipe): Promise<Recipe | null> => {
    const updatedRecipe = { ...recipe, updatedAt: new Date() };
    dispatch({ type: 'UPDATE_RECIPE', payload: updatedRecipe });
    
    // 实时同步到Supabase（等待完成，确保数据保存成功）
    if (user) {
      try {
        const syncedRecipe = await RealTimeSyncService.syncRecipe(updatedRecipe, user.id);
          console.log('✅ Update sync completed, refreshing data from cloud');
        
        // If syncRecipe returned updated recipe data, use it
        if (syncedRecipe && typeof syncedRecipe === 'object' && 'image_url' in syncedRecipe) {
          // Update local state with synced recipe (includes new image_url)
          dispatch({ type: 'UPDATE_RECIPE', payload: syncedRecipe as Recipe });
          
          // Refresh data from cloud to ensure consistency
          setTimeout(async () => {
            try {
              const cloudRecipes = await CloudRecipeService.fetchUserRecipes(user.id);
              console.log('☁️ Loaded recipes from cloud after update:', cloudRecipes.length);
              dispatch({ type: 'SET_RECIPES', payload: cloudRecipes });
            } catch (e) {
              console.error('❌ Failed to load recipes from cloud after update:', e);
            }
          }, 500); // Reduced delay since we already have the updated data
          
          return syncedRecipe as Recipe;
        }
        
        // Fallback: refresh from cloud after delay and return updated recipe
        return new Promise<Recipe | null>((resolve) => {
          setTimeout(async () => {
            try {
              const cloudRecipes = await CloudRecipeService.fetchUserRecipes(user.id);
              console.log('☁️ Loaded recipes from cloud after update:', cloudRecipes.length);
              dispatch({ type: 'SET_RECIPES', payload: cloudRecipes });
              
              // Find and return the updated recipe
              const foundRecipe = cloudRecipes.find(r => r.id === recipe.id);
              if (foundRecipe) {
                resolve(foundRecipe);
              } else {
                resolve(updatedRecipe);
              }
            } catch (e) {
              console.error('❌ Failed to load recipes from cloud after update:', e);
              resolve(updatedRecipe);
            }
          }, 1500); // Increased to 1500ms to ensure image upload and DB update are complete
        });
      } catch (error) {
          console.error('❌ Failed to sync update to Supabase:', error);
        return updatedRecipe;
    }
    }
    
    return updatedRecipe;
  };

  const deleteRecipe = (recipeId: string) => {
    const recipe = state.recipes.find(r => r.id === recipeId);
    dispatch({ type: 'DELETE_RECIPE', payload: recipeId });

    // 同步删除到 Supabase（基于菜谱ID）
    if (user && recipeId) {
      RealTimeSyncService.deleteRecipeById(recipeId);
    }
  };

  const setCurrentRecipe = (recipe: Recipe | null) => {
    dispatch({ type: 'SET_CURRENT_RECIPE', payload: recipe });
  };

  const getRecipeById = (recipeId: string) => {
    return state.recipes.find(recipe => recipe.id === recipeId);
  };

  const reloadRecipes = async () => {
    if (user?.id) {
      try {
        console.log('🔄 Reloading recipes from cloud...');
        const cloudRecipes = await CloudRecipeService.fetchUserRecipes(user.id);
        console.log('☁️ Reloaded recipes from cloud:', cloudRecipes.length);
        dispatch({ type: 'SET_RECIPES', payload: cloudRecipes });
      } catch (error) {
        console.error('❌ Failed to reload recipes:', error);
      }
    }
  };

  const value: RecipeContextType = {
    state,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    setCurrentRecipe,
    getRecipeById,
    reloadRecipes,
  };

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
};

export const useRecipe = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
};
