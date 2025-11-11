/**
 * Recipe Matcher Utility
 * Matches recipes based on ingredients, tags, and title
 */

import { Recipe } from '../types';

/**
 * Calculate match score between user ingredients and a recipe
 */
export function calculateMatchScore(userIngredients: string[], recipe: Recipe): number {
  const recipeIngredients = (recipe.ingredients || []).map(ing => ing.name.toLowerCase().trim());
  const userIngredientsLower = userIngredients.map(ing => ing.toLowerCase().trim());
  
  // Calculate ingredient matches (higher weight)
  let ingredientMatches = 0;
  userIngredientsLower.forEach(userIng => {
    // Check if user ingredient matches any recipe ingredient
    const hasMatch = recipeIngredients.some(recipeIng => {
      // Exact match
      if (recipeIng === userIng) return true;
      // Partial match (contains or is contained)
      if (recipeIng.includes(userIng) || userIng.includes(recipeIng)) return true;
      // Word match (check if words overlap)
      const recipeWords = recipeIng.split(/\s+/);
      const userWords = userIng.split(/\s+/);
      return recipeWords.some(rw => userWords.some(uw => rw === uw || rw.includes(uw) || uw.includes(rw)));
    });
    if (hasMatch) ingredientMatches++;
  });
  
  // Calculate tag matches (medium weight)
  const tagMatches = (recipe.tags || []).filter(tag => {
    const tagLower = tag.toLowerCase();
    return userIngredientsLower.some(ing => tagLower.includes(ing) || ing.includes(tagLower));
  }).length;
  
  // Calculate title/description match (lower weight)
  const titleLower = recipe.title.toLowerCase();
  const descriptionLower = (recipe.description || '').toLowerCase();
  const titleMatch = userIngredientsLower.some(ing => titleLower.includes(ing)) ? 1 : 0;
  const descriptionMatch = userIngredientsLower.some(ing => descriptionLower.includes(ing)) ? 1 : 0;
  
  // Weighted score: ingredients (x3), tags (x2), title (x1), description (x1)
  const score = (ingredientMatches * 3) + (tagMatches * 2) + titleMatch + descriptionMatch;
  
  return score;
}

/**
 * Find related recipes based on user ingredients
 */
export function findRelatedRecipes(
  userIngredients: string[],
  allRecipes: Recipe[],
  maxResults: number = 10
): Recipe[] {
  if (userIngredients.length === 0) {
    return [];
  }
  
  // Calculate match score for each recipe
  const recipesWithScore = allRecipes.map(recipe => ({
    recipe,
    score: calculateMatchScore(userIngredients, recipe),
  }));
  
  // Filter recipes with score > 0 and sort by score (descending)
  const sortedRecipes = recipesWithScore
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.recipe);
  
  return sortedRecipes;
}

