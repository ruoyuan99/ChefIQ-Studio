import React, { createContext, useReducer, useContext, ReactNode, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { clearAllDailyCheckin } from '../utils/clearDailyCheckin';
import { clearAllPointsActivities } from '../utils/clearAllPointsActivities';

export interface PointsActivity {
  id: string;
  type: 'create_recipe' | 'try_recipe' | 'favorite_recipe' | 'like_recipe' | 'share_recipe' | 'complete_profile' | 'add_comment' | 'daily_checkin' | 'complete_survey' | 'recipe_liked_by_others' | 'recipe_favorited_by_others' | 'recipe_tried_by_others';
  points: number;
  description: string;
  timestamp: Date;
  recipeId?: string;
}

interface PointsState {
  totalPoints: number;
  activities: PointsActivity[];
  level: number;
  pointsToNextLevel: number;
}

type PointsAction =
  | { type: 'ADD_POINTS'; payload: PointsActivity }
  | { type: 'SET_POINTS'; payload: { totalPoints: number; activities: PointsActivity[] } }
  | { type: 'RESET_POINTS' };

const initialState: PointsState = {
  totalPoints: 0,
  activities: [],
  level: 1,
  pointsToNextLevel: 100,
};

// Points rules
export const POINTS_RULES = {
  create_recipe: 50,
  try_recipe: 20,
  favorite_recipe: 10,
  like_recipe: 5,
  share_recipe: 15,
  complete_profile: 25,
  add_comment: 8,
  daily_checkin: 15,
  complete_survey: 10, // 完成烹饪后Survey (5-10分，取上限10分以提升填写率)
  recipe_liked_by_others: 1, // 被点赞 (每日上限10分)
  recipe_favorited_by_others: 2, // 被收藏 (每日上限10分)
  recipe_tried_by_others: 3, // 被尝试 (每日上限10分)
};

// Daily limits for creator rewards
export const DAILY_LIMITS = {
  recipe_liked_by_others: 10, // 每日最多10次被点赞 = 10分
  recipe_favorited_by_others: 5, // 每日最多5次被收藏 = 10分
  recipe_tried_by_others: 3, // 每日最多3次被尝试 = 9分 (接近10分)
};

// Level system
const LEVEL_THRESHOLDS = [
  { level: 1, points: 0 },
  { level: 2, points: 100 },
  { level: 3, points: 250 },
  { level: 4, points: 500 },
  { level: 5, points: 1000 },
  { level: 6, points: 2000 },
  { level: 7, points: 3500 },
  { level: 8, points: 5000 },
  { level: 9, points: 7500 },
  { level: 10, points: 10000 },
];

const pointsReducer = (state: PointsState, action: PointsAction): PointsState => {
  switch (action.type) {
    case 'ADD_POINTS':
      const newTotalPoints = state.totalPoints + action.payload.points;
      const newLevel = calculateLevel(newTotalPoints);
      const newPointsToNextLevel = calculatePointsToNextLevel(newTotalPoints, newLevel);
      
      return {
        ...state,
        totalPoints: newTotalPoints,
        activities: [...state.activities, action.payload],
        level: newLevel,
        pointsToNextLevel: newPointsToNextLevel,
      };
    case 'SET_POINTS':
      const level = calculateLevel(action.payload.totalPoints);
      const pointsToNextLevel = calculatePointsToNextLevel(action.payload.totalPoints, level);
      
      return {
        ...state,
        totalPoints: action.payload.totalPoints,
        activities: action.payload.activities,
        level,
        pointsToNextLevel,
      };
    case 'RESET_POINTS':
      return initialState;
    default:
      return state;
  }
};

const calculateLevel = (points: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].points) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
};

const calculatePointsToNextLevel = (points: number, currentLevel: number): number => {
  const nextLevel = currentLevel + 1;
  const nextLevelThreshold = LEVEL_THRESHOLDS.find(l => l.level === nextLevel);
  if (!nextLevelThreshold) {
    return 0; // Already at highest level
  }
  return nextLevelThreshold.points - points;
};

interface PointsContextType {
  state: PointsState;
  addPoints: (type: keyof typeof POINTS_RULES, description: string, recipeId?: string) => Promise<void>;
  addPointsToCreator: (creatorUserId: string, type: 'recipe_liked_by_others' | 'recipe_favorited_by_others' | 'recipe_tried_by_others', recipeId: string, recipeTitle: string) => Promise<void>;
  getPointsHistory: () => PointsActivity[];
  getLevelInfo: () => { level: number; pointsToNextLevel: number; totalPoints: number };
  clearDailyCheckin: () => Promise<{ success: boolean; message: string; deletedCount?: number }>;
  clearAllPointsActivities: () => Promise<{ success: boolean; message: string; deletedCount?: number }>;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const PointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(pointsReducer, initialState);
  const { user } = useAuth();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user?.id && previousUserIdRef.current !== user.id) {
      dispatch({ type: 'RESET_POINTS' });
      AsyncStorage.removeItem('userPoints').catch(console.error);
    }
    if (!user && previousUserIdRef.current) {
      dispatch({ type: 'RESET_POINTS' });
    }
    previousUserIdRef.current = user?.id || null;
  }, [user?.id]);

  // Load points data from Supabase
  useEffect(() => {
    const loadPointsFromSupabase = async () => {
      if (!user?.id) {
        // If user is not logged in, load from AsyncStorage
        loadPointsFromStorage();
        return;
      }

      try {
        // Load total points from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('total_points')
          .eq('id', user.id)
          .single();

        // Load points history from user_points table
        const { data: pointsHistory, error: historyError } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (userError && !historyError) {
          // If users table doesn't have total_points field, this is normal
          console.log('total_points field may not exist, using calculated points');
        }

        // Calculate total points (from history or users table)
        let totalPoints = userData?.total_points || 0;
        const activities: PointsActivity[] = [];

        if (pointsHistory && !historyError) {
          // If history exists, use it
          pointsHistory.forEach((point: any) => {
            activities.push({
              id: point.id,
              type: point.activity_type as any,
              points: point.points,
              description: point.description || '',
              timestamp: new Date(point.created_at),
              recipeId: point.recipe_id,
            });
          });
          // Recalculate total
          totalPoints = activities.reduce((sum, activity) => sum + activity.points, 0);
        } else {
          // If no history, load from AsyncStorage
          loadPointsFromStorage();
          return;
        }

        // Update state
        dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities } });
      } catch (error) {
        console.error('Error loading points from Supabase:', error);
        loadPointsFromStorage();
      }
    };

    const loadPointsFromStorage = async () => {
      try {
        const storedPoints = await AsyncStorage.getItem('userPoints');
        if (storedPoints) {
          const { totalPoints, activities } = JSON.parse(storedPoints);
          // 转换日期字符串为Date对象
          const parsedActivities = activities.map((activity: any) => ({
            ...activity,
            timestamp: new Date(activity.timestamp),
          }));
          dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities: parsedActivities } });
        }
      } catch (error) {
        console.error('Failed to load points from storage', error);
      }
    };

    if (user?.id) {
      loadPointsFromSupabase();
    } else {
      loadPointsFromStorage();
    }
  }, [user?.id]);

  // 保存积分数据到AsyncStorage和Supabase
  useEffect(() => {
    const savePoints = async () => {
      // 保存到 AsyncStorage
      try {
        // 转换Date对象为字符串，以便JSON序列化
        const activitiesToSave = state.activities.map(activity => ({
          ...activity,
          timestamp: activity.timestamp.toISOString(),
        }));
        await AsyncStorage.setItem('userPoints', JSON.stringify({
          totalPoints: state.totalPoints,
          activities: activitiesToSave,
        }));
      } catch (error) {
        console.error('Failed to save points to storage', error);
      }

      // 同步到 Supabase（如果用户已登录）
      if (user?.id && state.activities.length > 0) {
        try {
          // 更新 users 表的积分总数
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              total_points: state.totalPoints,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (updateError) {
            // 如果字段不存在，这是正常的，只记录日志
            console.log('total_points field may not exist in users table:', updateError.message);
          }

          // 获取数据库中已有的活动（用于去重）
          // 由于数据库中的 ID 是 UUID，而本地 ID 是时间戳，我们通过 type + description + created_at 匹配
          const { data: existingPoints } = await supabase
            .from('user_points')
            .select('activity_type, description, created_at, points')
            .eq('user_id', user.id);

          // 创建已存在活动的标识（使用 type + description + timestamp 的组合）
          // 时间戳匹配允许 1 秒的误差（因为可能存在毫秒级差异）
          const existingKeys = new Set<string>();
          if (existingPoints) {
            existingPoints.forEach((point: any) => {
              const timestamp = new Date(point.created_at).getTime();
              // 使用秒级精度匹配（允许 1 秒误差）
              const timestampKey = Math.floor(timestamp / 1000);
              const key = `${point.activity_type}_${point.description}_${timestampKey}`;
              existingKeys.add(key);
            });
          }

          // 同步所有未同步的积分活动到 user_points 表
          const activitiesToSync = state.activities.filter(activity => {
            // 检查这个活动是否已经在数据库中
            const timestamp = activity.timestamp.getTime();
            const timestampKey = Math.floor(timestamp / 1000);
            const key = `${activity.type}_${activity.description}_${timestampKey}`;
            return !existingKeys.has(key);
          });

          if (activitiesToSync.length > 0) {
            const pointsToInsert = activitiesToSync.map(activity => ({
              user_id: user.id,
              points: activity.points,
              activity_type: activity.type,
              description: activity.description,
              recipe_id: activity.recipeId || null,
              created_at: activity.timestamp.toISOString(),
            }));

            // Helper function to insert points with retry for foreign key errors
            const insertPointsBatch = async (points: typeof pointsToInsert, retryCount = 0): Promise<boolean> => {
              const { error: insertError } = await supabase
                .from('user_points')
                .insert(points);

              if (insertError) {
                // Check if it's a foreign key constraint error (recipe not yet in database)
                const isForeignKeyError = insertError.code === '23503' || 
                                         insertError.message?.includes('foreign key constraint') ||
                                         insertError.message?.includes('Key is not present in table "recipes"');
                
                if (isForeignKeyError && retryCount < 3) {
                  // Filter out activities with recipe_id that might not exist yet
                  // Only retry activities without recipe_id or split the batch
                  const activitiesWithRecipeId = points.filter(p => p.recipe_id);
                  const activitiesWithoutRecipeId = points.filter(p => !p.recipe_id);
                  
                  // First, try to insert activities without recipe_id (these should always work)
                  if (activitiesWithoutRecipeId.length > 0) {
                    await supabase
                      .from('user_points')
                      .insert(activitiesWithoutRecipeId);
                  }
                  
                  // For activities with recipe_id, wait and retry (recipe might sync soon)
                  if (activitiesWithRecipeId.length > 0) {
                    const delay = (retryCount + 1) * 1000; // 1s, 2s, 3s
                    console.log(`⚠️ Some recipes not found in database yet, retrying ${activitiesWithRecipeId.length} activities in ${delay}ms (attempt ${retryCount + 1}/3)`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return insertPointsBatch(activitiesWithRecipeId, retryCount + 1);
                  }
                  
                  return true; // All activities without recipe_id were inserted
                } else {
                  // Max retries reached or other error
                  if (isForeignKeyError) {
                    console.warn(`⚠️ Failed to sync some activities after ${retryCount + 1} attempts. Some recipes may not be synced yet. This is OK for newly created recipes.`);
                    // Try to insert activities without recipe_id anyway
                    const activitiesWithoutRecipeId = points.filter(p => !p.recipe_id);
                    if (activitiesWithoutRecipeId.length > 0) {
                      await supabase
                        .from('user_points')
                        .insert(activitiesWithoutRecipeId);
                    }
                  } else {
                    console.log('Failed to sync activities to user_points:', insertError.message);
                  }
                  return false;
                }
              }
              
              return true;
            };

            const success = await insertPointsBatch(pointsToInsert);
            if (success) {
              console.log(`✅ Synced ${pointsToInsert.length} activities to database`);
              
              // 验证数据已成功保存到数据库后，清除所有 AsyncStorage 中的积分数据
              setTimeout(async () => {
                try {
                  const { count } = await supabase
                    .from('user_points')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                  // 如果数据库中有数据，说明同步成功，清除所有本地 AsyncStorage 中的积分数据
                  if (count !== null && count > 0) {
                    await AsyncStorage.removeItem('userPoints');
                    console.log('✅ Cleared all userPoints from AsyncStorage after successful sync');
                  }
                } catch (error) {
                  console.error('Error verifying sync and clearing AsyncStorage:', error);
                }
              }, 1000); // 延迟 1 秒确保数据库已更新
            }
          } else {
            // 如果所有活动都已同步（activitiesToSync.length === 0），验证后清除所有 AsyncStorage
            setTimeout(async () => {
              try {
                const { count } = await supabase
                  .from('user_points')
                  .select('*', { count: 'exact', head: true })
                  .eq('user_id', user.id);

                // 如果数据库中有数据，清除所有本地 AsyncStorage 中的积分数据
                if (count !== null && count > 0) {
                  await AsyncStorage.removeItem('userPoints');
                  console.log('✅ Cleared all userPoints from AsyncStorage (all activities already synced)');
                }
              } catch (error) {
                console.error('Error verifying sync and clearing AsyncStorage:', error);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('Failed to sync points to Supabase:', error);
        }
      }
    };
    savePoints();
  }, [state.totalPoints, state.activities, user?.id]);

  const addPoints = async (type: keyof typeof POINTS_RULES, description: string, recipeId?: string) => {
    const points = POINTS_RULES[type];
    
    // 检查每日上限（针对被点赞/收藏/尝试）
    const creatorRewardTypes: Array<'recipe_liked_by_others' | 'recipe_favorited_by_others' | 'recipe_tried_by_others'> = 
      ['recipe_liked_by_others', 'recipe_favorited_by_others', 'recipe_tried_by_others'];
    
    if (creatorRewardTypes.includes(type as any) && user?.id) {
      try {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        
        // 检查今天已经获得的该类型积分次数
        const { data: todayActivities, error: checkError } = await supabase
          .from('user_points')
          .select('id')
          .eq('user_id', user.id)
          .eq('activity_type', type)
          .gte('created_at', todayStart.toISOString())
          .lt('created_at', todayEnd.toISOString());
        
        if (checkError) {
          console.error('Error checking daily limit:', checkError);
          // 不阻止，继续执行
        } else {
          const todayCount = todayActivities?.length || 0;
          const dailyLimit = DAILY_LIMITS[type as keyof typeof DAILY_LIMITS];
          
          if (todayCount >= dailyLimit) {
            // 已达到每日上限，不添加积分
            console.log(`Daily limit reached for ${type}: ${todayCount}/${dailyLimit}`);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking daily limit:', error);
        // 不阻止，继续执行
      }
    }
    
    // 如果是 daily_checkin，先检查数据库中今天是否已经签到过
    if (type === 'daily_checkin' && user?.id) {
      try {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        
        // 检查数据库中今天是否已经有 daily_checkin 记录
        const { data: existingCheckin, error: checkError } = await supabase
          .from('user_points')
          .select('id')
          .eq('user_id', user.id)
          .eq('activity_type', 'daily_checkin')
          .gte('created_at', todayStart.toISOString())
          .lt('created_at', todayEnd.toISOString())
          .limit(1);

        if (checkError) {
          console.error('Error checking existing daily check-in:', checkError);
          throw new Error('Failed to check existing check-in');
        }

        if (existingCheckin && existingCheckin.length > 0) {
          // 今天已经签到过了，不允许重复签到
          throw new Error('You have already checked in today.');
        }
      } catch (error) {
        // 如果是重复签到错误，直接抛出
        if (error instanceof Error && error.message === 'You have already checked in today.') {
          throw error;
        }
        // 其他错误也抛出
        throw error;
      }
    }

    const activity: PointsActivity = {
      id: Date.now().toString(),
      type,
      points,
      description,
      timestamp: new Date(),
      recipeId,
    };
    // 更新本地状态
    dispatch({ type: 'ADD_POINTS', payload: activity });

    // 立即同步到 Supabase（如果用户已登录）
    // 注意：这里使用 state.totalPoints + points 来计算新的总数
    // 因为 dispatch 是异步的，我们需要手动计算
    if (user?.id) {
      try {
        // 获取当前积分总数并计算新的总数
        const newTotalPoints = state.totalPoints + points;
        
        // 更新 users 表的积分总数
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            total_points: newTotalPoints,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          console.log('Failed to update total_points:', updateError.message);
        }

        // 立即添加新的积分活动到 user_points 表
        // 这样可以确保新活动立即保存，而不需要等待 useEffect 触发
        // Helper function to insert points with retry logic (for newly created recipes)
        const insertPoints = async (retryCount = 0): Promise<boolean> => {
          const { error: insertError } = await supabase
            .from('user_points')
            .insert({
              user_id: user.id,
              points: points,
              activity_type: type,
              description: description,
              recipe_id: recipeId || null,
              created_at: activity.timestamp.toISOString(),
            });

          if (insertError) {
            // Check if it's a foreign key constraint error (recipe not yet in database)
            // Error code 23503 = foreign key constraint violation
            const isForeignKeyError = insertError.code === '23503' || 
                                     insertError.message?.includes('foreign key constraint') ||
                                     insertError.message?.includes('Key is not present in table "recipes"');
            
            if (isForeignKeyError && recipeId && retryCount < 3) {
              // Recipe might not be synced yet, wait and retry
              const delay = (retryCount + 1) * 1000; // 1s, 2s, 3s
              console.log(`⚠️ Recipe ${recipeId} not found in database yet for points, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return insertPoints(retryCount + 1);
            } else {
              // Max retries reached or other error - log but don't throw
              if (isForeignKeyError && recipeId) {
                console.warn(`⚠️ Failed to insert points for recipe ${recipeId} after ${retryCount + 1} attempts. Recipe may not be synced yet. This is OK for newly created recipes. Will retry in useEffect.`);
              } else {
                console.log('Failed to insert user_points:', insertError.message);
              }
              // 如果插入失败，会在 useEffect 中重试同步
              return false;
            }
          }
          
          return true;
        };

        const success = await insertPoints();
        if (success) {
          console.log('✅ Activity saved to database:', type);
        }
      } catch (error) {
        console.error('Failed to sync points to Supabase:', error);
        // 如果失败，会在 useEffect 中重试同步
      }
    }
  };

  /**
   * 给食谱创作者添加积分（当他们的食谱被点赞/收藏/尝试时）
   * @param creatorUserId 创作者的用户ID
   * @param type 积分类型
   * @param recipeId 食谱ID
   * @param recipeTitle 食谱标题
   */
  const addPointsToCreator = async (
    creatorUserId: string,
    type: 'recipe_liked_by_others' | 'recipe_favorited_by_others' | 'recipe_tried_by_others',
    recipeId: string,
    recipeTitle: string
  ) => {
    // 如果创作者是当前用户，不需要给自己加分（避免重复）
    if (creatorUserId === user?.id) {
      return;
    }

    const points = POINTS_RULES[type];
    const dailyLimit = DAILY_LIMITS[type];

    try {
      // 检查创作者今天已经获得的该类型积分次数
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const { data: todayActivities, error: checkError } = await supabase
        .from('user_points')
        .select('id')
        .eq('user_id', creatorUserId)
        .eq('activity_type', type)
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString());

      if (checkError) {
        console.error('Error checking daily limit for creator:', checkError);
        return;
      }

      const todayCount = todayActivities?.length || 0;
      if (todayCount >= dailyLimit) {
        // 已达到每日上限
        console.log(`Creator daily limit reached for ${type}: ${todayCount}/${dailyLimit}`);
        return;
      }

      // 获取创作者当前积分总数
      const { data: creatorData, error: creatorError } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', creatorUserId)
        .single();

      if (creatorError) {
        console.error('Error fetching creator points:', creatorError);
        return;
      }

      const currentTotalPoints = creatorData?.total_points || 0;
      const newTotalPoints = currentTotalPoints + points;

      // 更新创作者的积分总数
      const { error: updateError } = await supabase
        .from('users')
        .update({
          total_points: newTotalPoints,
          updated_at: new Date().toISOString(),
        })
        .eq('id', creatorUserId);

      if (updateError) {
        console.error('Error updating creator total_points:', updateError);
        return;
      }

      // 添加积分活动记录
      const description = type === 'recipe_liked_by_others'
        ? `Your recipe "${recipeTitle}" was liked`
        : type === 'recipe_favorited_by_others'
        ? `Your recipe "${recipeTitle}" was favorited`
        : `Your recipe "${recipeTitle}" was tried`;

      const { error: insertError } = await supabase
        .from('user_points')
        .insert({
          user_id: creatorUserId,
          points: points,
          activity_type: type,
          description: description,
          recipe_id: recipeId,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error inserting creator points:', insertError);
        // 回滚积分总数
        await supabase
          .from('users')
          .update({
            total_points: currentTotalPoints,
            updated_at: new Date().toISOString(),
          })
          .eq('id', creatorUserId);
        return;
      }

      console.log(`✅ Added ${points} points to creator ${creatorUserId} for ${type}`);
    } catch (error) {
      console.error('Failed to add points to creator:', error);
    }
  };

  const getPointsHistory = () => {
    return state.activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const getLevelInfo = () => {
    return {
      level: state.level,
      pointsToNextLevel: state.pointsToNextLevel,
      totalPoints: state.totalPoints,
    };
  };

  const clearDailyCheckin = async () => {
    const result = await clearAllDailyCheckin(user?.id);
    
    // 如果清理成功，重新加载积分数据
    if (result.success) {
      // 重新加载积分数据
      if (user?.id) {
        try {
          const { data: pointsHistory } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          const { data: userData } = await supabase
            .from('users')
            .select('total_points')
            .eq('id', user.id)
            .single();

          let totalPoints = userData?.total_points || 0;
          const activities: PointsActivity[] = [];

          if (pointsHistory) {
            pointsHistory.forEach((point: any) => {
              activities.push({
                id: point.id,
                type: point.activity_type as any,
                points: point.points,
                description: point.description || '',
                timestamp: new Date(point.created_at),
                recipeId: point.recipe_id,
              });
            });
            totalPoints = activities.reduce((sum, activity) => sum + activity.points, 0);
          }

          dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities } });
        } catch (error) {
          console.error('Error reloading points after clearing check-in:', error);
        }
      } else {
        // 从 AsyncStorage 重新加载
        try {
          const storedPoints = await AsyncStorage.getItem('userPoints');
          if (storedPoints) {
            const { totalPoints, activities } = JSON.parse(storedPoints);
            const parsedActivities = activities.map((activity: any) => ({
              ...activity,
              timestamp: new Date(activity.timestamp),
            }));
            dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities: parsedActivities } });
          }
        } catch (error) {
          console.error('Error reloading points from storage:', error);
        }
      }
    }
    
    return result;
  };

  const clearAllPoints = async () => {
    console.log('🧹 Starting to clear all points activities...');
    console.log('User ID:', user?.id);
    
    const result = await clearAllPointsActivities(user?.id);
    
    console.log('Clear result:', result);
    
    // 无论成功与否，都重置本地状态并强制重新加载
    if (result.success) {
      // 先重置本地状态
      dispatch({ type: 'RESET_POINTS' });
      
      // 清除 AsyncStorage（再次确认）
      try {
        await AsyncStorage.removeItem('userPoints');
        console.log('✅ Confirmed: AsyncStorage cleared');
      } catch (error) {
        console.error('Error clearing AsyncStorage:', error);
      }
      
      // 等待一下，确保数据库操作完成
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 强制重新加载积分数据（应该为空）
      if (user?.id) {
        try {
          // 从数据库加载（应该为空）
          const { data: pointsHistory, error: historyError } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('total_points')
            .eq('id', user.id)
            .single();

          console.log('Reloaded pointsHistory:', pointsHistory?.length || 0, 'records');
          console.log('History error:', historyError);
          console.log('User data:', userData);
          console.log('User error:', userError);

          let totalPoints = userData?.total_points || 0;
          let activities: PointsActivity[] = [];

          if (pointsHistory && pointsHistory.length > 0) {
            console.warn('⚠️ Warning: Points history still exists after clearing!');
            activities = pointsHistory.map((point: any) => ({
              id: point.id,
              type: point.activity_type as any,
              points: point.points,
              description: point.description || '',
              timestamp: new Date(point.created_at),
              recipeId: point.recipe_id,
            }));
            totalPoints = activities.reduce((sum, activity) => sum + activity.points, 0);
          } else {
            console.log('✅ Confirmed: No points history in database');
            totalPoints = 0;
            activities = [];
          }

          dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities } });
        } catch (error) {
          console.error('Error reloading points after clearing:', error);
          // 即使出错，也确保状态为空
          dispatch({ type: 'RESET_POINTS' });
        }
      } else {
        // 从 AsyncStorage 重新加载（应该为空）
        try {
          const storedPoints = await AsyncStorage.getItem('userPoints');
          if (storedPoints) {
            console.warn('⚠️ Warning: AsyncStorage still has points data!');
            const { totalPoints, activities } = JSON.parse(storedPoints);
            const parsedActivities = activities.map((activity: any) => ({
              ...activity,
              timestamp: new Date(activity.timestamp),
            }));
            dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities: parsedActivities } });
          } else {
            console.log('✅ Confirmed: AsyncStorage is empty');
            // 如果没有数据，确保状态为空
            dispatch({ type: 'RESET_POINTS' });
          }
        } catch (error) {
          console.error('Error reloading points from storage:', error);
          // 即使出错，也确保状态为空
          dispatch({ type: 'RESET_POINTS' });
        }
      }
    } else {
      // 即使清理失败，也尝试重置本地状态
      console.error('❌ Clear failed, but resetting local state anyway');
      dispatch({ type: 'RESET_POINTS' });
      try {
        await AsyncStorage.removeItem('userPoints');
      } catch (error) {
        console.error('Error clearing AsyncStorage:', error);
      }
    }
    
    return result;
  };

  return (
    <PointsContext.Provider value={{ state, addPoints, addPointsToCreator, getPointsHistory, getLevelInfo, clearDailyCheckin, clearAllPointsActivities: clearAllPoints }}>
      {children}
    </PointsContext.Provider>
  );
};

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};
