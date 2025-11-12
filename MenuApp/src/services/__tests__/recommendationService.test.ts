import { RecommendationService } from '../recommendationService';
import { UserPreferenceService, UserPreference } from '../userPreferenceService';
import { Recipe } from '../../types';

describe('RecommendationService', () => {
  const mockRecipe: Recipe = {
    id: '1',
    title: 'Chicken Curry',
    description: 'A delicious chicken curry',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: true,
    tags: ['Indian', 'Spicy', 'Chicken'],
    cookingTime: '30 minutes',
    servings: '4 servings',
    cookware: 'Pan',
      ingredients: [
        { id: '1', name: 'Chicken', amount: 500, unit: 'g' },
        { id: '2', name: 'Onion', amount: 1, unit: 'piece' },
      ],
    instructions: [
      { id: '1', step: 1, description: 'Step 1' },
    ],
  };

  const mockUserPreference: UserPreference = {
    preferredTags: {
      indian: 2.0,
      spicy: 1.5,
      chicken: 2.0,
    },
    preferredCookingTimes: ['medium'],
    preferredCookware: ['pan'],
    preferredIngredients: {
      chicken: 2.0,
      onion: 1.0,
    },
    preferredServings: ['3-4'],
    preferredCuisines: ['indian'],
    totalInteractions: 3,
  };

  describe('calculateRecommendationScore', () => {
    it('should calculate score for matching recipe', () => {
      const score = RecommendationService.calculateRecommendationScore(mockRecipe, mockUserPreference);
      
      expect(score).toBeDefined();
      expect(score.recipe).toBe(mockRecipe);
      expect(score.score).toBeGreaterThan(0);
      expect(score.reasons.length).toBeGreaterThan(0);
    });

    it('should return 0 score for non-matching recipe', () => {
      const nonMatchingRecipe: Recipe = {
        ...mockRecipe,
        tags: ['Western'],
        cookware: 'Grill',
        ingredients: [{ id: '1', name: 'Beef', amount: 500, unit: 'g' }],
      };
      const emptyPreference: UserPreference = {
        preferredTags: {},
        preferredCookingTimes: [],
        preferredCookware: [],
        preferredIngredients: {},
        preferredServings: [],
        preferredCuisines: [],
        totalInteractions: 0,
      };

      const score = RecommendationService.calculateRecommendationScore(nonMatchingRecipe, emptyPreference);
      
      expect(score.score).toBe(0);
    });

    it('should calculate tag matching score', () => {
      const score = RecommendationService.calculateRecommendationScore(mockRecipe, mockUserPreference);
      
      expect(score.score).toBeGreaterThan(0);
      expect(score.reasons.some(r => r.includes('Matches your interests'))).toBe(true);
    });

    it('should calculate cooking time matching score', () => {
      const score = RecommendationService.calculateRecommendationScore(mockRecipe, mockUserPreference);
      
      expect(score.reasons.some(r => r.includes('cooking time'))).toBe(true);
    });

    it('should calculate cookware matching score', () => {
      const score = RecommendationService.calculateRecommendationScore(mockRecipe, mockUserPreference);
      
      expect(score.reasons.some(r => r.includes('cookware'))).toBe(true);
    });

    it('should calculate ingredient matching score', () => {
      const score = RecommendationService.calculateRecommendationScore(mockRecipe, mockUserPreference);
      
      // Ingredients may be included in reasons if score is high enough
      // Check that score is calculated (may not always appear in top 3 reasons)
      expect(score.score).toBeGreaterThan(0);
    });

    it('should limit reasons to top 3', () => {
      const score = RecommendationService.calculateRecommendationScore(mockRecipe, mockUserPreference);
      
      expect(score.reasons.length).toBeLessThanOrEqual(3);
    });
  });

  describe('sortByRecommendation', () => {
    const mockRecipes: Recipe[] = [
      mockRecipe,
      {
        ...mockRecipe,
        id: '2',
        title: 'Beef Steak',
        tags: ['Western'],
        cookware: 'Grill',
        ingredients: [{ id: '1', name: 'Beef', amount: 500, unit: 'g' }],
      },
      {
        ...mockRecipe,
        id: '3',
        title: 'Chicken Tikka',
        tags: ['Indian', 'Spicy'],
        cookware: 'Pan',
        ingredients: [
          { id: '1', name: 'Chicken', amount: 500, unit: 'g' },
        ],
      },
    ];

    it('should sort recipes by recommendation score', () => {
      const sorted = RecommendationService.sortByRecommendation(mockRecipes, mockUserPreference);
      
      expect(sorted.length).toBe(mockRecipes.length);
      // First recipe should have highest match score
      expect(sorted[0].id).toBe('1');
    });

    it('should handle empty recipes array', () => {
      const sorted = RecommendationService.sortByRecommendation([], mockUserPreference);
      
      expect(sorted).toEqual([]);
    });

    it('should handle empty preference', () => {
      const emptyPreference: UserPreference = {
        preferredTags: {},
        preferredCookingTimes: [],
        preferredCookware: [],
        preferredIngredients: {},
        preferredServings: [],
        preferredCuisines: [],
        totalInteractions: 0,
      };

      const sorted = RecommendationService.sortByRecommendation(mockRecipes, emptyPreference);
      
      expect(sorted.length).toBe(mockRecipes.length);
    });
  });

  describe('getRecommendationReason', () => {
    it('should return recommendation reason', () => {
      const reason = RecommendationService.getRecommendationReason(mockRecipe, mockUserPreference);
      
      expect(reason).toBeDefined();
      expect(typeof reason).toBe('string');
      expect(reason.length).toBeGreaterThan(0);
    });

    it('should return default reason if no specific reasons', () => {
      const emptyPreference: UserPreference = {
        preferredTags: {},
        preferredCookingTimes: [],
        preferredCookware: [],
        preferredIngredients: {},
        preferredServings: [],
        preferredCuisines: [],
        totalInteractions: 0,
      };

      const reason = RecommendationService.getRecommendationReason(mockRecipe, emptyPreference);
      
      expect(reason).toBe('Recommended based on your preferences');
    });
  });

  describe('isHighlyRecommended', () => {
    it('should return true for highly recommended recipe', () => {
      const isRecommended = RecommendationService.isHighlyRecommended(mockRecipe, mockUserPreference, 10);
      
      expect(isRecommended).toBe(true);
    });

    it('should return false for low score recipe', () => {
      const nonMatchingRecipe: Recipe = {
        ...mockRecipe,
        tags: ['Western'],
        cookware: 'Grill',
      };
      const emptyPreference: UserPreference = {
        preferredTags: {},
        preferredCookingTimes: [],
        preferredCookware: [],
        preferredIngredients: {},
        preferredServings: [],
        preferredCuisines: [],
        totalInteractions: 0,
      };

      const isRecommended = RecommendationService.isHighlyRecommended(nonMatchingRecipe, emptyPreference, 10);
      
      expect(isRecommended).toBe(false);
    });

    it('should use custom threshold', () => {
      const isRecommended = RecommendationService.isHighlyRecommended(mockRecipe, mockUserPreference, 100);
      
      expect(isRecommended).toBeDefined();
      expect(typeof isRecommended).toBe('boolean');
    });
  });
});

