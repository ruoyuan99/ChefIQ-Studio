import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { RecipeProvider } from './src/contexts/RecipeContext';
import { FavoriteProvider } from './src/contexts/FavoriteContext';
import { GroceriesProvider } from './src/contexts/GroceriesContext';
import { LikeProvider } from './src/contexts/LikeContext';
import { TriedProvider } from './src/contexts/TriedContext';
import { PointsProvider } from './src/contexts/PointsContext';
import { SocialStatsProvider } from './src/contexts/SocialStatsContext';
import { CommentProvider } from './src/contexts/CommentContext';
import { BadgeProvider } from './src/contexts/BadgeContext';
import AppNavigator from './src/navigation/AppNavigator';

// 导入调试工具（仅在开发环境中）
if (__DEV__) {
  require('./src/utils/debugAsyncStorage');
  require('./src/utils/clearLocalPoints');
  
  // 在 Chrome DevTools 中可用的全局函数
  // 注意：Chrome DevTools 无法直接访问 React Native 模块
  // 这些函数需要在 React Native Debugger 中使用
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  (global as any).clearPoints = async () => {
    try {
      await AsyncStorage.removeItem('userPoints');
      console.log('✅ 已清除积分数据');
      return { success: true, message: '已清除积分数据' };
    } catch (error) {
      console.error('❌ 清除失败:', error);
      return { success: false, error };
    }
  };
  
  (global as any).viewPoints = async () => {
    try {
      const data = await AsyncStorage.getItem('userPoints');
      if (data) {
        const parsed = JSON.parse(data);
        console.log('📊 积分数据:', parsed);
        return parsed;
      } else {
        console.log('ℹ️ 无积分数据');
        return null;
      }
    } catch (error) {
      console.error('❌ 读取失败:', error);
      return null;
    }
  };
  
  console.log('🔧 Chrome DevTools 可用函数:');
  console.log('  - clearPoints() - 清除积分数据');
  console.log('  - viewPoints() - 查看积分数据');
  console.log('⚠️ 注意：这些函数需要在 React Native Debugger 中使用，Chrome DevTools 可能无法访问');
}

export default function App() {
  return (
    <AuthProvider>
      <RecipeProvider>
        <FavoriteProvider>
          <GroceriesProvider>
            <LikeProvider>
              <TriedProvider>
                <PointsProvider>
                  <BadgeProvider>
                    <SocialStatsProvider>
                      <CommentProvider>
                        <AppNavigator />
                        <StatusBar style="auto" />
                      </CommentProvider>
                    </SocialStatsProvider>
                  </BadgeProvider>
                </PointsProvider>
              </TriedProvider>
            </LikeProvider>
          </GroceriesProvider>
        </FavoriteProvider>
      </RecipeProvider>
    </AuthProvider>
  );
}