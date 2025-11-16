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
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { logCompletionUsage, calculateCost } = require('./aiTokenLogger');
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

// Initialize Supabase client for YouTube cache
let supabase = null;
if (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
  console.log('✅ Supabase client initialized for YouTube cache');
} else {
  console.log('⚠️  Supabase credentials not found. YouTube cache will be disabled.');
  console.log('   Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env file to enable caching.');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request timeout configuration
const AXIOS_TIMEOUT = 30000; // 30 seconds

// ============================================
// YouTube Search Cache
// ============================================
// Cache configuration
const YOUTUBE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const youtubeCache = new Map(); // In-memory cache for YouTube search results

/**
 * Generate cache key for YouTube search
 * @param {string} recipeTitle - Recipe title
 * @param {string} cookware - Cookware used
 * @returns {string} Cache key
 */
function generateCacheKey(recipeTitle, cookware) {
  // Normalize the key by converting to lowercase and trimming
  const normalizedTitle = (recipeTitle || '').toLowerCase().trim();
  const normalizedCookware = (cookware || '').toLowerCase().trim();
  return `youtube:${normalizedTitle}:${normalizedCookware}`;
}

/**
 * Get cached YouTube search results
 * @param {string} cacheKey - Cache key
 * @returns {object|null} Cached result or null if not found/expired
 */
function getCachedYouTubeResult(cacheKey) {
  const cached = youtubeCache.get(cacheKey);
  if (!cached) {
    return null;
  }
  
  // Check if cache is expired
  const now = Date.now();
  if (now - cached.timestamp > YOUTUBE_CACHE_TTL) {
    youtubeCache.delete(cacheKey);
    console.log(`🗑️  Cache expired for key: ${cacheKey}`);
    return null;
  }
  
  console.log(`✅ Cache hit for key: ${cacheKey} (age: ${Math.round((now - cached.timestamp) / 1000 / 60)} minutes)`);
  return cached.data;
}

/**
 * Set cached YouTube search results
 * @param {string} cacheKey - Cache key
 * @param {object} data - Data to cache
 */
function setCachedYouTubeResult(cacheKey, data) {
  youtubeCache.set(cacheKey, {
    data: data,
    timestamp: Date.now(),
  });
  console.log(`💾 Cached YouTube result for key: ${cacheKey}`);
  
  // Optional: Log cache size (for monitoring)
  if (youtubeCache.size % 10 === 0) {
    console.log(`📊 YouTube cache size: ${youtubeCache.size} entries`);
  }
}

/**
 * Clear expired cache entries (should be called periodically)
 */
function clearExpiredCache() {
  const now = Date.now();
  let cleared = 0;
  
  for (const [key, value] of youtubeCache.entries()) {
    if (now - value.timestamp > YOUTUBE_CACHE_TTL) {
      youtubeCache.delete(key);
      cleared++;
    }
  }
  
  if (cleared > 0) {
    console.log(`🧹 Cleared ${cleared} expired cache entries. Remaining: ${youtubeCache.size}`);
  }
}

// Clear expired cache every hour
setInterval(clearExpiredCache, 60 * 60 * 1000); // 1 hour

/**
 * List of all valid cookware options
 * This must match the frontend cookware options
 */
const cookwareOptions = [
  'Stovetop – Pan or Pot',
  'Air Fryer',
  'Oven',
  'Grill',
  'Slow Cooker',
  'Pressure Cooker',
  'Wok',
  'Other'
];

/**
 * Sanitize cookware references in generated recipe text
 * Replaces any mentions of other cookware with the specified cookware
 * @param {string} text - Text to sanitize
 * @param {string} allowedCookware - The cookware that should be used
 * @returns {string} Sanitized text
 */
function sanitizeCookwareReferences(text, allowedCookware) {
  if (!text || !allowedCookware) return text;
  
  // Get other cookware options (excluding the allowed one)
  const otherCookware = cookwareOptions.filter(c => c !== allowedCookware);
  
  // Common variations and synonyms for each cookware type
  const commonVariations = {
    'Stovetop – Pan or Pot': ['stovetop', 'pan', 'pot', 'skillet', 'frying pan', 'saucepan', 'stove top', 'stove-top'],
    'Air Fryer': ['air fryer', 'airfryer', 'air-fryer'],
    'Oven': ['oven', 'baking oven'],
    'Pizza Oven': ['pizza oven'],
    'Grill': ['grill', 'grilling', 'barbecue', 'bbq', 'barbeque'],
    'Slow Cooker': ['slow cooker', 'crock pot', 'crockpot'],
    'Pressure Cooker': ['pressure cooker', 'instant pot'],
    'Wok': ['wok', 'wok pan']
  };
  
  let sanitized = text;
  
  // Get allowed variations for the specified cookware
  const allowedVariations = commonVariations[allowedCookware] || [];
  const allowedVariationsLower = allowedVariations.map(v => v.toLowerCase());
  
  // Replace other cookware options (exact matches)
  for (const cookware of otherCookware) {
    // Escape special regex characters
    const escaped = cookware.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Match as whole word/phrase (case-insensitive)
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    sanitized = sanitized.replace(regex, allowedCookware);
  }
  
  // Replace variations of other cookware types
  for (const [cookware, variations] of Object.entries(commonVariations)) {
    if (cookware !== allowedCookware) {
      for (const variation of variations) {
        // Only replace if it's not an allowed variation
        if (!allowedVariationsLower.includes(variation.toLowerCase())) {
          const regex = new RegExp(`\\b${variation.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
          sanitized = sanitized.replace(regex, allowedCookware);
        }
      }
    }
  }
  
  return sanitized;
}

/**
 * Normalize query string for matching (lowercase, trim, remove special chars)
 * @param {string} query - Query string
 * @returns {string} Normalized query
 */
function normalizeQuery(query) {
  if (!query) return '';
  return query.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

/**
 * Generate hash for query (for exact matching)
 * @param {string} query - Query string
 * @returns {string} Hash string
 */
function hashQuery(query) {
  const normalized = normalizeQuery(query);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Extract keywords from query string
 * @param {string} query - Query string
 * @returns {Array<string>} Array of keywords
 */
function extractKeywords(query) {
  if (!query) return [];
  // Remove common stop words
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);
  
  const words = query.toLowerCase().split(/\s+/).filter(word => {
    return word.length > 2 && !stopWords.has(word);
  });
  
  return [...new Set(words)]; // Remove duplicates
}

/**
 * Find cached YouTube query in database (exact match)
 * @param {string} searchQuery - Search query
 * @returns {Promise<Object|null>} Cached query with videos or null
 */
async function findCachedYouTubeQuery(searchQuery) {
  if (!supabase) return null;
  
  try {
    const queryHash = hashQuery(searchQuery);
    
    // Find exact match by hash
    const { data: queryRecord, error } = await supabase
      .from('youtube_queries')
      .select(`
        *,
        youtube_videos (*)
      `)
      .eq('query_hash', queryHash)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !queryRecord) {
      return null;
    }
    
    // Update usage statistics
    await supabase
      .from('youtube_queries')
      .update({
        use_count: queryRecord.use_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', queryRecord.id);
    
    // Format videos
    const videos = (queryRecord.youtube_videos || [])
      .filter(v => v.is_active)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .map(v => ({
        videoId: v.video_id,
        title: v.title,
        description: v.description,
        thumbnail: v.thumbnail_url,
        channelTitle: v.channel_title,
        publishedAt: v.published_at,
        url: v.url,
        embedUrl: v.embed_url,
      }));
    
    console.log(`💾 Found cached YouTube query: "${searchQuery}" (${videos.length} videos)`);
    return { query: queryRecord, videos };
  } catch (error) {
    console.error('❌ Error finding cached YouTube query:', error);
    return null;
  }
}

/**
 * Store YouTube query and videos to database
 * @param {string} searchQuery - Search query
 * @param {Array} videos - Array of video objects
 * @param {Object} context - Optional context (recipeTitle, cookware)
 * @returns {Promise<void>}
 */
async function storeYouTubeQuery(searchQuery, videos, context = {}) {
  if (!supabase || !videos || videos.length === 0) return;
  
  try {
    const queryHash = hashQuery(searchQuery);
    const normalizedQuery = normalizeQuery(searchQuery);
    
    // Check if query already exists
    const { data: existingQuery } = await supabase
      .from('youtube_queries')
      .select('id')
      .eq('query_hash', queryHash)
      .single();
    
    let queryId;
    
    if (existingQuery) {
      // Update existing query
      queryId = existingQuery.id;
      await supabase
        .from('youtube_queries')
        .update({
          total_results: videos.length,
          last_used_at: new Date().toISOString()
        })
        .eq('id', queryId);
    } else {
      // Create new query record
      const { data: newQuery, error: queryError } = await supabase
        .from('youtube_queries')
        .insert({
          search_query: searchQuery,
          normalized_query: normalizedQuery,
          query_hash: queryHash,
          recipe_title: context.recipeTitle || null,
          cookware: context.cookware || null,
          total_results: videos.length,
          api_quota_used: 100, // search.list costs 100 units
          last_used_at: new Date().toISOString(),
          use_count: 0
        })
        .select('id')
        .single();
      
      if (queryError) {
        console.error('❌ Error creating YouTube query record:', queryError);
        return;
      }
      
      queryId = newQuery.id;
    }
    
    // Store videos (with deduplication)
    const videoRecords = videos.map((video, index) => ({
      query_id: queryId,
      video_id: video.videoId,
      title: video.title || '',
      description: video.description || null,
      thumbnail_url: video.thumbnail || null,
      channel_title: video.channelTitle || null,
      channel_id: null, // Not available from search API
      published_at: video.publishedAt || null,
      duration: null, // Not available from search API
      view_count: null, // Not available from search API
      like_count: null, // Not available from search API
      url: video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
      embed_url: video.embedUrl || `https://www.youtube.com/embed/${video.videoId}`,
      relevance_score: 1.0 - (index * 0.01), // First video = 1.0, second = 0.99, etc.
      is_active: true,
      last_verified_at: new Date().toISOString()
    }));
    
    // Use upsert to handle duplicates (video_id is unique)
    const { error: videoError } = await supabase
      .from('youtube_videos')
      .upsert(videoRecords, {
        onConflict: 'video_id',
        ignoreDuplicates: false
      });
    
    if (videoError) {
      console.error('❌ Error storing YouTube videos:', videoError);
    } else {
      console.log(`💾 Stored ${videoRecords.length} YouTube videos for query: "${searchQuery}"`);
    }
    
    // Store keywords for similarity matching
    const keywords = extractKeywords(searchQuery);
    if (keywords.length > 0) {
      const keywordRecords = keywords.map(keyword => ({
        query_id: queryId,
        keyword: keyword,
        weight: 1.0
      }));
      
      // Delete old keywords and insert new ones
      await supabase
        .from('youtube_query_keywords')
        .delete()
        .eq('query_id', queryId);
      
      await supabase
        .from('youtube_query_keywords')
        .insert(keywordRecords);
    }
  } catch (error) {
    console.error('❌ Error storing YouTube query:', error);
  }
}

/**
 * Generate complete Recipe schema with all required fields
 * This ensures the frontend receives a fully-formed Recipe object
 * that matches the Recipe interface in types/index.ts
 * @param {object} rawRecipe - Raw recipe data from extraction
 * @param {boolean} isSchemaImport - If true, recipe was imported from Schema.org (tags should be empty)
 */
function generateCompleteRecipeSchema(rawRecipe, isSchemaImport = false) {
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
    // For schema imports, tags should ALWAYS be empty (let user define their own)
    // For AI imports, tags can be populated (maximum 3)
    tags: (() => {
      if (isSchemaImport) {
        // Schema import: ALWAYS empty array, completely ignore any tags from rawRecipe
        // Even if rawRecipe.tags exists, we must return empty array for schema imports
        console.log(`📋 Schema import detected - forcing tags to empty array (rawRecipe.tags: ${JSON.stringify(rawRecipe.tags)})`);
        return []; // ALWAYS return empty array for schema imports
      }
      // AI import: use tags from rawRecipe (max 3)
      // CRITICAL: Always limit to 3 tags, even if rawRecipe has more
      if (Array.isArray(rawRecipe.tags) && rawRecipe.tags.length > 0) {
        const limitedTags = rawRecipe.tags.slice(0, 3);
        if (rawRecipe.tags.length > 3) {
          console.log(`⚠️  AI import: rawRecipe has ${rawRecipe.tags.length} tags, limiting to 3: ${JSON.stringify(limitedTags)}`);
        }
        return limitedTags;
      }
      return [];
    })(),
    
    // Optional fields with defaults
    items: [], // Empty array, user can add menu items if needed
    // Convert cookingTime to string format "X分钟" (handle string, number, or null)
    // First convert to integer minutes, then format as string
    cookingTime: (() => {
      let minutes = null;
      
      if (typeof rawRecipe.cookingTime === 'number') {
        minutes = Math.max(1, Math.min(999, Math.round(rawRecipe.cookingTime)));
      } else if (typeof rawRecipe.cookingTime === 'string' && rawRecipe.cookingTime.trim() !== '') {
        const timeStr = rawRecipe.cookingTime.toLowerCase().trim();
        
        // Extract hours and minutes
        const hoursMatch = timeStr.match(/(\d+)\s*(hour|hours|hr|h)\b/);
        const minutesMatch = timeStr.match(/(\d+)\s*(minute|minutes|min|m)\b/);
        
        let totalMinutes = 0;
        if (hoursMatch) {
          totalMinutes += parseInt(hoursMatch[1], 10) * 60;
        }
        if (minutesMatch) {
          totalMinutes += parseInt(minutesMatch[1], 10);
        }
        
        // If no hours/minutes pattern found, try to extract just a number
        if (totalMinutes === 0) {
          const numberMatch = timeStr.match(/(\d+)/);
          if (numberMatch) {
            totalMinutes = parseInt(numberMatch[1], 10);
          }
        }
        
        if (totalMinutes > 0) {
          minutes = Math.max(1, Math.min(999, totalMinutes));
        }
      }
      
      // Format as "X分钟" string
      return minutes !== null ? `${minutes}分钟` : '';
    })(),
    // Convert servings to integer (handle string, number, array, or null)
    // If servings > 20, it's likely a parsing error, return null (will be empty in frontend)
    servings: (() => {
      let servingsValue;
      
      if (typeof rawRecipe.servings === 'number') {
        servingsValue = rawRecipe.servings;
      } else if (typeof rawRecipe.servings === 'string' && rawRecipe.servings.trim() !== '') {
        // Extract first number from string like "4 servings" or "88 servings"
        const numberMatch = rawRecipe.servings.match(/(\d+)/);
        servingsValue = numberMatch ? parseInt(numberMatch[1], 10) : undefined;
      } else if (Array.isArray(rawRecipe.servings) && rawRecipe.servings.length > 0) {
        const firstItem = rawRecipe.servings[0];
        servingsValue = typeof firstItem === 'number' 
          ? firstItem 
          : (typeof firstItem === 'string' ? (parseInt(firstItem, 10) || undefined) : undefined);
      } else {
        servingsValue = undefined;
      }
      
      // If servings > 20, it's likely a parsing error (e.g., reading wrong field)
      // Return null (which will be treated as empty in frontend) so user can fill it in manually
      if (servingsValue !== undefined && servingsValue !== null) {
        if (servingsValue > 20) {
          console.log(`⚠️  Servings value ${servingsValue} > 20, treating as parsing error, returning null`);
          return null; // Return null for invalid values > 20 (will be empty in frontend)
        }
        return Math.max(1, Math.min(20, Math.round(servingsValue)));
      }
      
      return null; // Default to null if invalid (will be empty in frontend)
    })(),
    // Validate and normalize cookware - must be from predefined options
    cookware: (() => {
      const rawCookware = rawRecipe.cookware;
      if (!rawCookware) return undefined;
      
      // Check if cookware matches any predefined option (case-insensitive)
      const matchingOption = cookwareOptions.find(
        option => option.toLowerCase().trim() === String(rawCookware).toLowerCase().trim()
      );
      
      if (matchingOption) {
        return matchingOption; // Use the exact predefined option
      } else {
        console.warn(`⚠️  Cookware "${rawCookware}" is not in predefined options, setting to "Other"`);
        return 'Other'; // Invalid cookware, set to "Other"
      }
    })(),
    
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

  // Validate cookingTime (must be string in format "X分钟" or empty)
  if (!recipe.cookingTime || typeof recipe.cookingTime !== 'string' || recipe.cookingTime.trim() === '') {
    console.warn('⚠️  Recipe has invalid cooking time - can be saved as draft');
  }

  // Validate servings (must be integer between 1 and 20)
  if (!recipe.servings || typeof recipe.servings !== 'number' || recipe.servings < 1 || recipe.servings > 20) {
    console.warn('⚠️  Recipe has invalid servings - can be saved as draft');
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

  // Parse cooking time - returns number (minutes) instead of string
  const cookingTime = parseDuration(recipe.totalTime || recipe.cookTime || recipe.prepTime);

  // Parse servings - extract number directly, return as integer
  // If servings > 20, it's likely a parsing error, return undefined (let user fill in)
  let servings;
  let rawServings = recipe.recipeYield || recipe.yield || '';
  
  if (typeof rawServings === 'object' && rawServings.value) {
    rawServings = rawServings.value;
  }
  
  if (typeof rawServings === 'number') {
    // If number is > 20, it's likely a parsing error (e.g., reading wrong field)
    // Return undefined so user can fill it in manually
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
    } else {
      servings = undefined;
    }
  } else {
    servings = undefined;
  }

  // Do not parse tags/keywords when importing directly from Schema.org
  // Tags should be empty array for schema-based imports - let user define their own tags
  const tags = [];

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
 * Returns number of minutes (integer) instead of string
 */
function parseDuration(duration) {
  if (!duration) return undefined;
  
  // Handle ISO 8601 format (PT30M, PT1H30M)
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const hours = duration.match(/(\d+)H/);
    const minutes = duration.match(/(\d+)M/);
    let totalMinutes = 0;
    
    if (hours) totalMinutes += parseInt(hours[1], 10) * 60;
    if (minutes) totalMinutes += parseInt(minutes[1], 10);
    
    return totalMinutes || undefined;
  }
  
  // If it's already a number, return it (clamp between 1-999)
  if (typeof duration === 'number') {
    return Math.max(1, Math.min(999, Math.round(duration)));
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
      // For Microdata imports (schema-based), tags should be empty and servings should be limited
      return {
        title,
        description: description || '',
        ingredients: [],
        instructions: [],
        tags: [], // Empty tags for schema imports
        servings: undefined, // Will be set by generateCompleteRecipeSchema
      };
    }
  }

  return null;
}

/**
 * Categorize cooking time into three categories: Quick, Medium, Long
 * Quick: < 30 minutes
 * Medium: 30-60 minutes
 * Long: > 60 minutes
 */
function categorizeCookingTime(cookingTime) {
  if (!cookingTime || typeof cookingTime !== 'string') {
    return 'Medium'; // Default to Medium if not specified
  }
  
  const timeStr = cookingTime.toLowerCase().trim();
  
  // Quick: Under 15 minutes, 15-30 minutes
  if (timeStr.includes('under 15') || 
      timeStr.includes('15-30') || 
      timeStr.includes('15 to 30') ||
      timeStr.includes('< 30') ||
      timeStr.includes('less than 30')) {
    return 'Quick';
  }
  
  // Long: 1-2 hours, 2-4 hours, 4+ hours, Overnight
  if (timeStr.includes('1-2 hours') || 
      timeStr.includes('2-4 hours') || 
      timeStr.includes('4+ hours') || 
      timeStr.includes('4 hours') ||
      timeStr.includes('overnight') ||
      timeStr.includes('> 60') ||
      timeStr.includes('more than 60') ||
      timeStr.includes('1 hour') ||
      timeStr.includes('2 hour')) {
    return 'Long';
  }
  
  // Medium: 30-45 minutes, 45-60 minutes (default)
  return 'Medium';
}

/**
 * Get YouTube videos from pre-generated queries (from recipe generation)
 * This function uses the YouTube queries that were generated along with the recipe
 * @param {Object} recipeData - Recipe data
 * @param {Array} youtubeQueries - Array of YouTube query objects with searchQuery and description
 * @param {string} optionLabel - Label for logging (e.g., "Option 1")
 * @returns {Promise<Object>} YouTube videos and search URL
 */
async function getYoutubeDataFromQueries(recipeData, youtubeQueries, optionLabel = '') {
  if (!process.env.YOUTUBE_API_KEY) {
    console.warn(`⚠️  YouTube API key not configured, cannot search for videos${optionLabel ? ` (${optionLabel})` : ''}`);
    return {
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        recipeData.title + (recipeData.cookware ? ` ${recipeData.cookware} recipe` : '')
      )}`,
      videos: [],
    };
  }

  try {
    const cookware = recipeData.cookware || '';
    const recipeTitle = recipeData.title || '';
    
    // Generate fallback search URL
    const searchQuery = cookware ? `${recipeTitle} ${cookware} recipe` : recipeTitle;
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
    
    // Process up to 3 search queries (each query returns 1 video)
    const searchQueriesToProcess = youtubeQueries.slice(0, 3);
    console.log(`📊 Processing ${searchQueriesToProcess.length} YouTube search queries${optionLabel ? ` (${optionLabel})` : ''}`);
    
    const videoPromises = searchQueriesToProcess.map(async (queryObj, index) => {
      try {
        const searchQuery = queryObj.searchQuery;
        if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length === 0) {
          console.warn(`⚠️  Query ${index + 1} missing searchQuery, skipping${optionLabel ? ` (${optionLabel})` : ''}`);
          return [];
        }
        
        console.log(`🔍 Searching YouTube using query "${searchQuery}" (getting top 1 video, 100 units)${optionLabel ? ` (${optionLabel})` : ''}`);
        
        try {
          const searchVideos = await searchYouTubeVideosByQuery(searchQuery, 1, {
            recipeTitle: recipeTitle,
            cookware: cookware
          });
          if (searchVideos && searchVideos.length > 0) {
            console.log(`✅ Successfully retrieved ${searchVideos.length} video(s) using searchQuery "${searchQuery}"${optionLabel ? ` (${optionLabel})` : ''}`);
            
            // Apply AI description to videos if available and in English
            const chineseCharRegex = /[\u4e00-\u9fff]/;
            const hasValidDescription = queryObj.description && !chineseCharRegex.test(queryObj.description);
            
            return searchVideos.map((video) => {
              let finalDescription = '';
              
              if (hasValidDescription) {
                // Use AI-generated English description from recipe generation
                finalDescription = queryObj.description;
              } else {
                // Generate English description from video and recipe info
                const recipeTitle = recipeData.title || 'this recipe';
                const cookware = recipeData.cookware || 'your cookware';
                const ingredientsList = recipeData.ingredients 
                  ? recipeData.ingredients.map(ing => typeof ing === 'string' ? ing : ing.name || ing).slice(0, 3).join(', ')
                  : '';
                
                if (ingredientsList) {
                  finalDescription = `Learn how to make ${recipeTitle.toLowerCase()} with ${ingredientsList.toLowerCase()} using ${cookware.toLowerCase()}. This video provides clear step-by-step instructions and helpful cooking tips to help you create a delicious and perfectly cooked dish.`;
                } else {
                  finalDescription = `This tutorial demonstrates how to prepare ${recipeTitle.toLowerCase()} using ${cookware.toLowerCase()}. Watch to learn essential cooking techniques, timing tips, and flavor-enhancing methods that will help you achieve excellent results every time.`;
                }
              }
              
              return {
                ...video,
                description: finalDescription, // Always use English description
              };
            });
          } else {
            console.warn(`⚠️  No videos found for searchQuery "${searchQuery}"${optionLabel ? ` (${optionLabel})` : ''}`);
            return [];
          }
        } catch (searchError) {
          console.error(`❌ Error searching for query "${searchQuery}"${optionLabel ? ` (${optionLabel})` : ''}:`, searchError.message);
          // Check if it's a quota error
          if (searchError.message === 'QUOTA_EXCEEDED' || 
              (searchError.response?.status === 403 && searchError.response?.data?.error?.code === 403)) {
            const errorMessage = searchError.response?.data?.error?.message || searchError.message;
            if (errorMessage.includes('quota') || searchError.message === 'QUOTA_EXCEEDED') {
              console.error(`❌ YouTube API quota exceeded detected in search!${optionLabel ? ` (${optionLabel})` : ''}`);
              globalYouTubeQuotaExceeded = true;
              globalYouTubeQuotaExceededTime = Date.now();
              return [{ quotaExceeded: true, query: searchQuery }];
            }
          }
          return [];
        }
      } catch (error) {
        console.error(`❌ Error processing search query ${index + 1}${optionLabel ? ` (${optionLabel})` : ''}:`, error.message);
        return [];
      }
    });
    
    // Wait for all search queries to complete
    const videoResultsArrays = await Promise.all(videoPromises);
    
    // Flatten arrays (each search query can return 1 video)
    const videoResults = videoResultsArrays.flat();
    
    // Calculate quota cost and statistics
    const searchQueriesUsed = searchQueriesToProcess.length;
    const totalQuotaCost = searchQueriesUsed * 100; // Each search query costs 100 units
    const hasQuotaError = videoResults.some(result => result && result.quotaExceeded);
    
    // Filter out error markers and duplicates
    const validVideos = [];
    const processedVideoIds = new Set();
    
    for (const result of videoResults) {
      // Skip error markers
      if (!result || result.quotaExceeded) {
        continue;
      }
      // Valid video result must have videoId and title
      if (result.videoId && result.title) {
        // Remove duplicates based on videoId
        if (!processedVideoIds.has(result.videoId)) {
          processedVideoIds.add(result.videoId);
          validVideos.push(result);
        }
      }
    }
    
    // Log quota usage statistics
    console.log(`📊 Quota usage summary${optionLabel ? ` (${optionLabel})` : ''}:`);
    console.log(`   - Search queries used: ${searchQueriesUsed} (${totalQuotaCost} units)`);
    console.log(`   - Total unique videos: ${validVideos.length}`);
    
    // Check for quota exceeded
    if (hasQuotaError) {
      globalYouTubeQuotaExceeded = true;
      globalYouTubeQuotaExceededTime = Date.now();
      console.error(`❌ YouTube API quota exceeded detected. Stopping video search.${optionLabel ? ` (${optionLabel})` : ''}`);
      console.error('🚫 Global quota flag set - future requests will skip YouTube searches for 1 hour');
    }
    
    // Remove internal fields before returning (frontend doesn't need them)
    const uniqueVideos = validVideos.map(video => {
      // Remove any internal tracking fields
      const { quotaCost, method, aiDescription, searchQuery: _, ...videoForFrontend } = video;
      return videoForFrontend;
    });
    
    if (uniqueVideos.length > 0) {
      console.log(`✅ Successfully found ${uniqueVideos.length} unique videos${optionLabel ? ` (${optionLabel})` : ''}`);
      console.log(`📺 Video titles:`, uniqueVideos.map(v => v.title).join(', '));
      
      return {
        searchUrl,
        videos: uniqueVideos, // Return all unique videos (up to 3 from 3 queries * 1 video each)
      };
    } else {
      console.warn(`⚠️  No unique videos found for YouTube queries${optionLabel ? ` (${optionLabel})` : ''}`);
      
      return {
        searchUrl,
        videos: [],
      };
    }
  } catch (error) {
    console.error(`❌ Error getting YouTube data from queries${optionLabel ? ` (${optionLabel})` : ''}:`, error.message);
    return {
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        recipeData.title + (recipeData.cookware ? ` ${recipeData.cookware} recipe` : '')
      )}`,
      videos: [],
    };
  }
}

/**
 * Get YouTube video search queries and descriptions from OpenAI
 * OpenAI will return 3 optimized search queries and descriptions for finding the most relevant videos
 * based on the recipe ingredients and requirements
 * The three videos will be categorized by cooking time: Quick, Medium, Long
 * NOTE: This function is now primarily used as a fallback. Main flow uses queries from recipe generation.
 */
async function getYouTubeVideoRecommendationsFromAI(recipeData) {
  if (!openai) {
    console.warn('⚠️  OpenAI not available, cannot get AI video recommendations');
    return null;
  }

  try {
    const ingredientsList = recipeData.ingredients 
      ? recipeData.ingredients.map(ing => typeof ing === 'string' ? ing : ing.name || ing).join(', ')
      : 'Unknown';
    
    const cookingTime = recipeData.cookingTime || 'Not specified';
    
    const prompt = `You are an expert YouTube video recommendation system for cooking tutorials. Your task is to find the BEST cooking tutorial videos for a given recipe.

RECIPE INFORMATION:
- Title: ${recipeData.title || 'Unknown'}
- Description: ${recipeData.description || 'No description'}
- Main Ingredients: ${ingredientsList}
- Primary Cookware: ${recipeData.cookware || 'Unknown'}
- Cuisine Style: ${recipeData.cuisine || 'Not specified'}
- Cooking Time: ${cookingTime}

YOUR TASK - GENERATE OPTIMIZED SEARCH QUERIES:
Generate exactly 3 optimized YouTube search queries for finding the most relevant cooking tutorial videos.

SEARCH QUERY REQUIREMENTS:
- Generate highly specific and optimized search queries for YouTube's search algorithm
- Use 5-12 words, include key ingredients, cookware, and cooking methods
- Each query should target a different aspect, technique, or approach to the recipe
- Focus on finding high-quality, educational cooking tutorial videos

VIDEO SELECTION CRITERIA:
- Videos should be highly relevant to the recipe (ingredients, cookware, technique)
- Videos should be from reputable cooking channels
- Videos should be educational and tutorial-focused
- Videos should match the cuisine style and cooking method
- Videos should be in English (for English-speaking audiences)

SEARCH QUERY GUIDELINES (if providing searchQuery):
- Use 5-12 words (optimal for YouTube search)
- Include primary ingredients and cookware when relevant
- Use action words: "how to", "easy", "best", "recipe", "tutorial"
- Include cooking methods: "air fry", "pan sear", "roast", "braise", etc.
- Be specific but not overly restrictive
- Use natural language (how people actually search)
- Avoid generic terms like "food" or "cooking" alone

DESCRIPTION REQUIREMENTS - CRITICAL:
For each video, you MUST write a description in ENGLISH ONLY. The description should:
- Be written in natural, conversational American English
- Be 2-3 sentences, 50-100 words
- Explain why this video is helpful for this recipe
- Describe what the viewer will learn from this video
- Highlight the specific value this video provides
- Use proper English grammar and spelling
- NOT contain any Chinese characters, Chinese text, or any language other than English

Return a JSON object with this exact structure:
{
  "videos": [
    {
      "searchQuery": "air fryer chicken recipe tutorial",  // REQUIRED: Optimized search query for YouTube
      "description": "English description in American English (2-3 sentences, 50-100 words, ENGLISH ONLY - no Chinese). Explain what makes this video helpful and what the viewer will learn."
    },
    {
      "searchQuery": "how to cook chicken in air fryer",  // REQUIRED: Optimized search query for YouTube
      "description": "English description in American English (2-3 sentences, 50-100 words, ENGLISH ONLY - no Chinese). Explain what makes this video helpful and what the viewer will learn."
    },
    {
      "searchQuery": "best air fryer chicken cooking method",  // REQUIRED: Optimized search query for YouTube
      "description": "English description in American English (2-3 sentences, 50-100 words, ENGLISH ONLY - no Chinese). Explain what makes this video helpful and what the viewer will learn."
    }
  ]
}

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. Return exactly 3 search queries (no more, no less)
2. ALWAYS provide a searchQuery for each video (required)
3. ALL descriptions MUST be written in ENGLISH ONLY
4. DO NOT use Chinese characters, Chinese text, or any language other than English in descriptions
5. Write descriptions in natural, conversational American English
6. Each search query should target different aspects, techniques, or approaches
7. Focus on finding high-quality, educational cooking tutorial videos
8. Prioritize queries that match ingredients, cookware, and cooking methods
9. Use 5-12 words per query (optimal for YouTube search)
10. Include primary ingredients and cookware when relevant
11. Use action words: "how to", "easy", "best", "recipe", "tutorial"

REMINDER: All descriptions must be in English. If you write descriptions in Chinese, the system will reject them and generate fallback descriptions.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert YouTube video recommendation system specializing in cooking tutorials. Your task is to generate optimized search queries for finding the most relevant and helpful cooking videos for recipes. Always return valid JSON with exactly 3 search queries. Each query should include: searchQuery (required, optimized for YouTube search), and description (required, in English only). CRITICAL: All descriptions must be written in English only - do not use Chinese or any other language. Write in natural, conversational American English. Generate search queries that are highly specific, include key ingredients and cookware, and target different aspects or techniques of the recipe.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7, // Balanced temperature for consistent search queries
      max_tokens: 800, // Reduced since we only need search queries and descriptions
      response_format: { type: 'json_object' },
    });

    // Log token usage
    logCompletionUsage('youtube-video-recommendations', completion, {
      recipeTitle: recipeData.title,
      cookware: recipeData.cookware || 'none',
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanedText);
      
      if (result && result.videos && Array.isArray(result.videos) && result.videos.length > 0) {
        console.log(`✅ AI recommended ${result.videos.length} YouTube video recommendations`);
        
        // Validate and normalize the recommendations
        const chineseCharRegex = /[\u4e00-\u9fff]/;
        const validatedVideos = result.videos.map((video, index) => {
          // Ensure searchQuery is always provided
          if (!video.searchQuery || typeof video.searchQuery !== 'string' || video.searchQuery.trim().length === 0) {
            console.warn(`⚠️  Video ${index + 1} missing searchQuery, generating fallback`);
            video.searchQuery = `${recipeData.title || 'recipe'} ${recipeData.cookware || ''} tutorial`.trim();
          }
          
          // Validate description (check for Chinese characters)
          if (video.description && chineseCharRegex.test(video.description)) {
            console.warn(`⚠️  Video ${index + 1} description contains Chinese characters, will use YouTube API description instead`);
            video.description = null; // Set to null, will use YouTube description
          }
          
          // Log what AI provided
          console.log(`🔍 Video ${index + 1}: AI provided searchQuery "${video.searchQuery}"`);
          
          return {
            searchQuery: video.searchQuery,
            description: video.description || null,
          };
        });
        
        const videosWithQueries = validatedVideos.filter(v => v.searchQuery).length;
        console.log(`✅ Validated ${validatedVideos.length} search queries: ${videosWithQueries} with searchQuery`);
        
        return validatedVideos;
      } else {
        console.warn('⚠️  AI response does not contain valid video recommendations');
        console.warn('⚠️  Response:', responseText);
    return null;
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI video recommendations:', parseError.message);
      console.error('❌ Response text:', responseText);
    return null;
    }
  } catch (error) {
    console.error('❌ Error getting YouTube video recommendations from AI:', error.message);
    return null;
  }
}

/**
 * Search YouTube videos by query and return the first result (for backward compatibility)
 */
async function searchYouTubeVideoByQuery(searchQuery, context = {}) {
  const videos = await searchYouTubeVideosByQuery(searchQuery, 1, context);
  return videos && videos.length > 0 ? videos[0] : null;
}

/**
 * Search YouTube videos by query and return multiple results
 * @param {string} searchQuery - Search query string
 * @param {number} maxResults - Maximum number of videos to return (default: 2)
 * @returns {Promise<Array>} Array of video objects
 */
async function searchYouTubeVideosByQuery(searchQuery, maxResults = 50, context = {}) {
  // Step 1: Check cache first
  const cached = await findCachedYouTubeQuery(searchQuery);
  if (cached && cached.videos && cached.videos.length > 0) {
    // Return cached videos (limit to requested maxResults)
    return cached.videos.slice(0, maxResults);
  }
  
  // Step 2: If not in cache, call YouTube API
  if (!process.env.YOUTUBE_API_KEY) {
    console.warn('⚠️  YouTube API key not configured, and no cache found');
    return [];
  }

  try {
    const axios = require('axios');
    console.log(`🔍 Searching YouTube API for: "${searchQuery}" (maxResults: ${maxResults})`);
    
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        maxResults: maxResults, // Get top N results (now 50 by default)
        key: process.env.YOUTUBE_API_KEY,
        videoEmbeddable: true,
        order: 'relevance', // Order by relevance (best match for the search query)
        safeSearch: 'moderate', // Moderate safe search for family-friendly content
      },
      timeout: 10000,
    });

    if (!response.data || !response.data.items || response.data.items.length === 0) {
      console.warn(`⚠️  No YouTube videos found for query: "${searchQuery}"`);
      return [];
    }
        
    const videos = response.data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
    }));
        
    console.log(`✅ Found ${videos.length} video(s) for query: "${searchQuery}"`);
    
    // Step 3: Store to database (async, don't wait)
    storeYouTubeQuery(searchQuery, videos, context).catch(err => {
      console.error('❌ Failed to store YouTube query to cache:', err);
    });
    
    return videos;
  } catch (apiError) {
    const errorData = apiError.response?.data;
    const errorMessage = errorData?.error?.message || apiError.message;
    const errorCode = errorData?.error?.code || apiError.response?.status;
    
    console.error(`❌ YouTube API error for query "${searchQuery}":`, errorMessage);
    console.error(`❌ Error code: ${errorCode}`);
    
    // Check for quota exceeded error
    if (errorCode === 403 && errorMessage && errorMessage.includes('quota')) {
      console.error('❌ YouTube API quota exceeded! The daily quota limit has been reached.');
      console.error('💡 Solutions:');
      console.error('   1. Wait for the quota to reset (usually at midnight Pacific Time)');
      console.error('   2. Request a quota increase in Google Cloud Console');
      console.error('   3. Implement caching to reduce API calls');
      console.error('   4. Optimize search queries to reduce redundant calls');
      // Re-throw to let caller handle quota errors
      throw new Error('QUOTA_EXCEEDED');
    }
    
    if (errorData?.error) {
      console.error(`❌ Error details:`, JSON.stringify(errorData.error, null, 2));
    }
    
    return [];
  }
}

/**
 * Get YouTube video details by video IDs using YouTube API
 * Returns video information including thumbnails, titles, channels, etc.
 */
async function getYouTubeVideoDetails(videoIds) {
  if (!process.env.YOUTUBE_API_KEY) {
    console.warn('⚠️  YouTube API key not configured');
    return [];
  }

  if (!videoIds || videoIds.length === 0) {
    return [];
  }

  try {
    const axios = require('axios');
    console.log(`🔍 Fetching YouTube video details for ${videoIds.length} video(s) using videos.list (1 unit per video)`);
    
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet', // Only need snippet for video details (not contentDetails to save quota)
        id: videoIds.join(','),
        key: process.env.YOUTUBE_API_KEY,
      },
      timeout: 10000,
    });

    if (!response.data || !response.data.items || response.data.items.length === 0) {
      console.warn(`⚠️  YouTube API returned no video details for videoIds: ${videoIds.join(', ')}`);
      return [];
    }

    const videos = response.data.items.map((item) => ({
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      embedUrl: `https://www.youtube.com/embed/${item.id}`,
    }));

    console.log(`✅ Retrieved details for ${videos.length} YouTube video(s) using videos.list (${videoIds.length} units)`);
    return videos;
  } catch (apiError) {
    const errorData = apiError.response?.data;
    const errorMessage = errorData?.error?.message || apiError.message;
    const errorCode = errorData?.error?.code || apiError.response?.status;
    
    console.error(`❌ YouTube API error fetching video details for IDs "${videoIds.join(', ')}":`, errorMessage);
    console.error(`❌ Error code: ${errorCode}`);
    
    // Check for quota exceeded error
    if (errorCode === 403 && errorMessage && errorMessage.includes('quota')) {
      console.error('❌ YouTube API quota exceeded! The daily quota limit has been reached.');
      console.error('💡 This affects videos.list operation (1 unit per video)');
      // Re-throw to let caller handle quota errors
      throw new Error('QUOTA_EXCEEDED');
    }
    
    // For other errors (invalid video ID, etc.), return empty array (not an error)
    if (errorCode === 404 || (errorData?.error?.errors && errorData.error.errors.some(e => e.reason === 'videoNotFound'))) {
      console.warn(`⚠️  Video IDs not found: ${videoIds.join(', ')}`);
      return [];
    }
    
    if (errorData?.error) {
      console.error(`❌ Error details:`, JSON.stringify(errorData.error, null, 2));
    }
    
    // For other errors, return empty array (fallback will be used)
    return [];
  }
}

/**
 * Search for related YouTube videos based on recipe ingredients and requirements
 * New workflow:
 * 1. Use OpenAI to get 3 most relevant YouTube video IDs and descriptions
 * 2. Use YouTube API to get video details (thumbnails, titles, channels, etc.)
 * 3. Merge AI descriptions with YouTube API data
 * 4. Return complete video information
 * 
 * @param {string} recipeTitle - The recipe title to search for
 * @param {string} cookware - The cookware used (e.g., "air fryer", "oven")
 * @param {object} recipeData - Recipe data including ingredients, description, etc.
 * @param {boolean} skipAI - Optional flag to skip AI recommendations (default: false)
 *                           Note: This is independent of DISABLE_AI_RECIPE_GENERATION
 */
// Global flag to track YouTube quota status (shared across requests)
// This helps skip unnecessary API calls when quota is exhausted
let globalYouTubeQuotaExceeded = false;
let globalYouTubeQuotaExceededTime = 0;
const QUOTA_EXCEEDED_RESET_TIME = 60 * 60 * 1000; // Reset after 1 hour

async function searchYouTubeVideos(recipeTitle, cookware, recipeData = null, skipAI = false) {
  try {
    // PERFORMANCE OPTIMIZATION: Check global quota status first
    // If quota was exhausted recently, skip all YouTube operations immediately
    const now = Date.now();
    if (globalYouTubeQuotaExceeded && (now - globalYouTubeQuotaExceededTime) < QUOTA_EXCEEDED_RESET_TIME) {
      const searchQuery = cookware ? `${recipeTitle} ${cookware} recipe` : recipeTitle;
      const encodedQuery = encodeURIComponent(searchQuery);
      const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
      console.log(`⏩ Skipping YouTube search (global quota exceeded) - using fallback URL`);
        return {
          searchUrl,
        videos: [],
      };
    }
    
    // Generate cache key
    const cacheKey = generateCacheKey(recipeTitle, cookware);
    
    // Check cache first (unless skipAI is true, which might indicate we want fresh data)
    if (!skipAI) {
      const cachedResult = getCachedYouTubeResult(cacheKey);
      if (cachedResult) {
        console.log(`🎯 Using cached YouTube results for: "${recipeTitle}" with cookware: "${cookware}"`);
        return cachedResult;
      }
    }
    
    // Generate fallback search URL
    const searchQuery = cookware ? `${recipeTitle} ${cookware} recipe` : recipeTitle;
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
    
    // Check if we should use AI recommendations
    const shouldUseAI = !skipAI && openai && recipeData;
    
    // Debug logging
    console.log(`🔍 YouTube search debug:`, {
      skipAI,
      hasOpenAI: !!openai,
      hasRecipeData: !!recipeData,
      shouldUseAI,
      youtubeApiKey: process.env.YOUTUBE_API_KEY ? 'configured' : 'not configured',
      cacheKey,
      cacheHit: false, // Will be true if we found in cache above
    });
    
    if (shouldUseAI) {
      // PERFORMANCE OPTIMIZATION: Check global quota status BEFORE calling AI
      // If quota is already exceeded, skip AI call entirely to save time
      const now = Date.now();
      if (globalYouTubeQuotaExceeded && (now - globalYouTubeQuotaExceededTime) < QUOTA_EXCEEDED_RESET_TIME) {
        console.log(`⏩ Skipping AI YouTube recommendations (global quota exceeded) - using fallback URL`);
    return {
      searchUrl,
      videos: [],
    };
      }
      
      console.log(`🤖 Getting AI YouTube video recommendations for: "${recipeTitle}"`);
      console.log(`📝 Recipe data for AI:`, JSON.stringify({
        title: recipeData.title,
        cookware: recipeData.cookware,
        ingredientsCount: recipeData.ingredients?.length || 0,
      }, null, 2));
      
      // Step 1: Get optimized search queries and descriptions from OpenAI
      // Add timeout to prevent AI call from blocking too long (10 seconds max)
      // Note: Actual AI recommendation takes ~6-7 seconds, so 10 seconds provides buffer
      const AI_YOUTUBE_TIMEOUT = 10000; // 10 seconds timeout for AI call (increased from 5s, actual time is ~7s)
      let aiRecommendations = null;
      try {
        const aiPromise = getYouTubeVideoRecommendationsFromAI(recipeData);
        const aiTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AI YouTube recommendations timeout')), AI_YOUTUBE_TIMEOUT);
        });
        aiRecommendations = await Promise.race([aiPromise, aiTimeoutPromise]);
      } catch (aiError) {
        if (aiError.message === 'AI YouTube recommendations timeout') {
          console.warn(`⏱️  AI YouTube recommendations timeout after ${AI_YOUTUBE_TIMEOUT}ms, skipping AI optimization`);
          aiRecommendations = null;
        } else {
          console.error(`❌ Error getting AI YouTube recommendations:`, aiError.message);
          aiRecommendations = null;
        }
      }
      
      if (aiRecommendations && aiRecommendations.length > 0) {
        console.log(`✅ AI recommended ${aiRecommendations.length} search queries`);
        
        if (process.env.YOUTUBE_API_KEY) {
          // SIMPLIFIED STRATEGY: Use AI-generated search queries to find videos
          const searchQueriesToProcess = aiRecommendations.slice(0, 2); // Process up to 2 search queries
          console.log(`📊 Processing ${searchQueriesToProcess.length} AI-generated search queries`);
          
          const videoPromises = searchQueriesToProcess.map(async (aiRec, index) => {
            try {
              if (!aiRec.searchQuery) {
                console.warn(`⚠️  Recommendation ${index + 1} missing searchQuery, skipping`);
                return [];
              }
              
              console.log(`🔍 Searching YouTube using AI query "${aiRec.searchQuery}" (getting top 1 video, 100 units)`);
              
              try {
                const searchVideos = await searchYouTubeVideosByQuery(aiRec.searchQuery, 1, {
                  recipeTitle: recipeTitle,
                  cookware: cookware
                });
                if (searchVideos && searchVideos.length > 0) {
                  console.log(`✅ Successfully retrieved ${searchVideos.length} video(s) using searchQuery "${aiRec.searchQuery}" (100 units cost)`);
                  
                  // Apply AI description to videos if available and in English
                  const chineseCharRegex = /[\u4e00-\u9fff]/;
                  const hasValidDescription = aiRec.description && !chineseCharRegex.test(aiRec.description);
                  
                  return searchVideos.map((video) => {
                    let finalDescription = '';
                    
                    if (hasValidDescription) {
                      // Use AI-generated English description
                      finalDescription = aiRec.description;
                    } else {
                      // Generate English description from video and recipe info
                      const recipeTitle = recipeData.title || 'this recipe';
                      const cookware = recipeData.cookware || 'your cookware';
                      const ingredientsList = recipeData.ingredients 
                        ? recipeData.ingredients.map(ing => typeof ing === 'string' ? ing : ing.name || ing).slice(0, 3).join(', ')
                        : '';
                      
                      if (ingredientsList) {
                        finalDescription = `Learn how to make ${recipeTitle.toLowerCase()} with ${ingredientsList.toLowerCase()} using ${cookware.toLowerCase()}. This video provides clear step-by-step instructions and helpful cooking tips to help you create a delicious and perfectly cooked dish.`;
                      } else {
                        finalDescription = `This tutorial demonstrates how to prepare ${recipeTitle.toLowerCase()} using ${cookware.toLowerCase()}. Watch to learn essential cooking techniques, timing tips, and flavor-enhancing methods that will help you achieve excellent results every time.`;
                      }
                    }
                    
                    return {
                      ...video,
                      description: finalDescription, // Always use English description
                    };
                  });
                } else {
                  console.warn(`⚠️  No videos found for searchQuery "${aiRec.searchQuery}"`);
                  return [];
                }
              } catch (searchError) {
                console.error(`❌ Error searching for query "${aiRec.searchQuery}":`, searchError.message);
                // Check if it's a quota error
                if (searchError.message === 'QUOTA_EXCEEDED' || 
                    (searchError.response?.status === 403 && searchError.response?.data?.error?.code === 403)) {
                  const errorMessage = searchError.response?.data?.error?.message || searchError.message;
                  if (errorMessage.includes('quota') || searchError.message === 'QUOTA_EXCEEDED') {
                    console.error('❌ YouTube API quota exceeded detected in search!');
                    globalYouTubeQuotaExceeded = true;
                    globalYouTubeQuotaExceededTime = Date.now();
                    return [{ quotaExceeded: true, query: aiRec.searchQuery }];
                  }
                }
                return [];
              }
            } catch (error) {
              console.error(`❌ Error processing search query ${index + 1}:`, error.message);
              return [];
            }
          });
          
          // Wait for all search queries to complete
          const videoResultsArrays = await Promise.all(videoPromises);
          
          // Flatten arrays (each search query can return multiple videos)
          const videoResults = videoResultsArrays.flat();
          
          // Calculate quota cost and statistics
          const searchQueriesUsed = searchQueriesToProcess.length;
          const totalQuotaCost = searchQueriesUsed * 100; // Each search query costs 100 units
          const hasQuotaError = videoResults.some(result => result && result.quotaExceeded);
          
          // Filter out error markers and duplicates
          const validVideos = [];
          const processedVideoIds = new Set();
          
          for (const result of videoResults) {
            // Skip error markers
            if (!result || result.quotaExceeded) {
              continue;
            }
            // Valid video result must have videoId and title
            if (result.videoId && result.title) {
              // Remove duplicates based on videoId
              if (!processedVideoIds.has(result.videoId)) {
                processedVideoIds.add(result.videoId);
                validVideos.push(result);
              }
            }
          }
          
          // Log quota usage statistics
          console.log(`📊 Quota usage summary:`);
          console.log(`   - Search queries used: ${searchQueriesUsed} (${totalQuotaCost} units)`);
          console.log(`   - Total unique videos: ${validVideos.length}`);
          
          // Check for quota exceeded
          if (hasQuotaError) {
            globalYouTubeQuotaExceeded = true;
            globalYouTubeQuotaExceededTime = Date.now();
            console.error('❌ YouTube API quota exceeded detected. Stopping video search.');
            console.error('🚫 Global quota flag set - future requests will skip YouTube searches for 1 hour');
          }
          
          // Remove internal fields before returning (frontend doesn't need them)
          const uniqueVideos = validVideos.map(video => {
            // Remove any internal tracking fields
            const { quotaCost, method, aiDescription, searchQuery, ...videoForFrontend } = video;
            return videoForFrontend;
          });
          
          if (uniqueVideos.length > 0) {
            console.log(`✅ Successfully found ${uniqueVideos.length} unique videos`);
            console.log(`📺 Video titles:`, uniqueVideos.map(v => v.title).join(', '));
            console.log(`📺 Video IDs:`, uniqueVideos.map(v => v.videoId).join(', '));
            
            const result = {
              searchUrl,
              videos: uniqueVideos, // Return all unique videos (up to 3 from 3 queries * 1 video each)
            };
            
            // Cache the result for future requests
            setCachedYouTubeResult(cacheKey, result);
            
            return result;
          } else {
            console.warn('⚠️  No unique videos found for AI-generated search queries');
            console.warn('⚠️  Possible reasons:');
            console.warn('   - YouTube API quota exceeded (check server logs for 403 errors)');
            console.warn('   - No videos match the search queries');
            console.warn('   - YouTube API errors');
            console.warn('⚠️  Falling back to search URL only. User can still search manually on YouTube.');
            
            // Cache the fallback result (empty videos) to avoid repeated API calls
            const fallbackResult = {
              searchUrl,
              videos: [],
            };
            
            // Only cache if it's not a quota error (don't cache quota errors)
            if (!hasQuotaError) {
              setCachedYouTubeResult(cacheKey, fallbackResult);
            }
          }
        } else {
          console.warn('⚠️  YouTube API key not configured, cannot search for videos');
        }
      } else {
        console.warn('⚠️  AI did not return search queries, falling back to basic YouTube search');
        // If AI failed but we have API key, try basic search as fallback
        if (process.env.YOUTUBE_API_KEY) {
          try {
            console.log(`🔍 Attempting basic YouTube search as fallback for: "${recipeTitle}"`);
            const basicSearchQuery = cookware ? `${recipeTitle} ${cookware} recipe` : `${recipeTitle} recipe`;
            const fallbackVideos = await searchYouTubeVideosByQuery(basicSearchQuery, 3, {
              recipeTitle: recipeTitle,
              cookware: cookware
            });
            if (fallbackVideos && fallbackVideos.length > 0) {
              console.log(`✅ Basic search found ${fallbackVideos.length} video(s) as fallback`);
              const result = {
                searchUrl,
                videos: fallbackVideos,
              };
              setCachedYouTubeResult(cacheKey, result);
              return result;
            } else {
              console.warn(`⚠️  Basic search also returned 0 videos for: "${basicSearchQuery}"`);
            }
          } catch (fallbackError) {
            console.error(`❌ Basic search fallback failed:`, fallbackError.message);
            // Check if quota error
            if (fallbackError.message === 'QUOTA_EXCEEDED' || 
                (fallbackError.response?.status === 403 && fallbackError.response?.data?.error?.message?.includes('quota'))) {
              globalYouTubeQuotaExceeded = true;
              globalYouTubeQuotaExceededTime = Date.now();
              console.error('🚫 YouTube API quota exceeded detected in fallback search');
            }
          }
        }
      }
    } else {
      if (skipAI) {
        console.log('⚠️  AI recommendations skipped by parameter (skipAI=true), trying basic search');
        // Try basic search if skipAI is true
        if (process.env.YOUTUBE_API_KEY) {
          try {
            const basicSearchQuery = cookware ? `${recipeTitle} ${cookware} recipe` : `${recipeTitle} recipe`;
            const basicVideos = await searchYouTubeVideosByQuery(basicSearchQuery, 3, {
              recipeTitle: recipeTitle,
              cookware: cookware
            });
            if (basicVideos && basicVideos.length > 0) {
              console.log(`✅ Basic search found ${basicVideos.length} video(s)`);
              const result = {
                searchUrl,
                videos: basicVideos,
              };
              setCachedYouTubeResult(cacheKey, result);
              return result;
            }
          } catch (basicError) {
            console.error(`❌ Basic search failed:`, basicError.message);
          }
        }
      } else if (!openai) {
        console.log('⚠️  OpenAI not available, trying basic YouTube search');
        // Try basic search if OpenAI is not available
        if (process.env.YOUTUBE_API_KEY) {
          try {
            const basicSearchQuery = cookware ? `${recipeTitle} ${cookware} recipe` : `${recipeTitle} recipe`;
            const basicVideos = await searchYouTubeVideosByQuery(basicSearchQuery, 3, {
              recipeTitle: recipeTitle,
              cookware: cookware
            });
            if (basicVideos && basicVideos.length > 0) {
              console.log(`✅ Basic search found ${basicVideos.length} video(s)`);
              const result = {
                searchUrl,
                videos: basicVideos,
              };
              setCachedYouTubeResult(cacheKey, result);
              return result;
            }
          } catch (basicError) {
            console.error(`❌ Basic search failed:`, basicError.message);
          }
        }
      } else if (!recipeData) {
        console.log('⚠️  Recipe data not provided, trying basic YouTube search');
        // Try basic search if recipe data is not provided
        if (process.env.YOUTUBE_API_KEY) {
          try {
            const basicSearchQuery = cookware ? `${recipeTitle} ${cookware} recipe` : `${recipeTitle} recipe`;
            const basicVideos = await searchYouTubeVideosByQuery(basicSearchQuery, 3, {
              recipeTitle: recipeTitle,
              cookware: cookware
            });
            if (basicVideos && basicVideos.length > 0) {
              console.log(`✅ Basic search found ${basicVideos.length} video(s)`);
              const result = {
                searchUrl,
                videos: basicVideos,
              };
              setCachedYouTubeResult(cacheKey, result);
              return result;
            }
          } catch (basicError) {
            console.error(`❌ Basic search failed:`, basicError.message);
          }
        }
      } else {
        console.log('⚠️  Unknown reason for skipping AI recommendations, trying basic search');
        // Try basic search as last resort
        if (process.env.YOUTUBE_API_KEY) {
          try {
            const basicSearchQuery = cookware ? `${recipeTitle} ${cookware} recipe` : `${recipeTitle} recipe`;
            const basicVideos = await searchYouTubeVideosByQuery(basicSearchQuery, 3, {
              recipeTitle: recipeTitle,
              cookware: cookware
            });
            if (basicVideos && basicVideos.length > 0) {
              console.log(`✅ Basic search found ${basicVideos.length} video(s)`);
              const result = {
                searchUrl,
                videos: basicVideos,
              };
              setCachedYouTubeResult(cacheKey, result);
              return result;
            }
          } catch (basicError) {
            console.error(`❌ Basic search failed:`, basicError.message);
          }
        }
      }
    }
    
    // Final fallback: return search URL only (no videos)
    console.log(`📺 Returning search URL only for YouTube: ${searchUrl}`);
    const fallbackResult = {
      searchUrl,
      videos: [],
    };
    
    // Only cache fallback if it's not a quota error (don't cache quota errors)
    if (!globalYouTubeQuotaExceeded) {
      setCachedYouTubeResult(cacheKey, fallbackResult);
    }
    
    return fallbackResult;
  } catch (error) {
    console.error('❌ Error searching YouTube videos:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Generate cache key for error handling
    const cacheKey = generateCacheKey(recipeTitle, cookware);
    
    // Return fallback search URL
    const fallbackQuery = cookware ? `${recipeTitle} ${cookware} recipe` : recipeTitle;
    const fallbackResult = {
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(fallbackQuery)}`,
      videos: [],
    };
    
    // Don't cache quota errors (they should be retried after quota reset)
    // But cache other errors to avoid repeated failures
    const isQuotaError = error.response?.status === 403 && 
                         (error.response?.data?.error?.message?.includes('quota') || 
                          error.message?.includes('quota'));
    if (!isQuotaError) {
      setCachedYouTubeResult(cacheKey, fallbackResult);
      console.log(`💾 Cached error result for: ${cacheKey}`);
    } else {
      console.log('⚠️  Not caching quota error - will retry after quota reset');
    }
    
    return fallbackResult;
  }
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
      type: "integer",
      description: "Cooking time in minutes as an integer (minimum 1, maximum 999). Convert any time format to total minutes. Examples: '30 minutes' = 30, '1 hour' = 60, '1 hour 30 minutes' = 90",
      minimum: 1,
      maximum: 999
    },
    servings: {
      type: "integer",
      description: "Number of servings as an integer (minimum 1, maximum 20). Extract the number directly. Examples: '4 servings' = 4, '6-8 servings' = 6 (use the lower number), 'serves 4' = 4",
      minimum: 1,
      maximum: 20
    },
    tags: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Relevant tags (cuisine type, meal type, dietary info, etc.) - MAXIMUM 3 tags only",
      maxItems: 3
    },
    cookware: {
      type: ["string", "null"],
      description: `Main cookware type (optional, can be null). CRITICAL: You MUST use EXACTLY one of these predefined options: ${cookwareOptions.join(', ')}. Do NOT create custom cookware names. If cookware is mentioned, match it to the closest predefined option. If not specified or unsure, use null.`,
      enum: [...cookwareOptions, null]
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

IMPORTANT FORMATTING RULES:
1. cookingTime: Convert to INTEGER in minutes (1-999)
   - "30 minutes" → 30
   - "1 hour" → 60
   - "1 hour 30 minutes" → 90
   - "45 min" → 45
   - If range given (e.g., "30-45 minutes"), use the average or lower number

2. servings: Extract INTEGER directly (1-20)
   - "4 servings" → 4
   - "6-8 servings" → 6 (use lower number)
   - "serves 4" → 4
   - "for 4 people" → 4
   - If range given, use the lower number

3. tags: Select MAXIMUM 3 most relevant tags only

4. cookware: If mentioned, MUST match one of: ${cookwareOptions.join(', ')}
   - Do NOT create custom cookware names
   - Match to closest predefined option
   - If not specified, use null`;

  try {
    console.log('🤖 Using AI to extract recipe information with Structured Outputs...');
    
    // Use Structured Outputs with strict JSON Schema
    // Note: This requires OpenAI SDK 4.20.0+ and models that support structured outputs
    const completion = await openai.beta.chat.completions.parse({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a recipe extraction expert. Extract recipe information from web pages following the exact JSON schema provided.

CRITICAL RULES:
1. cookingTime: Must be an INTEGER in minutes (1-999). Convert any time format to total minutes.
   - Examples: "30 minutes" = 30, "1 hour" = 60, "1 hour 30 minutes" = 90, "45 min" = 45
2. servings: MUST be an INTEGER (1-20) - this is REQUIRED. Extract the number directly from text.
   - CRITICAL: servings MUST be an INTEGER, NOT a string
   - Examples: "4 servings" = 4, "6-8 servings" = 6 (use lower number), "serves 4" = 4, "for 4 people" = 4
   - If not specified, use a realistic number (typically 4-6)
3. tags: MAXIMUM 3 tags only. Select the most relevant tags.
4. cookware: MUST be one of these predefined options: ${cookwareOptions.join(', ')}. Do NOT create custom names. If cookware is mentioned, match it to the closest predefined option. If not specified, use null.`
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

    // Ensure tags are limited to maximum 3
    if (recipeData.tags && Array.isArray(recipeData.tags)) {
      recipeData.tags = recipeData.tags.slice(0, 3);
    }

    // Validate and normalize cookware - must be from predefined options
    if (recipeData.cookware) {
      const matchingOption = cookwareOptions.find(
        option => option.toLowerCase().trim() === String(recipeData.cookware).toLowerCase().trim()
      );
      
      if (matchingOption) {
        recipeData.cookware = matchingOption; // Use the exact predefined option
      } else {
        // AI generated cookware is not in predefined options, set to "Other"
        console.warn(`⚠️  AI generated cookware "${recipeData.cookware}" is not in predefined options, setting to "Other"`);
        recipeData.cookware = 'Other';
      }
    }

    // Ensure cookingTime is an integer
    if (recipeData.cookingTime && typeof recipeData.cookingTime !== 'number') {
      const parsed = parseInt(recipeData.cookingTime, 10);
      if (!isNaN(parsed)) {
        recipeData.cookingTime = Math.max(1, Math.min(999, parsed));
      } else {
        recipeData.cookingTime = null;
      }
    }

    // Ensure servings is an integer
    if (recipeData.servings && typeof recipeData.servings !== 'number') {
      const parsed = parseInt(recipeData.servings, 10);
      if (!isNaN(parsed)) {
        recipeData.servings = Math.max(1, Math.min(20, parsed));
      } else {
        recipeData.servings = null;
      }
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
    let isSchemaImport = false; // Track if recipe was imported from schema (not AI)

    // Step 2: If Schema.org failed, try AI extraction (only when needed)
    if (!rawRecipe || !rawRecipe.title) {
      if (openai) {
        try {
          console.log('📝 Schema.org extraction failed, trying AI extraction...');
          rawRecipe = await extractRecipeWithAI(response.data, url);
          // AI extraction - tags are allowed
          isSchemaImport = false;
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
    } else {
      // Schema.org extraction successful - tags should be empty
      isSchemaImport = true;
    }

    // Step 3: Generate complete Recipe schema with all required fields
    // For schema imports, ensure tags are empty (let user define their own)
    // IMPORTANT: Force rawRecipe.tags to empty array before passing to generateCompleteRecipeSchema
    // This ensures no tags leak through even if extractRecipeFromJsonLd somehow returns tags
    if (isSchemaImport && rawRecipe) {
      rawRecipe.tags = []; // Force empty tags for schema imports
      console.log(`📋 Schema import - Forcing rawRecipe.tags to empty array before generateCompleteRecipeSchema`);
    }
    
    const finalRecipe = generateCompleteRecipeSchema(rawRecipe, isSchemaImport);

    // Debug: Log servings and tags for schema imports
    if (isSchemaImport) {
      console.log(`📋 Schema import - Servings: ${finalRecipe.servings}, Tags: ${JSON.stringify(finalRecipe.tags)}`);
      // CRITICAL: tags must be empty for schema imports - force it if not
      if (!Array.isArray(finalRecipe.tags) || finalRecipe.tags.length > 0) {
        console.error(`❌ ERROR: Tags should be empty for schema import but got: ${JSON.stringify(finalRecipe.tags)}`);
        console.error(`   Forcing tags to empty array...`);
        finalRecipe.tags = []; // Force fix - CRITICAL for schema imports
      }
      console.log(`✅ Schema import verified - Tags: ${JSON.stringify(finalRecipe.tags)}`);
    }

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
        cookingTime: { 
          type: 'integer',
          description: 'Cooking time in minutes (integer, minimum 1, maximum 999)',
          minimum: 1,
          maximum: 999
        },
        servings: { 
          type: 'integer',
          description: 'Number of servings (integer, minimum 1, maximum 20)',
          minimum: 1,
          maximum: 20
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Relevant tags (cuisine type, meal type, dietary info, etc.) - maximum 3 tags',
          maxItems: 3
        },
        cookware: { 
          type: ['string', 'null'],
          description: `Main cookware type (optional, can be null). CRITICAL: You MUST use EXACTLY one of these predefined options: ${cookwareOptions.join(', ')}. Do NOT create custom cookware names. If the recipe doesn't specify cookware or you're unsure, use null.`,
          enum: [...cookwareOptions, null]
        }
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
            '6. Ensuring cooking time and servings are accurate (cookingTime: integer in minutes 1-999, servings: integer 1-20)\n' +
            `7. Cookware (CRITICAL RULE):\n` +
            `   - You MUST use EXACTLY one of these predefined options: ${cookwareOptions.join(', ')}\n` +
            `   - Do NOT create custom cookware names or variations\n` +
            `   - Do NOT use synonyms or alternative names\n` +
            `   - If the recipe specifies cookware, match it to the closest predefined option\n` +
            `   - If cookware is not specified or you're unsure, use null\n` +
            `   - Valid examples: "Oven", "Air Fryer", "Stovetop – Pan or Pot", "Other", or null\n` +
            `   - Invalid examples: "stove", "frying pan", "baking oven", "microwave" (these should map to predefined options)\n\n` +
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

    // CRITICAL: Ensure tags are limited to maximum 3 before generating complete schema
    // This must be done BEFORE calling generateCompleteRecipeSchema
    if (optimizedRecipe.tags && Array.isArray(optimizedRecipe.tags)) {
      const originalTagCount = optimizedRecipe.tags.length;
      optimizedRecipe.tags = optimizedRecipe.tags.slice(0, 3);
      if (originalTagCount > 3) {
        console.log(`⚠️  AI returned ${originalTagCount} tags, limiting to 3: ${JSON.stringify(optimizedRecipe.tags)}`);
      }
    } else if (!optimizedRecipe.tags) {
      optimizedRecipe.tags = []; // Ensure it's an array
    }

    // Validate and normalize cookware - must be from predefined options
    if (optimizedRecipe.cookware) {
      // Check if cookware matches any predefined option (case-insensitive)
      const matchingOption = cookwareOptions.find(
        option => option.toLowerCase().trim() === String(optimizedRecipe.cookware).toLowerCase().trim()
      );
      
      if (matchingOption) {
        optimizedRecipe.cookware = matchingOption; // Use the exact predefined option
      } else {
        // AI generated cookware is not in predefined options, set to "Other"
        console.warn(`⚠️  AI generated cookware "${optimizedRecipe.cookware}" is not in predefined options, setting to "Other"`);
        optimizedRecipe.cookware = 'Other';
      }
    }

    // Generate complete Recipe schema with optimized data
    // Pass isSchemaImport = false for AI imports (tags are allowed, but max 3)
    const finalRecipe = generateCompleteRecipeSchema(optimizedRecipe, false);

    // CRITICAL: Double-check tags are limited to 3 after generateCompleteRecipeSchema
    // This is a safety measure in case generateCompleteRecipeSchema doesn't limit properly
    if (finalRecipe.tags && Array.isArray(finalRecipe.tags)) {
      const tagCount = finalRecipe.tags.length;
      if (tagCount > 3) {
        console.warn(`⚠️  Final recipe has ${tagCount} tags, limiting to 3: ${JSON.stringify(finalRecipe.tags)}`);
        finalRecipe.tags = finalRecipe.tags.slice(0, 3);
      }
    } else {
      finalRecipe.tags = []; // Ensure it's an array
    }

    console.log(`📋 AI import - Final tags (max 3): ${JSON.stringify(finalRecipe.tags)}`);

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
        cookingTime: { 
          type: ['integer', 'null'],
          description: 'Cooking time in minutes (integer, minimum 1, maximum 999, or null if not visible)',
          minimum: 1,
          maximum: 999
        },
        servings: { 
          type: ['integer', 'null'],
          description: 'Number of servings (integer, minimum 1, maximum 20, or null if not visible)',
          minimum: 1,
          maximum: 20
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Relevant tags (cuisine type, meal type, dietary info, etc.) - maximum 3 tags',
          maxItems: 3
        },
        cookware: { 
          type: ['string', 'null'],
          description: `Main cookware type (optional, can be null). Must be one of: ${cookwareOptions.join(', ')}`,
          enum: [...cookwareOptions, null]
        }
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
            '5. Cooking time (if visible) - as integer in minutes (1-999)\n' +
            '6. Servings (if visible) - as integer (1-20)\n' +
            '7. Tags or categories (if visible) - maximum 3 tags\n' +
            `8. Cookware needed (if visible) - must be one of: ${cookwareOptions.join(', ')}\n\n` +
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
      imageSize: `${Math.round(base64Image.length / 1024)}KB`,
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
          items: { type: 'string' },
          description: 'Relevant tags (cuisine type, meal type, dietary info, etc.) - maximum 3 tags',
          maxItems: 3
        },
        cookware: { 
          type: ['string', 'null'],
          description: `Main cookware type (optional, can be null). Must be one of: ${cookwareOptions.join(', ')}`,
          enum: [...cookwareOptions, null]
        }
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
            '5. Cooking time (if mentioned) - as integer in minutes (1-999)\n' +
            '6. Servings (if mentioned) - as integer (1-20)\n' +
            '7. Tags or categories (if mentioned) - maximum 3 tags\n' +
            `8. Cookware needed (if mentioned) - must be one of: ${cookwareOptions.join(', ')}\n\n` +
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
 * Generate recipe from ingredients using AI
 * Takes user's available ingredients and generates a recipe
 */
app.post('/api/generate-recipe-from-ingredients', async (req, res) => {
  const requestStartTime = Date.now();
  console.log(`⏱️  [PERFORMANCE] Recipe generation request started at ${new Date(requestStartTime).toISOString()}`);
  
  try {
    const { ingredients, dietaryRestrictions, cuisine, servings, cookingTime, cookware, skipAI } = req.body;

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({
        error: 'At least one ingredient is required',
        success: false,
      });
    }

    if (!cookware) {
      return res.status(400).json({
        error: 'Cookware is required',
        success: false,
      });
    }

    // Check if AI recipe generation should be skipped (via environment variable)
    // Note: This only affects recipe generation, not YouTube search AI optimization
    const shouldSkipRecipeAI = process.env.DISABLE_AI_RECIPE_GENERATION === 'true';

    // Track YouTube quota status to avoid unnecessary API calls
    let youtubeQuotaExceeded = false;
    
    const getYoutubeDataForRecipe = async (recipeData, optionLabel = '') => {
      // PERFORMANCE OPTIMIZATION: Check global quota status first (fastest path)
      const now = Date.now();
      if (globalYouTubeQuotaExceeded && (now - globalYouTubeQuotaExceededTime) < QUOTA_EXCEEDED_RESET_TIME) {
        const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
          recipeData.title + (cookware ? ` ${cookware} recipe` : '')
        )}`;
        console.log(`⏩ Skipping YouTube search${optionLabel ? ` (${optionLabel})` : ''} - global quota exceeded, using fallback URL`);
        return {
          searchUrl: fallbackUrl,
          videos: [],
        };
      }
      
      // PERFORMANCE OPTIMIZATION: If YouTube quota is already exceeded in this request, skip API calls and return fallback immediately
      if (youtubeQuotaExceeded) {
        const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
          recipeData.title + (cookware ? ` ${cookware} recipe` : '')
        )}`;
        console.log(`⏩ Skipping YouTube search${optionLabel ? ` (${optionLabel})` : ''} - quota exceeded in this request, using fallback URL`);
        return {
          searchUrl: fallbackUrl,
          videos: [],
        };
      }

      let youtubeVideos = null;
      const startTime = Date.now();
      try {
        const logLabel = optionLabel ? ` (${optionLabel})` : '';
        console.log(`🔍 Searching YouTube videos${logLabel} for: "${recipeData.title}" with cookware: "${cookware}"`);
        console.log(`📺 YouTube API Key configured: ${process.env.YOUTUBE_API_KEY ? 'YES' : 'NO'}`);

        const recipeDataForSearch = {
          title: recipeData.title,
          description: recipeData.description,
          ingredients: recipeData.ingredients || [],
          cookware: cookware,
          cuisine: cuisine || null,
          cookingTime: recipeData.cookingTime || null,
        };

        // Increased timeout to 15 seconds to allow AI recommendations (~7s) and YouTube API calls to complete
        const YOUTUBE_SEARCH_TIMEOUT = 15000; // 15 seconds timeout (AI needs ~7s, YouTube API needs additional time)
        const youtubeSearchPromise = searchYouTubeVideos(recipeData.title, cookware, recipeDataForSearch);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('YouTube search timeout')), YOUTUBE_SEARCH_TIMEOUT);
        });

        youtubeVideos = await Promise.race([youtubeSearchPromise, timeoutPromise]);
        
        const searchTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`📺 YouTube search result${logLabel}: ${youtubeVideos?.videos?.length || 0} videos (${searchTime}s)`);
        console.log(`📺 YouTube search URL${logLabel}: ${youtubeVideos?.searchUrl ? 'YES' : 'NO'}`);

        if (!youtubeVideos || !youtubeVideos.searchUrl) {
          console.warn(`⚠️  No search URL in YouTube result${logLabel}, creating fallback`);
          youtubeVideos = {
            searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
              recipeData.title + (cookware ? ` ${cookware} recipe` : '')
            )}`,
            videos: youtubeVideos?.videos || [],
          };
        }
      } catch (youtubeError) {
        const searchTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        // Check if quota is exceeded and mark it globally to skip future calls
        if (youtubeError.message && (youtubeError.message.includes('QUOTA_EXCEEDED') || youtubeError.message.includes('quota'))) {
          youtubeQuotaExceeded = true;
          console.warn(`🚫 YouTube quota exceeded detected. Skipping future YouTube searches for this request.`);
        }
        
        if (youtubeError.message === 'YouTube search timeout') {
          console.warn(`⏱️  YouTube search timeout${optionLabel ? ` (${optionLabel})` : ''} after ${searchTime}s, using fallback`);
        } else if (youtubeError.message && youtubeError.message.includes('QUOTA_EXCEEDED')) {
          console.warn(`🚫 YouTube quota exceeded${optionLabel ? ` (${optionLabel})` : ''}, using fallback`);
        } else {
          console.error(`❌ Error searching YouTube videos${optionLabel ? ` (${optionLabel})` : ''}:`, youtubeError.message);
        }
        
        youtubeVideos = {
          searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            recipeData.title + (cookware ? ` ${cookware} recipe` : '')
          )}`,
          videos: [],
        };
      }

      const finalYoutubeVideos = youtubeVideos || {
        searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
          recipeData.title + (cookware ? ` ${cookware} recipe` : '')
        )}`,
        videos: [],
      };

      if (!Array.isArray(finalYoutubeVideos.videos)) {
        finalYoutubeVideos.videos = [];
      }

      if (!finalYoutubeVideos.searchUrl) {
        finalYoutubeVideos.searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
          recipeData.title + (cookware ? ` ${cookware} recipe` : '')
        )}`;
        console.log(`⚠️  Created fallback search URL${optionLabel ? ` (${optionLabel})` : ''}:`, finalYoutubeVideos.searchUrl);
      }

      return finalYoutubeVideos;
    };
    
    if (shouldSkipRecipeAI) {
      console.log(`⚠️  AI recipe generation is disabled. Creating mock recipe options for YouTube testing.`);
      console.log(`📝 Ingredients: ${ingredients.join(', ')}`);
      console.log(`🍳 Cookware: ${cookware}`);
      console.log(`📺 YouTube search will still use AI optimization if available.`);
      
      const ingredientObjects = ingredients.map((ing, index) => ({
        name: ing,
        amount: index + 1,
        unit: 'cup'
      }));

      // Determine cooking times - if user specified, all three use same category with slight variation
      // If not specified, use different times to reflect different styles
      let cookingTimes;
      if (cookingTime) {
        // All three recipes same category, but slight variation for style
        if (cookingTime === 'Quick') {
          cookingTimes = ['25 minutes', '28 minutes', '30 minutes']; // All under 30 minutes
        } else if (cookingTime === 'Medium') {
          cookingTimes = ['40 minutes', '45 minutes', '50 minutes']; // All 30-60 minutes
        } else if (cookingTime === 'Long') {
          cookingTimes = ['70 minutes', '80 minutes', '90 minutes']; // All over 60 minutes
        }
      } else {
        // Different cooking times to reflect different styles
        cookingTimes = ['30 minutes', '45 minutes', '60 minutes'];
      }

      // Determine servings - use user selection or default
      const targetServings = servings || '4 servings';
      
      // Determine tags based on user selections
      const baseTags = [cookware];
      if (cuisine && cuisine !== 'None') {
        baseTags.push(cuisine);
      }
      if (cookingTime) {
        baseTags.push(cookingTime);
      }
      if (dietaryRestrictions && dietaryRestrictions.length > 0) {
        baseTags.push(...dietaryRestrictions);
      }

      // Three different styles
      const style1Tags = [...baseTags, 'Classic', 'Traditional'];
      const style2Tags = [...baseTags, 'Modern', 'Fusion'];
      const style3Tags = [...baseTags, 'Gourmet', 'Elevated'];

      const mockRecipes = [
        {
          title: `Classic ${ingredients[0] || 'Chef'} ${cookware} ${cookingTime === 'Quick' ? 'Quick' : cookingTime === 'Medium' ? 'Classic' : cookingTime === 'Long' ? 'Special' : 'Dish'}`,
          description: `A traditional, straightforward recipe that highlights ${ingredients.join(', ')} using your ${cookware}. Simple techniques with familiar flavors make this an approachable everyday meal.${cuisine && cuisine !== 'None' ? ` Inspired by classic ${cuisine} cuisine.` : ''}${dietaryRestrictions && dietaryRestrictions.length > 0 ? ` Suitable for ${dietaryRestrictions.join(', ')}.` : ''}`,
          ingredients: ingredientObjects,
          instructions: [
            { step: 1, description: `Prep all ingredients simply and preheat the ${cookware}.` },
            { step: 2, description: `Layer ${ingredients[0]} with supporting ingredients using traditional techniques.` },
            { step: 3, description: `Cook in the ${cookware} until done and serve with classic presentation.` }
          ],
          cookingTime: cookingTimes[0],
          servings: targetServings,
          tags: style1Tags,
          cookware,
        },
        {
          title: `Modern ${ingredients[0] || 'Family'} ${cookware} ${cookingTime === 'Quick' ? 'Express' : cookingTime === 'Medium' ? 'Fusion' : cookingTime === 'Long' ? 'Feast' : 'Creation'}`,
          description: `A contemporary recipe with creative twists that transforms ${ingredients.join(', ')} into something exciting using your ${cookware}. Bold flavors and modern techniques create a memorable dish.${cuisine && cuisine !== 'None' ? ` Featuring ${cuisine} fusion flavors.` : ''}${dietaryRestrictions && dietaryRestrictions.length > 0 ? ` Perfect for ${dietaryRestrictions.join(', ')} diets.` : ''}`,
          ingredients: ingredientObjects.map((ing) => ({
            ...ing,
            amount: ing.amount + 0.5,
          })),
          instructions: [
            { step: 1, description: `Season ${ingredients[0]} with modern spice blends and prep with creative techniques.` },
            { step: 2, description: `Use innovative cooking methods in the ${cookware} to build complex flavors.` },
            { step: 3, description: `Finish with contemporary garnishes and serve with style.` }
          ],
          cookingTime: cookingTimes[1],
          servings: targetServings,
          tags: style2Tags,
          cookware,
        },
        {
          title: `Gourmet ${ingredients[0] || 'Signature'} ${cookware} ${cookingTime === 'Quick' ? 'Delight' : cookingTime === 'Medium' ? 'Showcase' : cookingTime === 'Long' ? 'Masterpiece' : 'Experience'}`,
          description: `An elevated, restaurant-quality recipe that showcases ${ingredients.join(', ')} in your ${cookware}. Sophisticated techniques and refined presentation make this perfect for special occasions.${cuisine && cuisine !== 'None' ? ` Using advanced ${cuisine} techniques.` : ''}${dietaryRestrictions && dietaryRestrictions.length > 0 ? ` Compliant with ${dietaryRestrictions.join(', ')} requirements.` : ''}`,
          ingredients: ingredientObjects.map((ing, idx) => ({
            ...ing,
            amount: ing.amount + idx * 0.25,
          })),
          instructions: [
            { step: 1, description: `Prepare ${ingredients[0]} with advanced techniques like marinating or sous-vide preparation.` },
            { step: 2, description: `Cook in stages inside the ${cookware} using professional methods to build depth.` },
            { step: 3, description: `Plate with artistic presentation, adding elegant garnishes and finishing touches.` }
          ],
          cookingTime: cookingTimes[2],
          servings: targetServings,
          tags: style3Tags,
          cookware,
        },
      ];

      const recipeOptions = [];

      for (let i = 0; i < mockRecipes.length; i += 1) {
        const mockRecipe = mockRecipes[i];
        const finalRecipe = generateCompleteRecipeSchema(mockRecipe);
        const youtubeData = await getYoutubeDataForRecipe(finalRecipe, `Option ${i + 1}`);

        recipeOptions.push({
          recipe: finalRecipe,
          youtubeVideos: youtubeData,
        });
      }

      console.log(`✅ Mock recipe options generated: ${recipeOptions.length}`);
      
      return res.json({
        success: true,
        recipeOptions,
      });
    }

    if (!openai) {
      return res.status(503).json({
        error: 'AI recipe generation is not available. Please set OPENAI_API_KEY in .env file.',
        success: false,
      });
    }

    console.log(`🤖 Generating recipe from ingredients: ${ingredients.join(', ')}`);

    // JSON schema for three recipe options
    // The response should be an object with a "recipes" array containing exactly 3 recipes
    const RECIPE_JSON_SCHEMA = {
      type: 'object',
      properties: {
        recipes: {
          type: 'array',
          items: {
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
        servings: { 
          type: 'integer',
          description: 'Number of servings as an integer (minimum 1, maximum 20). This is REQUIRED.',
          minimum: 1,
          maximum: 20
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Relevant tags (cuisine type, meal type, dietary info, etc.) - maximum 3 tags',
          maxItems: 3
        },
        cookware: { 
          type: ['string', 'null'],
          description: `Main cookware type (optional, can be null). Must be one of: ${cookwareOptions.join(', ')}`,
          enum: [...cookwareOptions, null]
        }
      },
      required: ['title', 'description', 'ingredients', 'instructions', 'cookingTime', 'servings', 'tags', 'cookware'],
            additionalProperties: false
          },
          minItems: 3,
          maxItems: 3
        }
      },
      required: ['recipes'],
      additionalProperties: false
    };

    // ============================================
    // SINGLE-STAGE RECIPE GENERATION
    // Generate complete recipes directly in one API call for better performance
    // Expected improvement: 26-44% faster (30-40s vs 54s), 30-43% fewer tokens, 15-35% cost reduction
    // ============================================
    
    console.log('🎯 Starting single-stage recipe generation process...');
    const aiGenerationStartTime = Date.now();
    console.log(`⏱️  [PERFORMANCE] AI generation started at ${new Date(aiGenerationStartTime).toISOString()}`);
    
    // SINGLE-STAGE: Generate complete recipes directly
    const modelForRecipeGeneration = process.env.OPENAI_MODEL_RECIPE || 'gpt-4o';
    console.log(`📝 Generating recipes using ${modelForRecipeGeneration} (single-stage)...`);
    const apiStartTime = Date.now();
    
    // Build user requirements
    const userRequirements = [];
    
    if (cookingTime) {
      if (cookingTime === 'Quick') {
        userRequirements.push('Cooking Time: ALL three recipes MUST be Quick (less than 30 minutes total). This is REQUIRED.');
      } else if (cookingTime === 'Medium') {
        userRequirements.push('Cooking Time: ALL three recipes MUST be Medium (30-60 minutes total). This is REQUIRED.');
      } else if (cookingTime === 'Long') {
        userRequirements.push('Cooking Time: ALL three recipes MUST be Long (more than 60 minutes total). This is REQUIRED.');
      }
    }
    
    if (servings) {
      userRequirements.push(`Servings: ALL three recipes MUST serve ${servings}. This is REQUIRED.`);
    }
    
    if (cuisine && cuisine !== 'None') {
      userRequirements.push(`Cuisine: ALL three recipes MUST have ${cuisine} cuisine influence. This is REQUIRED.`);
    }
    
    if (dietaryRestrictions && dietaryRestrictions.length > 0) {
      userRequirements.push(`Dietary Restrictions: ALL three recipes MUST respect: ${dietaryRestrictions.join(', ')}. This is REQUIRED.`);
    }
    
    // Build optimized single-stage prompt
    const prompt = `Create THREE HIGHLY DISTINCT, REALISTIC, AUTHENTIC recipes from these available ingredients: ${ingredients.join(', ')}.

CRITICAL: Generate REAL, PRACTICAL recipes that people would actually cook, not random ingredient combinations. Each recipe must be a complete, well-thought-out dish with proper techniques, timing, and cooking methods.

INGREDIENT USAGE - REALISTIC COMBINATIONS:
- You do NOT need to use ALL provided ingredients in every recipe
- Each recipe should SELECT a DIFFERENT subset of ingredients that WORK WELL TOGETHER in real cooking
- Recipe 1 (Classic/Traditional): Choose 2-3 ingredients for a classic dish (e.g., chicken + tomato = curry/stew, not just "chicken and tomato")
- Recipe 2 (Modern/Fusion): Choose a DIFFERENT 2-4 ingredients for a modern/fusion dish (ensure ingredients complement each other)
- Recipe 3 (Gourmet/Elevated): Choose yet ANOTHER DIFFERENT 2-4 ingredients for a gourmet/elevated dish (create sophisticated pairings)
- You may add basic pantry staples (salt, pepper, oil, water, flour, sugar, spices, herbs, garlic, onion, etc.) as needed
- IMPORTANT: Only combine ingredients that make culinary sense together. Create ACTUAL DISHES, not random combinations.
- You must use each input ingredient **at least once** across the 3 recipes

RECIPE VARIETY - MAXIMUM DIFFERENTIATION:
The three recipes must be HIGHLY DISTINCT and offer COMPLETELY DIFFERENT culinary experiences:

1. DISH TYPE VARIETY:
   - Recipe 1: One specific dish type (e.g., "Tacos", "Curry", "Soup", "Stir-Fry", "Salad", "Roast", "Skewers", "Wraps")
   - Recipe 2: A COMPLETELY DIFFERENT dish type (avoid repetition)
   - Recipe 3: Yet ANOTHER DIFFERENT dish type
   - Examples: If Recipe 1 is a curry, Recipe 2 could be a salad, and Recipe 3 could be a roast
   - AVOID generic terms: "Dish", "Meal", "Supper", "Feast", "Showcase"

2. FLAVOR PROFILE VARIETY:
   - Recipe 1: Simple, classic, familiar flavors (basic seasoning, traditional combinations)
   - Recipe 2: Bold, complex, exotic flavors (spices, sauces, marinades, fusion elements)
   - Recipe 3: Sophisticated, refined, delicate flavors (premium ingredients, unique combinations, elegant preparations)

3. COOKING TECHNIQUE VARIETY:
   - Recipe 1: Straightforward technique (one-pot, minimal steps, simple roasting/baking)
   - Recipe 2: More complex technique (layering flavors, multiple steps, marination, searing)
   - Recipe 3: Advanced/unique technique (slow cooking, brining, special preparation, multi-stage cooking)

4. PRIMARY INGREDIENTS:
   - Each recipe should use DIFFERENT primary ingredients to maximize variety
   - Overlap between recipes should be MINIMAL (maximum 1-2 shared ingredients, but used in completely different ways)

${userRequirements.length > 0 ? `\nUSER REQUIREMENTS (ALL THREE RECIPES MUST SATISFY):\n${userRequirements.map((req, idx) => `${idx + 1}. ${req}`).join('\n')}` : ''}

${cookingTime ? `\nIMPORTANT: ALL THREE recipes MUST be ${cookingTime} (same cooking time category), but EVERYTHING ELSE should be COMPLETELY DIFFERENT.` : ''}

RECIPE STRUCTURE:
1. TITLE: Specific, descriptive (e.g., "Air Fryer Crispy Chicken Tacos", NOT "Chicken Air Fryer Supper")
   - Include dish type, cuisine style, or cooking technique when helpful
   - AVOID generic suffixes: "Supper", "Feast", "Showcase", "Dish", "Meal"
   - Each title must be UNIQUE and reflect the specific dish type
   - Examples: "Air Fryer Crispy Chicken Tacos", "Slow Cooker Thai Red Curry", "Pan-Seared Salmon with Lemon Herbs"

2. DESCRIPTION: "Perfect for: ..." + 2-3 sentences
   - Describe what makes this dish special and when to serve it
   - Mention flavor profile, texture, or cooking style

3. INGREDIENTS: Specific quantities (US units), prep notes in parentheses, substitutions
   - Include SPECIFIC quantities: "1 lb chicken breast", "2 cups coconut milk", "1 tablespoon curry powder"
   - Mention prep state: "Extra-firm tofu (press to remove excess water)", "Onion, diced", "Garlic, minced"
   - Provide substitutions: "Coconut milk (or cream as substitute)"
   - Include common pantry staples (salt, pepper, oil, etc.)

4. INSTRUCTIONS: Detailed steps with SPECIFIC times/temps
   - Include SPECIFIC cooking times and temperatures: "Cook 3-4 min per side", "Bake 375°F for 25 min", "Cook on Low for 6-7 hours"
   - Add preparation notes: "Press and cube the tofu", "Dice onion", "Marinate for 30 minutes"
   - Include cooking tips: "Mix gently to coat", "Cook until golden brown", "Add in last 10 minutes"
   - Specify when to add ingredients: "In the last 10 minutes", "After 30 minutes of cooking"
   - Add serving suggestions: "Serve with rice, naan, or a light green salad"
   - Each step should be clear, actionable, and realistic

5. COOKING TIME: ${cookingTime ? `${cookingTime} category` : 'Appropriate for recipe'}
   - Return as INTEGER in minutes (minimum 1, maximum 999)
   - Include both active and passive cooking time
   - Examples: 25 (for 25 minutes), 60 (for 1 hour), 420 (for 7 hours)

6. SERVINGS: ${servings ? `MUST be ${servings} (REQUIRED)` : 'REQUIRED - Return as INTEGER (minimum 1, maximum 20)'}
   - CRITICAL: This field is REQUIRED and MUST be an INTEGER
   - Return as INTEGER (minimum 1, maximum 20)
   - Examples: 4 (for 4 servings), 6 (for 6 servings)
   - If user specified servings, ALL three recipes MUST use that exact number

7. COOKWARE: "${cookware}" (REQUIRED for all recipes)
   - CRITICAL: You MUST use ONLY "${cookware}" for ALL recipes
   - DO NOT mention or use any other cookware (e.g., if cookware is "Air Fryer", do NOT mention "oven", "stovetop", "pan", "pot", etc.)
   - ALL cooking instructions must use ONLY "${cookware}"
   - Recipe titles should reflect the cookware when appropriate (e.g., "Air Fryer Crispy Chicken")
   - Descriptions and instructions must ONLY reference "${cookware}", never other cookware types

8. TAGS: Maximum 3 tags (cookware, cuisine type, meal type, dietary notes, cooking method)

CRITICAL REMINDERS:
- REALISTIC, PRACTICAL recipes only (real cooking techniques, timing, methods)
- Use ingredients that WORK TOGETHER in real cooking (e.g., chicken + tomato = curry, not random)
- SPECIFIC quantities, times, temperatures with US units
- Each recipe: COMPLETE, DISTINCT, AUTHENTIC
- Avoid unrealistic ingredient combinations or impractical techniques
- All cookware and tools should be commonly available in regular home kitchens
- AVOID generic titles: "Supper", "Feast", "Showcase", "Dish", "Meal"

RETURN FORMAT: JSON with "recipes" array containing exactly 3 recipe objects. Each recipe must include:
- title, description, ingredients (array), instructions (array), cookingTime, servings, tags (array), cookware`;

    // Build system message for single-stage approach
    const systemMessage = `Create THREE HIGHLY DISTINCT, AUTHENTIC, PRACTICAL recipes from available ingredients.

RULES:
1. REALISTIC: Real cooking techniques, specific times/temps (e.g., "pan-fry 3-4 min per side", "bake 375°F for 25 min")
2. INGREDIENTS: Use ingredients that WORK TOGETHER (e.g., chicken + tomato = curry, not random combinations)
3. VARIETY: Recipe 1 (Classic/Traditional), Recipe 2 (Modern/Fusion), Recipe 3 (Gourmet/Elevated)
   - DIFFERENT dish types (e.g., "Tacos", "Curry", "Soup", "Salad", "Roast")
   - DIFFERENT primary ingredients (minimal overlap)
   - DIFFERENT flavors (simple classic, bold complex, sophisticated refined)
   - DIFFERENT techniques (straightforward, multi-step, advanced)
4. TITLES: Specific, descriptive (e.g., "Air Fryer Crispy Chicken Tacos", NOT "Chicken Air Fryer Supper")
   - Include dish type, cuisine, or technique
   - AVOID generic terms: "Supper", "Feast", "Showcase", "Dish", "Meal"
5. DESCRIPTIONS: "Perfect for: ..." + what makes it special (flavor, texture, occasion)
6. RESPECT ALL USER CONSTRAINTS: cookware, time, servings, cuisine, dietary restrictions
   - SERVINGS CONSTRAINT IS CRITICAL:
     * servings MUST be an INTEGER (not a string) - this is REQUIRED
     * If user specified servings, ALL three recipes MUST use that exact number
     * If not specified, use a realistic number (typically 4-6)
   - COOKWARE CONSTRAINT IS CRITICAL: 
     * You MUST use EXACTLY "${cookware}" as the cookware value
     * Valid cookware options are: ${cookwareOptions.join(', ')}
     * You CANNOT use any cookware not in this list - NO custom cookware allowed
     * NEVER mention other cookware types in title, description, or instructions
7. Use each input ingredient at least once across 3 recipes
8. SPECIFIC quantities (US units), prep notes in parentheses, substitutions, serving suggestions
9. DETAILED INSTRUCTIONS: Clear steps with specific times, temperatures, and techniques
   - ALL instructions must use ONLY "${cookware}" - do NOT reference other cookware`;

    console.log(`🤖 Using model for recipe generation: ${modelForRecipeGeneration}`);
    if (modelForRecipeGeneration === 'gpt-4o-mini') {
      console.log(`💰 Cost-saving mode: Using gpt-4o-mini (93% cheaper than gpt-4o)`);
      console.log(`⚠️  Note: Recipe quality may be slightly lower. Monitor token usage and quality.`);
    } else {
      console.log(`💡 Tip: GPT-4o provides much better recipe quality than gpt-4o-mini`);
    }

    const completion = await openai.beta.chat.completions.parse({
      model: modelForRecipeGeneration,
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'recipe_generation',
          description: 'Generated recipe options from ingredients',
          strict: true,
          schema: RECIPE_JSON_SCHEMA
        }
      },
      temperature: 0.75, // Slightly higher for more creative variety while maintaining realism
    });
    const apiEndTime = Date.now();
    const apiDuration = ((apiEndTime - apiStartTime) / 1000).toFixed(2);
    console.log(`⏱️  [PERFORMANCE] AI API call completed in ${apiDuration}s`);

    const parsedResponse = completion.choices[0].message.parsed;
    const generatedRecipes = Array.isArray(parsedResponse?.recipes) ? parsedResponse.recipes : [];

    if (generatedRecipes.length === 0) {
      console.error('❌ AI did not return any recipes. Parsed response:', JSON.stringify(parsedResponse, null, 2));
      return res.status(500).json({
        error: 'AI failed to generate recipes. The response format may be incorrect.',
        success: false,
        debug: {
          hasRecipes: !!parsedResponse?.recipes,
          recipesLength: parsedResponse?.recipes?.length || 0,
          parsedResponseKeys: parsedResponse ? Object.keys(parsedResponse) : []
        }
      });
    }

    if (generatedRecipes.length < 3) {
      console.warn(`⚠️  AI returned ${generatedRecipes.length} recipes instead of 3. Using available recipes.`);
      // Continue with available recipes instead of failing completely
    } else if (generatedRecipes.length > 3) {
      console.warn(`⚠️  AI returned ${generatedRecipes.length} recipes instead of 3. Using first 3 recipes.`);
      generatedRecipes.splice(3); // Keep only first 3
    }

    // Log token usage with cost
    const aiGenerationEndTime = Date.now();
    const aiGenerationDuration = ((aiGenerationEndTime - aiGenerationStartTime) / 1000).toFixed(2);
    console.log(`⏱️  [PERFORMANCE] Total AI generation completed in ${aiGenerationDuration}s`);
    
    if (completion.usage) {
      const totalCost = calculateCost(modelForRecipeGeneration, completion.usage.prompt_tokens, completion.usage.completion_tokens);
      console.log(`📊 ${modelForRecipeGeneration} token usage: ${completion.usage.prompt_tokens} prompt + ${completion.usage.completion_tokens} completion = ${completion.usage.total_tokens} total`);
      console.log(`💰 Total recipe generation cost: $${totalCost.toFixed(6)}`);
      console.log(`📋 Generated recipes: ${generatedRecipes.map((r) => r?.title || 'Untitled').join(' | ')}`);
    }

    logCompletionUsage('generate-recipe-from-ingredients', completion, {
      ingredients: ingredients.join(', '),
      recipeTitles: generatedRecipes.map((r) => r?.title).join(' | '),
      dietaryRestrictions: dietaryRestrictions?.join(', ') || 'none',
      cuisine: cuisine || 'none',
      cookware: cookware || 'none',
    });
    
    // Prepare all recipes first (without YouTube data)
    const preparedRecipes = [];
    for (let i = 0; i < generatedRecipes.length; i += 1) {
      // Validate and normalize cookware - must be from predefined options
      let validatedCookware = cookware; // Start with user-specified cookware
      
      // If AI generated a different cookware, check if it's in the allowed list
      const aiGeneratedCookware = generatedRecipes[i].cookware;
      if (aiGeneratedCookware && aiGeneratedCookware !== cookware) {
        // Check if AI-generated cookware matches any predefined option (case-insensitive)
        const matchingOption = cookwareOptions.find(
          option => option.toLowerCase().trim() === aiGeneratedCookware.toLowerCase().trim()
        );
        if (matchingOption) {
          validatedCookware = matchingOption; // Use the exact predefined option
        } else {
          // AI generated cookware is not in the list, use user-specified cookware
          validatedCookware = cookware;
          console.log(`⚠️  AI generated cookware "${aiGeneratedCookware}" is not in predefined options, using user-specified: "${cookware}"`);
        }
      }
      
      // Ensure cookware is in the predefined list
      if (!cookwareOptions.includes(validatedCookware)) {
        console.warn(`⚠️  Cookware "${validatedCookware}" not in predefined options, defaulting to first option`);
        validatedCookware = cookwareOptions[0];
      }
      
      const generatedRecipe = {
        ...generatedRecipes[i],
        // Force user requirements to be satisfied - always use validated cookware from predefined options
        cookware: validatedCookware,
      };
      
      // Sanitize cookware references in title, description, and instructions
      // Use validatedCookware to ensure consistency
      if (generatedRecipe.title) {
        generatedRecipe.title = sanitizeCookwareReferences(generatedRecipe.title, validatedCookware);
      }
      if (generatedRecipe.description) {
        generatedRecipe.description = sanitizeCookwareReferences(generatedRecipe.description, validatedCookware);
      }
      if (Array.isArray(generatedRecipe.instructions)) {
        generatedRecipe.instructions = generatedRecipe.instructions.map(inst => ({
          ...inst,
          description: sanitizeCookwareReferences(
            typeof inst === 'string' ? inst : (inst.description || inst.step || ''),
            validatedCookware
          )
        }));
      }

      // Force servings if user specified - ensure it's a number
      if (servings) {
        // Convert servings to integer if it's a string
        if (typeof servings === 'string') {
          const numberMatch = servings.match(/(\d+)/);
          if (numberMatch) {
            generatedRecipe.servings = parseInt(numberMatch[1], 10);
          } else {
            generatedRecipe.servings = parseInt(servings, 10) || 4; // Default to 4 if can't parse
          }
        } else if (typeof servings === 'number') {
          generatedRecipe.servings = Math.max(1, Math.min(20, Math.round(servings)));
        } else {
          generatedRecipe.servings = servings;
        }
      }
      
      // Ensure servings is always a number (integer) and is present
      if (!generatedRecipe.servings || typeof generatedRecipe.servings !== 'number') {
        // Try to extract number from generatedRecipe.servings if it's a string
        if (typeof generatedRecipe.servings === 'string') {
          const numberMatch = generatedRecipe.servings.match(/(\d+)/);
          if (numberMatch) {
            generatedRecipe.servings = parseInt(numberMatch[1], 10);
          } else {
            generatedRecipe.servings = 4; // Default to 4 if can't parse
          }
        } else {
          generatedRecipe.servings = 4; // Default to 4 if missing or invalid
        }
      }
      
      // Ensure servings is within valid range
      generatedRecipe.servings = Math.max(1, Math.min(20, Math.round(generatedRecipe.servings)));

      // Validate and enforce cooking time category if user specified
      // Also convert cookingTime to integer (minutes) if it's a string
      if (cookingTime || generatedRecipe.cookingTime) {
        let cookingTimeMinutes = null;
        
        // Convert cookingTime to minutes (integer) if it's a string
        if (typeof generatedRecipe.cookingTime === 'string') {
          const cookingTimeLower = generatedRecipe.cookingTime.toLowerCase().trim();
          
          // Extract hours and minutes
          const hoursMatch = cookingTimeLower.match(/(\d+)\s*(hour|hours|hr|h)\b/);
          const minutesMatch = cookingTimeLower.match(/(\d+)\s*(minute|minutes|min|m)\b/);
          
          let totalMinutes = 0;
          if (hoursMatch) {
            totalMinutes += parseInt(hoursMatch[1], 10) * 60;
          }
          if (minutesMatch) {
            totalMinutes += parseInt(minutesMatch[1], 10);
          }
          
          // If no hours/minutes pattern found, try to extract just a number
          if (totalMinutes === 0) {
            const numberMatch = cookingTimeLower.match(/(\d+)/);
            if (numberMatch) {
              totalMinutes = parseInt(numberMatch[1], 10);
            }
          }
          
          if (totalMinutes > 0) {
            cookingTimeMinutes = Math.max(1, Math.min(999, totalMinutes));
          }
        } else if (typeof generatedRecipe.cookingTime === 'number') {
          cookingTimeMinutes = Math.max(1, Math.min(999, Math.round(generatedRecipe.cookingTime)));
        }
        
        // Check if cooking time matches the category (if user specified)
        if (cookingTime && cookingTimeMinutes !== null) {
          let timeMatches = false;
          if (cookingTime === 'Quick') {
            timeMatches = cookingTimeMinutes < 30;
          } else if (cookingTime === 'Medium') {
            timeMatches = cookingTimeMinutes >= 30 && cookingTimeMinutes <= 60;
          } else if (cookingTime === 'Long') {
            timeMatches = cookingTimeMinutes > 60;
          }
          
          if (!timeMatches) {
            console.warn(`⚠️  Recipe ${i + 1} cooking time ${cookingTimeMinutes} minutes doesn't match category "${cookingTime}". Adjusting...`);
            // Set appropriate cooking time based on category (as integer minutes)
            if (cookingTime === 'Quick') {
              cookingTimeMinutes = 25;
            } else if (cookingTime === 'Medium') {
              cookingTimeMinutes = 45;
            } else if (cookingTime === 'Long') {
              cookingTimeMinutes = 75;
            }
          }
        }
        
        // Update cookingTime to integer (minutes)
        if (cookingTimeMinutes !== null) {
          generatedRecipe.cookingTime = cookingTimeMinutes;
        }
      }

      // Ensure tags include user-specified requirements
      if (!Array.isArray(generatedRecipe.tags)) {
        generatedRecipe.tags = [];
      }
      
      // Add cookware to tags if not present
      if (!generatedRecipe.tags.includes(cookware)) {
        generatedRecipe.tags.push(cookware);
      }
      
      // Add cuisine to tags if specified and not present
      if (cuisine && cuisine !== 'None' && !generatedRecipe.tags.includes(cuisine)) {
        generatedRecipe.tags.push(cuisine);
      }
      
      // Add cooking time category to tags if specified and not present
      if (cookingTime && !generatedRecipe.tags.includes(cookingTime)) {
        generatedRecipe.tags.push(cookingTime);
      }
      
      // Add dietary restrictions to tags if specified and not present
      if (dietaryRestrictions && dietaryRestrictions.length > 0) {
        dietaryRestrictions.forEach(restriction => {
          if (!generatedRecipe.tags.includes(restriction)) {
            generatedRecipe.tags.push(restriction);
          }
        });
      }

      // Limit tags to maximum 3
      // Priority: user-specified tags (cookware, cuisine, cookingTime, dietaryRestrictions) first
      const userSpecifiedTags = [];
      if (cookware) userSpecifiedTags.push(cookware);
      if (cuisine && cuisine !== 'None') userSpecifiedTags.push(cuisine);
      if (cookingTime) userSpecifiedTags.push(cookingTime);
      if (dietaryRestrictions && dietaryRestrictions.length > 0) {
        userSpecifiedTags.push(...dietaryRestrictions);
      }
      
      // Get AI-generated tags (excluding user-specified ones)
      const aiGeneratedTags = generatedRecipe.tags.filter(tag => !userSpecifiedTags.includes(tag));
      
      // Combine: user-specified tags first, then AI-generated tags (up to 3 total)
      const maxTags = 3;
      // CRITICAL: Limit userSpecifiedTags to maxTags first, then add AI tags
      const limitedUserTags = userSpecifiedTags.slice(0, maxTags);
      const remainingSlots = maxTags - limitedUserTags.length;
      const limitedAiTags = aiGeneratedTags.slice(0, Math.max(0, remainingSlots));
      const finalTags = [...limitedUserTags, ...limitedAiTags].slice(0, maxTags);
      
      // Double-check: ensure final tags never exceed 3
      if (finalTags.length > maxTags) {
        console.warn(`⚠️  Generated recipe has ${finalTags.length} tags, limiting to ${maxTags}: ${JSON.stringify(finalTags)}`);
        generatedRecipe.tags = finalTags.slice(0, maxTags);
      } else {
        generatedRecipe.tags = finalTags;
      }
      
      console.log(`📋 Generate from ingredients - Final tags (max 3): ${JSON.stringify(generatedRecipe.tags)}`);

      if (!generatedRecipe.title) {
        console.warn(`⚠️  Skipping recipe option ${i + 1} due to missing title`, generatedRecipe);
        continue;
      }

      console.log(`✅ AI generated recipe option ${i + 1}: ${generatedRecipe.title}`);
      console.log(`   - Description: ${generatedRecipe.description?.substring(0, 100)}...`);
      console.log(`   - Cookware: ${generatedRecipe.cookware}`);
      console.log(`   - Cooking Time: ${generatedRecipe.cookingTime}`);
      console.log(`   - Servings: ${generatedRecipe.servings}`);
      console.log(`   - Ingredients count: ${generatedRecipe.ingredients?.length || 0}`);
      console.log(`   - Instructions count: ${generatedRecipe.instructions?.length || 0}`);
      console.log(`   - Tags: ${generatedRecipe.tags.join(', ')}`);
      
      // Validate recipe quality
      if (generatedRecipe.instructions && generatedRecipe.instructions.length < 3) {
        console.warn(`⚠️  Recipe ${i + 1} has fewer than 3 instructions - may be too simple`);
      }
      if (generatedRecipe.ingredients && generatedRecipe.ingredients.length < 3) {
        console.warn(`⚠️  Recipe ${i + 1} has fewer than 3 ingredients - may be incomplete`);
      }
      
      const finalRecipe = generateCompleteRecipeSchema(generatedRecipe);
      preparedRecipes.push({ 
        recipe: finalRecipe, 
        index: i + 1
      });
    }

    // AI generation time is already calculated above in the token usage section
    // (aiGenerationEndTime and aiGenerationDuration are already set)
    
    // Generate 3 shared YouTube queries based on user input (not individual recipes)
    // These queries will be shared across all recipe options
    console.log(`🚀 Generating 3 shared YouTube queries based on user input (ingredients, cookware, etc.)...`);
    const youtubeSearchStartTime = Date.now();
    
    // Check if quota is exceeded before starting
    if (youtubeQuotaExceeded || globalYouTubeQuotaExceeded) {
      console.log(`⏩ Skipping YouTube searches - quota exceeded, using fallback URLs only`);
    }
    
    // Generate shared YouTube queries based on user input
    let sharedYoutubeVideos = {
      videos: [],
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        ingredients.join(' ') + (cookware ? ` ${cookware} recipe` : '')
      )}`,
    };
    
    if (!youtubeQuotaExceeded && !globalYouTubeQuotaExceeded) {
      try {
        // Create a composite recipe data object for YouTube query generation
        // This represents the general theme of all recipes, not a specific one
        const compositeRecipeData = {
          title: `${ingredients.slice(0, 3).join(', ')} ${cookware} Recipes`,
          description: `Recipes using ${ingredients.join(', ')} with ${cookware}`,
          ingredients: ingredients.map(ing => ({ name: ing, amount: 1, unit: 'unit' })),
          cookware: cookware,
          cuisine: cuisine || null,
          cookingTime: cookingTime || null,
        };
        
        // Generate YouTube queries based on user input (not individual recipes)
        console.log(`📝 Generating YouTube queries for: ${ingredients.join(', ')} with ${cookware}`);
        const youtubeQueries = await getYouTubeVideoRecommendationsFromAI(compositeRecipeData);
        
        if (youtubeQueries && youtubeQueries.length > 0) {
          console.log(`✅ Generated ${youtubeQueries.length} YouTube queries based on user input`);
          // Get YouTube videos using the generated queries
          sharedYoutubeVideos = await getYoutubeDataFromQueries(compositeRecipeData, youtubeQueries, 'Shared');
          console.log(`✅ Retrieved ${sharedYoutubeVideos.videos.length} shared YouTube videos`);
        } else {
          console.warn(`⚠️  Failed to generate YouTube queries, using fallback`);
        }
      } catch (error) {
        console.error(`❌ Error generating shared YouTube videos:`, error.message);
        // Continue with fallback URL
      }
    }
    
    // Apply the same YouTube videos to all recipe options
    console.log(`📺 Applying ${sharedYoutubeVideos.videos.length} shared YouTube videos to all ${preparedRecipes.length} recipe options...`);
    const recipeOptions = preparedRecipes.map(({ recipe, index }) => {
      // Use the same YouTube videos for all recipes
      // Generate a search URL based on the recipe title for fallback
      const searchUrl = sharedYoutubeVideos.searchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(
        recipe.title + (cookware ? ` ${cookware} recipe` : '')
      )}`;
      
      return {
        recipe,
        youtubeVideos: {
          videos: sharedYoutubeVideos.videos, // Same videos for all recipes
          searchUrl,
        },
      };
    });
    
    const youtubeSearchEndTime = Date.now();
    const youtubeSearchTime = ((youtubeSearchEndTime - youtubeSearchStartTime) / 1000).toFixed(2);
    console.log(`⚡ YouTube searches completed in ${youtubeSearchTime}s (shared videos for all recipes)`);
    
    // Log summary of YouTube videos found
    const totalVideos = sharedYoutubeVideos.videos.length;
    console.log(`📺 Shared YouTube videos: ${totalVideos} videos (same for all ${recipeOptions.length} recipe options)`);

    if (recipeOptions.length === 0) {
      const requestEndTime = Date.now();
      const totalDuration = ((requestEndTime - requestStartTime) / 1000).toFixed(2);
      console.log(`⏱️  [PERFORMANCE] Request failed after ${totalDuration}s (no recipe options)`);
      return res.status(500).json({
        error: 'No valid recipe options were generated',
        success: false,
      });
    }

    const requestEndTime = Date.now();
    const totalDuration = ((requestEndTime - requestStartTime) / 1000).toFixed(2);
    console.log(`✅ Generated ${recipeOptions.length} recipe options successfully`);
    console.log(`⏱️  [PERFORMANCE] ========================================`);
    console.log(`⏱️  [PERFORMANCE] TOTAL REQUEST TIME: ${totalDuration}s`);
    console.log(`⏱️  [PERFORMANCE] - AI Generation: ${aiGenerationDuration}s (recipe generation only)`);
    console.log(`⏱️  [PERFORMANCE] - YouTube Search: ${youtubeSearchTime}s (3 shared videos based on user input)`);
    console.log(`⏱️  [PERFORMANCE] - Total Videos: ${totalVideos} shared videos (same for all recipe options)`);
    console.log(`⏱️  [PERFORMANCE] - AI Calls: 2 (1 for recipes + 1 for YouTube queries based on user input)`);
    console.log(`⏱️  [PERFORMANCE] ========================================`);
    
    res.json({
      success: true,
      recipeOptions,
    });

  } catch (error) {
    console.error('Error generating recipe from ingredients:', error.message);
    
    res.status(500).json({
      error: error.message || 'Failed to generate recipe from ingredients',
      success: false,
    });
  }
});

/**
 * Test YouTube video search endpoint
 * This endpoint allows testing YouTube video search without generating a full recipe
 */
app.get('/api/test-youtube', async (req, res) => {
  try {
    const { query, cookware } = req.query;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query parameter is required',
        success: false,
      });
    }
    
    console.log(`🧪 Testing YouTube search for: "${query}"${cookware ? ` with cookware: ${cookware}` : ''}`);
    
    // Prepare recipe data for AI search (if available)
    const recipeDataForSearch = {
      title: query,
      description: '',
      ingredients: [],
      cookware: cookware || '',
      cuisine: null,
      cookingTime: null,
    };
    
    // Test YouTube video search with AI optimization
    const youtubeVideos = await searchYouTubeVideos(query, cookware || '', recipeDataForSearch);
    
    console.log(`✅ YouTube search result:`, JSON.stringify(youtubeVideos, null, 2));
    
    // Extract the search query from the URL to show what was actually used
    const searchQueryUsed = youtubeVideos.searchUrl 
      ? decodeURIComponent(youtubeVideos.searchUrl.split('search_query=')[1]?.split('&')[0] || '')
      : 'N/A';
    
    res.json({
      success: true,
      query: query,
      cookware: cookware || 'none',
      recipeData: recipeDataForSearch,
      searchQueryUsed: searchQueryUsed,
      youtubeVideos: youtubeVideos,
      hasApiKey: !!process.env.YOUTUBE_API_KEY,
      hasOpenAIApiKey: !!process.env.OPENAI_API_KEY,
      videoCount: youtubeVideos.videos ? youtubeVideos.videos.length : 0,
      hasSearchUrl: !!youtubeVideos.searchUrl,
      aiOptimized: !!process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.error('Error testing YouTube search:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to test YouTube search',
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
    youtubeApiKey: process.env.YOUTUBE_API_KEY ? 'configured' : 'not configured',
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
  console.log(`📸 Scan endpoint: http://localhost:${PORT}/api/scan-recipe`);
  console.log(`📝 Text import endpoint: http://localhost:${PORT}/api/import-recipe-text`);
  console.log(`🍳 Generate from ingredients: http://localhost:${PORT}/api/generate-recipe-from-ingredients`);
  console.log(`🧪 Test YouTube endpoint: http://localhost:${PORT}/api/test-youtube?query=chicken%20recipe&cookware=Oven`);
  console.log(`📺 YouTube API Key: ${process.env.YOUTUBE_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🤖 OpenAI API: ${openai ? '✅ Available' : '❌ Not available'}`);
  console.log(`🛠️  AI recipe generation disabled: ${process.env.DISABLE_AI_RECIPE_GENERATION === 'true' ? '✅ Yes' : '❌ No'}`);
  console.log(`💾 YouTube cache: Enabled (TTL: ${YOUTUBE_CACHE_TTL / 1000 / 60 / 60} hours)`);
  console.log(`📊 YouTube search optimization: AI-generated search queries`);
  console.log(`🎯 Strategy: AI generates optimized search queries, then search YouTube API (100 units per query)`);
  console.log(`📈 Estimated quota consumption: 300 units per user query (3 search queries * 100 units each)`);
  console.log(`📺 Videos per query: 1 video per search query (up to 3 total videos from 3 queries)`);
});