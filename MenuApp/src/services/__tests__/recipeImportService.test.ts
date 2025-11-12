import { importRecipeViaBackend, generateRecipeFromIngredients } from '../recipeImportService';
import { getBackendUrl } from '../../config/recipeImport';

// Mock the config
jest.mock('../../config/recipeImport', () => ({
  getBackendUrl: jest.fn(() => 'http://localhost:3001'),
  RECIPE_IMPORT_ENDPOINT: '/api/import-recipe',
  RECIPE_GENERATE_FROM_INGREDIENTS_ENDPOINT: '/api/generate-recipe-from-ingredients',
}));

// Mock fetch
global.fetch = jest.fn();

describe('recipeImportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('importRecipeViaBackend', () => {
    const mockRecipe = {
      id: '1',
      title: 'Test Recipe',
      description: 'Test Description',
      ingredients: [
        { id: '1', name: 'Chicken', amount: '500g', unit: 'g' },
      ],
      instructions: [
        { id: '1', step: 1, description: 'Step 1' },
      ],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('should import recipe successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          success: true,
          recipe: mockRecipe,
        }),
      });

      const result = await importRecipeViaBackend('https://example.com/recipe');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/import-recipe',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: 'https://example.com/recipe' }),
        }
      );
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Recipe');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

      await expect(importRecipeViaBackend('https://example.com/recipe')).rejects.toThrow(
        'Cannot connect to backend server'
      );
    });

    it('should handle backend errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          success: false,
          error: 'Backend error',
        }),
      });

      await expect(importRecipeViaBackend('https://example.com/recipe')).rejects.toThrow('Backend error');
    });

    it('should handle 403 errors with user-friendly message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: 'This website does not allow importing recipes',
        }),
      });

      await expect(importRecipeViaBackend('https://example.com/recipe')).rejects.toThrow(
        'This website does not allow importing recipes'
      );
    });
  });

  describe('generateRecipeFromIngredients', () => {
    const mockRecipeOptions = {
      success: true,
      recipeOptions: [
        {
          recipe: {
            id: '1',
            title: 'Recipe 1',
            description: 'Description 1',
            ingredients: [],
            instructions: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          youtubeVideos: {
            videos: [],
            searchUrl: 'https://youtube.com/search?q=Recipe+1',
          },
        },
      ],
    };

    it('should generate recipes successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockRecipeOptions,
      });

      const result = await generateRecipeFromIngredients(['chicken', 'onion']);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/generate-recipe-from-ingredients',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ingredients: ['chicken', 'onion'],
            dietaryRestrictions: [],
            cuisine: '',
            servings: '',
            cookingTime: '',
            cookware: '',
          }),
        }
      );
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

      await expect(generateRecipeFromIngredients(['chicken'])).rejects.toThrow(
        'Cannot connect to backend server'
      );
    });

    it('should handle missing ingredients error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'At least one ingredient is required',
        }),
      });

      await expect(generateRecipeFromIngredients([])).rejects.toThrow(
        'Please provide at least one ingredient to generate recipes'
      );
    });

    it('should handle missing cookware error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'Cookware is required',
        }),
      });

      await expect(generateRecipeFromIngredients(['chicken'], { cookware: '' })).rejects.toThrow(
        'Please select a cookware to generate recipes'
      );
    });
  });
});

