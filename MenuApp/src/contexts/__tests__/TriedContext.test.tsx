import React from 'react';
import { render } from '@testing-library/react-native';
import { TriedProvider, useTried } from '../TriedContext';
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

describe('TriedContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TriedProvider>{children}</TriedProvider>
  );

  describe('useTried', () => {
    it('should provide tried context', () => {
      const { result } = renderHook(() => useTried(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.toggleTried).toBeDefined();
      expect(result.current.isTried).toBeDefined();
    });

    it('should toggle tried status', async () => {
      const { result } = renderHook(() => useTried(), { wrapper });
      
      expect(result.current.isTried('recipe-1')).toBe(false);
      
      result.current.toggleTried('recipe-1');
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(result.current.isTried('recipe-1')).toBe(true);
      
      result.current.toggleTried('recipe-1');
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(result.current.isTried('recipe-1')).toBe(false);
    });

    it('should check if recipe is tried', async () => {
      const { result } = renderHook(() => useTried(), { wrapper });
      
      expect(result.current.isTried('recipe-1')).toBe(false);
      result.current.toggleTried('recipe-1');
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(result.current.isTried('recipe-1')).toBe(true);
    });
  });
});

