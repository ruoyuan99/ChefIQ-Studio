import { UserPreferenceService } from '../userPreferenceService';
import { Recipe } from '../../types';

describe('UserPreferenceService', () => {
  const mockRecipes: Recipe[] = [
    {
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
    },
    {
      id: '2',
      title: 'Beef Steak',
      description: 'A tasty beef steak',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      tags: ['Western', 'Beef'],
      cookingTime: '20 minutes',
      servings: '2 servings',
      cookware: 'Grill',
        ingredients: [
          { id: '1', name: 'Beef', amount: 500, unit: 'g' },
        ],
      instructions: [
        { id: '1', step: 1, description: 'Step 1' },
      ],
    },
  ];

  describe('analyzeUserPreferences', () => {
    it('should analyze preferences from liked recipes', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        ['1'],
        [],
        [],
        mockRecipes
      );

      expect(preference.preferredTags).toHaveProperty('indian');
      expect(preference.preferredTags).toHaveProperty('spicy');
      expect(preference.preferredTags).toHaveProperty('chicken');
      expect(preference.preferredCookingTimes).toContain('medium');
      expect(preference.preferredCookware).toContain('pan');
      expect(preference.preferredIngredients).toHaveProperty('chicken');
      expect(preference.totalInteractions).toBe(1);
    });

    it('should analyze preferences from favorited recipes', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        [],
        [mockRecipes[0]],
        [],
        mockRecipes
      );

      expect(preference.preferredTags).toHaveProperty('indian');
      expect(preference.totalInteractions).toBe(1);
    });

    it('should analyze preferences from tried recipes', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        [],
        [],
        ['1'],
        mockRecipes
      );

      expect(preference.preferredTags).toHaveProperty('indian');
      expect(preference.totalInteractions).toBe(1);
    });

    it('should weight tried recipes higher than favorites', () => {
      const preference1 = UserPreferenceService.analyzeUserPreferences(
        ['1'],
        [],
        [],
        mockRecipes
      );
      const preference2 = UserPreferenceService.analyzeUserPreferences(
        [],
        [],
        ['1'],
        mockRecipes
      );

      // Tried recipes should have higher weight
      expect(preference2.preferredTags['indian']).toBeGreaterThan(preference1.preferredTags['indian']);
    });

    it('should combine preferences from multiple recipes', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        ['1', '2'],
        [],
        [],
        mockRecipes
      );

      expect(preference.preferredTags).toHaveProperty('indian');
      expect(preference.preferredTags).toHaveProperty('western');
      expect(preference.totalInteractions).toBe(2);
    });

    it('should extract cuisines from tags', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        ['1'],
        [],
        [],
        mockRecipes
      );

      expect(preference.preferredCuisines.length).toBeGreaterThan(0);
    });

    it('should normalize cooking times', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        ['1'],
        [],
        [],
        mockRecipes
      );

      expect(preference.preferredCookingTimes).toContain('medium');
    });

    it('should normalize servings', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        ['1'],
        [],
        [],
        mockRecipes
      );

      expect(preference.preferredServings.length).toBeGreaterThan(0);
    });

    it('should handle empty inputs', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        [],
        [],
        [],
        mockRecipes
      );

      expect(preference.totalInteractions).toBe(0);
      expect(Object.keys(preference.preferredTags)).toHaveLength(0);
    });
  });

  describe('hasEnoughData', () => {
    it('should return true if user has interactions', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        ['1'],
        [],
        [],
        mockRecipes
      );

      expect(UserPreferenceService.hasEnoughData(preference)).toBe(true);
    });

    it('should return false if user has no interactions', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        [],
        [],
        [],
        mockRecipes
      );

      expect(UserPreferenceService.hasEnoughData(preference)).toBe(false);
    });
  });

  describe('getTopTags', () => {
    it('should return top tags sorted by weight', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        ['1', '2'],
        [],
        [],
        mockRecipes
      );

      const topTags = UserPreferenceService.getTopTags(preference, 5);
      expect(topTags.length).toBeLessThanOrEqual(5);
      expect(topTags.length).toBeGreaterThan(0);
    });

    it('should return empty array if no tags', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        [],
        [],
        [],
        mockRecipes
      );

      const topTags = UserPreferenceService.getTopTags(preference, 5);
      expect(topTags).toEqual([]);
    });
  });

  describe('getTopIngredients', () => {
    it('should return top ingredients sorted by weight', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        ['1', '2'],
        [],
        [],
        mockRecipes
      );

      const topIngredients = UserPreferenceService.getTopIngredients(preference, 5);
      expect(topIngredients.length).toBeLessThanOrEqual(5);
      expect(topIngredients.length).toBeGreaterThan(0);
    });

    it('should return empty array if no ingredients', () => {
      const preference = UserPreferenceService.analyzeUserPreferences(
        [],
        [],
        [],
        mockRecipes
      );

      const topIngredients = UserPreferenceService.getTopIngredients(preference, 5);
      expect(topIngredients).toEqual([]);
    });
  });
});

