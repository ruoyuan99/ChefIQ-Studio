import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../config/supabase'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  details?: any
}

const SupabaseTestScreen: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addTestResult = (name: string, status: 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => [...prev, { name, status, message, details }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const testBasicConnection = async () => {
    try {
      console.log('🔗 测试基本连接...')
      const { data, error } = await supabase
        .from('recipes')
        .select('count')
        .limit(1)
      
      if (error) {
        addTestResult('基本连接', 'error', `连接失败: ${error.message}`, error)
        return false
      }
      
      addTestResult('基本连接', 'success', 'Supabase连接成功!', { data })
      return true
    } catch (err) {
      addTestResult('基本连接', 'error', `连接异常: ${err}`, err)
      return false
    }
  }

  const testDatabaseTables = async () => {
    const tables = ['users', 'recipes', 'ingredients', 'instructions', 'comments', 'favorites', 'tags']
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          addTestResult(`表 ${table}`, 'error', `表不存在或无法访问: ${error.message}`, error)
        } else {
          addTestResult(`表 ${table}`, 'success', '表存在且可访问')
        }
      } catch (err) {
        addTestResult(`表 ${table}`, 'error', `测试异常: ${err}`, err)
      }
    }
  }

  const testCreateUser = async () => {
    try {
      const testUser = {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        avatar_url: null
      }
      
      const { data, error } = await supabase
        .from('users')
        .insert(testUser)
        .select()
        .single()
      
      if (error) {
        addTestResult('创建用户', 'error', `创建失败: ${error.message}`, error)
        return null
      }
      
      addTestResult('创建用户', 'success', '测试用户创建成功', data)
      return data
    } catch (err) {
      addTestResult('创建用户', 'error', `创建异常: ${err}`, err)
      return null
    }
  }

  const testCreateRecipe = async (userId: string) => {
    try {
      const testRecipe = {
        title: `测试菜谱 ${Date.now()}`,
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
        addTestResult('创建菜谱', 'error', `创建失败: ${error.message}`, error)
        return null
      }
      
      addTestResult('创建菜谱', 'success', '测试菜谱创建成功', data)
      
      // 测试添加食材
      const testIngredients = [
        { recipe_id: data.id, name: '测试食材1', amount: '100', unit: 'g' },
        { recipe_id: data.id, name: '测试食材2', amount: '2', unit: '个' }
      ]
      
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .insert(testIngredients)
        .select()
      
      if (ingredientsError) {
        addTestResult('添加食材', 'error', `添加失败: ${ingredientsError.message}`, ingredientsError)
      } else {
        addTestResult('添加食材', 'success', '测试食材添加成功', ingredients)
      }
      
      // 测试添加步骤
      const testInstructions = [
        { recipe_id: data.id, step_number: 1, description: '第一步：准备食材' },
        { recipe_id: data.id, step_number: 2, description: '第二步：开始烹饪' }
      ]
      
      const { data: instructions, error: instructionsError } = await supabase
        .from('instructions')
        .insert(testInstructions)
        .select()
      
      if (instructionsError) {
        addTestResult('添加步骤', 'error', `添加失败: ${instructionsError.message}`, instructionsError)
      } else {
        addTestResult('添加步骤', 'success', '测试步骤添加成功', instructions)
      }
      
      return data
    } catch (err) {
      addTestResult('创建菜谱', 'error', `创建异常: ${err}`, err)
      return null
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    clearResults()
    
    console.log('🚀 开始Supabase集成测试...\n')
    
    // 1. 测试基本连接
    const connectionOk = await testBasicConnection()
    if (!connectionOk) {
      addTestResult('测试总结', 'error', '基本连接失败，停止后续测试')
      setIsRunning(false)
      return
    }
    
    // 2. 测试数据库表
    await testDatabaseTables()
    
    // 3. 创建测试数据
    const testUser = await testCreateUser()
    if (testUser) {
      await testCreateRecipe(testUser.id)
    }
    
    addTestResult('测试总结', 'success', '所有测试完成!')
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
      case 'error':
        return <Ionicons name="close-circle" size={20} color="#F44336" />
      default:
        return <Ionicons name="time" size={20} color="#FF9800" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#4CAF50'
      case 'error':
        return '#F44336'
      default:
        return '#FF9800'
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supabase 连接测试</Text>
        <Text style={styles.subtitle}>验证数据库连接和功能</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Ionicons name="play" size={20} color="white" />
          <Text style={styles.buttonText}>
            {isRunning ? '测试中...' : '开始测试'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={clearResults}
        >
          <Ionicons name="refresh" size={20} color="#FF6B35" />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>清除结果</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.results}>
        <Text style={styles.resultsTitle}>测试结果</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>暂无测试结果</Text>
        ) : (
          testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                {getStatusIcon(result.status)}
                <Text style={[styles.resultName, { color: getStatusColor(result.status) }]}>
                  {result.name}
                </Text>
              </View>
              <Text style={styles.resultMessage}>{result.message}</Text>
              {result.details && (
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => Alert.alert('详细信息', JSON.stringify(result.details, null, 2))}
                >
                  <Text style={styles.detailsText}>查看详情</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>项目信息</Text>
        <Text style={styles.infoText}>URL: https://txendredncvrbxnxphbm.supabase.co</Text>
        <Text style={styles.infoText}>状态: {isRunning ? '测试中' : '就绪'}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#FF6B35',
  },
  results: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    padding: 20,
  },
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
  },
  detailsButton: {
    marginTop: 8,
    marginLeft: 28,
  },
  detailsText: {
    fontSize: 12,
    color: '#FF6B35',
    textDecorationLine: 'underline',
  },
  info: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
})

export default SupabaseTestScreen
