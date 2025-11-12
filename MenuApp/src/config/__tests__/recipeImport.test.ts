import { getBackendUrl, RECIPE_IMPORT_ENDPOINT, RECIPE_GENERATE_FROM_INGREDIENTS_ENDPOINT } from '../recipeImport';

// Mock __DEV__
const originalDev = (global as any).__DEV__;

describe('recipeImport config', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.EXPO_PUBLIC_BACKEND_URL;
    delete process.env.EXPO_PUBLIC_BACKEND_URL_DEV;
    delete process.env.EXPO_PUBLIC_BACKEND_URL_PROD;
  });

  afterEach(() => {
    (global as any).__DEV__ = originalDev;
  });

  describe('getBackendUrl', () => {
    it('should return environment variable URL if set', () => {
      process.env.EXPO_PUBLIC_BACKEND_URL = 'https://custom-backend.com';
      (global as any).__DEV__ = false;
      
      const url = getBackendUrl();
      expect(url).toBe('https://custom-backend.com');
    });

    it('should return dev URL in development mode', () => {
      (global as any).__DEV__ = true;
      delete process.env.EXPO_PUBLIC_BACKEND_URL;
      
      const url = getBackendUrl();
      expect(url).toContain('192.168.10.153');
      expect(url).toContain('3001');
    });

    it('should return dev-specific environment variable if set', () => {
      process.env.EXPO_PUBLIC_BACKEND_URL_DEV = 'http://dev-backend.com';
      (global as any).__DEV__ = true;
      delete process.env.EXPO_PUBLIC_BACKEND_URL;
      
      const url = getBackendUrl();
      expect(url).toBe('http://dev-backend.com');
    });

    it('should return prod URL in production mode', () => {
      (global as any).__DEV__ = false;
      delete process.env.EXPO_PUBLIC_BACKEND_URL;
      delete process.env.EXPO_PUBLIC_BACKEND_URL_PROD;
      
      const url = getBackendUrl();
      expect(url).toBe('https://your-backend-domain.com');
    });

    it('should return prod-specific environment variable if set', () => {
      process.env.EXPO_PUBLIC_BACKEND_URL_PROD = 'https://prod-backend.com';
      (global as any).__DEV__ = false;
      delete process.env.EXPO_PUBLIC_BACKEND_URL;
      
      const url = getBackendUrl();
      expect(url).toBe('https://prod-backend.com');
    });
  });

  describe('endpoints', () => {
    it('should have correct import endpoint', () => {
      expect(RECIPE_IMPORT_ENDPOINT).toBe('/api/import-recipe');
    });

    it('should have correct generate endpoint', () => {
      expect(RECIPE_GENERATE_FROM_INGREDIENTS_ENDPOINT).toBe('/api/generate-recipe-from-ingredients');
    });
  });
});

