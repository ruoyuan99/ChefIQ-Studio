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
    // Clear userPoints
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

// Expose functions to global in development environment for easy calling in React Native Debugger
if (__DEV__) {
  (global as any).clearLocalPoints = clearLocalPoints;
  (global as any).clearAllAsyncStorage = clearAllAsyncStorage;
  
  console.log('🧹 Local Points Clear Tools Available:');
  console.log('  - clearLocalPoints() - Clear points data (AsyncStorage only)');
  console.log('  - clearAllAsyncStorage() - Clear all AsyncStorage data');
}

