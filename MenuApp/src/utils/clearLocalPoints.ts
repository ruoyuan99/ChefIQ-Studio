/**
 * 清除本地 AsyncStorage 中的积分信息
 * 仅清除 AsyncStorage，不影响 Supabase 数据库
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 清除本地 AsyncStorage 中的积分信息
 */
export const clearLocalPoints = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // 清除 userPoints
    await AsyncStorage.removeItem('userPoints');
    console.log('✅ Cleared userPoints from AsyncStorage');
    
    return {
      success: true,
      message: 'Successfully cleared points data from AsyncStorage',
    };
  } catch (error) {
    console.error('❌ Error clearing local points:', error);
    return {
      success: false,
      message: `Failed to clear local points: ${error}`,
    };
  }
};

/**
 * 清除所有 AsyncStorage 数据（包括积分和其他数据）
 */
export const clearAllAsyncStorage = async (): Promise<{ success: boolean; message: string }> => {
  try {
    await AsyncStorage.clear();
    console.log('✅ Cleared all AsyncStorage data');
    
    return {
      success: true,
      message: 'Successfully cleared all AsyncStorage data',
    };
  } catch (error) {
    console.error('❌ Error clearing AsyncStorage:', error);
    return {
      success: false,
      message: `Failed to clear AsyncStorage: ${error}`,
    };
  }
};

// 在开发环境中将函数暴露到全局，方便在 React Native Debugger 中调用
if (__DEV__) {
  (global as any).clearLocalPoints = clearLocalPoints;
  (global as any).clearAllAsyncStorage = clearAllAsyncStorage;
  
  console.log('🧹 Local Points Clear Tools Available:');
  console.log('  - clearLocalPoints() - 清除积分数据（仅 AsyncStorage）');
  console.log('  - clearAllAsyncStorage() - 清除所有 AsyncStorage 数据');
}

