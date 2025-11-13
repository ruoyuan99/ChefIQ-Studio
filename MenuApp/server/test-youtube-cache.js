/**
 * YouTube Cache Test Script
 * 测试YouTube缓存功能（阶段1：精确匹配）
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase client
// Use environment variables or fallback to defaults from frontend config
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://txendredncvrbxnxphbm.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZW5kcmVkbmN2cmJ4bnhwaGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3OTAsImV4cCI6MjA3NzI1ODc5MH0.EH6kk2dmx80Vm0-OsXAYZeU9vu_JZ0ElNh1WHEHzFfM';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('   Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase client initialized\n');

// Helper functions (same as in server.js)
function normalizeQuery(query) {
  if (!query) return '';
  return query.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

function hashQuery(query) {
  const normalized = normalizeQuery(query);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function extractKeywords(query) {
  if (!query) return [];
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);
  
  const words = query.toLowerCase().split(/\s+/).filter(word => {
    return word.length > 2 && !stopWords.has(word);
  });
  
  return [...new Set(words)];
}

// Test functions
async function testDatabaseConnection() {
  console.log('📋 Test 1: Database Connection');
  console.log('─────────────────────────────────────────');
  
  try {
    // Test connection by querying youtube_queries table
    const { data, error } = await supabase
      .from('youtube_queries')
      .select('count')
      .limit(1);
    
    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.error('❌ Table youtube_queries does not exist!');
        console.error('   Please run the SQL script in MenuApp/database/youtube_cache_tables.sql');
        return false;
      }
      throw error;
    }
    
    console.log('✅ Database connection successful');
    console.log('✅ Table youtube_queries exists\n');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Error details:', error);
    return false;
  }
}

async function testStoreQuery() {
  console.log('📋 Test 2: Store YouTube Query');
  console.log('─────────────────────────────────────────');
  
  const testQuery = 'chicken stir fry recipe';
  const testVideos = [
    {
      videoId: 'test_video_1',
      title: 'Test Video 1 - Chicken Stir Fry',
      description: 'A delicious chicken stir fry recipe',
      thumbnail: 'https://example.com/thumb1.jpg',
      channelTitle: 'Test Channel',
      publishedAt: new Date().toISOString(),
      url: 'https://www.youtube.com/watch?v=test_video_1',
      embedUrl: 'https://www.youtube.com/embed/test_video_1',
    },
    {
      videoId: 'test_video_2',
      title: 'Test Video 2 - Easy Chicken Recipe',
      description: 'Quick and easy chicken recipe',
      thumbnail: 'https://example.com/thumb2.jpg',
      channelTitle: 'Test Channel 2',
      publishedAt: new Date().toISOString(),
      url: 'https://www.youtube.com/watch?v=test_video_2',
      embedUrl: 'https://www.youtube.com/embed/test_video_2',
    }
  ];
  
  const context = {
    recipeTitle: 'Chicken Stir Fry',
    cookware: 'Wok'
  };
  
  try {
    const queryHash = hashQuery(testQuery);
    const normalizedQuery = normalizeQuery(testQuery);
    
    console.log(`📝 Test query: "${testQuery}"`);
    console.log(`📝 Normalized: "${normalizedQuery}"`);
    console.log(`📝 Hash: ${queryHash.substring(0, 16)}...`);
    
    // Check if query already exists
    const { data: existingQuery } = await supabase
      .from('youtube_queries')
      .select('id')
      .eq('query_hash', queryHash)
      .single();
    
    let queryId;
    
    if (existingQuery) {
      console.log('⚠️  Query already exists, updating...');
      queryId = existingQuery.id;
      await supabase
        .from('youtube_queries')
        .update({
          total_results: testVideos.length,
          last_used_at: new Date().toISOString()
        })
        .eq('id', queryId);
    } else {
      console.log('➕ Creating new query record...');
      const { data: newQuery, error: queryError } = await supabase
        .from('youtube_queries')
        .insert({
          search_query: testQuery,
          normalized_query: normalizedQuery,
          query_hash: queryHash,
          recipe_title: context.recipeTitle || null,
          cookware: context.cookware || null,
          total_results: testVideos.length,
          api_quota_used: 100,
          last_used_at: new Date().toISOString(),
          use_count: 0
        })
        .select('id')
        .single();
      
      if (queryError) {
        throw queryError;
      }
      
      queryId = newQuery.id;
      console.log(`✅ Query record created with ID: ${queryId}`);
    }
    
    // Store videos
    const videoRecords = testVideos.map((video, index) => ({
      query_id: queryId,
      video_id: video.videoId,
      title: video.title || '',
      description: video.description || null,
      thumbnail_url: video.thumbnail || null,
      channel_title: video.channelTitle || null,
      channel_id: null,
      published_at: video.publishedAt || null,
      duration: null,
      view_count: null,
      like_count: null,
      url: video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
      embed_url: video.embedUrl || `https://www.youtube.com/embed/${video.videoId}`,
      relevance_score: 1.0 - (index * 0.01),
      is_active: true,
      last_verified_at: new Date().toISOString()
    }));
    
    const { error: videoError } = await supabase
      .from('youtube_videos')
      .upsert(videoRecords, {
        onConflict: 'video_id',
        ignoreDuplicates: false
      });
    
    if (videoError) {
      throw videoError;
    }
    
    console.log(`✅ Stored ${videoRecords.length} videos`);
    
    // Store keywords
    const keywords = extractKeywords(testQuery);
    if (keywords.length > 0) {
      const keywordRecords = keywords.map(keyword => ({
        query_id: queryId,
        keyword: keyword,
        weight: 1.0
      }));
      
      await supabase
        .from('youtube_query_keywords')
        .delete()
        .eq('query_id', queryId);
      
      await supabase
        .from('youtube_query_keywords')
        .insert(keywordRecords);
      
      console.log(`✅ Stored ${keywords.length} keywords: ${keywords.join(', ')}`);
    }
    
    console.log('✅ Test 2 passed\n');
    return { queryId, queryHash };
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    console.error('   Error details:', error);
    return null;
  }
}

async function testFindCachedQuery(queryHash) {
  console.log('📋 Test 3: Find Cached Query (Exact Match)');
  console.log('─────────────────────────────────────────');
  
  const testQuery = 'chicken stir fry recipe';
  
  try {
    const hash = hashQuery(testQuery);
    console.log(`🔍 Searching for query: "${testQuery}"`);
    console.log(`🔍 Hash: ${hash.substring(0, 16)}...`);
    
    // Find exact match by hash
    const { data: queryRecord, error } = await supabase
      .from('youtube_queries')
      .select(`
        *,
        youtube_videos (*)
      `)
      .eq('query_hash', hash)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !queryRecord) {
      console.error('❌ Query not found in cache');
      console.error('   Error:', error?.message || 'No record found');
      return false;
    }
    
    console.log(`✅ Found cached query: "${queryRecord.search_query}"`);
    console.log(`   Recipe Title: ${queryRecord.recipe_title || 'N/A'}`);
    console.log(`   Cookware: ${queryRecord.cookware || 'N/A'}`);
    console.log(`   Total Results: ${queryRecord.total_results}`);
    console.log(`   Use Count: ${queryRecord.use_count}`);
    
    // Format videos
    const videos = (queryRecord.youtube_videos || [])
      .filter(v => v.is_active)
      .sort((a, b) => b.relevance_score - a.relevance_score);
    
    console.log(`   Videos: ${videos.length}`);
    videos.forEach((v, i) => {
      console.log(`     ${i + 1}. ${v.title} (score: ${v.relevance_score.toFixed(2)})`);
    });
    
    // Update usage statistics
    await supabase
      .from('youtube_queries')
      .update({
        use_count: queryRecord.use_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', queryRecord.id);
    
    console.log('✅ Usage statistics updated');
    console.log('✅ Test 3 passed\n');
    return true;
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
    console.error('   Error details:', error);
    return false;
  }
}

async function testQueryVariations() {
  console.log('📋 Test 4: Query Normalization (Variations)');
  console.log('─────────────────────────────────────────');
  
  const variations = [
    'chicken stir fry recipe',
    'Chicken Stir Fry Recipe',
    'chicken stir-fry recipe',
    'chicken stir fry recipe!',
    '  chicken stir fry recipe  ',
  ];
  
  try {
    const hashes = variations.map(q => ({
      query: q,
      normalized: normalizeQuery(q),
      hash: hashQuery(q)
    }));
    
    console.log('Testing query normalization:');
    variations.forEach((q, i) => {
      const result = hashes[i];
      console.log(`  "${q}"`);
      console.log(`    → Normalized: "${result.normalized}"`);
      console.log(`    → Hash: ${result.hash.substring(0, 16)}...`);
    });
    
    // Check if most variations produce the same hash
    // Note: "stir-fry" becomes "stirfry" (hyphen removed), so it's different from "stir fry"
    const firstHash = hashes[0].hash;
    const sameHashes = hashes.filter(h => h.hash === firstHash);
    
    // At least 4 out of 5 should match (excluding the hyphenated version)
    if (sameHashes.length >= 4) {
      console.log(`✅ ${sameHashes.length}/${hashes.length} variations produce the same hash (normalization works)`);
      if (sameHashes.length < hashes.length) {
        console.log('   Note: Hyphenated words (e.g., "stir-fry") are normalized differently');
      }
    } else {
      console.error('❌ Too many variations produce different hashes');
      return false;
    }
    
    console.log('✅ Test 4 passed\n');
    return true;
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
    return false;
  }
}

async function testCleanup() {
  console.log('📋 Test 5: Cleanup Test Data');
  console.log('─────────────────────────────────────────');
  
  try {
    // Find test queries
    const { data: testQueries } = await supabase
      .from('youtube_queries')
      .select('id')
      .eq('search_query', 'chicken stir fry recipe');
    
    if (!testQueries || testQueries.length === 0) {
      console.log('⚠️  No test data to clean up');
      return true;
    }
    
    const queryIds = testQueries.map(q => q.id);
    
    // Delete test videos
    const { error: videoError } = await supabase
      .from('youtube_videos')
      .delete()
      .in('query_id', queryIds);
    
    if (videoError) {
      console.warn('⚠️  Error deleting test videos:', videoError.message);
    } else {
      console.log('✅ Test videos deleted');
    }
    
    // Delete test keywords
    const { error: keywordError } = await supabase
      .from('youtube_query_keywords')
      .delete()
      .in('query_id', queryIds);
    
    if (keywordError) {
      console.warn('⚠️  Error deleting test keywords:', keywordError.message);
    } else {
      console.log('✅ Test keywords deleted');
    }
    
    // Delete test queries
    const { error: queryError } = await supabase
      .from('youtube_queries')
      .delete()
      .in('id', queryIds);
    
    if (queryError) {
      console.warn('⚠️  Error deleting test queries:', queryError.message);
    } else {
      console.log('✅ Test queries deleted');
    }
    
    console.log('✅ Test 5 passed\n');
    return true;
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting YouTube Cache Tests (Stage 1: Exact Match)\n');
  console.log('=' .repeat(50));
  console.log('');
  
  const results = {
    connection: false,
    store: false,
    find: false,
    variations: false,
    cleanup: false
  };
  
  // Test 1: Database connection
  results.connection = await testDatabaseConnection();
  if (!results.connection) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Test 2: Store query
  const storeResult = await testStoreQuery();
  results.store = !!storeResult;
  
  if (storeResult) {
    // Test 3: Find cached query
    results.find = await testFindCachedQuery(storeResult.queryHash);
  }
  
  // Test 4: Query variations
  results.variations = await testQueryVariations();
  
  // Test 5: Cleanup (optional)
  const args = process.argv.slice(2);
  if (args.includes('--cleanup') || args.includes('-c')) {
    results.cleanup = await testCleanup();
  } else {
    console.log('💡 Tip: Run with --cleanup flag to remove test data\n');
  }
  
  // Summary
  console.log('=' .repeat(50));
  console.log('📊 Test Summary');
  console.log('=' .repeat(50));
  console.log(`Database Connection: ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Store Query:         ${results.store ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Find Cached Query:   ${results.find ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Query Variations:    ${results.variations ? '✅ PASS' : '❌ FAIL'}`);
  if (args.includes('--cleanup') || args.includes('-c')) {
    console.log(`Cleanup:              ${results.cleanup ? '✅ PASS' : '❌ FAIL'}`);
  }
  console.log('');
  
  const allPassed = results.connection && results.store && results.find && results.variations;
  
  if (allPassed) {
    console.log('🎉 All tests passed! Stage 1 implementation is working correctly.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

