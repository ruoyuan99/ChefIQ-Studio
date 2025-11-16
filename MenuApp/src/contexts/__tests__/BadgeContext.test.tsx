import React from 'react';
import { render } from '@testing-library/react-native';
import { BadgeProvider, useBadges, BADGE_DEFINITIONS } from '../BadgeContext';

// Mock dependencies
jest.mock('../AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user', email: 'test@example.com' } }),
}));

jest.mock('../PointsContext', () => ({
  usePoints: () => ({
    state: { 
      totalPoints: 100,
      activities: [],
    },
    getPointsHistory: () => [],
  }),
}));

jest.mock('../RecipeContext', () => ({
  useRecipe: () => ({
    state: { recipes: [] },
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
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

describe('BadgeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BadgeProvider>{children}</BadgeProvider>
  );

  describe('useBadges', () => {
    it('should provide badge context', () => {
      const { result } = renderHook(() => useBadges(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.badges).toBeDefined();
      expect(result.current.unlockedBadges).toBeDefined();
      expect(result.current.getBadgeById).toBeDefined();
      expect(result.current.getBadgesByCategory).toBeDefined();
      expect(result.current.checkBadgeUnlock).toBeDefined();
    });

    it('should return badge definitions', () => {
      const { result } = renderHook(() => useBadges(), { wrapper });
      
      expect(result.current.badges).toBeDefined();
      expect(Array.isArray(result.current.badges)).toBe(true);
    });

    it('should get badge by id', () => {
      const { result } = renderHook(() => useBadges(), { wrapper });
      
      const badge = result.current.getBadgeById('first_checkin');
      
      expect(badge).toBeDefined();
      expect(badge?.id).toBe('first_checkin');
    });

    it('should get badges by category', () => {
      const { result } = renderHook(() => useBadges(), { wrapper });
      
      const dailyBadges = result.current.getBadgesByCategory('daily');
      
      expect(Array.isArray(dailyBadges)).toBe(true);
      dailyBadges.forEach(badge => {
        expect(badge.category).toBe('daily');
      });
    });

    it('should check badge unlock', () => {
      const { result } = renderHook(() => useBadges(), { wrapper });
      
      // Should not throw error
      expect(() => {
        result.current.checkBadgeUnlock('first_checkin');
      }).not.toThrow();
    });
  });

  describe('BADGE_DEFINITIONS', () => {
    it('should have all required badges', () => {
      expect(BADGE_DEFINITIONS.first_checkin).toBeDefined();
      expect(BADGE_DEFINITIONS.first_recipe).toBeDefined();
      expect(BADGE_DEFINITIONS.first_try).toBeDefined();
    });

    it('should have correct badge structure', () => {
      const badge = BADGE_DEFINITIONS.first_checkin;
      
      expect(badge.id).toBe('first_checkin');
      expect(badge.name).toBeDefined();
      expect(badge.description).toBeDefined();
      expect(badge.icon).toBeDefined();
      expect(badge.color).toBeDefined();
      expect(badge.category).toBeDefined();
    });
  });
});

