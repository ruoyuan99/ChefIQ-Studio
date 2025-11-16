import React from 'react';
import { render } from '@testing-library/react-native';
import { SocialStatsProvider, useSocialStats } from '../SocialStatsContext';

// Mock dependencies
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

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

describe('SocialStatsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SocialStatsProvider>{children}</SocialStatsProvider>
  );

  describe('useSocialStats', () => {
    it('should provide social stats context', () => {
      const { result } = renderHook(() => useSocialStats(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.getStats).toBeDefined();
      expect(result.current.incrementLikes).toBeDefined();
      expect(result.current.incrementFavorites).toBeDefined();
      expect(result.current.incrementViews).toBeDefined();
      expect(result.current.incrementTried).toBeDefined();
    });

    it('should get stats for recipe', () => {
      const { result } = renderHook(() => useSocialStats(), { wrapper });
      
      const stats = result.current.getStats('recipe-1');
      
      expect(stats).toBeDefined();
      expect(stats.likes).toBe(0);
      expect(stats.favorites).toBe(0);
      expect(stats.views).toBe(0);
      expect(stats.tried).toBe(0);
    });

    it('should increment likes', () => {
      const { result } = renderHook(() => useSocialStats(), { wrapper });
      
      result.current.incrementLikes('recipe-1');
      const stats = result.current.getStats('recipe-1');
      
      expect(stats.likes).toBe(1);
    });

    it('should increment favorites', () => {
      const { result } = renderHook(() => useSocialStats(), { wrapper });
      
      result.current.incrementFavorites('recipe-1');
      const stats = result.current.getStats('recipe-1');
      
      expect(stats.favorites).toBe(1);
    });

    it('should increment views', () => {
      const { result } = renderHook(() => useSocialStats(), { wrapper });
      
      result.current.incrementViews('recipe-1');
      const stats = result.current.getStats('recipe-1');
      
      expect(stats.views).toBe(1);
    });

    it('should increment tried', () => {
      const { result } = renderHook(() => useSocialStats(), { wrapper });
      
      result.current.incrementTried('recipe-1');
      const stats = result.current.getStats('recipe-1');
      
      expect(stats.tried).toBe(1);
    });
  });
});

