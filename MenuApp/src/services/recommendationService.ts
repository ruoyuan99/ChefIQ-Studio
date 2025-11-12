import { Recipe } from '../types';
import { UserPreference, UserPreferenceService } from './userPreferenceService';

export interface RecommendationScore {
  recipe: Recipe;
  score: number;
  reasons: string[]; // Reasons for recommendation
}

// Normalize cooking time string to category
const normalizeCookingTime = (cookingTime: string): string => {
  if (!cookingTime) return '';
  const time = cookingTime.toLowerCase();
  if (time.includes('< 15') || time.includes('15') || time.includes('10') || time.includes('quick')) {
    return 'quick';
  }
  if (time.includes('20') || time.includes('25') || time.includes('30') || time.includes('medium')) {
    return 'medium';
  }
  if (time.includes('35') || time.includes('40') || time.includes('45') || time.includes('50') || time.includes('60') || time.includes('>') || time.includes('long')) {
    return 'long';
  }
  return '';
};

// Normalize servings string
const normalizeServings = (servings: string): string => {
  if (!servings) return '';
  const serving = servings.toString().toLowerCase();
  if (serving.includes('1') || serving.includes('2')) {
    return '1-2';
  }
  if (serving.includes('3') || serving.includes('4')) {
    return '3-4';
  }
  if (serving.includes('5') || serving.includes('6') || serving.includes('+')) {
    return '5+';
  }
  return '';
};

// Common cuisine tags
const CUISINE_TAGS = [
  'italian', 'chinese', 'japanese', 'thai', 'indian', 'mexican',
  'french', 'mediterranean', 'american', 'asian', 'korean', 'vietnamese',
  'greek', 'spanish', 'middle eastern', 'latin', 'caribbean'
];

// Extract cuisine from tags
const extractCuisine = (tags: string[]): string[] => {
  const cuisines: string[] = [];
  tags.forEach(tag => {
    const lowerTag = tag.toLowerCase();
    CUISINE_TAGS.forEach(cuisine => {
      if (lowerTag.includes(cuisine) && !cuisines.includes(cuisine)) {
        cuisines.push(cuisine);
      }
    });
  });
  return cuisines;
};

export class RecommendationService {
  // Recommendation weights
  private static readonly WEIGHTS = {
    tagMatch: 0.4, // 40% - Tag matching
    cookingTime: 0.2, // 20% - Cooking time matching
    cookware: 0.15, // 15% - Cookware matching
    ingredients: 0.15, // 15% - Ingredient matching
    servings: 0.1, // 10% - Servings matching
  };

  /**
   * Calculate recommendation score for a single recipe
   * @param recipe - Recipe to score
   * @param userPreference - User preference data
   * @returns RecommendationScore object
   */
  static calculateRecommendationScore(
    recipe: Recipe,
    userPreference: UserPreference
  ): RecommendationScore {
    const reasons: string[] = [];
    let totalScore = 0;

    // 1. Tag matching (40%)
    const tagScore = this.calculateTagScore(recipe, userPreference, reasons);
    totalScore += tagScore * this.WEIGHTS.tagMatch;

    // 2. Cooking time matching (20%)
    const cookingTimeScore = this.calculateCookingTimeScore(recipe, userPreference, reasons);
    totalScore += cookingTimeScore * this.WEIGHTS.cookingTime;

    // 3. Cookware matching (15%)
    const cookwareScore = this.calculateCookwareScore(recipe, userPreference, reasons);
    totalScore += cookwareScore * this.WEIGHTS.cookware;

    // 4. Ingredient matching (15%)
    const ingredientsScore = this.calculateIngredientsScore(recipe, userPreference, reasons);
    totalScore += ingredientsScore * this.WEIGHTS.ingredients;

    // 5. Servings matching (10%)
    const servingsScore = this.calculateServingsScore(recipe, userPreference, reasons);
    totalScore += servingsScore * this.WEIGHTS.servings;

    return {
      recipe,
      score: totalScore,
      reasons: reasons.slice(0, 3), // Limit to top 3 reasons
    };
  }

  /**
   * Calculate tag matching score
   */
  private static calculateTagScore(
    recipe: Recipe,
    userPreference: UserPreference,
    reasons: string[]
  ): number {
    if (!recipe.tags || recipe.tags.length === 0) {
      return 0;
    }

    if (Object.keys(userPreference.preferredTags).length === 0) {
      return 0;
    }

    let matchingTags = 0;
    let totalTagWeight = 0;
    const matchedTagNames: string[] = [];

    recipe.tags.forEach(tag => {
      const lowerTag = tag.toLowerCase();
      if (userPreference.preferredTags[lowerTag]) {
        matchingTags++;
        totalTagWeight += userPreference.preferredTags[lowerTag];
        matchedTagNames.push(tag);
      }
    });

    if (matchingTags === 0) {
      return 0;
    }

    // Calculate score: (matching tags / total user preference tags) * average weight
    const totalUserTags = Object.keys(userPreference.preferredTags).length;
    const tagRatio = matchingTags / Math.max(totalUserTags, recipe.tags.length);
    const averageWeight = totalTagWeight / matchingTags;
    const score = Math.min(100, tagRatio * 100 * (averageWeight / 2.0)); // Normalize weight

    if (score > 20 && matchedTagNames.length > 0) {
      reasons.push(`Matches your interests: ${matchedTagNames.slice(0, 2).join(', ')}`);
    }

    return score;
  }

  /**
   * Calculate cooking time matching score
   */
  private static calculateCookingTimeScore(
    recipe: Recipe,
    userPreference: UserPreference,
    reasons: string[]
  ): number {
    if (!recipe.cookingTime) {
      return 0;
    }

    if (userPreference.preferredCookingTimes.length === 0) {
      return 0;
    }

    const normalizedTime = normalizeCookingTime(recipe.cookingTime);
    if (normalizedTime && userPreference.preferredCookingTimes.includes(normalizedTime)) {
      reasons.push(`Matches your preferred cooking time`);
      return 100;
    }

    return 0;
  }

  /**
   * Calculate cookware matching score
   */
  private static calculateCookwareScore(
    recipe: Recipe,
    userPreference: UserPreference,
    reasons: string[]
  ): number {
    if (!recipe.cookware) {
      return 0;
    }

    if (userPreference.preferredCookware.length === 0) {
      return 0;
    }

    const cookware = recipe.cookware.toLowerCase();
    if (userPreference.preferredCookware.includes(cookware)) {
      reasons.push(`Uses your preferred cookware: ${recipe.cookware}`);
      return 100;
    }

    return 0;
  }

  /**
   * Calculate ingredient matching score
   */
  private static calculateIngredientsScore(
    recipe: Recipe,
    userPreference: UserPreference,
    reasons: string[]
  ): number {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return 0;
    }

    if (Object.keys(userPreference.preferredIngredients).length === 0) {
      return 0;
    }

    let matchingIngredients = 0;
    let totalIngredientWeight = 0;
    const matchedIngredientNames: string[] = [];

    recipe.ingredients.forEach(ingredient => {
      const ingredientName = ingredient.name.toLowerCase().trim();
      if (userPreference.preferredIngredients[ingredientName]) {
        matchingIngredients++;
        totalIngredientWeight += userPreference.preferredIngredients[ingredientName];
        matchedIngredientNames.push(ingredient.name);
      }
    });

    if (matchingIngredients === 0) {
      return 0;
    }

    // Calculate score: (matching ingredients / total user preference ingredients) * average weight
    const totalUserIngredients = Object.keys(userPreference.preferredIngredients).length;
    const ingredientRatio = matchingIngredients / Math.max(totalUserIngredients, recipe.ingredients.length);
    const averageWeight = totalIngredientWeight / matchingIngredients;
    const score = Math.min(100, ingredientRatio * 100 * (averageWeight / 2.0)); // Normalize weight

    if (score > 20 && matchedIngredientNames.length > 0) {
      reasons.push(`Uses your favorite ingredients: ${matchedIngredientNames.slice(0, 2).join(', ')}`);
    }

    return score;
  }

  /**
   * Calculate servings matching score
   */
  private static calculateServingsScore(
    recipe: Recipe,
    userPreference: UserPreference,
    reasons: string[]
  ): number {
    if (!recipe.servings) {
      return 0;
    }

    if (userPreference.preferredServings.length === 0) {
      return 0;
    }

    const normalizedServings = normalizeServings(recipe.servings);
    if (normalizedServings && userPreference.preferredServings.includes(normalizedServings)) {
      return 100;
    }

    return 0;
  }

  /**
   * Sort recipes by recommendation score
   * @param recipes - Array of recipes to sort
   * @param userPreference - User preference data
   * @returns Sorted array of recipes
   */
  static sortByRecommendation(
    recipes: Recipe[],
    userPreference: UserPreference
  ): Recipe[] {
    // Calculate scores for all recipes
    const scoredRecipes = recipes.map(recipe =>
      this.calculateRecommendationScore(recipe, userPreference)
    );

    // Sort by score (descending)
    scoredRecipes.sort((a, b) => b.score - a.score);

    // Return sorted recipes
    return scoredRecipes.map(scored => scored.recipe);
  }

  /**
   * Get recommendation reason for a recipe (for display)
   * @param recipe - Recipe to get reason for
   * @param userPreference - User preference data
   * @returns Recommendation reason string
   */
  static getRecommendationReason(
    recipe: Recipe,
    userPreference: UserPreference
  ): string {
    const score = this.calculateRecommendationScore(recipe, userPreference);
    if (score.reasons.length > 0) {
      return score.reasons[0]; // Return first reason
    }
    return 'Recommended based on your preferences';
  }

  /**
   * Check if recipe is highly recommended (score > threshold)
   * @param recipe - Recipe to check
   * @param userPreference - User preference data
   * @param threshold - Score threshold (default: 30)
   * @returns boolean indicating if recipe is highly recommended
   */
  static isHighlyRecommended(
    recipe: Recipe,
    userPreference: UserPreference,
    threshold: number = 30
  ): boolean {
    const score = this.calculateRecommendationScore(recipe, userPreference);
    return score.score >= threshold;
  }
}

