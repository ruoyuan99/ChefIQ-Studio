import { supabase } from '../config/supabase';
import { SurveyData, TasteRating, DifficultyRating, WillMakeAgain } from '../components/RecipeSurveyModal';

export interface RecipeSurveyStats {
  taste: {
    like: number;
    neutral: number;
    dislike: number;
  };
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  willMakeAgain: {
    yes: number;
    no: number;
  };
  total: number;
}

export interface UserSurvey {
  id: string;
  recipeId: string;
  userId: string;
  taste: TasteRating;
  difficulty: DifficultyRating;
  willMakeAgain: WillMakeAgain;
  createdAt: Date;
}

class RecipeSurveyService {
  /**
   * 提交用户的survey数据
   */
  async submitSurvey(
    recipeId: string,
    userId: string,
    surveyData: SurveyData
  ): Promise<void> {
    if (!surveyData.taste || !surveyData.difficulty || !surveyData.willMakeAgain) {
      throw new Error('Survey data is incomplete');
    }

    try {
      // 使用 upsert 来支持更新已存在的survey
      const { error } = await supabase
        .from('recipe_surveys')
        .upsert(
          {
            recipe_id: recipeId,
            user_id: userId,
            taste: surveyData.taste,
            difficulty: surveyData.difficulty,
            will_make_again: surveyData.willMakeAgain,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'recipe_id,user_id',
          }
        );

      if (error) {
        console.error('Error submitting survey:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to submit survey:', error);
      throw error;
    }
  }

  /**
   * 获取用户对特定菜谱的survey
   */
  async getUserSurvey(recipeId: string, userId: string): Promise<UserSurvey | null> {
    try {
      const { data, error } = await supabase
        .from('recipe_surveys')
        .select('*')
        .eq('recipe_id', recipeId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching user survey:', error);
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        recipeId: data.recipe_id,
        userId: data.user_id,
        taste: data.taste as TasteRating,
        difficulty: data.difficulty as DifficultyRating,
        willMakeAgain: data.will_make_again as WillMakeAgain,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Failed to fetch user survey:', error);
      return null;
    }
  }

  /**
   * 获取菜谱的survey统计数据
   */
  async getRecipeSurveyStats(recipeId: string): Promise<RecipeSurveyStats> {
    try {
      const { data, error } = await supabase
        .from('recipe_surveys')
        .select('taste, difficulty, will_make_again')
        .eq('recipe_id', recipeId);

      if (error) {
        console.error('Error fetching survey stats:', error);
        throw error;
      }

      const stats: RecipeSurveyStats = {
        taste: {
          like: 0,
          neutral: 0,
          dislike: 0,
        },
        difficulty: {
          easy: 0,
          medium: 0,
          hard: 0,
        },
        willMakeAgain: {
          yes: 0,
          no: 0,
        },
        total: data?.length || 0,
      };

      if (data) {
        data.forEach((survey) => {
          // Count taste
          if (survey.taste === 'like') stats.taste.like++;
          else if (survey.taste === 'neutral') stats.taste.neutral++;
          else if (survey.taste === 'dislike') stats.taste.dislike++;

          // Count difficulty
          if (survey.difficulty === 'easy') stats.difficulty.easy++;
          else if (survey.difficulty === 'medium') stats.difficulty.medium++;
          else if (survey.difficulty === 'hard') stats.difficulty.hard++;

          // Count willMakeAgain
          if (survey.will_make_again === 'yes') stats.willMakeAgain.yes++;
          else if (survey.will_make_again === 'no') stats.willMakeAgain.no++;
        });
      }

      return stats;
    } catch (error) {
      console.error('Failed to fetch survey stats:', error);
      // Return empty stats on error
      return {
        taste: { like: 0, neutral: 0, dislike: 0 },
        difficulty: { easy: 0, medium: 0, hard: 0 },
        willMakeAgain: { yes: 0, no: 0 },
        total: 0,
      };
    }
  }

  /**
   * 删除用户的survey
   */
  async deleteSurvey(recipeId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('recipe_surveys')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting survey:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete survey:', error);
      throw error;
    }
  }
}

export const recipeSurveyService = new RecipeSurveyService();

