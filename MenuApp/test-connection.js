const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://txendredncvrbxnxphbm.supabase.co'
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZW5kcmVkbmN2cmJ4bnhwaGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3OTAsImV4cCI6MjA3NzI1ODc5MH0.EH6kk2dmx80Vm0-OsXAYZeU9vu_JZ0ElNh1WHEHzFfM'

const supabase = createClient(supabaseUrl, supabaseKey)

// 测试Supabase连接
const testSupabaseConnection = async () => {
  console.log('🚀 开始测试Supabase连接...')
  
  try {
    // 1. 测试基本连接
    console.log('1️⃣ 测试基本连接...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('recipes')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ 连接失败:', connectionError.message)
      return false
    }
    console.log('✅ 基本连接成功!')
    
    // 2. 测试表是否存在
    console.log('2️⃣ 测试数据库表...')
    const tables = ['users', 'recipes', 'ingredients', 'instructions', 'comments', 'favorites', 'tags']
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.error(`❌ 表 ${table} 测试失败:`, error.message)
        } else {
          console.log(`✅ 表 ${table} 存在且可访问`)
        }
      } catch (err) {
        console.error(`❌ 表 ${table} 测试异常:`, err)
      }
    }
    
    // 3. 测试数据读取（不创建数据，因为需要认证）
    console.log('3️⃣ 测试数据读取...')
    
    // 测试读取公开菜谱
    const { data: publicRecipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true)
      .limit(5)
    
    if (recipesError) {
      console.error('❌ 读取公开菜谱失败:', recipesError.message)
    } else {
      console.log('✅ 公开菜谱读取成功:', publicRecipes.length, '个')
    }
    
    // 测试读取评论
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .limit(5)
    
    if (commentsError) {
      console.error('❌ 读取评论失败:', commentsError.message)
    } else {
      console.log('✅ 评论读取成功:', comments.length, '个')
    }
    
    // 测试读取收藏
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select('*')
      .limit(5)
    
    if (favoritesError) {
      console.error('❌ 读取收藏失败:', favoritesError.message)
    } else {
      console.log('✅ 收藏读取成功:', favorites.length, '个')
    }
    
    console.log('🎉 所有测试完成！Supabase连接正常！')
    return true
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
    return false
  }
}

// 如果直接运行此文件
if (require.main === module) {
  testSupabaseConnection()
}
