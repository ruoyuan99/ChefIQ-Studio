import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  recipeId: string;
  recipeTitle: string;
  isCompleted: boolean;
}

interface GroceriesState {
  items: GroceryItem[];
}

type GroceriesAction =
  | { type: 'ADD_ITEMS'; payload: { recipeId: string; recipeTitle: string; ingredients: Array<{ name: string; amount: string; unit: string }> } }
  | { type: 'TOGGLE_ITEM'; payload: string }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_COMPLETED' };

const initialState: GroceriesState = {
  items: [],
};

const groceriesReducer = (state: GroceriesState, action: GroceriesAction): GroceriesState => {
  switch (action.type) {
    case 'ADD_ITEMS':
      const newItems = action.payload.ingredients.map((ingredient, index) => ({
        id: `${action.payload.recipeId}-${index}-${Date.now()}`,
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit,
        recipeId: action.payload.recipeId,
        recipeTitle: action.payload.recipeTitle,
        isCompleted: false,
      }));
      return {
        ...state,
        items: [...state.items, ...newItems],
      };
    case 'TOGGLE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload ? { ...item, isCompleted: !item.isCompleted } : item
        ),
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    case 'CLEAR_COMPLETED':
      return {
        ...state,
        items: state.items.filter(item => !item.isCompleted),
      };
    default:
      return state;
  }
};

interface GroceriesContextType {
  state: GroceriesState;
  addItemsToGroceries: (recipeId: string, recipeTitle: string, ingredients: Array<{ name: string; amount: string; unit: string }>) => void;
  toggleItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  clearCompleted: () => void;
}

const GroceriesContext = createContext<GroceriesContextType | undefined>(undefined);

export const GroceriesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(groceriesReducer, initialState);

  const addItemsToGroceries = (recipeId: string, recipeTitle: string, ingredients: Array<{ name: string; amount: string; unit: string }>) => {
    dispatch({ type: 'ADD_ITEMS', payload: { recipeId, recipeTitle, ingredients } });
  };

  const toggleItem = (itemId: string) => {
    dispatch({ type: 'TOGGLE_ITEM', payload: itemId });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const clearCompleted = () => {
    dispatch({ type: 'CLEAR_COMPLETED' });
  };

  return (
    <GroceriesContext.Provider value={{
      state,
      addItemsToGroceries,
      toggleItem,
      removeItem,
      clearCompleted,
    }}>
      {children}
    </GroceriesContext.Provider>
  );
};

export const useGroceries = () => {
  const context = useContext(GroceriesContext);
  if (context === undefined) {
    throw new Error('useGroceries must be used within a GroceriesProvider');
  }
  return context;
};
