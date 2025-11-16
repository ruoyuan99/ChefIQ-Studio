import React from 'react';
import { render } from '@testing-library/react-native';
import { LikeProvider, useLike } from '../LikeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
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

describe('LikeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <LikeProvider>{children}</LikeProvider>
  );

  describe('useLike', () => {
    it('should provide like context', () => {
      const { result } = renderHook(() => useLike(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.toggleLike).toBeDefined();
      expect(result.current.isLiked).toBeDefined();
    });

    it('should toggle like status', async () => {
      const { result } = renderHook(() => useLike(), { wrapper });
      
      expect(result.current.isLiked('recipe-1')).toBe(false);
      
      result.current.toggleLike('recipe-1');
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(result.current.isLiked('recipe-1')).toBe(true);
      
      result.current.toggleLike('recipe-1');
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(result.current.isLiked('recipe-1')).toBe(false);
    });

    it('should check if recipe is liked', async () => {
      const { result } = renderHook(() => useLike(), { wrapper });
      
      expect(result.current.isLiked('recipe-1')).toBe(false);
      result.current.toggleLike('recipe-1');
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(result.current.isLiked('recipe-1')).toBe(true);
    });
  });
});

