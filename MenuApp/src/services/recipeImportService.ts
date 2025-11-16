/**
 * Recipe Import Service
 * Imports recipes from websites using Recipe Schema.org structured data
 */

import { getBackendUrl, RECIPE_IMPORT_ENDPOINT, RECIPE_OPTIMIZE_ENDPOINT, RECIPE_SCAN_ENDPOINT, RECIPE_TEXT_IMPORT_ENDPOINT, RECIPE_GENERATE_FROM_INGREDIENTS_ENDPOINT } from '../config/recipeImport';
import { RecipeOption, YouTubeVideo } from '../types';

interface ImportedRecipe {
  title: string;
  description: string;
  imageUrl?: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions: Array<{
    step: number;
    description: string;
  }>;
  cookingTime?: number; // Changed to number (minutes) instead of string
  servings?: number; // Changed to number (people) instead of string
  tags?: string[];
}

/**
 * Option 1: Using Recipe Parser API (Recommended for production)
 * Requires API key from https://www.recipeparser.com/
 */
export const importRecipeFromAPI = async (url: string, apiKey: string): Promise<ImportedRecipe> => {
  try {
    const response = await fetch(`https://api.recipeparser.com/parse?url=${encodeURIComponent(url)}`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return transformAPIResponse(data);
  } catch (error) {
    console.error('Recipe import error:', error);
    throw error;
  }
};

/**
 * Option 2: Using Recipe Schema.org Parser (Free, client-side)
 * Parses Schema.org Recipe structured data from HTML
 */
export const importRecipeFromURL = async (url: string): Promise<ImportedRecipe> => {
  try {
    // Fetch HTML content
    // Note: This requires CORS to be enabled on the target website
    // For production, use a backend proxy
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeImporter/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    return parseRecipeFromHTML(html, url);
  } catch (error) {
    console.error('Recipe import error:', error);
    throw error;
  }
};

/**
 * Option 3: Using Backend Proxy (Recommended for production)
 * Backend now returns complete Recipe schema with all required fields (ID, timestamps, etc.)
 * No transformation needed - backend handles everything
 */
export const importRecipeViaBackend = async (url: string): Promise<any> => {
  try {
    // Get backend URL from configuration
    const backendUrl = `${getBackendUrl()}${RECIPE_IMPORT_ENDPOINT}`;
    console.log('🌐 Attempting to import from backend:', backendUrl);
    console.log('📝 URL to import:', url);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.error || `Backend Error: ${response.statusText}`;
      
      // Provide user-friendly error messages for websites that block access
      if (response.status === 403 || response.status === 404 || response.status === 429) {
        errorMessage = 'This website does not allow importing recipes. The website source has restricted access to protect intellectual property. Please try importing from a different recipe website.';
      } else if (errorData.error && errorData.error.includes('does not allow importing')) {
        // Use the backend's friendly error message if it's already formatted
        errorMessage = errorData.error;
      }
      
      console.error('❌ Backend error:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Backend response received:', data.success ? 'Success' : 'Failed');
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to import recipe');
    }

    // Backend now returns complete Recipe schema, just convert Date strings to Date objects
    return transformBackendResponse(data.recipe);
  } catch (error: any) {
    console.error('❌ Recipe import error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    
    // Provide more helpful error message
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to backend server. Please ensure:\n` +
        `1. Backend server is running on port 3001\n` +
        `2. If using real device, check network connection\n` +
        `3. If using Android emulator, ensure using 10.0.2.2:3001\n` +
        `Original error: ${error.message}`
      );
    }
    
    throw error;
  }
};

/**
 * Parse Recipe from HTML using Schema.org structured data
 */
function parseRecipeFromHTML(html: string, baseUrl: string): ImportedRecipe {
  // Extract JSON-LD structured data
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is);
  
  if (jsonLdMatch) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      return parseSchemaOrgRecipe(jsonData, baseUrl);
    } catch (e) {
      console.error('Failed to parse JSON-LD:', e);
    }
  }

  // Fallback: Try to extract from Microdata
  return parseMicrodataRecipe(html, baseUrl);
}

/**
 * Parse Schema.org Recipe JSON-LD
 */
function parseSchemaOrgRecipe(data: any, baseUrl: string): ImportedRecipe {
  // Handle both single object and array
  const recipe = Array.isArray(data) 
    ? data.find((item: any) => item['@type'] === 'Recipe' || item.type === 'Recipe')
    : (data['@type'] === 'Recipe' || data.type === 'Recipe' ? data : data.recipe || data);

  if (!recipe) {
    throw new Error('No Recipe schema found');
  }

  // Parse ingredients
  const ingredients = parseIngredients(recipe.recipeIngredient || recipe.ingredients || []);
  
  // Parse instructions
  const instructions = parseInstructions(recipe.recipeInstructions || recipe.instructions || []);
  
  // Parse image
  let imageUrl: string | undefined;
  if (recipe.image) {
    if (typeof recipe.image === 'string') {
      imageUrl = recipe.image.startsWith('http') ? recipe.image : new URL(recipe.image, baseUrl).href;
    } else if (recipe.image.url) {
      imageUrl = recipe.image.url.startsWith('http') ? recipe.image.url : new URL(recipe.image.url, baseUrl).href;
    } else if (Array.isArray(recipe.image) && recipe.image[0]) {
      imageUrl = recipe.image[0].startsWith('http') ? recipe.image[0] : new URL(recipe.image[0], baseUrl).href;
    }
  }

  // Parse cooking time - returns number (minutes) instead of string
  const cookingTime = parseDuration(recipe.totalTime || recipe.cookTime || recipe.prepTime);

  // Parse servings - extract number directly, return as integer
  let servings: number | undefined;
  let rawServings = recipe.recipeYield || recipe.yield || '';
  
  if (typeof rawServings === 'object' && (rawServings as any).value) {
    rawServings = (rawServings as any).value;
  }
  
  if (typeof rawServings === 'number') {
    // If number > 20, it's likely a parsing error, return undefined (let user fill in)
    if (rawServings > 20) {
      servings = undefined;
    } else {
      servings = Math.max(1, Math.min(20, Math.round(rawServings)));
    }
  } else if (typeof rawServings === 'string' && rawServings.trim() !== '') {
    // Extract number from string like "4 servings", "serves 4", "6-8 servings"
    const numberMatch = rawServings.match(/(\d+)/);
    if (numberMatch) {
      const extractedNumber = parseInt(numberMatch[1], 10);
      // If extracted number > 20, it's likely a parsing error, return undefined
      if (extractedNumber > 20) {
        servings = undefined;
      } else {
        servings = Math.max(1, Math.min(20, extractedNumber));
      }
    }
  }

  // Do not parse tags/keywords when importing directly from Schema.org
  // Tags should be empty array for schema-based imports - let user define their own tags
  const tags: string[] = [];

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
function parseIngredients(ingredients: any[]): Array<{ name: string; amount: string; unit: string }> {
  return ingredients.map((ing, index) => {
    if (typeof ing === 'string') {
      // Try to parse "2 cups flour" format
      const parsed = parseIngredientString(ing);
      return {
        name: parsed.name,
        amount: parsed.amount,
        unit: parsed.unit,
      };
    } else if (ing.name) {
      return {
        name: ing.name,
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
function parseIngredientString(str: string): { name: string; amount: string; unit: string } {
  // Simple regex to match common patterns
  const match = str.match(/^(\d+(?:\.\d+)?)\s*(\w+)?\s+(.+)$/);
  if (match) {
    return {
      amount: match[1],
      unit: match[2] || '',
      name: match[3].trim(),
    };
  }
  return { name: str.trim(), amount: '', unit: '' };
}

/**
 * Parse instructions from various formats
 */
function parseInstructions(instructions: any[]): Array<{ step: number; description: string }> {
  return instructions.map((inst, index) => {
    let description = '';
    let step = index + 1;
    
    if (typeof inst === 'string') {
      description = inst;
    } else if (inst && typeof inst === 'object') {
      // Ensure description is always a string
      if (typeof inst.description === 'string') {
        description = inst.description;
      } else if (typeof inst.text === 'string') {
        description = inst.text;
      } else if (typeof inst.name === 'string') {
        description = inst.name;
      } else if (inst.itemListElement) {
        // Handle HowToStep format
        description = inst.itemListElement
          .map((item: any) => (typeof item === 'string' ? item : (item.text || item.name || '')))
          .filter(Boolean)
          .join(' ');
      } else if (inst.description) {
        description = String(inst.description);
      } else {
        description = String(inst);
      }
      
      step = inst.step || inst.position || inst.stepNumber || index + 1;
    } else {
      description = String(inst);
    }
    
    // Ensure description is never empty
    if (!description || description.trim() === '') {
      description = `Step ${step}`;
    }
    
    return {
      step: step,
      description: description.trim(),
    };
  });
}

/**
 * Parse duration string like "PT30M" (ISO 8601) or "30 minutes"
 * Returns number of minutes (integer) instead of string
 */
function parseDuration(duration: string | number | undefined): number | undefined {
  if (!duration) return undefined;
  
  // If it's already a number, return it (clamp between 1-999)
  if (typeof duration === 'number') {
    return Math.max(1, Math.min(999, Math.round(duration)));
  }
  
  // Handle ISO 8601 format (PT30M, PT1H30M)
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const hours = duration.match(/(\d+)H/);
    const minutes = duration.match(/(\d+)M/);
    let totalMinutes = 0;
    
    if (hours) totalMinutes += parseInt(hours[1], 10) * 60;
    if (minutes) totalMinutes += parseInt(minutes[1], 10);
    
    return totalMinutes || undefined;
  }
  
  // Try to extract number from string like "30 minutes", "1 hour 30 minutes", etc.
  if (typeof duration === 'string') {
    const timeStr = duration.toLowerCase().trim();
    let totalMinutes = 0;
    
    // Match hours: "1 hour", "2 hours", "1h", "2hr"
    const hourMatches = timeStr.match(/(\d+)\s*(?:hour|hours|hr|h)\b/);
    if (hourMatches) {
      totalMinutes += parseInt(hourMatches[1], 10) * 60;
    }
    
    // Match minutes: "30 minutes", "45 min", "30m"
    const minuteMatches = timeStr.match(/(\d+)\s*(?:minute|minutes|min|m)\b/);
    if (minuteMatches) {
      totalMinutes += parseInt(minuteMatches[1], 10);
    }
    
    // If no hours/minutes pattern found, try to extract just a number
    if (totalMinutes === 0) {
      const numberMatch = timeStr.match(/(\d+)/);
      if (numberMatch) {
        totalMinutes = parseInt(numberMatch[1], 10);
      }
    }
    
    return totalMinutes > 0 ? Math.max(1, Math.min(999, totalMinutes)) : undefined;
  }
  
  return undefined;
}

/**
 * Parse keywords/tags
 */
function parseKeywords(keywords: any): string[] {
  if (!keywords) return [];
  if (typeof keywords === 'string') {
    return keywords.split(',').map(k => k.trim()).filter(Boolean);
  }
  if (Array.isArray(keywords)) {
    return keywords.map(k => typeof k === 'string' ? k : k.name || k).filter(Boolean);
  }
  return [];
}

/**
 * Parse Microdata format (fallback)
 */
function parseMicrodataRecipe(html: string, baseUrl: string): ImportedRecipe {
  // This is a simplified parser - in production, use a proper HTML parser
  throw new Error('Microdata parsing not fully implemented. Please use Schema.org JSON-LD format.');
}

/**
 * Transform API response to our format
 */
function transformAPIResponse(data: any): ImportedRecipe {
  return {
    title: data.title || data.name || '',
    description: data.description || '',
    imageUrl: data.image || data.imageUrl,
    ingredients: parseIngredients(data.ingredients || data.recipeIngredient || []),
    instructions: parseInstructions(data.instructions || data.recipeInstructions || []),
    cookingTime: parseDuration(data.totalTime || data.cookTime),
    servings: (() => {
      // Parse servings - extract number directly, return as integer
      let rawServings = data.servings || data.recipeYield || '';
      
      if (typeof rawServings === 'object' && (rawServings as any).value) {
        rawServings = (rawServings as any).value;
      }
      
      if (typeof rawServings === 'number') {
        // If number > 20, it's likely a parsing error, return undefined (let user fill in)
        if (rawServings > 20) {
          return undefined;
        } else {
          return Math.max(1, Math.min(20, Math.round(rawServings)));
        }
      } else if (typeof rawServings === 'string' && rawServings.trim() !== '') {
        const numberMatch = rawServings.match(/(\d+)/);
        if (numberMatch) {
          const extractedNumber = parseInt(numberMatch[1], 10);
          // If extracted number > 20, it's likely a parsing error, return undefined
          if (extractedNumber > 20) {
            return undefined;
          } else {
            return Math.max(1, Math.min(20, extractedNumber));
          }
        }
      }
      return undefined;
    })(),
    // Do not parse tags/keywords when importing directly from Schema.org/Microdata
    // Tags should be empty array - let user define their own tags
    tags: [],
  };
}

/**
 * Transform backend response to Recipe format
 * Backend now returns complete Recipe schema, so we just need to ensure Date objects are properly handled
 * IMPORTANT: For schema imports, backend should return empty tags array - we verify this here
 */
function transformBackendResponse(data: any): any {
  // Backend now returns complete Recipe schema with all fields
  // Just ensure Date strings are converted to Date objects
  const transformed = {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  };
  
  // CRITICAL: For "Import from Website" (schema imports), tags should ALWAYS be empty
  // Backend should return empty tags for schema imports, but we enforce it here as a safety measure
  // We check if tags is empty/undefined - if so, it's likely a schema import, keep it empty
  // If tags exist, it might be from AI import, but we can't distinguish here
  // However, since user specifically said schema imports should have NO tags,
  // we'll be conservative: if tags is empty/undefined, keep empty. If tags exist, log warning.
  if (!Array.isArray(transformed.tags)) {
    console.log(`⚠️  Tags is not an array: ${JSON.stringify(transformed.tags)}, forcing to empty array`);
    transformed.tags = [];
  } else if (transformed.tags.length > 0) {
    // Tags exist - log for debugging, but keep them (might be AI import)
    // However, if this is a schema import, backend should have returned empty tags
    console.log(`⚠️  Backend returned non-empty tags: ${JSON.stringify(transformed.tags)}`);
    console.log(`   If this is a schema import, tags should be empty. Please check backend logs.`);
    
    // CRITICAL: For AI imports, limit tags to maximum 3 (even if backend returns more)
    // This ensures consistency even if production backend hasn't been updated yet
    if (transformed.tags.length > 3) {
      const originalTagCount = transformed.tags.length;
      transformed.tags = transformed.tags.slice(0, 3);
      console.log(`⚠️  Backend returned ${originalTagCount} tags, limiting to 3: ${JSON.stringify(transformed.tags)}`);
    }
  }
  
  return transformed;
}

/**
 * Scan recipe from image using AI via backend
 * Takes a base64-encoded image and extracts recipe information
 */
export const scanRecipeFromImage = async (imageBase64: string): Promise<any> => {
  try {
    const backendUrl = `${getBackendUrl()}${RECIPE_SCAN_ENDPOINT}`;
    console.log('📸 Attempting to scan recipe from image via backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase64 }),
    });

    console.log('📡 Scan response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.error || `Backend Error: ${response.statusText}`;
      
      // Provide helpful error messages
      if (response.status === 503 && errorMessage.includes('AI image scanning is not available')) {
        errorMessage = 'AI image scanning requires OpenAI API key. Please set OPENAI_API_KEY in the backend .env file to enable image scanning.';
      }
      
      console.error('❌ Backend scan error:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Backend scan response received:', data.success ? 'Success' : 'Failed');
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to scan recipe from image');
    }

    // Backend returns complete Recipe schema, just convert Date strings to Date objects
    return transformBackendResponse(data.recipe);
  } catch (error: any) {
    console.error('❌ Recipe scan error:', error);
    
    // Provide more helpful error message for network errors
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to backend server. Please ensure:\n` +
        `1. Backend server is running on port 3001\n` +
        `2. If using real device, check network connection\n` +
        `3. If using Android emulator, ensure using 10.0.2.2:3001\n` +
        `Original error: ${error.message}`
      );
    }
    
    throw error;
  }
};

/**
 * Import recipe from text using AI via backend
 * Takes plain text and extracts structured recipe information
 */
export const importRecipeFromText = async (text: string): Promise<any> => {
  try {
    const backendUrl = `${getBackendUrl()}${RECIPE_TEXT_IMPORT_ENDPOINT}`;
    console.log('📝 Attempting to import recipe from text via backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    console.log('📡 Text import response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.error || `Backend Error: ${response.statusText}`;
      
      // Provide helpful error messages
      if (response.status === 503 && errorMessage.includes('AI text parsing is not available')) {
        errorMessage = 'AI text parsing requires OpenAI API key. Please set OPENAI_API_KEY in the backend .env file to enable text parsing.';
      }
      
      console.error('❌ Backend text import error:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Backend text import response received:', data.success ? 'Success' : 'Failed');
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to import recipe from text');
    }

    // Backend returns complete Recipe schema, just convert Date strings to Date objects
    return transformBackendResponse(data.recipe);
  } catch (error: any) {
    console.error('❌ Recipe text import error:', error);
    
    // Provide more helpful error message for network errors
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to backend server. Please ensure:\n` +
        `1. Backend server is running on port 3001\n` +
        `2. If using real device, check network connection\n` +
        `3. If using Android emulator, ensure using 10.0.2.2:3001\n` +
        `Original error: ${error.message}`
      );
    }
    
    throw error;
  }
};

/**
 * Optimize recipe using AI via backend
 */
export const optimizeRecipeViaBackend = async (recipe: any): Promise<any> => {
  try {
    const backendUrl = `${getBackendUrl()}${RECIPE_OPTIMIZE_ENDPOINT}`;
    console.log('🤖 Attempting to optimize recipe via backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipe }),
    });

    console.log('📡 Optimization response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Backend Error: ${response.statusText}`;
      console.error('❌ Backend optimization error:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Backend optimization response received:', data.success ? 'Success' : 'Failed');
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to optimize recipe');
    }

    // Backend returns complete Recipe schema, just convert Date strings to Date objects
    return transformBackendResponse(data.recipe);
  } catch (error: any) {
    console.error('❌ Recipe optimization error:', error);
    throw error;
  }
};

/**
 * Generate recipe from ingredients using AI via backend
 */
export const generateRecipeFromIngredients = async (
  ingredients: string[],
  options?: {
    dietaryRestrictions?: string[];
    cuisine?: string;
    servings?: string;
    cookingTime?: string;
    cookware?: string;
  }
): Promise<RecipeOption[]> => {
  try {
    const backendUrl = `${getBackendUrl()}${RECIPE_GENERATE_FROM_INGREDIENTS_ENDPOINT}`;
    console.log('🍳 Attempting to generate recipes from ingredients via backend:', backendUrl);
    console.log('📝 Ingredients:', ingredients.join(', '));
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ingredients,
        dietaryRestrictions: options?.dietaryRestrictions || [],
        cuisine: options?.cuisine || '',
        servings: options?.servings || '',
        cookingTime: options?.cookingTime || '',
        cookware: options?.cookware || '',
      }),
    });

    console.log('📡 Generate recipe response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.error || `Backend Error: ${response.statusText}`;
      
      if (response.status === 503 && errorMessage.includes('AI recipe generation is not available')) {
        errorMessage = 'AI recipe generation requires OpenAI API key. Please set OPENAI_API_KEY in the backend .env file to enable recipe generation.';
      } else if (response.status === 400 && errorMessage.includes('ingredient is required')) {
        errorMessage = 'Please provide at least one ingredient to generate recipes.';
      } else if (response.status === 400 && errorMessage.includes('Cookware is required')) {
        errorMessage = 'Please select a cookware to generate recipes.';
      }
      
      console.error('❌ Backend generate recipe error:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Backend generate recipe response received:', data.success ? 'Success' : 'Failed');
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate recipes from ingredients');
    }

    const normalizeYoutubeData = (rawYoutube: any, recipeTitle: string) => {
      let videos: YouTubeVideo[] = [];
      let searchUrl: string | undefined;

      if (rawYoutube) {
        if (Array.isArray(rawYoutube)) {
          videos = rawYoutube;
        } else if (typeof rawYoutube === 'object') {
          if (Array.isArray(rawYoutube.videos)) {
            videos = rawYoutube.videos;
          }
          searchUrl = rawYoutube.searchUrl;
        }
      }

      if (!searchUrl && recipeTitle) {
        searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(recipeTitle)}`;
      }

      return { videos, searchUrl };
    };

    if (Array.isArray(data.recipeOptions) && data.recipeOptions.length > 0) {
      const recipeOptions: RecipeOption[] = data.recipeOptions.map((option: any, index: number) => {
        const recipe = transformBackendResponse(option.recipe);
        const { videos, searchUrl } = normalizeYoutubeData(option.youtubeVideos, recipe.title);

        const recipeWithMedia = {
          ...recipe,
          youtubeVideos: videos,
          youtubeSearchUrl: searchUrl,
        };

        return {
          recipe: recipeWithMedia,
          youtubeVideos: videos,
          youtubeSearchUrl: searchUrl,
          optionIndex: index,
        };
      });

      console.log('🍽️ Received recipe options count:', recipeOptions.length);
      return recipeOptions;
    }

    if (data.recipe) {
      console.warn('⚠️ Backend returned legacy single recipe format. Converting to recipe options array.');
      const recipe = transformBackendResponse(data.recipe);
      const { videos, searchUrl } = normalizeYoutubeData(data.youtubeVideos, recipe.title);
      const recipeWithMedia = {
        ...recipe,
        youtubeVideos: videos,
        youtubeSearchUrl: searchUrl,
      };

      return [
        {
          recipe: recipeWithMedia,
          youtubeVideos: videos,
          youtubeSearchUrl: searchUrl,
          optionIndex: 0,
        },
      ];
    }

    throw new Error('Backend did not return any recipe options');
  } catch (error: any) {
    console.error('❌ Recipe generation error:', error);
    
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to backend server. Please ensure:\n` +
        `1. Backend server is running on port 3001\n` +
        `2. If using real device, check network connection\n` +
        `3. If using Android emulator, ensure using 10.0.2.2:3001\n` +
        `Original error: ${error.message}`
      );
    }
    
    throw error;
  }
};

