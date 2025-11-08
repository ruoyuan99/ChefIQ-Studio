import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LikeState {
  likedRecipes: string[]; // 存储被点赞的菜谱ID列表
}

type LikeAction =
  | { type: 'TOGGLE_LIKE'; payload: string }
  | { type: 'SET_LIKES'; payload: string[] };

const initialState: LikeState = {
  likedRecipes: [],
};

const likeReducer = (state: LikeState, action: LikeAction): LikeState => {
  switch (action.type) {
    case 'TOGGLE_LIKE':
      const isLiked = state.likedRecipes.includes(action.payload);
      if (isLiked) {
        return {
          ...state,
          likedRecipes: state.likedRecipes.filter(id => id !== action.payload),
        };
      } else {
        return {
          ...state,
          likedRecipes: [...state.likedRecipes, action.payload],
        };
      }
    case 'SET_LIKES':
      return { ...state, likedRecipes: action.payload };
    default:
      return state;
  }
};

interface LikeContextType {
  state: LikeState;
  toggleLike: (recipeId: string) => void;
  isLiked: (recipeId: string) => boolean;
}

const LikeContext = createContext<LikeContextType | undefined>(undefined);

export const LikeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(likeReducer, initialState);

  // 加载保存的点赞数据
  useEffect(() => {
    const loadLikes = async () => {
      try {
        const storedLikes = await AsyncStorage.getItem('likedRecipes');
        if (storedLikes) {
          dispatch({ type: 'SET_LIKES', payload: JSON.parse(storedLikes) });
        }
      } catch (error) {
        console.error('Failed to load likes from storage', error);
      }
    };
    loadLikes();
  }, []);

  // 保存点赞数据到AsyncStorage
  useEffect(() => {
    const saveLikes = async () => {
      if (state.likedRecipes.length > 0) {
        try {
          await AsyncStorage.setItem('likedRecipes', JSON.stringify(state.likedRecipes));
        } catch (error) {
          console.error('Failed to save likes to storage', error);
        }
      }
    };
    saveLikes();
  }, [state.likedRecipes]);

  const toggleLike = (recipeId: string) => {
    dispatch({ type: 'TOGGLE_LIKE', payload: recipeId });
  };

  const isLiked = (recipeId: string) => {
    return state.likedRecipes.includes(recipeId);
  };

  return (
    <LikeContext.Provider value={{ state, toggleLike, isLiked }}>
      {children}
    </LikeContext.Provider>
  );
};

export const useLike = () => {
  const context = useContext(LikeContext);
  if (context === undefined) {
    throw new Error('useLike must be used within a LikeProvider');
  }
  return context;
};
