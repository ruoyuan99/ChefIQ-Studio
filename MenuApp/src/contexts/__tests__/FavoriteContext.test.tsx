import React from 'react';
import { render } from '@testing-library/react-native';
import { FavoriteProvider, useFavorite } from '../FavoriteContext';
import { Recipe } from '../../types';

// Mock dependencies
jest.mock('../AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user', email: 'test@example.com' } }),
}));

jest.mock('../../services/realTimeSyncService', () => ({
  RealTimeSyncService: {
    syncFavorite: jest.fn(),
  },
}));

jest.mock('../../data/sampleRecipes', () => ({
  sampleRecipes: [],
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

describe('FavoriteContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FavoriteProvider>{children}</FavoriteProvider>
  );

  const createMockRecipe = (id: string, title: string): Recipe => ({
    id,
    title,
    description: 'Test Description',
    items: [],
    isPublic: false,
    userId: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  describe('useFavorite', () => {
    it('should provide favorite context', () => {
      const { result } = renderHook(() => useFavorite(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.addToFavorites).toBeDefined();
      expect(result.current.removeFromFavorites).toBeDefined();
      expect(result.current.toggleFavorite).toBeDefined();
      expect(result.current.isFavorite).toBeDefined();
    });

    it('should add recipe to favorites', () => {
      const { result } = renderHook(() => useFavorite(), { wrapper });
      
      const recipe = createMockRecipe('recipe-1', 'Test Recipe');
      result.current.addToFavorites(recipe);
      
      expect(result.current.isFavorite('recipe-1')).toBe(true);
      expect(result.current.state.favoriteRecipes.length).toBeGreaterThan(0);
    });

    it('should not add duplicate favorites', () => {
      const { result } = renderHook(() => useFavorite(), { wrapper });
      
      const recipe = createMockRecipe('recipe-1', 'Test Recipe');
      const initialLength = result.current.state.favoriteRecipes.length;
      
      result.current.addToFavorites(recipe);
      result.current.addToFavorites(recipe);
      
      const favorites = result.current.state.favoriteRecipes.filter(r => r.id === 'recipe-1');
      expect(favorites.length).toBe(1);
    });

    it('should remove recipe from favorites', () => {
      const { result } = renderHook(() => useFavorite(), { wrapper });
      
      const recipe = createMockRecipe('recipe-1', 'Test Recipe');
      result.current.addToFavorites(recipe);
      expect(result.current.isFavorite('recipe-1')).toBe(true);
      
      result.current.removeFromFavorites('recipe-1');
      expect(result.current.isFavorite('recipe-1')).toBe(false);
    });

    it('should toggle favorite status', () => {
      const { result } = renderHook(() => useFavorite(), { wrapper });
      
      const recipe = createMockRecipe('recipe-1', 'Test Recipe');
      
      // Toggle on
      result.current.toggleFavorite(recipe);
      expect(result.current.isFavorite('recipe-1')).toBe(true);
      
      // Toggle off
      result.current.toggleFavorite(recipe);
      expect(result.current.isFavorite('recipe-1')).toBe(false);
    });

    it('should check if recipe is favorite', () => {
      const { result } = renderHook(() => useFavorite(), { wrapper });
      
      const recipe = createMockRecipe('recipe-1', 'Test Recipe');
      
      expect(result.current.isFavorite('recipe-1')).toBe(false);
      result.current.addToFavorites(recipe);
      expect(result.current.isFavorite('recipe-1')).toBe(true);
    });
  });
});

