/**
 * Direct test script for AI-enhanced YouTube search
 * This script directly calls the searchYouTubeVideos function (requires server code)
 * 
 * Usage: node test-youtube-ai-direct.js
 */

require('dotenv').config();
const OpenAI = require('openai');

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

if (!openai) {
  console.error('❌ OPENAI_API_KEY is not set in .env file');
  process.exit(1);
}

/**
 * Generate optimized YouTube search queries using AI
 */
async function generateYouTubeSearchQuery(recipeData) {
  try {
    const prompt = `You are a YouTube search query optimizer. Given a recipe, generate the most effective YouTube search queries that will find relevant cooking tutorial videos.

Recipe Information:
- Title: ${recipeData.title || 'Unknown'}
- Description: ${recipeData.description || 'No description'}
- Ingredients: ${recipeData.ingredients ? recipeData.ingredients.map(ing => ing.name || ing).join(', ') : 'Unknown'}
- Cookware: ${recipeData.cookware || 'Unknown'}
- Cuisine: ${recipeData.cuisine || 'Unknown'}
- Cooking Time: ${recipeData.cookingTime || 'Unknown'}

Generate 1-3 optimized YouTube search queries that will find the most relevant cooking tutorial videos for this recipe. The queries should:
1. Be specific and relevant to the recipe
2. Include key ingredients or cooking methods
3. Consider the cookware and cuisine type
4. Be in English
5. Be concise (under 10 words each)

Return ONLY a JSON array of search query strings, no other text. Example: ["chicken stir fry recipe", "easy chicken wok tutorial"]`;

    console.log(`\n🤖 Calling OpenAI to generate search query...`);
    console.log(`📝 Recipe: ${recipeData.title}`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a YouTube search query optimizer. Always return a valid JSON array of search query strings.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    
    console.log(`\n📥 Raw AI Response:`);
    console.log(responseText);
    
    // Try to parse JSON array from response
    let searchQueries = [];
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      searchQueries = JSON.parse(cleanedText);
      
      // Ensure it's an array
      if (!Array.isArray(searchQueries)) {
        searchQueries = [searchQueries];
      }
      
      console.log(`\n✅ Successfully parsed ${searchQueries.length} search query(ies):`);
      searchQueries.forEach((query, index) => {
        console.log(`   ${index + 1}. "${query}"`);
      });
      
      return searchQueries;
    } catch (parseError) {
      console.error(`\n❌ Failed to parse AI response as JSON:`);
      console.error(`   Error: ${parseError.message}`);
      console.error(`   Response: ${responseText}`);
      return null;
    }
  } catch (error) {
    console.error(`\n❌ Error generating YouTube search query with AI:`);
    console.error(`   ${error.message}`);
    return null;
  }
}

/**
 * Test recipes
 */
const testRecipes = [
  {
    name: 'Chicken Stir Fry',
    data: {
      title: 'Chicken and Tofu Stir Fry',
      description: 'A quick and easy stir fry with chicken, tofu, and vegetables in a savory sauce',
      ingredients: [
        { name: 'chicken breast' },
        { name: 'tofu' },
        { name: 'soy sauce' },
        { name: 'garlic' },
        { name: 'ginger' },
        { name: 'bell peppers' },
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
        { name: 'dark chocolate' },
        { name: 'heavy cream' },
        { name: 'sugar' },
        { name: 'egg yolks' },
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
        { name: 'salmon fillets' },
        { name: 'lemon' },
        { name: 'olive oil' },
        { name: 'fresh dill' },
      ],
      cookware: 'Grill',
      cuisine: 'Mediterranean',
      cookingTime: '15 minutes',
    },
  },
];

/**
 * Compare AI query with basic query
 */
function compareQueries(recipeData, aiQueries) {
  const basicQuery = `${recipeData.title} ${recipeData.cookware} recipe`;
  console.log(`\n📊 Query Comparison:`);
  console.log(`   Basic query: "${basicQuery}"`);
  if (aiQueries && aiQueries.length > 0) {
    console.log(`   AI query(ies):`);
    aiQueries.forEach((query, index) => {
      console.log(`      ${index + 1}. "${query}"`);
    });
    console.log(`\n💡 The AI query is more specific and should yield better results!`);
  }
}

/**
 * Run tests
 */
async function runTests() {
  console.log('🚀 Starting direct AI-enhanced YouTube search query generation tests...');
  console.log(`📍 Using OpenAI API: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  
  for (const testRecipe of testRecipes) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Test: ${testRecipe.name}`);
    console.log(`${'='.repeat(60)}`);
    
    const aiQueries = await generateYouTubeSearchQuery(testRecipe.data);
    
    if (aiQueries) {
      compareQueries(testRecipe.data, aiQueries);
      
      // Generate YouTube search URLs
      console.log(`\n🔗 Generated YouTube Search URLs:`);
      aiQueries.forEach((query, index) => {
        const encodedQuery = encodeURIComponent(query);
        const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
        console.log(`   ${index + 1}. ${searchUrl}`);
      });
    }
    
    // Wait between tests
    if (testRecipe !== testRecipes[testRecipes.length - 1]) {
      console.log(`\n⏳ Waiting 2 seconds before next test...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ All tests completed!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Compare the AI-generated queries with basic queries`);
  console.log(`   2. Test the queries manually on YouTube to see the improvement`);
  console.log(`   3. Check server logs when using the full API to see AI queries in action`);
}

// Run tests
runTests().catch(console.error);

