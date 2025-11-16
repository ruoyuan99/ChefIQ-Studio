// Mock expo-modules-core BEFORE jest-expo loads it
// This must be loaded before jest-expo's setup.js

jest.mock('expo-modules-core', () => ({
  EventEmitter: class EventEmitter {
    addListener() {}
    removeListener() {}
    emit() {}
  },
  NativeModule: class NativeModule {},
  SharedObject: class SharedObject {},
  SharedRef: class SharedRef {},
}), { virtual: true });

// Mock the specific file that's causing issues
jest.mock('expo-modules-core/src/polyfill/dangerous-internal', () => ({
  EventEmitter: class EventEmitter {},
  NativeModule: class NativeModule {},
  SharedObject: class SharedObject {},
  SharedRef: class SharedRef {},
}), { virtual: true });

// Mock expo winter runtime - prevent import errors
jest.mock('expo/src/winter/runtime.native', () => ({
  __esModule: true,
  default: {},
}), { virtual: true });

// Mock expo installGlobal - prevent import errors
jest.mock('expo/src/winter/installGlobal', () => ({
  __esModule: true,
  default: {},
  getValue: jest.fn(() => ({})),
}), { virtual: true });

// Mock expo module registry to prevent import errors
if (typeof global !== 'undefined') {
  global.__ExpoImportMetaRegistry = {};
  
  // Mock structuredClone which is used by expo winter runtime
  if (!global.structuredClone) {
    global.structuredClone = function(obj) {
      return JSON.parse(JSON.stringify(obj));
    };
  }
}

// Mock expo winter runtime more thoroughly
jest.mock('expo/src/winter/runtime.native', () => {
  const mockRuntime = {
    __esModule: true,
    default: {},
  };
  return mockRuntime;
}, { virtual: true });

// Mock expo installGlobal more thoroughly
jest.mock('expo/src/winter/installGlobal', () => {
  const mockRegistry = {};
  return {
    __esModule: true,
    default: {},
    getValue: jest.fn(function(key) {
      if (key === 'structuredClone') {
        return function(obj) {
          return JSON.parse(JSON.stringify(obj));
        };
      }
      return mockRegistry[key];
    }),
    setValue: jest.fn(function(key, value) {
      mockRegistry[key] = value;
    }),
  };
}, { virtual: true });

