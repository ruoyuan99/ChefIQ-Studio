/**
 * Test script for AI-enhanced YouTube search
 * This script tests the generateYouTubeSearchQuery function
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Test recipe data
const testRecipes = [
  {
    name: 'Chicken Stir Fry',
    data: {
      title: 'Chicken and Tofu Stir Fry',
      description: 'A quick and easy stir fry with chicken, tofu, and vegetables in a savory sauce',
      ingredients: [
        { name: 'chicken breast', amount: '500g', unit: 'g' },
        { name: 'tofu', amount: '300g', unit: 'g' },
        { name: 'soy sauce', amount: '3', unit: 'tbsp' },
        { name: 'garlic', amount: '3', unit: 'cloves' },
        { name: 'ginger', amount: '1', unit: 'inch' },
        { name: 'bell peppers', amount: '2', unit: 'pieces' },
      ],
      cookware: 'Stovetop',
      cuisine: 'Chinese',
      cookingTime: '20 minutes',
    },
  },
  {
    name: 'Chocolate Pudding',
    data: {
      title: 'Chocolate Pudding Pots',
      description: 'Rich and creamy chocolate pudding served in individual pots',
      ingredients: [
        { name: 'dark chocolate', amount: '200g', unit: 'g' },
        { name: 'heavy cream', amount: '500ml', unit: 'ml' },
        { name: 'sugar', amount: '50g', unit: 'g' },
        { name: 'egg yolks', amount: '4', unit: 'pieces' },
      ],
      cookware: 'Oven',
      cuisine: 'Dessert',
      cookingTime: '30 minutes',
    },
  },
  {
    name: 'Grilled Salmon',
    data: {
      title: 'Grilled Salmon with Lemon',
      description: 'Tender grilled salmon with fresh lemon and herbs',
      ingredients: [
        { name: 'salmon fillets', amount: '4', unit: 'pieces' },
        { name: 'lemon', amount: '2', unit: 'pieces' },
        { name: 'olive oil', amount: '2', unit: 'tbsp' },
        { name: 'fresh dill', amount: '2', unit: 'tbsp' },
      ],
      cookware: 'Grill',
      cuisine: 'Mediterranean',
      cookingTime: '15 minutes',
    },
  },
];

/**
 * Test AI-enhanced YouTube search for a recipe
 */
async function testYouTubeSearch(recipeName, recipeData) {
  try {
    console.log(`\n🧪 Testing YouTube search for: "${recipeName}"`);
    console.log(`📝 Recipe: ${recipeData.title}`);
    console.log(`🍳 Cookware: ${recipeData.cookware}`);
    console.log(`🌍 Cuisine: ${recipeData.cuisine || 'N/A'}`);
    console.log(`⏱️  Cooking Time: ${recipeData.cookingTime || 'N/A'}`);
    console.log(`\n📋 Ingredients: ${recipeData.ingredients.map(ing => ing.name).join(', ')}`);
    
    // Call the backend API
    const response = await axios.post(`${BACKEND_URL}/api/generate-recipe-from-ingredients`, {
      ingredients: recipeData.ingredients.map(ing => ing.name),
      cookware: recipeData.cookware,
      cuisine: recipeData.cuisine || null,
      servings: '4',
      dietaryRestrictions: [],
    }, {
      timeout: 30000, // 30 seconds timeout
    });
    
    if (response.data.success) {
      const { recipe, youtubeVideos } = response.data;
      
      console.log(`\n✅ Recipe generated successfully!`);
      console.log(`📺 YouTube Search URL: ${youtubeVideos?.searchUrl || 'N/A'}`);
      console.log(`📹 Videos found: ${youtubeVideos?.videos?.length || 0}`);
      
      if (youtubeVideos?.videos && youtubeVideos.videos.length > 0) {
        console.log(`\n🎬 Top videos:`);
        youtubeVideos.videos.slice(0, 3).forEach((video, index) => {
          console.log(`\n  ${index + 1}. ${video.title}`);
          console.log(`     Channel: ${video.channelTitle}`);
          console.log(`     URL: ${video.url}`);
        });
      } else {
        console.log(`\n⚠️  No videos found (this might be due to missing YouTube API key)`);
        console.log(`🔗 You can search manually: ${youtubeVideos?.searchUrl}`);
      }
      
      // Check if AI search query was used (check server logs or search URL)
      if (youtubeVideos?.searchUrl) {
        const searchQuery = decodeURIComponent(youtubeVideos.searchUrl.split('search_query=')[1]?.split('&')[0] || '');
        console.log(`\n🤖 AI-generated search query: "${searchQuery}"`);
        console.log(`   (Compare with basic: "${recipeData.title} ${recipeData.cookware} recipe")`);
      }
    } else {
      console.error(`❌ Error: ${response.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    if (error.response) {
      console.error(`❌ API Error: ${error.response.status} - ${error.response.data.error || error.response.statusText}`);
    } else if (error.request) {
      console.error(`❌ Network Error: Could not reach backend server at ${BACKEND_URL}`);
      console.error(`   Make sure the server is running: npm start`);
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

/**
 * Test all recipes
 */
async function runTests() {
  console.log('🚀 Starting AI-enhanced YouTube search tests...');
  console.log(`📍 Backend URL: ${BACKEND_URL}`);
  console.log(`\n⚠️  Note: This test requires:`);
  console.log(`   1. Backend server running on ${BACKEND_URL}`);
  console.log(`   2. OPENAI_API_KEY configured in .env`);
  console.log(`   3. (Optional) YOUTUBE_API_KEY for video details`);
  
  // Test each recipe
  for (const testRecipe of testRecipes) {
    await testYouTubeSearch(testRecipe.name, testRecipe.data);
    
    // Wait a bit between tests to avoid rate limiting
    if (testRecipe !== testRecipes[testRecipes.length - 1]) {
      console.log(`\n⏳ Waiting 2 seconds before next test...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n✅ All tests completed!`);
  console.log(`\n💡 Tips:`);
  console.log(`   - Check server logs for AI-generated search queries`);
  console.log(`   - Compare AI queries with basic queries to see the improvement`);
  console.log(`   - If videos are empty, check YOUTUBE_API_KEY configuration`);
}

// Run tests
runTests().catch(console.error);

