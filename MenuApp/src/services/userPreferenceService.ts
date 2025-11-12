import { Recipe } from '../types';

export interface UserPreference {
  preferredTags: { [tag: string]: number }; // Tag preference with weight
  preferredCookingTimes: string[]; // Preferred cooking times
  preferredCookware: string[]; // Preferred cookware
  preferredIngredients: { [ingredient: string]: number }; // Ingredient preference with weight
  preferredServings: string[]; // Preferred servings
  preferredCuisines: string[]; // Preferred cuisines (extracted from tags)
  totalInteractions: number; // Total number of user interactions
}

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

export class UserPreferenceService {
  /**
   * Analyze user behavior and extract preferences
   * @param likedRecipeIds - Array of recipe IDs the user has liked
   * @param favoriteRecipes - Array of recipes the user has favorited
   * @param triedRecipeIds - Array of recipe IDs the user has tried
   * @param allRecipes - All available recipes (to look up recipe details)
   * @returns UserPreference object
   */
  static analyzeUserPreferences(
    likedRecipeIds: string[],
    favoriteRecipes: Recipe[],
    triedRecipeIds: string[],
    allRecipes: Recipe[]
  ): UserPreference {
    // Combine all interacted recipes
    const interactedRecipeIds = new Set([
      ...likedRecipeIds,
      ...favoriteRecipes.map(r => r.id),
      ...triedRecipeIds,
    ]);

    // Get recipe details for interacted recipes
    const interactedRecipes = allRecipes.filter(r => interactedRecipeIds.has(r.id));

    // Initialize preference objects
    const preferredTags: { [tag: string]: number } = {};
    const preferredCookingTimes: string[] = [];
    const preferredCookware: string[] = [];
    const preferredIngredients: { [ingredient: string]: number } = {};
    const preferredServings: string[] = [];
    const preferredCuisines: string[] = [];

    // Weight different interaction types
    const likeWeight = 1.0;
    const favoriteWeight = 1.5; // Favorites are more important than likes
    const triedWeight = 2.0; // Tried recipes are most important

    // Analyze each interacted recipe
    interactedRecipes.forEach(recipe => {
      const isLiked = likedRecipeIds.includes(recipe.id);
      const isFavorite = favoriteRecipes.some(r => r.id === recipe.id);
      const isTried = triedRecipeIds.includes(recipe.id);

      // Calculate weight for this recipe
      let recipeWeight = 0;
      if (isTried) recipeWeight += triedWeight;
      if (isFavorite) recipeWeight += favoriteWeight;
      if (isLiked) recipeWeight += likeWeight;

      // Extract tags
      if (recipe.tags && recipe.tags.length > 0) {
        recipe.tags.forEach(tag => {
          const lowerTag = tag.toLowerCase();
          preferredTags[lowerTag] = (preferredTags[lowerTag] || 0) + recipeWeight;
        });
      }

      // Extract cooking time
      if (recipe.cookingTime) {
        const normalizedTime = normalizeCookingTime(recipe.cookingTime);
        if (normalizedTime && !preferredCookingTimes.includes(normalizedTime)) {
          preferredCookingTimes.push(normalizedTime);
        }
      }

      // Extract cookware
      if (recipe.cookware) {
        const cookware = recipe.cookware.toLowerCase();
        if (!preferredCookware.includes(cookware)) {
          preferredCookware.push(cookware);
        }
      }

      // Extract ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ingredient => {
          const ingredientName = ingredient.name.toLowerCase().trim();
          preferredIngredients[ingredientName] = (preferredIngredients[ingredientName] || 0) + recipeWeight;
        });
      }

      // Extract servings
      if (recipe.servings) {
        const normalizedServings = normalizeServings(recipe.servings);
        if (normalizedServings && !preferredServings.includes(normalizedServings)) {
          preferredServings.push(normalizedServings);
        }
      }

      // Extract cuisines from tags
      if (recipe.tags && recipe.tags.length > 0) {
        const cuisines = extractCuisine(recipe.tags);
        cuisines.forEach(cuisine => {
          if (!preferredCuisines.includes(cuisine)) {
            preferredCuisines.push(cuisine);
          }
        });
      }
    });

    // Calculate total interactions
    const totalInteractions = interactedRecipeIds.size;

    return {
      preferredTags,
      preferredCookingTimes,
      preferredCookware,
      preferredIngredients,
      preferredServings,
      preferredCuisines,
      totalInteractions,
    };
  }

  /**
   * Check if user has enough data for recommendation
   * @param preference - UserPreference object
   * @returns boolean indicating if user has enough data
   */
  static hasEnoughData(preference: UserPreference): boolean {
    return preference.totalInteractions >= 1; // At least 1 interaction
  }

  /**
   * Get top N preferred tags
   * @param preference - UserPreference object
   * @param topN - Number of top tags to return (default: 10)
   * @returns Array of top tags sorted by weight
   */
  static getTopTags(preference: UserPreference, topN: number = 10): string[] {
    return Object.entries(preference.preferredTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([tag]) => tag);
  }

  /**
   * Get top N preferred ingredients
   * @param preference - UserPreference object
   * @param topN - Number of top ingredients to return (default: 10)
   * @returns Array of top ingredients sorted by weight
   */
  static getTopIngredients(preference: UserPreference, topN: number = 10): string[] {
    return Object.entries(preference.preferredIngredients)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([ingredient]) => ingredient);
  }
}

