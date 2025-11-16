import React from 'react';
import { render } from '@testing-library/react-native';
import { RecipeProvider, useRecipe } from '../RecipeContext';
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

describe('MenuContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <RecipeProvider>{children}</RecipeProvider>
  );

  describe('useRecipe (MenuContext uses RecipeContext)', () => {
    it('should provide recipe context', () => {
      const { result } = renderHook(() => useRecipe(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.addRecipe).toBeDefined();
      expect(result.current.updateRecipe).toBeDefined();
      expect(result.current.deleteRecipe).toBeDefined();
      expect(result.current.getRecipeById).toBeDefined();
    });

    it('should add a recipe', async () => {
      const { result } = renderHook(() => useRecipe(), { wrapper });
      
      const recipe: Omit<import('../../types').Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Recipe',
        description: 'Test Description',
        items: [],
        isPublic: false,
        userId: 'test-user',
      };

      result.current.addRecipe(recipe);
      // Wait for async sync and state update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(result.current.state.recipes.length).toBeGreaterThan(0);
      expect(result.current.state.recipes[0].title).toBe('Test Recipe');
    });

    it('should get recipe by id', async () => {
      const { result } = renderHook(() => useRecipe(), { wrapper });
      
      const recipe: Omit<import('../../types').Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Recipe',
        description: 'Test Description',
        items: [],
        isPublic: false,
        userId: 'test-user',
      };

      result.current.addRecipe(recipe);
      // Wait for async sync and state update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const addedRecipe = result.current.state.recipes[0];
      const found = result.current.getRecipeById(addedRecipe.id);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(addedRecipe.id);
    });
  });
});

