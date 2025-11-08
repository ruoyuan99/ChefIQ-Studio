import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Recipe, MenuItem } from '../types';

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
  | { type: 'SET_CURRENT_RECIPE'; payload: Recipe | null };

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
    default:
      return state;
  }
};

interface RecipeContextType {
  state: RecipeState;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (recipeId: string) => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  getRecipeById: (recipeId: string) => Recipe | undefined;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(recipeReducer, initialState);

  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_RECIPE', payload: newRecipe });
  };

  const updateRecipe = (recipe: Recipe) => {
    const updatedRecipe = { ...recipe, updatedAt: new Date() };
    dispatch({ type: 'UPDATE_RECIPE', payload: updatedRecipe });
  };

  const deleteRecipe = (recipeId: string) => {
    dispatch({ type: 'DELETE_RECIPE', payload: recipeId });
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
