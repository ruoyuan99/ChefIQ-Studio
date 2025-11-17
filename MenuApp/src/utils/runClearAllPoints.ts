/**
 * 执行清理所有积分活动的脚本
 * 使用方法：
 * 1. 在开发环境中，可以在 React Native Debugger 中执行
 * 2. 或者创建一个临时的 Screen 组件来调用
 */

import { clearAllPointsActivities } from './clearAllPointsActivities';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

export const runClearAllPoints = async (): Promise<void> => {
  console.log('🧹 Starting to clear all points activities...');
  
  try {
    // Get current user ID
    let userId: string | undefined;
    
    // Try to get from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      userId = user.id;
      console.log('✅ Found user from Supabase auth:', userId);
    } else {
      // Try to get from AsyncStorage
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        userId = parsedUser.id;
        console.log('✅ Found user from AsyncStorage:', userId);
      }
    }

    if (!userId) {
      console.log('⚠️ No user found. Will only clear AsyncStorage.');
    }

    // Execute cleanup
    const result = await clearAllPointsActivities(userId);
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log(`📊 Deleted ${result.deletedCount || 0} points activities from database`);
    } else {
      console.error('❌ Failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error running clear all points activities:', error);
  }
};

// If running this file directly (in development environment)
if (__DEV__) {
  // Can be called through React Native Debugger
  // Enter in console: runClearAllPoints()
  (global as any).runClearAllPoints = runClearAllPoints;
}

