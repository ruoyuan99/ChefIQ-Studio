/**
 * Recipe Import Backend Server
 * 
 * This server acts as a proxy to fetch and parse recipe websites,
 * avoiding CORS issues and handling web scraping.
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');
const { logCompletionUsage } = require('./aiTokenLogger');
require('dotenv').config();

// Initialize OpenAI client (optional - only if API key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI API initialized');
} else {
  console.log('⚠️  OpenAI API key not found. AI-enhanced parsing will be disabled.');
  console.log('   Set OPENAI_API_KEY in .env file to enable AI parsing.');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request timeout configuration
const AXIOS_TIMEOUT = 30000; // 30 seconds

/**
 * Generate complete Recipe schema with all required fields
 * This ensures the frontend receives a fully-formed Recipe object
 * that matches the Recipe interface in types/index.ts
 */
function generateCompleteRecipeSchema(rawRecipe) {
  const now = new Date();
  const recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Convert ingredients to proper format with IDs
  const ingredients = (rawRecipe.ingredients || []).map((ing, index) => ({
    id: `ing_${Date.now()}_${index}`,
    name: ing.name || String(ing),
    amount: typeof ing.amount === 'number' ? ing.amount : (parseFloat(ing.amount) || 0),
    unit: ing.unit || ''
  }));

  // Convert instructions to proper format with IDs
  const instructions = (rawRecipe.instructions || []).map((inst, index) => {
    const step = typeof inst === 'object' ? (inst.step || inst.position || index + 1) : index + 1;
    const description = typeof inst === 'string' 
      ? inst 
      : (inst.description || inst.text || inst.name || '');
    
    return {
      id: `inst_${Date.now()}_${index}`,
      step: step,
      description: description.trim() || `Step ${step}`,
      imageUri: null
    };
  });

  // Validate and build complete recipe
  const recipe = {
    // Required fields
    id: recipeId,
    title: rawRecipe.title || 'Untitled Recipe',
    description: rawRecipe.description || '',
    createdAt: now,
    updatedAt: now,
    isPublic: false, // Default to private, user can change

    // Recipe content
    ingredients: ingredients,
    instructions: instructions,
    tags: Array.isArray(rawRecipe.tags) ? rawRecipe.tags : [],
    
    // Optional fields with defaults
    items: [], // Empty array, user can add menu items if needed
    cookingTime: rawRecipe.cookingTime || '',
    // Ensure servings is always a string (handle array case from Schema.org)
    servings: Array.isArray(rawRecipe.servings) 
      ? rawRecipe.servings.join(', ') 
      : (rawRecipe.servings || ''),
    cookware: rawRecipe.cookware || undefined,
    
    // Image handling
    imageUri: rawRecipe.imageUrl || null,
    image_url: rawRecipe.imageUrl || null,
    
    // Author info (will be populated by frontend from AuthContext)
    authorAvatar: null,
    authorName: undefined,
    authorBio: undefined,
    
    // Share code (generated later if needed)
    shareCode: undefined
  };

  // Validation - Only title is required
  // Other fields can be empty and saved as draft, user can complete later
  if (!recipe.title || recipe.title.trim() === '') {
    throw new Error('Recipe title is required');
  }

  // Warn about missing fields but allow saving as draft
  if (recipe.ingredients.length === 0) {
    console.warn('⚠️  Recipe has no ingredients - can be saved as draft');
  }

  if (recipe.instructions.length === 0) {
    console.warn('⚠️  Recipe has no instructions - can be saved as draft');
  }

  if (!recipe.cookingTime || recipe.cookingTime.trim() === '') {
    console.warn('⚠️  Recipe has no cooking time - can be saved as draft');
  }

  if (!recipe.servings || recipe.servings.trim() === '') {
    console.warn('⚠️  Recipe has no servings - can be saved as draft');
  }

  return recipe;
}

/**
 * Extract Recipe from Schema.org JSON-LD
 */
function extractRecipeFromJsonLd(jsonData, baseUrl) {
  // Handle both single object and array
  let recipe = null;
  
  if (Array.isArray(jsonData)) {
    recipe = jsonData.find(item => 
      item['@type'] === 'Recipe' || 
      item.type === 'Recipe' ||
      (item['@graph'] && item['@graph'].find(g => g['@type'] === 'Recipe'))
    );
    
    // Handle @graph structure
    if (!recipe && jsonData[0]?.['@graph']) {
      recipe = jsonData[0]['@graph'].find(item => item['@type'] === 'Recipe');
    }
  } else {
    if (jsonData['@type'] === 'Recipe' || jsonData.type === 'Recipe') {
      recipe = jsonData;
    } else if (jsonData.recipe) {
      recipe = jsonData.recipe;
    } else if (jsonData['@graph']) {
      recipe = jsonData['@graph'].find(item => item['@type'] === 'Recipe');
    }
  }

  if (!recipe) {
    return null;
  }

  // Parse ingredients
  const ingredients = parseIngredients(recipe.recipeIngredient || recipe.ingredients || []);
  
  // Parse instructions
  const instructions = parseInstructions(recipe.recipeInstructions || recipe.instructions || []);
  
  // Parse image
  let imageUrl = null;
  if (recipe.image) {
    if (typeof recipe.image === 'string') {
      imageUrl = recipe.image.startsWith('http') ? recipe.image : new URL(recipe.image, baseUrl).href;
    } else if (recipe.image.url) {
      imageUrl = recipe.image.url.startsWith('http') ? recipe.image.url : new URL(recipe.image.url, baseUrl).href;
    } else if (Array.isArray(recipe.image) && recipe.image[0]) {
      const img = recipe.image[0];
      imageUrl = typeof img === 'string' 
        ? (img.startsWith('http') ? img : new URL(img, baseUrl).href)
        : (img.url ? (img.url.startsWith('http') ? img.url : new URL(img.url, baseUrl).href) : null);
    }
  }

  // Parse cooking time
  const cookingTime = parseDuration(recipe.totalTime || recipe.cookTime || recipe.prepTime);

  // Parse servings
  let servings = recipe.recipeYield || recipe.yield || '';
  if (typeof servings === 'object' && servings.value) {
    servings = servings.value;
  }
  if (typeof servings === 'number') {
    servings = `${servings} servings`;
  }

  // Parse tags/keywords
  const tags = parseKeywords(recipe.keywords || recipe.recipeCategory || recipe.category);

  return {
    title: recipe.name || recipe.headline || '',
    description: recipe.description || recipe.about || '',
    imageUrl,
    ingredients,
    instructions,
    cookingTime,
    servings,
    tags,
  };
}

/**
 * Parse ingredients from various formats
 */
function parseIngredients(ingredients) {
  if (!Array.isArray(ingredients)) {
    ingredients = [ingredients];
  }

  return ingredients.map((ing, index) => {
    if (typeof ing === 'string') {
      const parsed = parseIngredientString(ing);
      return {
        name: parsed.name,
        amount: parsed.amount,
        unit: parsed.unit,
      };
    } else if (ing.name || ing.ingredient) {
      return {
        name: ing.name || ing.ingredient,
        amount: ing.amount?.toString() || '',
        unit: ing.unit || '',
      };
    }
    return {
      name: ing.toString(),
      amount: '',
      unit: '',
    };
  });
}

/**
 * Parse ingredient string like "2 cups flour"
 */
function parseIngredientString(str) {
  // Enhanced regex to match various patterns
  const patterns = [
    /^(\d+(?:\.\d+)?)\s*(\w+)?\s+(.+)$/,  // "2 cups flour"
    /^(\d+\/\d+|\d+\.\d+|\d+)\s*(\w+)?\s+(.+)$/,  // "1/2 cup sugar"
    /^(.+)$/,  // Just the name
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      if (match.length === 4) {
        return {
          amount: match[1],
          unit: match[2] || '',
          name: match[3].trim(),
        };
      } else if (match.length === 2) {
        return {
          name: match[1].trim(),
          amount: '',
          unit: '',
        };
      }
    }
  }

  return { name: str.trim(), amount: '', unit: '' };
}

/**
 * Parse instructions from various formats
 */
function parseInstructions(instructions) {
  if (!Array.isArray(instructions)) {
    instructions = [instructions];
  }

  return instructions.map((inst, index) => {
    if (typeof inst === 'string') {
      return {
        step: index + 1,
        description: inst,
      };
    } else if (inst.text) {
      return {
        step: inst.position || inst.stepNumber || index + 1,
        description: inst.text,
      };
    } else if (inst.itemListElement) {
      // Handle HowToStep format
      const text = inst.text || inst.itemListElement
        .map(item => item.text || item.name)
        .filter(Boolean)
        .join(' ');
      return {
        step: inst.position || index + 1,
        description: text,
      };
    } else if (inst['@type'] === 'HowToStep' || inst.type === 'HowToStep') {
      return {
        step: inst.position || index + 1,
        description: inst.text || inst.name || '',
      };
    }
    return {
      step: index + 1,
      description: inst.toString(),
    };
  });
}

/**
 * Parse duration string like "PT30M" (ISO 8601) or "30 minutes"
 */
function parseDuration(duration) {
  if (!duration) return undefined;
  
  // Handle ISO 8601 format (PT30M, PT1H30M)
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const hours = duration.match(/(\d+)H/);
    const minutes = duration.match(/(\d+)M/);
    const parts = [];
    
    if (hours) parts.push(`${hours[1]} hour${hours[1] !== '1' ? 's' : ''}`);
    if (minutes) parts.push(`${minutes[1]} minute${minutes[1] !== '1' ? 's' : ''}`);
    
    return parts.join(' ') || undefined;
  }
  
  // Return as-is if already formatted
  return duration.toString();
}

/**
 * Parse keywords/tags
 */
function parseKeywords(keywords) {
  if (!keywords) return [];
  
  if (typeof keywords === 'string') {
    return keywords.split(',').map(k => k.trim()).filter(Boolean);
  }
  
  if (Array.isArray(keywords)) {
    return keywords.map(k => typeof k === 'string' ? k : (k.name || k.toString())).filter(Boolean);
  }
  
  return [];
}

/**
 * Extract recipe from HTML using multiple methods
 */
function extractRecipeFromHTML(html, url) {
  const $ = cheerio.load(html);
  const baseUrl = new URL(url).origin;

  // Method 1: Try JSON-LD
  const jsonLdScripts = $('script[type="application/ld+json"]');
  
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const jsonData = JSON.parse($(jsonLdScripts[i]).html());
      const recipe = extractRecipeFromJsonLd(jsonData, url);
      if (recipe && recipe.title) {
        return recipe;
      }
    } catch (e) {
      console.log('Failed to parse JSON-LD:', e.message);
    }
  }

  // Method 2: Try Microdata (fallback)
  // This is a simplified implementation
  const recipeElement = $('[itemtype*="Recipe"], [itemtype*="schema.org/Recipe"]');
  if (recipeElement.length > 0) {
    // Basic microdata extraction
    const title = recipeElement.find('[itemprop="name"]').text().trim() ||
                  $('h1').first().text().trim();
    const description = recipeElement.find('[itemprop="description"]').text().trim() ||
                        $('meta[property="og:description"]').attr('content');
    
    if (title) {
      return {
        title,
        description: description || '',
        ingredients: [],
        instructions: [],
      };
    }
  }

  return null;
}

/**
 * Recipe JSON Schema for Structured Outputs
 * This ensures strict validation and consistent output format
 */
const RECIPE_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Recipe title, clear and concise"
    },
    description: {
      type: "string",
      description: "Recipe description or summary"
    },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Ingredient name"
          },
          amount: {
            type: "number",
            description: "Ingredient amount as a number (e.g., 1.5 for 1 1/2)"
          },
          unit: {
            type: "string",
            description: "Standardized unit (cup, tbsp, tsp, oz, lb, g, ml, etc.)"
          }
        },
        required: ["name", "amount", "unit"],
        additionalProperties: false
      },
      minItems: 1
    },
    instructions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          step: {
            type: "number",
            description: "Step number, starting from 1"
          },
          description: {
            type: "string",
            description: "Clear, concise step instruction"
          }
        },
        required: ["step", "description"],
        additionalProperties: false
      },
      minItems: 1
    },
    cookingTime: {
      type: "string",
      description: "Standardized cooking time (e.g., '30 minutes', '1 hour', '1 hour 30 minutes')"
    },
    servings: {
      type: "string",
      description: "Standardized servings format (e.g., '4 servings', '6-8 servings')"
    },
    tags: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Relevant tags (cuisine type, meal type, dietary info, etc.)"
    },
    cookware: {
      type: ["string", "null"],
      description: "Main cookware type (optional, can be null)"
    }
  },
  // Only require essential fields for extraction
  // Optional fields (cookingTime, servings, cookware) can be empty and filled later
  required: ["title", "description", "ingredients", "instructions"],
  additionalProperties: false
};

/**
 * Extract recipe using AI with Structured Outputs (Strict JSON Schema)
 * This function uses AI to intelligently parse recipe information from any website
 * Uses OpenAI Structured Outputs for guaranteed JSON Schema compliance
 */
async function extractRecipeWithAI(html, url) {
  if (!openai) {
    throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY in .env file.');
  }

  const $ = cheerio.load(html);
  
  // Clean up HTML - remove scripts, styles, and other non-content elements
  $('script, style, nav, header, footer, aside, .ad, .advertisement, .social-share').remove();
  
  // Extract main content
  const title = $('h1').first().text().trim() || $('title').text().trim();
  // Limit content length to avoid token limits (approximately 8000 characters)
  const contentText = $('main, article, .content, .recipe, .post-content').first().text().trim().substring(0, 8000);
  
  const prompt = `Extract recipe information from the following webpage content.

URL: ${url}
Title: ${title}

Webpage Content:
${contentText}

Extract ALL ingredients and instructions, even if they are in a list format.
For ingredients, extract amount as a number and unit separately when possible.
For instructions, number them sequentially starting from 1.
Only include information that is clearly a recipe.
If cooking time or servings are mentioned, include them.`;

  try {
    console.log('🤖 Using AI to extract recipe information with Structured Outputs...');
    
    // Use Structured Outputs with strict JSON Schema
    // Note: This requires OpenAI SDK 4.20.0+ and models that support structured outputs
    const completion = await openai.beta.chat.completions.parse({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a recipe extraction expert. Extract recipe information from web pages following the exact JSON schema provided.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'recipe_extraction',
          strict: true,
          schema: RECIPE_JSON_SCHEMA
        }
      }
    });

    // Structured Outputs automatically validates and parses the response
    // The parsed field contains the validated JSON matching the schema
    const recipeData = completion.choices[0].message.parsed;
    
    // Log token usage
    logCompletionUsage('extract-recipe', completion, {
      url: url,
      recipeTitle: recipeData?.title,
    });
    
    if (!recipeData || !recipeData.title) {
      throw new Error('AI did not extract a valid recipe');
    }

    console.log(`✅ AI extracted recipe: ${recipeData.title} (${recipeData.ingredients?.length || 0} ingredients, ${recipeData.instructions?.length || 0} instructions)`);
    return recipeData;

  } catch (error) {
    console.error('❌ AI extraction failed:', error.message);
    throw error;
  }
}

/**
 * API Endpoint: Import Recipe from URL
 */
app.post('/api/import-recipe', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ 
      error: 'URL is required',
      success: false 
    });
  }

  // Validate URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return res.status(400).json({ 
      error: 'Invalid URL format',
      success: false 
    });
  }

  // Only allow http/https protocols
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({ 
      error: 'Only HTTP/HTTPS URLs are allowed',
      success: false 
    });
  }

  try {
    console.log(`Fetching recipe from: ${url}`);
    
    // Fetch HTML with proper headers to avoid 403 errors
    const response = await axios.get(url, {
      timeout: AXIOS_TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      },
      maxRedirects: 5,
      validateStatus: function (status) {
        // Don't throw error for 403, handle it separately
        return status >= 200 && status < 500;
      },
    });

    // Handle 403 Forbidden - website blocks scraping
    if (response.status === 403) {
      return res.status(403).json({
        error: 'This website does not allow importing recipes. The website source has restricted access to protect intellectual property. Please try importing from a different recipe website.',
        success: false,
        statusCode: 403,
      });
    }

    // Handle other non-200 status codes
    if (response.status !== 200) {
      return res.status(response.status).json({
        error: 'This website does not allow importing recipes. The website source has restricted access to protect intellectual property. Please try importing from a different recipe website.',
        success: false,
        statusCode: response.status,
      });
    }

    // Step 1: Try Schema.org extraction (free, fast)
    let rawRecipe = extractRecipeFromHTML(response.data, url);

    // Step 2: If Schema.org failed, try AI extraction (only when needed)
    if (!rawRecipe || !rawRecipe.title) {
      if (openai) {
        try {
          console.log('📝 Schema.org extraction failed, trying AI extraction...');
          rawRecipe = await extractRecipeWithAI(response.data, url);
        } catch (aiError) {
          console.error('AI extraction error:', aiError.message);
          // Fall through to return error
        }
      }
      
      // If still no recipe found
      if (!rawRecipe || !rawRecipe.title) {
        return res.status(404).json({
          error: 'This website does not allow importing recipes. The website source has restricted access to protect intellectual property. Please try importing from a different recipe website.',
          success: false,
        });
      }
    }

    // Step 3: Generate complete Recipe schema with all required fields
    const finalRecipe = generateCompleteRecipeSchema(rawRecipe);

    console.log(`✅ Successfully extracted recipe: ${finalRecipe.title}`);
    
    res.json({
      success: true,
      recipe: finalRecipe,
    });

  } catch (error) {
    console.error('Error importing recipe:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        error: 'Request timeout. The website took too long to respond.',
        success: false,
      });
    }

    if (error.response) {
      // Handle various HTTP errors (403, 404, 429, etc.)
      const status = error.response.status;
      if (status === 403 || status === 404 || status === 429) {
        return res.status(status).json({
          error: 'This website does not allow importing recipes. The website source has restricted access to protect intellectual property. Please try importing from a different recipe website.',
          success: false,
          statusCode: status,
        });
      }
      return res.status(status).json({
        error: 'This website does not allow importing recipes. The website source has restricted access to protect intellectual property. Please try importing from a different recipe website.',
        success: false,
        statusCode: status,
      });
    }

    res.status(500).json({
      error: error.message || 'Failed to import recipe',
      success: false,
    });
  }
});

/**
 * Optimize recipe using AI
 * Takes an existing recipe and optimizes it with AI
 */
app.post('/api/optimize-recipe', async (req, res) => {
  try {
    const { recipe } = req.body;

    if (!recipe) {
      return res.status(400).json({
        error: 'Recipe data is required',
        success: false,
      });
    }

    if (!openai) {
      return res.status(503).json({
        error: 'AI optimization is not available. Please set OPENAI_API_KEY in .env file.',
        success: false,
      });
    }

    console.log(`🤖 Optimizing recipe with AI: ${recipe.title || 'Untitled'}`);

    // Use the same JSON schema as extraction for consistency
    // OpenAI Structured Outputs requires additionalProperties: false for all objects
    const RECIPE_JSON_SCHEMA = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              amount: { type: 'number' },
              unit: { type: 'string' }
            },
            required: ['name', 'amount', 'unit'],
            additionalProperties: false
          }
        },
        instructions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              description: { type: 'string' }
            },
            required: ['step', 'description'],
            additionalProperties: false
          }
        },
        cookingTime: { type: 'string' },
        servings: { type: 'string' },
        tags: {
          type: 'array',
          items: { type: 'string' }
        },
        cookware: { type: ['string', 'null'] }
      },
      required: ['title', 'description', 'ingredients', 'instructions', 'cookingTime', 'servings', 'tags', 'cookware'],
      additionalProperties: false
    };

    // Prepare recipe data for AI
    const recipeText = `
Title: ${recipe.title || 'Untitled'}
Description: ${recipe.description || ''}
Cooking Time: ${recipe.cookingTime || ''}
Servings: ${recipe.servings || ''}
Tags: ${(recipe.tags || []).join(', ')}
Cookware: ${recipe.cookware || ''}

Ingredients:
${(recipe.ingredients || []).map((ing, i) => 
  `${i + 1}. ${ing.name || ing} ${ing.amount ? `${ing.amount} ${ing.unit || ''}` : ''}`.trim()
).join('\n')}

Instructions:
${(recipe.instructions || []).map((inst, i) => 
  `${i + 1}. ${typeof inst === 'string' ? inst : (inst.description || inst.text || '')}`
).join('\n')}
    `.trim();

    const completion = await openai.beta.chat.completions.parse({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional recipe editor. Optimize and improve the given recipe by:\n' +
            '1. Making the title concise and descriptive (6 words or less, like "Chocolate Pudding Pots" or "Grilled Salmon with Lemon")\n' +
            '2. Enhancing the description to be more engaging\n' +
            '3. Standardizing ingredient names and amounts (convert to consistent units)\n' +
            '4. Improving instruction clarity and step-by-step flow\n' +
            '5. Adding relevant tags if missing\n' +
            '6. Ensuring cooking time and servings are accurate\n' +
            '7. Suggesting appropriate cookware if missing\n\n' +
            'Keep the recipe authentic and maintain its original character while making it more professional and user-friendly.'
        },
        {
          role: 'user',
          content: `Please optimize this recipe:\n\n${recipeText}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'recipe_optimization',
          description: 'Optimized recipe with improved title, description, ingredients, and instructions',
          strict: true,
          schema: RECIPE_JSON_SCHEMA
        }
      },
      temperature: 0.7,
    });

    const optimizedRecipe = completion.choices[0].message.parsed;
    
    // Log token usage
    logCompletionUsage('optimize-recipe', completion, {
      recipeTitle: recipe.title || 'Untitled',
    });
    
    if (!optimizedRecipe || !optimizedRecipe.title) {
      throw new Error('AI did not return a valid optimized recipe');
    }

    console.log(`✅ AI optimized recipe: ${optimizedRecipe.title}`);

    // Generate complete Recipe schema with optimized data
    const finalRecipe = generateCompleteRecipeSchema(optimizedRecipe);

    // Preserve the original image from the preview recipe
    // AI optimization should only affect text content, not images
    if (recipe.imageUri || recipe.image_url || recipe.image) {
      const originalImage = recipe.imageUri || recipe.image_url || recipe.image;
      finalRecipe.imageUri = originalImage;
      finalRecipe.image_url = originalImage;
      console.log(`📸 Preserved original image: ${originalImage}`);
    }

    res.json({
      success: true,
      recipe: finalRecipe,
    });

  } catch (error) {
    console.error('Error optimizing recipe:', error.message);
    
    res.status(500).json({
      error: error.message || 'Failed to optimize recipe',
      success: false,
    });
  }
});

/**
 * Scan recipe from image using OpenAI Vision API
 * Takes a base64-encoded image and extracts recipe information
 */
app.post('/api/scan-recipe', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        error: 'Image data is required',
        success: false,
      });
    }

    if (!openai) {
      return res.status(503).json({
        error: 'AI image scanning is not available. Please set OPENAI_API_KEY in .env file.',
        success: false,
      });
    }

    console.log('📸 Scanning recipe from image...');

    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, '');

    // Use the same JSON schema as extraction for consistency
    // For image scanning, we allow optional fields (cookingTime, servings, tags, cookware)
    // since they may not be visible in the image
    const RECIPE_JSON_SCHEMA = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              amount: { type: 'number' },
              unit: { type: 'string' }
            },
            required: ['name', 'amount', 'unit'],
            additionalProperties: false
          }
        },
        instructions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              description: { type: 'string' }
            },
            required: ['step', 'description'],
            additionalProperties: false
          }
        },
        cookingTime: { type: ['string', 'null'] }, // Allow null for optional fields
        servings: { type: ['string', 'null'] },
        tags: {
          type: 'array',
          items: { type: 'string' }
        },
        cookware: { type: ['string', 'null'] }
      },
      required: ['title', 'description', 'ingredients', 'instructions', 'cookingTime', 'servings', 'tags', 'cookware'],
      additionalProperties: false
    };

    // Use OpenAI Vision API to extract recipe from image
    const completion = await openai.beta.chat.completions.parse({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional recipe extractor. Analyze the provided image and extract all recipe information you can see. This may include:\n' +
            '1. Recipe title\n' +
            '2. Description or summary\n' +
            '3. Ingredients list with amounts and units\n' +
            '4. Step-by-step instructions\n' +
            '5. Cooking time (if visible)\n' +
            '6. Servings (if visible)\n' +
            '7. Tags or categories (if visible)\n' +
            '8. Cookware needed (if visible)\n\n' +
            'Extract as much information as possible from the image. If some information is not visible, you can leave those fields empty or make reasonable inferences based on the recipe type.\n\n' +
            'For ingredients, standardize units (cup, tbsp, tsp, oz, lb, g, ml, etc.).\n' +
            'For instructions, break them down into clear, numbered steps.\n' +
            'Make the title concise and descriptive (6 words or less).'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please extract the recipe information from this image. Include all visible details about ingredients, instructions, cooking time, servings, and any other relevant information.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'recipe_extraction',
          description: 'Extracted recipe from image',
          strict: true,
          schema: RECIPE_JSON_SCHEMA
        }
      },
      temperature: 0.3, // Lower temperature for more accurate extraction
    });

    const extractedRecipe = completion.choices[0].message.parsed;
    
    // Log token usage
    logCompletionUsage('scan-recipe', completion, {
      recipeTitle: extractedRecipe?.title,
      imageSize: `${Math.round(imageBase64.length / 1024)}KB`,
    });
    
    if (!extractedRecipe || !extractedRecipe.title) {
      throw new Error('AI did not return a valid recipe from the image');
    }

    console.log(`✅ Recipe extracted from image: ${extractedRecipe.title}`);

    // Generate complete Recipe schema with extracted data
    const finalRecipe = generateCompleteRecipeSchema(extractedRecipe);

    // Note: The image itself is not stored in the recipe object
    // The user can add the image separately in the CreateRecipe screen

    res.json({
      success: true,
      recipe: finalRecipe,
    });

  } catch (error) {
    console.error('Error scanning recipe from image:', error.message);
    
    res.status(500).json({
      error: error.message || 'Failed to scan recipe from image',
      success: false,
    });
  }
});

/**
 * Import recipe from text using AI
 * Takes plain text and extracts structured recipe information
 */
app.post('/api/import-recipe-text', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Text data is required',
        success: false,
      });
    }

    if (!openai) {
      return res.status(503).json({
        error: 'AI text parsing is not available. Please set OPENAI_API_KEY in .env file.',
        success: false,
      });
    }

    console.log('📝 Parsing recipe from text...');

    // Use the same JSON schema as extraction for consistency
    const RECIPE_JSON_SCHEMA = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              amount: { type: 'number' },
              unit: { type: 'string' }
            },
            required: ['name', 'amount', 'unit'],
            additionalProperties: false
          }
        },
        instructions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              description: { type: 'string' }
            },
            required: ['step', 'description'],
            additionalProperties: false
          }
        },
        cookingTime: { type: ['string', 'null'] },
        servings: { type: ['string', 'null'] },
        tags: {
          type: 'array',
          items: { type: 'string' }
        },
        cookware: { type: ['string', 'null'] }
      },
      required: ['title', 'description', 'ingredients', 'instructions', 'cookingTime', 'servings', 'tags', 'cookware'],
      additionalProperties: false
    };

    // Use OpenAI to extract recipe from text
    const completion = await openai.beta.chat.completions.parse({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional recipe extractor. Analyze the provided text and extract all recipe information. This may include:\n' +
            '1. Recipe title\n' +
            '2. Description or summary\n' +
            '3. Ingredients list with amounts and units\n' +
            '4. Step-by-step instructions\n' +
            '5. Cooking time (if mentioned)\n' +
            '6. Servings (if mentioned)\n' +
            '7. Tags or categories (if mentioned)\n' +
            '8. Cookware needed (if mentioned)\n\n' +
            'Extract as much information as possible from the text. If some information is not mentioned, you can leave those fields empty or make reasonable inferences based on the recipe type.\n\n' +
            'For ingredients, standardize units (cup, tbsp, tsp, oz, lb, g, ml, etc.).\n' +
            'For instructions, break them down into clear, numbered steps.\n' +
            'Make the title concise and descriptive (6 words or less).'
        },
        {
          role: 'user',
          content: `Please extract the recipe information from this text:\n\n${text}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'recipe_extraction',
          description: 'Extracted recipe from text',
          strict: true,
          schema: RECIPE_JSON_SCHEMA
        }
      },
      temperature: 0.3, // Lower temperature for more accurate extraction
    });

    const extractedRecipe = completion.choices[0].message.parsed;
    
    // Log token usage
    logCompletionUsage('import-recipe-text', completion, {
      recipeTitle: extractedRecipe?.title,
      textLength: `${text.length} characters`,
    });
    
    if (!extractedRecipe || !extractedRecipe.title) {
      throw new Error('AI did not return a valid recipe from the text');
    }

    console.log(`✅ Recipe extracted from text: ${extractedRecipe.title}`);

    // Generate complete Recipe schema with extracted data
    const finalRecipe = generateCompleteRecipeSchema(extractedRecipe);

    res.json({
      success: true,
      recipe: finalRecipe,
    });

  } catch (error) {
    console.error('Error parsing recipe from text:', error.message);
    
    res.status(500).json({
      error: error.message || 'Failed to parse recipe from text',
      success: false,
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Recipe Import Server',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`🚀 Recipe Import Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📥 Import endpoint: http://localhost:${PORT}/api/import-recipe`);
  console.log(`🤖 Optimize endpoint: http://localhost:${PORT}/api/optimize-recipe`);
});

