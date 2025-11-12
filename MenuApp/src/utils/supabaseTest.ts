import { supabase } from '../config/supabase'

// 测试Supabase连接
export const testSupabaseConnection = async () => {
  console.log('🔗 测试Supabase连接...')
  
  try {
    // 测试基本连接
    const { data, error } = await supabase
      .from('recipes')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase连接失败:', error.message)
      return false
    }
    
    console.log('✅ Supabase连接成功!')
    console.log('📊 项目URL:', supabase.supabaseUrl)
    console.log('🔑 API密钥已配置')
    
    return true
  } catch (err) {
    console.error('❌ 连接测试异常:', err)
    return false
  }
}

// 测试数据库表是否存在
export const testDatabaseTables = async () => {
  console.log('🗄️ 测试数据库表...')
  
  const tables = ['users', 'recipes', 'ingredients', 'instructions', 'comments', 'favorites', 'tags']
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ 表 ${table} 不存在或无法访问:`, error.message)
      } else {
        console.log(`✅ 表 ${table} 存在且可访问`)
      }
    } catch (err) {
      console.log(`❌ 表 ${table} 测试异常:`, err)
    }
  }
}

// 创建测试用户
export const createTestUser = async () => {
  console.log('👤 创建测试用户...')
  
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
      console.log('⚠️ 测试用户可能已存在:', error.message)
    } else {
      console.log('✅ 测试用户创建成功:', data)
    }
    
    return data
  } catch (err) {
    console.error('❌ 创建测试用户失败:', err)
    return null
  }
}

// 创建测试菜谱
export const createTestRecipe = async (userId: string) => {
  console.log('🍳 创建测试菜谱...')
  
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
      console.error('❌ 创建测试菜谱失败:', error.message)
      return null
    }
    
    console.log('✅ 测试菜谱创建成功:', data)
    
    // 添加测试食材
    const testIngredients = [
      { recipe_id: data.id, name: '测试食材1', amount: '100', unit: 'g' },
      { recipe_id: data.id, name: '测试食材2', amount: '2', unit: '个' }
    ]
    
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .insert(testIngredients)
      .select()
    
    if (ingredientsError) {
      console.error('❌ 创建测试食材失败:', ingredientsError.message)
    } else {
      console.log('✅ 测试食材创建成功:', ingredients)
    }
    
    // 添加测试步骤
    const testInstructions = [
      { recipe_id: data.id, step_number: 1, description: '第一步：准备食材' },
      { recipe_id: data.id, step_number: 2, description: '第二步：开始烹饪' }
    ]
    
    const { data: instructions, error: instructionsError } = await supabase
      .from('instructions')
      .insert(testInstructions)
      .select()
    
    if (instructionsError) {
      console.error('❌ 创建测试步骤失败:', instructionsError.message)
    } else {
      console.log('✅ 测试步骤创建成功:', instructions)
    }
    
    return data
  } catch (err) {
    console.error('❌ 创建测试菜谱异常:', err)
    return null
  }
}

// 运行所有测试
export const runAllTests = async () => {
  console.log('🚀 开始Supabase集成测试...\n')
  
  // 1. 测试连接
  const connectionOk = await testSupabaseConnection()
  if (!connectionOk) {
    console.log('❌ 连接测试失败，停止后续测试')
    return
  }
  
  console.log('')
  
  // 2. 测试数据库表
  await testDatabaseTables()
  
  console.log('')
  
  // 3. 创建测试数据
  const testUser = await createTestUser()
  if (testUser) {
    console.log('')
    await createTestRecipe(testUser.id)
  }
  
  console.log('\n🎉 Supabase集成测试完成!')
}
