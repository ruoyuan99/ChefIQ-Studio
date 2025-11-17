import { supabase } from '../config/supabase'

// Test Supabase connection
export const testSupabaseConnection = async () => {
  console.log('🔗 Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('recipes')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    // Note: supabaseUrl is protected, using alternative check
    console.log('🔑 API key configured')
    
    return true
  } catch (err) {
    console.error('❌ Connection test exception:', err)
    return false
  }
}

// Test if database tables exist
export const testDatabaseTables = async () => {
  console.log('🗄️ Testing database tables...')
  
  const tables = ['users', 'recipes', 'ingredients', 'instructions', 'comments', 'favorites', 'tags']
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table ${table} does not exist or cannot be accessed:`, error.message)
      } else {
        console.log(`✅ Table ${table} exists and is accessible`)
      }
    } catch (err) {
      console.log(`❌ Table ${table} test exception:`, err)
    }
  }
}

// Create test user
export const createTestUser = async () => {
  console.log('👤 Creating test user...')
  
  try {
    const testUser = {
      email: 'test@example.com',
      name: 'Test User',
      avatar_url: null
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single()
    
    if (error) {
      console.log('⚠️ Test user may already exist:', error.message)
    } else {
      console.log('✅ Test user created successfully:', data)
    }
    
    return data
  } catch (err) {
    console.error('❌ Failed to create test user:', err)
    return null
  }
}

// Create test recipe
export const createTestRecipe = async (userId: string) => {
  console.log('🍳 Creating test recipe...')
  
  try {
    const testRecipe = {
      title: '测试菜谱',
      description: '这是一个用于测试的菜谱',
      cooking_time: '30分钟',
      servings: 4,
      is_public: true,
      user_id: userId
    }
    
    const { data, error } = await supabase
      .from('recipes')
      .insert(testRecipe)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Failed to create test recipe:', error.message)
      return null
    }
    
    console.log('✅ Test recipe created successfully:', data)
    
    // Add test ingredients
    const testIngredients = [
      { recipe_id: data.id, name: '测试食材1', amount: '100', unit: 'g' },
      { recipe_id: data.id, name: '测试食材2', amount: '2', unit: '个' }
    ]
    
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .insert(testIngredients)
      .select()
    
    if (ingredientsError) {
      console.error('❌ Failed to create test ingredients:', ingredientsError.message)
    } else {
      console.log('✅ Test ingredients created successfully:', ingredients)
    }
    
    // Add test instructions
    const testInstructions = [
      { recipe_id: data.id, step_number: 1, description: '第一步：准备食材' },
      { recipe_id: data.id, step_number: 2, description: '第二步：开始烹饪' }
    ]
    
    const { data: instructions, error: instructionsError } = await supabase
      .from('instructions')
      .insert(testInstructions)
      .select()
    
    if (instructionsError) {
      console.error('❌ Failed to create test instructions:', instructionsError.message)
    } else {
      console.log('✅ Test instructions created successfully:', instructions)
    }
    
    return data
  } catch (err) {
    console.error('❌ Test recipe creation exception:', err)
    return null
  }
}

// Run all tests
export const runAllTests = async () => {
  console.log('🚀 Starting Supabase integration test...\n')
  
  // 1. Test connection
  const connectionOk = await testSupabaseConnection()
  if (!connectionOk) {
    console.log('❌ Connection test failed, stopping further tests')
    return
  }
  
  console.log('')
  
  // 2. Test database tables
  await testDatabaseTables()
  
  console.log('')
  
  // 3. Create test data
  const testUser = await createTestUser()
  if (testUser) {
    console.log('')
    await createTestRecipe(testUser.id)
  }
  
  console.log('\n🎉 Supabase integration test completed!')
}
