// Simple Jest setup for pure function tests
// This avoids Expo module dependencies

// Mock React Native Platform
global.Platform = {
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
};

// Mock __DEV__
global.__DEV__ = true;

// Mock fetch
global.fetch = jest.fn();

// Mock React Native modules that might be imported
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },
}), { virtual: true });

