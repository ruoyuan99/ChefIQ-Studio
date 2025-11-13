/**
 * 执行清理所有 daily check-in 记录的脚本
 * 使用方法：
 * 1. 在开发环境中，可以在 React Native Debugger 中执行
 * 2. 或者创建一个临时的 Screen 组件来调用
 */

import { clearAllDailyCheckin } from './clearDailyCheckin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

export const runClearDailyCheckin = async (): Promise<void> => {
  console.log('🧹 Starting to clear all daily check-in records...');
  
  try {
    // 获取当前用户ID
    let userId: string | undefined;
    
    // 尝试从 Supabase auth 获取
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      userId = user.id;
      console.log('✅ Found user from Supabase auth:', userId);
    } else {
      // 尝试从 AsyncStorage 获取
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        userId = parsedUser.id;
        console.log('✅ Found user from AsyncStorage:', userId);
      }
    }

    if (!userId) {
      console.log('⚠️ No user found. Will only clear AsyncStorage records.');
    }

    // 执行清理
    const result = await clearAllDailyCheckin(userId);
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log(`📊 Deleted ${result.deletedCount || 0} daily check-in records`);
    } else {
      console.error('❌ Failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error running clear daily check-in:', error);
  }
};

// 如果直接运行此文件（在开发环境中）
if (__DEV__) {
  // 可以通过 React Native Debugger 调用
  // 在控制台输入: runClearDailyCheckin()
  (global as any).runClearDailyCheckin = runClearDailyCheckin;
}

