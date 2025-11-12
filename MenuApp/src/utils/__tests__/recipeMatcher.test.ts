import { calculateMatchScore, findRelatedRecipes } from '../recipeMatcher';
import { Recipe } from '../../types';

describe('recipeMatcher', () => {
  const mockRecipe: Recipe = {
    id: '1',
    title: 'Chicken Curry',
    description: 'A delicious chicken curry with spices',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: true,
    tags: ['Indian', 'Spicy', 'Chicken'],
    cookingTime: '30 minutes',
    servings: '4 servings',
    ingredients: [
      { id: '1', name: 'Chicken', amount: 500, unit: 'g' },
      { id: '2', name: 'Onion', amount: 1, unit: 'piece' },
      { id: '3', name: 'Garlic', amount: 3, unit: 'cloves' },
      { id: '4', name: 'Tomato', amount: 2, unit: 'pieces' },
    ],
    instructions: [
      { id: '1', step: 1, description: 'Cut chicken into pieces' },
      { id: '2', step: 2, description: 'Heat oil in a pan' },
    ],
  };

  describe('calculateMatchScore', () => {
    it('should return 0 for empty ingredients', () => {
      const score = calculateMatchScore([], mockRecipe);
      expect(score).toBe(0);
    });

    it('should return 0 for recipe with no ingredients, tags, or title match', () => {
      const recipeWithoutIngredients: Recipe = {
        ...mockRecipe,
        ingredients: [],
        tags: [],
        title: 'Unrelated Dish',
        description: 'No matching content',
      };
      const score = calculateMatchScore(['chicken'], recipeWithoutIngredients);
      expect(score).toBe(0);
    });

    it('should calculate exact match score', () => {
      const score = calculateMatchScore(['chicken'], mockRecipe);
      expect(score).toBeGreaterThan(0);
    });

    it('should calculate partial match score', () => {
      const score = calculateMatchScore(['chicken', 'onion'], mockRecipe);
      expect(score).toBeGreaterThan(0);
    });

    it('should calculate tag match score', () => {
      const score = calculateMatchScore(['indian'], mockRecipe);
      expect(score).toBeGreaterThan(0);
    });

    it('should calculate title match score', () => {
      const score = calculateMatchScore(['curry'], mockRecipe);
      expect(score).toBeGreaterThan(0);
    });

    it('should calculate description match score', () => {
      const score = calculateMatchScore(['spices'], mockRecipe);
      expect(score).toBeGreaterThan(0);
    });

    it('should return higher score for more matches', () => {
      const score1 = calculateMatchScore(['chicken'], mockRecipe);
      const score2 = calculateMatchScore(['chicken', 'onion', 'garlic'], mockRecipe);
      expect(score2).toBeGreaterThan(score1);
    });

    it('should handle case-insensitive matching', () => {
      const score1 = calculateMatchScore(['CHICKEN'], mockRecipe);
      const score2 = calculateMatchScore(['chicken'], mockRecipe);
      expect(score1).toBe(score2);
    });

    it('should handle ingredient name variations', () => {
      const score = calculateMatchScore(['chicken breast'], mockRecipe);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('findRelatedRecipes', () => {
    const mockRecipes: Recipe[] = [
      mockRecipe,
      {
        ...mockRecipe,
        id: '2',
        title: 'Beef Steak',
        ingredients: [
          { id: '1', name: 'Beef', amount: 500, unit: 'g' },
          { id: '2', name: 'Pepper', amount: 1, unit: 'tsp' },
        ],
        tags: ['Western', 'Beef'],
      },
      {
        ...mockRecipe,
        id: '3',
        title: 'Vegetable Stir Fry',
        ingredients: [
          { id: '1', name: 'Onion', amount: 1, unit: 'piece' },
          { id: '2', name: 'Garlic', amount: 3, unit: 'cloves' },
          { id: '3', name: 'Carrot', amount: 2, unit: 'pieces' },
        ],
        tags: ['Vegetarian', 'Quick'],
      },
    ];

    it('should return empty array for empty ingredients', () => {
      const results = findRelatedRecipes([], mockRecipes);
      expect(results).toEqual([]);
    });

    it('should return empty array for empty recipes', () => {
      const results = findRelatedRecipes(['chicken'], []);
      expect(results).toEqual([]);
    });

    it('should find related recipes', () => {
      const results = findRelatedRecipes(['chicken'], mockRecipes);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('1');
    });

    it('should sort recipes by match score', () => {
      const results = findRelatedRecipes(['onion', 'garlic'], mockRecipes);
      expect(results.length).toBeGreaterThan(0);
      // Recipe with more matches should be first
      const firstRecipe = results[0];
      expect(firstRecipe.ingredients?.some(ing => 
        ing.name.toLowerCase().includes('onion') || ing.name.toLowerCase().includes('garlic')
      )).toBe(true);
    });

    it('should limit results to maxResults', () => {
      const results = findRelatedRecipes(['onion'], mockRecipes, 1);
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should filter out recipes with score 0', () => {
      const results = findRelatedRecipes(['nonexistent'], mockRecipes);
      expect(results.length).toBe(0);
    });

    it('should handle multiple ingredients', () => {
      const results = findRelatedRecipes(['chicken', 'onion', 'garlic'], mockRecipes);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});

