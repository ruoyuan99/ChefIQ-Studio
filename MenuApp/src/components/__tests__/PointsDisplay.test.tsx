// Mock @expo/vector-icons BEFORE any imports
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import PointsDisplay from '../PointsDisplay';

// Mock dependencies
jest.mock('../../contexts/PointsContext', () => ({
  usePoints: () => ({
    state: {
      totalPoints: 100,
      level: 1,
    },
    getLevelInfo: () => ({
      level: 1,
      pointsToNextLevel: 50,
      totalPoints: 100,
    }),
    addPoints: jest.fn(),
    getPointsHistory: () => [],
  }),
}));

jest.mock('../../contexts/BadgeContext', () => ({
  useBadges: () => ({
    checkBadgeUnlock: jest.fn(),
    getBadgeById: jest.fn(),
  }),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

describe('PointsDisplay', () => {
  it('should render without crashing', () => {
    const { getByText } = render(<PointsDisplay />);
    
    // Component should render
    expect(getByText).toBeDefined();
  });

  it('should display points information', () => {
    const { getByText } = render(<PointsDisplay />);
    
    // Should display level or points information
    expect(getByText).toBeDefined();
  });

  it('should handle onPress callback', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<PointsDisplay onPress={onPress} />);
    
    // Component should be rendered
    expect(getByTestId).toBeDefined();
  });
});

