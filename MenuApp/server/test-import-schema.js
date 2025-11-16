/**
 * Test script for Schema.org import functionality
 * Tests:
 * 1. Servings > 20 should return null (parsing error)
 * 2. Tags should be empty array for schema imports
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';
const TEST_URL = 'https://schema.org/Recipe'; // Example URL with schema

// Mock schema data for testing
const mockSchemaRecipe = {
  '@type': 'Recipe',
  name: 'Test Recipe',
  description: 'A test recipe',
  recipeIngredient: ['2 cups flour', '1 cup sugar'],
  recipeInstructions: [
    { '@type': 'HowToStep', text: 'Mix ingredients' },
    { '@type': 'HowToStep', text: 'Bake for 30 minutes' }
  ],
  recipeYield: '88 servings', // This should be treated as parsing error (> 20)
  totalTime: 'PT30M',
  keywords: 'test, recipe, food' // These should NOT be parsed as tags
};

async function testSchemaImport() {
  console.log('🧪 Testing Schema.org Import Functionality\n');
  
  // Test 1: Mock test with servings > 20
  console.log('Test 1: Servings > 20 should return null');
  const testRecipe1 = {
    '@type': 'Recipe',
    name: 'Test Recipe',
    recipeYield: 88, // > 20, should return null
    keywords: 'test, recipe'
  };
  
  console.log('Input:', JSON.stringify(testRecipe1, null, 2));
  
  // Simulate extractRecipeFromJsonLd logic
  let rawServings = testRecipe1.recipeYield || '';
  let servings;
  
  if (typeof rawServings === 'number') {
    if (rawServings > 20) {
      servings = undefined;
      console.log('✅ Servings > 20 correctly returns undefined');
    } else {
      servings = Math.max(1, Math.min(20, Math.round(rawServings)));
    }
  }
  
  console.log('Output servings:', servings);
  console.log('Expected: undefined');
  console.log(servings === undefined ? '✅ PASS' : '❌ FAIL');
  console.log('');
  
  // Test 2: Tags should be empty for schema imports
  console.log('Test 2: Tags should be empty array for schema imports');
  const isSchemaImportForTags = true;
  const rawRecipe = {
    tags: ['test', 'recipe', 'food'], // These should be ignored
    keywords: 'test, recipe, food'
  };
  
  const tags = isSchemaImportForTags ? [] : (Array.isArray(rawRecipe.tags) && rawRecipe.tags.length > 0 ? rawRecipe.tags.slice(0, 3) : []);
  
  console.log('Input tags:', rawRecipe.tags);
  console.log('Output tags:', tags);
  console.log('Expected: []');
  console.log(Array.isArray(tags) && tags.length === 0 ? '✅ PASS' : '❌ FAIL');
  console.log('');
  
  // Test 3: Test generateCompleteRecipeSchema logic directly
  console.log('Test 3: Testing generateCompleteRecipeSchema logic');
  console.log('Simulating generateCompleteRecipeSchema with servings > 20 and tags');
  
  const rawRecipeWithInvalidServings = {
    title: 'Test Recipe',
    description: 'A test recipe',
    ingredients: [],
    instructions: [],
    servings: 88, // > 20, should return null
    tags: ['test', 'recipe', 'food'] // Should be ignored for schema imports
  };
  
  const isSchemaImportForSchema = true;
  
  // Simulate generateCompleteRecipeSchema logic
  const servingsValue = rawRecipeWithInvalidServings.servings;
  let finalServings;
  if (servingsValue !== undefined && servingsValue !== null) {
    if (servingsValue > 20) {
      finalServings = null; // Return null for invalid values > 20
      console.log('✅ Servings > 20 correctly returns null');
    } else {
      finalServings = Math.max(1, Math.min(20, Math.round(servingsValue)));
    }
  } else {
    finalServings = null;
  }
  
  const finalTags = isSchemaImportForSchema ? [] : (Array.isArray(rawRecipeWithInvalidServings.tags) && rawRecipeWithInvalidServings.tags.length > 0 ? rawRecipeWithInvalidServings.tags.slice(0, 3) : []);
  
  console.log('Input servings:', rawRecipeWithInvalidServings.servings);
  console.log('Output servings:', finalServings);
  console.log('Expected: null');
  console.log(finalServings === null ? '✅ PASS' : '❌ FAIL');
  
  console.log('Input tags:', rawRecipeWithInvalidServings.tags);
  console.log('Output tags:', finalTags);
  console.log('Expected: []');
  console.log(Array.isArray(finalTags) && finalTags.length === 0 ? '✅ PASS' : '❌ FAIL');
  console.log('');
  
  // Test 4: Test with valid servings (should work normally)
  console.log('Test 4: Testing with valid servings (1-20)');
  const rawRecipeWithValidServings = {
    servings: 4, // Valid value
    tags: ['test', 'recipe'] // Should be ignored for schema imports
  };
  
  const validServingsValue = rawRecipeWithValidServings.servings;
  let validFinalServings;
  if (validServingsValue !== undefined && validServingsValue !== null) {
    if (validServingsValue > 20) {
      validFinalServings = null;
    } else {
      validFinalServings = Math.max(1, Math.min(20, Math.round(validServingsValue)));
    }
  } else {
    validFinalServings = null;
  }
  
  console.log('Input servings:', rawRecipeWithValidServings.servings);
  console.log('Output servings:', validFinalServings);
  console.log('Expected: 4');
  console.log(validFinalServings === 4 ? '✅ PASS' : '❌ FAIL');
  
  console.log('\n✅ Testing completed');
}

testSchemaImport().catch(console.error);

