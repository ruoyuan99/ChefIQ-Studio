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

