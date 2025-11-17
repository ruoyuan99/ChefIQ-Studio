// Mock Supabase BEFORE importing the service
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('../../config/supabase', () => {
  const mockSupabase = {
    from: jest.fn(),
  };
  return {
    supabase: mockSupabase,
  };
});

import { supabase } from '../../config/supabase';
import { recipeSurveyService, RecipeSurveyStats } from '../recipeSurveyService';
import { SurveyData } from '../../components/RecipeSurveyModal';

// Get the mocked supabase
const mockSupabaseFrom = supabase.from as jest.Mock;

describe('RecipeSurveyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitSurvey', () => {
    it('should submit survey successfully', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockFrom = {
        upsert: mockUpsert,
      };

      mockSupabaseFrom.mockReturnValue(mockFrom);

      const surveyData: SurveyData = {
        taste: 'like',
        difficulty: 'easy',
        willMakeAgain: 'yes',
      };

      await recipeSurveyService.submitSurvey('recipe-1', 'user-1', surveyData);

      expect(mockSupabaseFrom).toHaveBeenCalledWith('recipe_surveys');
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          recipe_id: 'recipe-1',
          user_id: 'user-1',
          taste: 'like',
          difficulty: 'easy',
          will_make_again: 'yes',
          updated_at: expect.any(String),
        },
        {
          onConflict: 'recipe_id,user_id',
        }
      );
    });

    it('should throw error when survey data is incomplete', async () => {
      const incompleteData: SurveyData = {
        taste: 'like',
        difficulty: null,
        willMakeAgain: 'yes',
      };

      await expect(
        recipeSurveyService.submitSurvey('recipe-1', 'user-1', incompleteData)
      ).rejects.toThrow('Survey data is incomplete');
    });

    it('should throw error when Supabase returns error', async () => {
      const mockError = { message: 'Database error', code: 'PGRST_ERROR' };
      const mockUpsert = jest.fn().mockResolvedValue({ error: mockError });
      const mockFrom = {
        upsert: mockUpsert,
      };

      mockSupabaseFrom.mockReturnValue(mockFrom);

      const surveyData: SurveyData = {
        taste: 'like',
        difficulty: 'easy',
        willMakeAgain: 'yes',
      };

      await expect(
        recipeSurveyService.submitSurvey('recipe-1', 'user-1', surveyData)
      ).rejects.toEqual(mockError);
    });
  });

  describe('getUserSurvey', () => {
    it('should return user survey when it exists', async () => {
      const mockData = {
        id: 'survey-1',
        recipe_id: 'recipe-1',
        user_id: 'user-1',
        taste: 'like',
        difficulty: 'medium',
        will_make_again: 'yes',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = {
        select: mockSelect,
      };

      mockSupabaseFrom.mockReturnValue(mockFrom);

      const result = await recipeSurveyService.getUserSurvey('recipe-1', 'user-1');

      expect(result).toEqual({
        id: 'survey-1',
        recipeId: 'recipe-1',
        userId: 'user-1',
        taste: 'like',
        difficulty: 'medium',
        willMakeAgain: 'yes',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('recipe_surveys');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq1).toHaveBeenCalledWith('recipe_id', 'recipe-1');
      expect(mockEq2).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should return null when survey does not exist', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq2 = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = {
        select: mockSelect,
      };

      mockSupabaseFrom.mockReturnValue(mockFrom);

      const result = await recipeSurveyService.getUserSurvey('recipe-1', 'user-1');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Other error' },
      });
      const mockEq2 = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = {
        select: mockSelect,
      };

      mockSupabaseFrom.mockReturnValue(mockFrom);

      const result = await recipeSurveyService.getUserSurvey('recipe-1', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('getRecipeSurveyStats', () => {
    it('should calculate stats correctly', async () => {
      const mockData = [
        { taste: 'like', difficulty: 'easy', will_make_again: 'yes' },
        { taste: 'like', difficulty: 'medium', will_make_again: 'yes' },
        { taste: 'neutral', difficulty: 'hard', will_make_again: 'no' },
        { taste: 'dislike', difficulty: 'easy', will_make_again: 'yes' },
        { taste: 'like', difficulty: 'hard', will_make_again: 'no' },
      ];

      const mockEq = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      const mockFrom = {
        select: mockSelect,
      };

      mockSupabaseFrom.mockReturnValue(mockFrom);

      const result = await recipeSurveyService.getRecipeSurveyStats('recipe-1');

      expect(result).toEqual({
        taste: {
          like: 3,
          neutral: 1,
          dislike: 1,
        },
        difficulty: {
          easy: 2,
          medium: 1,
          hard: 2,
        },
        willMakeAgain: {
          yes: 3,
          no: 2,
        },
        total: 5,
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('recipe_surveys');
      expect(mockSelect).toHaveBeenCalledWith('taste, difficulty, will_make_again');
      expect(mockEq).toHaveBeenCalledWith('recipe_id', 'recipe-1');
    });

    it('should return empty stats when no data exists', async () => {
      const mockEq = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      const mockFrom = {
        select: mockSelect,
      };

      mockSupabaseFrom.mockReturnValue(mockFrom);

      const result = await recipeSurveyService.getRecipeSurveyStats('recipe-1');

      expect(result).toEqual({
        taste: { like: 0, neutral: 0, dislike: 0 },
        difficulty: { easy: 0, medium: 0, hard: 0 },
        willMakeAgain: { yes: 0, no: 0 },
        total: 0,
      });
    });

    it('should return empty stats on error', async () => {
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      const mockFrom = {
        select: mockSelect,
      };

      mockSupabaseFrom.mockReturnValue(mockFrom);

      const result = await recipeSurveyService.getRecipeSurveyStats('recipe-1');

      expect(result).toEqual({
        taste: { like: 0, neutral: 0, dislike: 0 },
        difficulty: { easy: 0, medium: 0, hard: 0 },
        willMakeAgain: { yes: 0, no: 0 },
        total: 0,
      });
    });
  });

  describe('deleteSurvey', () => {
    it('should delete survey successfully', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ error: null });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockDelete = jest.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = {
        delete: mockDelete,
      };

      mockSupabaseFrom.mockReturnValue(mockFrom);

      await recipeSurveyService.deleteSurvey('recipe-1', 'user-1');

      expect(mockSupabaseFrom).toHaveBeenCalledWith('recipe_surveys');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith('recipe_id', 'recipe-1');
      expect(mockEq2).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should throw error when deletion fails', async () => {
      const mockError = { message: 'Delete failed', code: 'PGRST_ERROR' };
      const mockEq2 = jest.fn().mockResolvedValue({ error: mockError });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockDelete = jest.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = {
        delete: mockDelete,
      };

      mockSupabaseFrom.mockReturnValue(mockFrom);

      await expect(
        recipeSurveyService.deleteSurvey('recipe-1', 'user-1')
      ).rejects.toEqual(mockError);
    });
  });
});

