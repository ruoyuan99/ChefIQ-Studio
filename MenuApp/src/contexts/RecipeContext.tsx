import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, MenuItem } from '../types';
import { AutoSyncService } from '../services/autoSyncService';
import { CloudRecipeService } from '../services/cloudRecipeService';
import { RealTimeSyncService } from '../services/realTimeSyncService';
import { useAuth } from './AuthContext';

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
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Recipe;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (recipeId: string) => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  getRecipeById: (recipeId: string) => Recipe | undefined;
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
          console.log('🔄 用户已登录，开始自动同步数据...');
          const needsSync = await AutoSyncService.needsSync();
          
          if (needsSync) {
            console.log('📤 检测到本地数据，开始同步到Supabase...');
            const result = await AutoSyncService.syncAllDataToSupabase();
            
            if (result.success) {
              console.log('✅ 自动同步完成:', result.message);
              
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
              console.log('⚠️ 自动同步失败:', result.message);
            }
          } else {
            console.log('✅ 数据已同步，无需重复同步');
          }

          // 从云端拉取并覆盖为权威数据
          try {
            const cloudRecipes = await CloudRecipeService.fetchUserRecipes(user.id);
            console.log('☁️ 从云端加载菜谱:', cloudRecipes.length);
            dispatch({ type: 'SET_RECIPES', payload: cloudRecipes });
          } catch (e) {
            console.error('❌ 加载云端菜谱失败:', e);
          }
        } catch (error) {
          console.error('❌ 自动同步出错:', error);
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

  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      authorName: user?.name || (user?.email ? user.email.split('@')[0] : 'Chef'),
      authorAvatar: user?.avatar_url || null,
    };
    
    console.log('RecipeContext - Adding recipe:', {
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
    
    // 实时同步到Supabase（等待完成，确保数据保存成功）
    // 注意：同步是异步的，但我们需要立即返回recipe对象
    // 所以先返回本地recipe，然后异步更新ID
    if (user) {
      const originalLocalId = newRecipe.id; // 保存原始本地ID
      RealTimeSyncService.syncRecipe(newRecipe, user.id)
        .then((dbRecipeId) => {
          console.log('✅ 同步完成，数据库recipe ID:', dbRecipeId);
          
          // 如果返回了数据库ID，更新本地recipe的ID
          if (dbRecipeId && typeof dbRecipeId === 'string' && dbRecipeId !== originalLocalId) {
            console.log('🔄 更新本地recipe ID:', originalLocalId, '->', dbRecipeId);
            // 使用新的 action type 来更新 recipe ID，reducer 会检查重复
            const updatedRecipe = { ...newRecipe, id: dbRecipeId };
            dispatch({ 
              type: 'UPDATE_RECIPE_ID', 
              payload: { 
                oldId: originalLocalId, 
                newId: dbRecipeId, 
                recipe: updatedRecipe 
              } 
            });
            // 更新返回的recipe对象的引用（这样调用者也能获取到新ID）
            newRecipe.id = dbRecipeId;
          }
          
          // 同步完成后，从云端刷新数据（延迟一下确保数据库已更新）
          setTimeout(async () => {
            try {
              const cloudRecipes = await CloudRecipeService.fetchUserRecipes(user.id);
              console.log('☁️ 同步后从云端加载菜谱:', cloudRecipes.length);
              dispatch({ type: 'SET_RECIPES', payload: cloudRecipes });
              
              // 验证数据已成功保存到数据库后，清除所有 AsyncStorage 中的菜谱数据
              if (cloudRecipes && cloudRecipes.length > 0) {
                await AsyncStorage.removeItem('recipes');
                console.log('✅ Cleared all recipes from AsyncStorage after successful sync');
              }
            } catch (e) {
              console.error('❌ 同步后加载云端菜谱失败:', e);
            }
          }, 1000); // 延迟1秒确保数据库已更新
        })
        .catch(error => {
          console.error('❌ 同步到Supabase失败:', error);
          // 即使同步失败，也继续返回 recipe，因为本地已保存
        });
    }
    
    return newRecipe; // 返回创建的recipe对象（ID可能会在同步后更新）
  };

  const updateRecipe = (recipe: Recipe) => {
    const updatedRecipe = { ...recipe, updatedAt: new Date() };
    dispatch({ type: 'UPDATE_RECIPE', payload: updatedRecipe });
    
    // 实时同步到Supabase（等待完成，确保数据保存成功）
    if (user) {
      RealTimeSyncService.syncRecipe(updatedRecipe, user.id)
        .then(() => {
          console.log('✅ 更新同步完成，从云端刷新数据');
          // 同步完成后，从云端刷新数据（延迟一下确保数据库已更新）
          setTimeout(async () => {
            try {
              const cloudRecipes = await CloudRecipeService.fetchUserRecipes(user.id);
              console.log('☁️ 更新后从云端加载菜谱:', cloudRecipes.length);
              dispatch({ type: 'SET_RECIPES', payload: cloudRecipes });
            } catch (e) {
              console.error('❌ 更新后加载云端菜谱失败:', e);
            }
          }, 500); // 延迟500ms确保数据库已更新
        })
        .catch(error => {
          console.error('❌ 更新同步到Supabase失败:', error);
        });
    }
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

  const value: RecipeContextType = {
    state,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    setCurrentRecipe,
    getRecipeById,
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
