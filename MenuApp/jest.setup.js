// Jest setup file
// Note: expo-modules-core is mocked in jest.setup.mocks.js (loaded before this file)

try {
  require('@testing-library/react-native/extend-expect');
} catch (e) {
  // Ignore if not available (e.g., when using Node test environment)
}

// Mock Expo modules
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Mock @expo/vector-icons to prevent expo-font issues
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  AntDesign: 'AntDesign',
  Entypo: 'Entypo',
  Feather: 'Feather',
  FontAwesome5: 'FontAwesome5',
  Foundation: 'Foundation',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Octicons: 'Octicons',
  SimpleLineIcons: 'SimpleLineIcons',
  Zocial: 'Zocial',
}));

// Mock expo-font to prevent ES module issues
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  documentDirectory: 'file:///document/',
  cacheDirectory: 'file:///cache/',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
      })),
    },
  })),
}));

// Mock React Native modules (only if using React Native test environment)
// For Node test environment, these are not needed
if (process.env.TEST_ENV !== 'node') {
  try {
    jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
  } catch (e) {
    // Ignore if not available
  }
}

// Global test utilities
global.fetch = jest.fn();

// Mock __DEV__
global.__DEV__ = true;

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

