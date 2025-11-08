import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

export interface PointsActivity {
  id: string;
  type: 'create_recipe' | 'try_recipe' | 'favorite_recipe' | 'like_recipe' | 'share_recipe' | 'complete_profile' | 'add_comment';
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

// 积分规则
export const POINTS_RULES = {
  create_recipe: 50,
  try_recipe: 20,
  favorite_recipe: 10,
  like_recipe: 5,
  share_recipe: 15,
  complete_profile: 25,
  add_comment: 8,
};

// 等级系统
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
    return 0; // 已达到最高等级
  }
  return nextLevelThreshold.points - points;
};

interface PointsContextType {
  state: PointsState;
  addPoints: (type: keyof typeof POINTS_RULES, description: string, recipeId?: string) => Promise<void>;
  getPointsHistory: () => PointsActivity[];
  getLevelInfo: () => { level: number; pointsToNextLevel: number; totalPoints: number };
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const PointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(pointsReducer, initialState);
  const { user } = useAuth();

  // 从 Supabase 加载积分数据
  useEffect(() => {
    const loadPointsFromSupabase = async () => {
      if (!user?.id) {
        // 如果用户未登录，从 AsyncStorage 加载
        loadPointsFromStorage();
        return;
      }

      try {
        // 从 users 表加载积分总数
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('total_points')
          .eq('id', user.id)
          .single();

        // 从 user_points 表加载积分历史
        const { data: pointsHistory, error: historyError } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (userError && !historyError) {
          // 如果 users 表没有 total_points 字段，这是正常的
          console.log('total_points field may not exist, using calculated points');
        }

        // 计算积分总数（从历史记录或 users 表）
        let totalPoints = userData?.total_points || 0;
        const activities: PointsActivity[] = [];

        if (pointsHistory && !historyError) {
          // 如果有历史记录，使用它
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
          // 重新计算总数
          totalPoints = activities.reduce((sum, activity) => sum + activity.points, 0);
        } else {
          // 如果没有历史记录，从 AsyncStorage 加载
          loadPointsFromStorage();
          return;
        }

        // 更新状态
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

          // 同步最新的积分活动到 user_points 表
          const latestActivity = state.activities[state.activities.length - 1];
          if (latestActivity) {
            const { error: insertError } = await supabase
              .from('user_points')
              .insert({
                user_id: user.id,
                points: latestActivity.points,
                activity_type: latestActivity.type,
                description: latestActivity.description,
                recipe_id: latestActivity.recipeId || null,
              });

            if (insertError) {
              // 如果表不存在，这是正常的，只记录日志
              console.log('user_points table may not exist:', insertError.message);
            }
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
    const activity: PointsActivity = {
      id: Date.now().toString(),
      type,
      points,
      description,
      timestamp: new Date(),
      recipeId,
    };
    // 先更新本地状态
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

        // 添加积分活动到 user_points 表
        const { error: insertError } = await supabase
          .from('user_points')
          .insert({
            user_id: user.id,
            points: points,
            activity_type: type,
            description: description,
            recipe_id: recipeId || null,
          });

        if (insertError) {
          console.log('Failed to insert user_points:', insertError.message);
        }
      } catch (error) {
        console.error('Failed to sync points to Supabase:', error);
      }
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

  return (
    <PointsContext.Provider value={{ state, addPoints, getPointsHistory, getLevelInfo }}>
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
