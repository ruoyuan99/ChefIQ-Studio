import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Recipe } from '../types';
import { sampleRecipes } from '../data/sampleRecipes';

interface FavoriteState {
  favoriteRecipes: Recipe[];
}

type FavoriteAction =
  | { type: 'ADD_FAVORITE'; payload: Recipe }
  | { type: 'REMOVE_FAVORITE'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: Recipe };

const initialState: FavoriteState = {
  favoriteRecipes: [...sampleRecipes], // 初始化时包含示例recipes
};

const favoriteReducer = (state: FavoriteState, action: FavoriteAction): FavoriteState => {
  switch (action.type) {
    case 'ADD_FAVORITE':
      const isAlreadyFavorite = state.favoriteRecipes.some(recipe => recipe.id === action.payload.id);
      if (isAlreadyFavorite) {
        return state;
      }
      return {
        ...state,
        favoriteRecipes: [...state.favoriteRecipes, action.payload],
      };
    case 'REMOVE_FAVORITE':
      return {
        ...state,
        favoriteRecipes: state.favoriteRecipes.filter(recipe => recipe.id !== action.payload),
      };
    case 'TOGGLE_FAVORITE':
      const isFavorite = state.favoriteRecipes.some(recipe => recipe.id === action.payload.id);
      if (isFavorite) {
        return {
          ...state,
          favoriteRecipes: state.favoriteRecipes.filter(recipe => recipe.id !== action.payload.id),
        };
      } else {
        return {
          ...state,
          favoriteRecipes: [...state.favoriteRecipes, action.payload],
        };
      }
    default:
      return state;
  }
};

interface FavoriteContextType {
  state: FavoriteState;
  addToFavorites: (recipe: Recipe) => void;
  removeFromFavorites: (recipeId: string) => void;
  toggleFavorite: (recipe: Recipe) => void;
  isFavorite: (recipeId: string) => boolean;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export const FavoriteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(favoriteReducer, initialState);

  const addToFavorites = (recipe: Recipe) => {
    dispatch({ type: 'ADD_FAVORITE', payload: recipe });
  };

  const removeFromFavorites = (recipeId: string) => {
    dispatch({ type: 'REMOVE_FAVORITE', payload: recipeId });
  };

  const toggleFavorite = (recipe: Recipe) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: recipe });
  };

  const isFavorite = (recipeId: string) => {
    return state.favoriteRecipes.some(recipe => recipe.id === recipeId);
  };

  return (
    <FavoriteContext.Provider value={{
      state,
      addToFavorites,
      removeFromFavorites,
      toggleFavorite,
      isFavorite,
    }}>
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorite = () => {
  const context = useContext(FavoriteContext);
  if (context === undefined) {
    throw new Error('useFavorite must be used within a FavoriteProvider');
  }
  return context;
};
