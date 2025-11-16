import React from 'react';
import { render } from '@testing-library/react-native';
import { GroceriesProvider, useGroceries } from '../GroceriesContext';

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

describe('GroceriesContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GroceriesProvider>{children}</GroceriesProvider>
  );

  describe('useGroceries', () => {
    it('should provide groceries context', () => {
      const { result } = renderHook(() => useGroceries(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.addItems).toBeDefined();
      expect(result.current.addSingleItem).toBeDefined();
      expect(result.current.toggleItem).toBeDefined();
      expect(result.current.removeItem).toBeDefined();
      expect(result.current.removeCategory).toBeDefined();
      expect(result.current.clearCompleted).toBeDefined();
    });

    it('should add items from recipe', () => {
      const { result } = renderHook(() => useGroceries(), { wrapper });
      
      const ingredients = [
        { name: 'Chicken', amount: '500', unit: 'g' },
        { name: 'Onion', amount: '1', unit: 'piece' },
      ];

      result.current.addItems('recipe-1', 'Test Recipe', ingredients);
      
      expect(result.current.state.items.length).toBe(2);
      expect(result.current.state.items[0].name).toBe('Chicken');
    });

    it('should add single item', () => {
      const { result } = renderHook(() => useGroceries(), { wrapper });
      
      result.current.addSingleItem('Milk', '500', 'ml');
      
      expect(result.current.state.items.length).toBe(1);
      expect(result.current.state.items[0].name).toBe('Milk');
    });

    it('should toggle item completion', () => {
      const { result } = renderHook(() => useGroceries(), { wrapper });
      
      result.current.addSingleItem('Milk', '500', 'ml');
      const itemId = result.current.state.items[0].id;
      
      expect(result.current.state.items[0].isCompleted).toBe(false);
      result.current.toggleItem(itemId);
      expect(result.current.state.items[0].isCompleted).toBe(true);
    });

    it('should remove item', () => {
      const { result } = renderHook(() => useGroceries(), { wrapper });
      
      result.current.addSingleItem('Milk', '500', 'ml');
      const itemId = result.current.state.items[0].id;
      
      expect(result.current.state.items.length).toBe(1);
      result.current.removeItem(itemId);
      expect(result.current.state.items.length).toBe(0);
    });

    it('should clear completed items', () => {
      const { result } = renderHook(() => useGroceries(), { wrapper });
      
      result.current.addSingleItem('Milk', '500', 'ml');
      result.current.addSingleItem('Bread', '1', 'loaf');
      
      const itemId1 = result.current.state.items[0].id;
      result.current.toggleItem(itemId1);
      
      expect(result.current.state.items.length).toBe(2);
      result.current.clearCompleted();
      expect(result.current.state.items.length).toBe(1);
    });
  });
});

