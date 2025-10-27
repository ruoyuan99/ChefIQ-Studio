import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PointsActivity {
  id: string;
  type: 'create_recipe' | 'try_recipe' | 'favorite_recipe' | 'like_recipe' | 'share_recipe' | 'complete_profile';
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
  addPoints: (type: keyof typeof POINTS_RULES, description: string, recipeId?: string) => void;
  getPointsHistory: () => PointsActivity[];
  getLevelInfo: () => { level: number; pointsToNextLevel: number; totalPoints: number };
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const PointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(pointsReducer, initialState);

  // 加载保存的积分数据
  useEffect(() => {
    const loadPoints = async () => {
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
    loadPoints();
  }, []);

  // 保存积分数据到AsyncStorage
  useEffect(() => {
    const savePoints = async () => {
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
    };
    savePoints();
  }, [state.totalPoints, state.activities]);

  const addPoints = (type: keyof typeof POINTS_RULES, description: string, recipeId?: string) => {
    const points = POINTS_RULES[type];
    const activity: PointsActivity = {
      id: Date.now().toString(),
      type,
      points,
      description,
      timestamp: new Date(),
      recipeId,
    };
    dispatch({ type: 'ADD_POINTS', payload: activity });
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
