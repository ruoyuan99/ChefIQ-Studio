import React from 'react';
import { render } from '@testing-library/react-native';
import { RecipeProvider, useRecipe } from '../RecipeContext';
import { Recipe } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user', email: 'test@example.com' } }),
}));

jest.mock('../../services/autoSyncService', () => ({
  AutoSyncService: {
    needsSync: jest.fn(() => Promise.resolve(false)),
    syncAllDataToSupabase: jest.fn(() => Promise.resolve({ success: true })),
  },
}));

jest.mock('../../services/cloudRecipeService', () => ({
  CloudRecipeService: {
    fetchUserRecipes: jest.fn(() => Promise.resolve([])),
  },
}));

jest.mock('../../services/realTimeSyncService', () => ({
  RealTimeSyncService: {
    subscribeToRecipes: jest.fn(() => ({ unsubscribe: jest.fn() })),
    syncRecipe: jest.fn(() => Promise.resolve('recipe-id-123')),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

function renderHook<T>(hook: () => T, options?: { wrapper?: React.ComponentType }) {
  let result: { current: T } = { current: null as any };
  const TestComponent = () => {
    result.current = hook();
    return null;
  };
  const Wrapper = options?.wrapper || React.Fragment;
  render(
    <Wrapper>
      <TestComponent />
    </Wrapper>
  );
  return { result };
}

describe('RecipeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <RecipeProvider>{children}</RecipeProvider>
  );

  describe('useRecipe', () => {
    it('should provide recipe context', () => {
      const { result } = renderHook(() => useRecipe(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.addRecipe).toBeDefined();
      expect(result.current.updateRecipe).toBeDefined();
      expect(result.current.deleteRecipe).toBeDefined();
      expect(result.current.setCurrentRecipe).toBeDefined();
      expect(result.current.getRecipeById).toBeDefined();
    });

    it('should initialize with empty recipes', () => {
      const { result } = renderHook(() => useRecipe(), { wrapper });
      
      expect(result.current.state.recipes).toEqual([]);
      expect(result.current.state.currentRecipe).toBeNull();
      expect(result.current.state.loading).toBe(false);
    });

    it('should add a recipe', async () => {
      const { result } = renderHook(() => useRecipe(), { wrapper });
      
      const newRecipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Recipe',
        description: 'Test Description',
        items: [],
        isPublic: false,
        userId: 'test-user',
      };

      result.current.addRecipe(newRecipe);
      
      // Wait for async sync to complete and state update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(result.current.state.recipes.length).toBe(1);
      expect(result.current.state.recipes[0].title).toBe('Test Recipe');
      expect(result.current.state.recipes[0].id).toBeDefined();
    });

    it('should update a recipe', async () => {
      const { result } = renderHook(() => useRecipe(), { wrapper });
      
      const newRecipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Recipe',
        description: 'Test Description',
        items: [],
        isPublic: false,
        userId: 'test-user',
      };

      result.current.addRecipe(newRecipe);
      // Wait for async sync
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const recipe = result.current.state.recipes[0];
      const updatedRecipe = { ...recipe, title: 'Updated Recipe' };
      result.current.updateRecipe(updatedRecipe);
      
      // Wait for update to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(result.current.state.recipes[0].title).toBe('Updated Recipe');
    });

    it('should delete a recipe', async () => {
      const { result } = renderHook(() => useRecipe(), { wrapper });
      
      const newRecipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Recipe',
        description: 'Test Description',
        items: [],
        isPublic: false,
        userId: 'test-user',
      };

      result.current.addRecipe(newRecipe);
      // Wait for async sync
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(result.current.state.recipes.length).toBe(1);
      
      const recipe = result.current.state.recipes[0];
      result.current.deleteRecipe(recipe.id);
      // Wait for delete to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(result.current.state.recipes.length).toBe(0);
    });

    it('should set current recipe', async () => {
      const { result } = renderHook(() => useRecipe(), { wrapper });
      
      const newRecipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Recipe',
        description: 'Test Description',
        items: [],
        isPublic: false,
        userId: 'test-user',
      };

      result.current.addRecipe(newRecipe);
      // Wait for async sync
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const recipe = result.current.state.recipes[0];
      result.current.setCurrentRecipe(recipe);
      
      expect(result.current.state.currentRecipe).toEqual(recipe);
    });

    it('should get recipe by id', async () => {
      const { result } = renderHook(() => useRecipe(), { wrapper });
      
      const newRecipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Recipe',
        description: 'Test Description',
        items: [],
        isPublic: false,
        userId: 'test-user',
      };

      result.current.addRecipe(newRecipe);
      // Wait for async sync and state update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(result.current.state.recipes.length).toBeGreaterThan(0);
      const recipe = result.current.state.recipes[0];
      expect(recipe).toBeDefined();
      expect(recipe.id).toBeDefined();
      
      const found = result.current.getRecipeById(recipe.id);
      
      expect(found).toBeDefined();
      expect(found).toEqual(recipe);
    });

    it('should return undefined for non-existent recipe', () => {
      const { result } = renderHook(() => useRecipe(), { wrapper });
      
      const found = result.current.getRecipeById('non-existent-id');
      
      expect(found).toBeUndefined();
    });
  });
});

