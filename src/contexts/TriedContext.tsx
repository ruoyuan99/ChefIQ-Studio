import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TriedState {
  triedRecipes: string[]; // 存储用户尝试过的菜谱ID列表
}

type TriedAction =
  | { type: 'TOGGLE_TRIED'; payload: string }
  | { type: 'SET_TRIED'; payload: string[] };

const initialState: TriedState = {
  triedRecipes: [],
};

const triedReducer = (state: TriedState, action: TriedAction): TriedState => {
  switch (action.type) {
    case 'TOGGLE_TRIED':
      const isTried = state.triedRecipes.includes(action.payload);
      if (isTried) {
        return {
          ...state,
          triedRecipes: state.triedRecipes.filter(id => id !== action.payload),
        };
      } else {
        return {
          ...state,
          triedRecipes: [...state.triedRecipes, action.payload],
        };
      }
    case 'SET_TRIED':
      return { ...state, triedRecipes: action.payload };
    default:
      return state;
  }
};

interface TriedContextType {
  state: TriedState;
  toggleTried: (recipeId: string) => void;
  isTried: (recipeId: string) => boolean;
  getTriedCount: (recipeId: string) => number;
}

const TriedContext = createContext<TriedContextType | undefined>(undefined);

export const TriedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(triedReducer, initialState);

  // 加载保存的尝试数据
  useEffect(() => {
    const loadTried = async () => {
      try {
        const storedTried = await AsyncStorage.getItem('triedRecipes');
        if (storedTried) {
          dispatch({ type: 'SET_TRIED', payload: JSON.parse(storedTried) });
        }
      } catch (error) {
        console.error('Failed to load tried recipes from storage', error);
      }
    };
    loadTried();
  }, []);

  // 保存尝试数据到AsyncStorage
  useEffect(() => {
    const saveTried = async () => {
      if (state.triedRecipes.length > 0) {
        try {
          await AsyncStorage.setItem('triedRecipes', JSON.stringify(state.triedRecipes));
        } catch (error) {
          console.error('Failed to save tried recipes to storage', error);
        }
      }
    };
    saveTried();
  }, [state.triedRecipes]);

  const toggleTried = (recipeId: string) => {
    dispatch({ type: 'TOGGLE_TRIED', payload: recipeId });
  };

  const isTried = (recipeId: string) => {
    return state.triedRecipes.includes(recipeId);
  };

  const getTriedCount = (recipeId: string) => {
    // 这里可以扩展为从服务器获取真实的尝试人数
    // 目前返回一个模拟的数字
    const mockCounts: { [key: string]: number } = {
      'sample_1': 15, // Jerk Fish
      'sample_2': 8,  // Chicken Curry
      'sample_3': 12, // Beef Stir Fry
      'sample_4': 6,  // Vegetarian Pasta
      'sample_5': 20, // Grilled Salmon
      'sample_6': 25, // Chocolate Cake
    };
    return mockCounts[recipeId] || 0;
  };

  return (
    <TriedContext.Provider value={{ state, toggleTried, isTried, getTriedCount }}>
      {children}
    </TriedContext.Provider>
  );
};

export const useTried = () => {
  const context = useContext(TriedContext);
  if (context === undefined) {
    throw new Error('useTried must be used within a TriedProvider');
  }
  return context;
};
