import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 尝试加载 .env 文件
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://txendredncvrbxnxphbm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'your_service_role_key') {
  console.error('❌ 请设置真实的 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  console.error('');
  console.error('   如何获取 Service Role Key:');
  console.error('   1. 打开 Supabase Dashboard: https://app.supabase.com');
  console.error('   2. 选择您的项目');
  console.error('   3. 进入 Settings → API');
  console.error('   4. 复制 "service_role" key（⚠️  注意：这是秘密密钥，不要泄露）');
  console.error('');
  console.error('   设置方式:');
  console.error('   方式 1: export SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...');
  console.error('   方式 2: 创建 .env 文件并添加 SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...');
  console.error('');
  console.error('   或者直接在 Supabase Dashboard 中运行 SQL 测试:');
  console.error('   打开 database/test_schema.sql 文件并在 Supabase SQL Editor 中执行');
  console.error('');
  console.error('   注意: SUPABASE_URL 默认使用: ' + SUPABASE_URL);
  process.exit(1);
}

console.log('🔑 使用 SUPABASE_URL:', SUPABASE_URL);
console.log('🔑 使用 SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log('   详情:', JSON.stringify(details, null, 2));
  }
}

async function testColumnTypes() {
  console.log('\n📊 测试 1: 检查列类型...');
  
  try {
    // 通过查询系统表来检查列类型
    const { data, error } = await db.rpc('get_table_info', { table_name: 'recipes' });
    
    if (error) {
      // 如果 RPC 不存在，尝试直接查询表结构
      console.log('   ⚠️  无法通过 RPC 查询表结构，改用插入测试...');
      return false;
    }
    
    // 检查 cooking_time 和 servings 的类型
    // 注意：Supabase 不直接暴露列类型查询，所以我们会通过插入测试来验证
    return true;
  } catch (err: any) {
    console.log('   ⚠️  列类型检查需要直接插入测试来验证');
    return false;
  }
}

async function testInsertIntegerValues() {
  console.log('\n📝 测试 2: 插入整数类型的 cooking_time 和 servings...');
  
  try {
    const testRecipe = {
      title: `TEST_Recipe_${Date.now()}`,
      description: '测试菜谱 - 验证整数类型',
      cooking_time: 25, // INTEGER (minutes)
      servings: 4, // INTEGER
      cookware: 'Regular Pan/Pot',
      is_public: false,
      user_id: TEST_USER_ID,
    };

    const { data, error } = await db
      .from('recipes')
      .insert(testRecipe)
      .select()
      .single();

    if (error) {
      addResult(
        '插入整数类型',
        false,
        `插入失败: ${error.message}`,
        { error, testRecipe }
      );
      return null;
    }

    // 验证返回的数据类型
    const cookingTimeType = typeof data.cooking_time;
    const servingsType = typeof data.servings;

    if (cookingTimeType === 'number' && servingsType === 'number') {
      addResult(
        '插入整数类型',
        true,
        `成功插入！cooking_time: ${data.cooking_time} (${cookingTimeType}), servings: ${data.servings} (${servingsType})`,
        data
      );
      return data.id;
    } else {
      addResult(
        '插入整数类型',
        false,
        `类型不正确！cooking_time: ${cookingTimeType}, servings: ${servingsType}`,
        data
      );
      return data.id;
    }
  } catch (err: any) {
    addResult('插入整数类型', false, `异常: ${err.message}`, err);
    return null;
  }
}

async function testInsertStringValues() {
  console.log('\n📝 测试 3: 尝试插入字符串类型的 cooking_time（应该失败或自动转换）...');
  
  try {
    const testRecipe = {
      title: `TEST_String_${Date.now()}`,
      description: '测试字符串类型插入',
      cooking_time: '30分钟', // STRING - 应该失败或自动转换
      servings: '4', // STRING - 可能自动转换为数字
      cookware: 'Regular Pan/Pot',
      is_public: false,
      user_id: TEST_USER_ID,
    };

    const { data, error } = await db
      .from('recipes')
      .insert(testRecipe as any)
      .select()
      .single();

    if (error) {
      // 如果插入失败，这是预期的（因为 cooking_time 应该是 INTEGER）
      addResult(
        '插入字符串类型',
        true,
        `正确拒绝字符串类型: ${error.message}`,
        { error }
      );
      return null;
    } else {
      // 如果插入成功，检查是否自动转换
      if (typeof data.cooking_time === 'number') {
        addResult(
          '插入字符串类型',
          true,
          `数据库自动转换字符串为整数: cooking_time=${data.cooking_time}`,
          data
        );
        return data.id;
      } else {
        addResult(
          '插入字符串类型',
          false,
          `数据库允许字符串类型，但期望整数！cooking_time类型: ${typeof data.cooking_time}`,
          data
        );
        return data.id;
      }
    }
  } catch (err: any) {
    addResult('插入字符串类型', false, `异常: ${err.message}`, err);
    return null;
  }
}

async function testQueryData(recipeId: string | null) {
  console.log('\n🔍 测试 4: 查询数据并验证类型...');
  
  if (!recipeId) {
    addResult('查询数据类型', false, '没有可查询的测试数据');
    return;
  }

  try {
    const { data, error } = await db
      .from('recipes')
      .select('id, title, cooking_time, servings')
      .eq('id', recipeId)
      .single();

    if (error) {
      addResult('查询数据类型', false, `查询失败: ${error.message}`, error);
      return;
    }

    const cookingTimeType = typeof data.cooking_time;
    const servingsType = typeof data.servings;

    if (cookingTimeType === 'number' && servingsType === 'number') {
      addResult(
        '查询数据类型',
        true,
        `类型正确！cooking_time: ${data.cooking_time} (${cookingTimeType}), servings: ${data.servings} (${servingsType})`,
        data
      );
    } else {
      addResult(
        '查询数据类型',
        false,
        `类型不正确！cooking_time: ${cookingTimeType}, servings: ${servingsType}`,
        data
      );
    }
  } catch (err: any) {
    addResult('查询数据类型', false, `异常: ${err.message}`, err);
  }
}

async function testExistingData() {
  console.log('\n📋 测试 5: 检查现有数据的类型...');
  
  try {
    const { data, error } = await db
      .from('recipes')
      .select('id, title, cooking_time, servings')
      .limit(10);

    if (error) {
      addResult('检查现有数据', false, `查询失败: ${error.message}`, error);
      return;
    }

    if (!data || data.length === 0) {
      addResult('检查现有数据', true, '没有现有数据需要检查');
      return;
    }

    const typeStats = {
      cookingTimeTypes: {} as Record<string, number>,
      servingsTypes: {} as Record<string, number>,
    };

    data.forEach((recipe: any) => {
      const ctType = typeof recipe.cooking_time;
      const sType = typeof recipe.servings;
      
      typeStats.cookingTimeTypes[ctType] = (typeStats.cookingTimeTypes[ctType] || 0) + 1;
      typeStats.servingsTypes[sType] = (typeStats.servingsTypes[sType] || 0) + 1;
    });

    const allCookingTimeAreNumbers = Object.keys(typeStats.cookingTimeTypes).every(t => t === 'number');
    const allServingsAreNumbers = Object.keys(typeStats.servingsTypes).every(t => t === 'number');

    if (allCookingTimeAreNumbers && allServingsAreNumbers) {
      addResult(
        '检查现有数据',
        true,
        `所有 ${data.length} 条记录的类型都正确！`,
        typeStats
      );
    } else {
      addResult(
        '检查现有数据',
        false,
        `发现类型不一致！`,
        { typeStats, sampleData: data.slice(0, 3) }
      );
    }
  } catch (err: any) {
    addResult('检查现有数据', false, `异常: ${err.message}`, err);
  }
}

async function testDataConversion() {
  console.log('\n🔄 测试 6: 测试数据转换（整数 -> 字符串显示格式）...');
  
  try {
    // 插入一个测试记录
    const testRecipe = {
      title: `TEST_Conversion_${Date.now()}`,
      description: '测试数据转换',
      cooking_time: 30,
      servings: 6,
      cookware: 'Regular Pan/Pot',
      is_public: false,
      user_id: TEST_USER_ID,
    };

    const { data: inserted, error: insertError } = await db
      .from('recipes')
      .insert(testRecipe)
      .select()
      .single();

    if (insertError) {
      addResult('数据转换', false, `插入失败: ${insertError.message}`, insertError);
      return inserted?.id;
    }

    // 模拟前端转换逻辑
    const displayCookingTime = inserted.cooking_time ? `${inserted.cooking_time}分钟` : '';
    const displayServings = inserted.servings ? String(inserted.servings) : '';

    if (displayCookingTime === '30分钟' && displayServings === '6') {
      addResult(
        '数据转换',
        true,
        `转换成功！数据库: cooking_time=${inserted.cooking_time}, servings=${inserted.servings} -> 显示: "${displayCookingTime}", "${displayServings}"`
      );
    } else {
      addResult(
        '数据转换',
        false,
        `转换结果不正确！显示格式: cooking_time="${displayCookingTime}", servings="${displayServings}"`
      );
    }

    return inserted.id;
  } catch (err: any) {
    addResult('数据转换', false, `异常: ${err.message}`, err);
    return null;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 清理测试数据...');
  
  try {
    const { error } = await db
      .from('recipes')
      .delete()
      .like('title', 'TEST_%');

    if (error) {
      console.log(`   ⚠️  清理测试数据失败: ${error.message}`);
    } else {
      console.log('   ✅ 测试数据已清理');
    }
  } catch (err: any) {
    console.log(`   ⚠️  清理测试数据异常: ${err.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 开始数据库 Schema 测试...\n');
  console.log('测试目标:');
  console.log('  - cooking_time 应为 INTEGER (1-999 分钟)');
  console.log('  - servings 应为 INTEGER (1-20)');
  console.log('');

  // 运行所有测试
  await testColumnTypes();
  const recipeId1 = await testInsertIntegerValues();
  await testInsertStringValues();
  await testQueryData(recipeId1 || null);
  await testExistingData();
  const recipeId2 = await testDataConversion();

  // 清理测试数据
  await cleanupTestData();

  // 打印总结
  console.log('\n📊 测试总结:');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (!result.passed) {
      console.log(`   ${result.message}`);
    }
  });

  console.log('='.repeat(60));
  console.log(`总计: ${total} 项测试`);
  console.log(`通过: ${passed} 项 ✅`);
  console.log(`失败: ${failed} 项 ${failed > 0 ? '❌' : ''}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 所有测试通过！数据库 Schema 更改成功！');
    process.exit(0);
  } else {
    console.log('⚠️  部分测试失败，请检查上面的错误信息。');
    process.exit(1);
  }
}

// 运行测试
runAllTests().catch(err => {
  console.error('❌ 测试执行失败:', err);
  process.exit(1);
});

