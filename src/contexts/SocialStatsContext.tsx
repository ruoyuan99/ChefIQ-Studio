import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SocialStats {
  likes: number;
  favorites: number;
  views: number;
  tried: number;
}

interface SocialStatsState {
  stats: { [recipeId: string]: SocialStats };
}

type SocialStatsAction =
  | { type: 'SET_STATS'; payload: { recipeId: string; stats: SocialStats } }
  | { type: 'INCREMENT_LIKES'; payload: string }
  | { type: 'INCREMENT_FAVORITES'; payload: string }
  | { type: 'INCREMENT_VIEWS'; payload: string }
  | { type: 'INCREMENT_TRIED'; payload: string }
  | { type: 'LOAD_STATS'; payload: { [recipeId: string]: SocialStats } };

const initialState: SocialStatsState = {
  stats: {},
};

const socialStatsReducer = (state: SocialStatsState, action: SocialStatsAction): SocialStatsState => {
  switch (action.type) {
    case 'SET_STATS':
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.payload.recipeId]: action.payload.stats,
        },
      };
    case 'INCREMENT_LIKES':
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.payload]: {
            ...state.stats[action.payload],
            likes: (state.stats[action.payload]?.likes || 0) + 1,
          },
        },
      };
    case 'INCREMENT_FAVORITES':
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.payload]: {
            ...state.stats[action.payload],
            favorites: (state.stats[action.payload]?.favorites || 0) + 1,
          },
        },
      };
    case 'INCREMENT_VIEWS':
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.payload]: {
            ...state.stats[action.payload],
            views: (state.stats[action.payload]?.views || 0) + 1,
          },
        },
      };
    case 'INCREMENT_TRIED':
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.payload]: {
            ...state.stats[action.payload],
            tried: (state.stats[action.payload]?.tried || 0) + 1,
          },
        },
      };
    case 'LOAD_STATS':
      return {
        ...state,
        stats: action.payload,
      };
    default:
      return state;
  }
};

interface SocialStatsContextType {
  state: SocialStatsState;
  getStats: (recipeId: string) => SocialStats;
  incrementLikes: (recipeId: string) => void;
  incrementFavorites: (recipeId: string) => void;
  incrementViews: (recipeId: string) => void;
  incrementTried: (recipeId: string) => void;
}

const SocialStatsContext = createContext<SocialStatsContextType | undefined>(undefined);

export const SocialStatsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(socialStatsReducer, initialState);

  // 加载保存的统计数据
  useEffect(() => {
    const loadStats = async () => {
      try {
        const storedStats = await AsyncStorage.getItem('socialStats');
        if (storedStats) {
          dispatch({ type: 'LOAD_STATS', payload: JSON.parse(storedStats) });
        }
      } catch (error) {
        console.error('Failed to load social stats from storage', error);
      }
    };
    loadStats();
  }, []);

  // 保存统计数据到AsyncStorage
  useEffect(() => {
    const saveStats = async () => {
      try {
        await AsyncStorage.setItem('socialStats', JSON.stringify(state.stats));
      } catch (error) {
        console.error('Failed to save social stats to storage', error);
      }
    };
    saveStats();
  }, [state.stats]);

  const getStats = (recipeId: string): SocialStats => {
    return state.stats[recipeId] || {
      likes: Math.floor(Math.random() * 1000) + 100, // 模拟数据
      favorites: Math.floor(Math.random() * 500) + 50,
      views: Math.floor(Math.random() * 2000) + 500,
      tried: Math.floor(Math.random() * 200) + 10,
    };
  };

  const incrementLikes = (recipeId: string) => {
    dispatch({ type: 'INCREMENT_LIKES', payload: recipeId });
  };

  const incrementFavorites = (recipeId: string) => {
    dispatch({ type: 'INCREMENT_FAVORITES', payload: recipeId });
  };

  const incrementViews = (recipeId: string) => {
    dispatch({ type: 'INCREMENT_VIEWS', payload: recipeId });
  };

  const incrementTried = (recipeId: string) => {
    dispatch({ type: 'INCREMENT_TRIED', payload: recipeId });
  };

  return (
    <SocialStatsContext.Provider value={{ 
      state, 
      getStats, 
      incrementLikes, 
      incrementFavorites, 
      incrementViews, 
      incrementTried 
    }}>
      {children}
    </SocialStatsContext.Provider>
  );
};

export const useSocialStats = () => {
  const context = useContext(SocialStatsContext);
  if (context === undefined) {
    throw new Error('useSocialStats must be used within a SocialStatsProvider');
  }
  return context;
};
