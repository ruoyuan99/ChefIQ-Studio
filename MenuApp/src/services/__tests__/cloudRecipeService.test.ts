import { CloudRecipeService } from '../cloudRecipeService';
import { Recipe } from '../../types';

// Mock dependencies
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('../../config/supabase', () => ({
  supabase: mockSupabase,
}));

describe('CloudRecipeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserRecipes', () => {
    it('should fetch user recipes successfully', async () => {
      const mockRecipes = [
        {
          id: 'recipe-1',
          title: 'Test Recipe',
          description: 'Test Description',
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockFrom = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: mockRecipes,
              error: null,
            }),
          })),
        })),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await CloudRecipeService.fetchUserRecipes('user-123');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
    });

    it('should handle errors when fetching recipes', async () => {
      const mockFrom = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          })),
        })),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await CloudRecipeService.fetchUserRecipes('user-123');
      
      // Should handle error gracefully
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('saveRecipe', () => {
    it('should save recipe successfully', async () => {
      const mockRecipe: Recipe = {
        id: 'recipe-1',
        title: 'Test Recipe',
        description: 'Test Description',
        items: [],
        isPublic: false,
        userId: 'user-123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockFrom = {
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [{ id: 'recipe-1' }],
            error: null,
          }),
        })),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await CloudRecipeService.saveRecipe(mockRecipe);
      
      expect(result).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
    });
  });

  describe('updateRecipe', () => {
    it('should update recipe successfully', async () => {
      const mockRecipe: Recipe = {
        id: 'recipe-1',
        title: 'Updated Recipe',
        description: 'Updated Description',
        items: [],
        isPublic: false,
        userId: 'user-123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockFrom = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn().mockResolvedValue({
              data: [{ id: 'recipe-1' }],
              error: null,
            }),
          })),
        })),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await CloudRecipeService.updateRecipe(mockRecipe);
      
      expect(result).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
    });
  });

  describe('deleteRecipe', () => {
    it('should delete recipe successfully', async () => {
      const mockFrom = {
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockFrom);

      const result = await CloudRecipeService.deleteRecipe('recipe-1');
      
      expect(result).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
    });
  });
});

