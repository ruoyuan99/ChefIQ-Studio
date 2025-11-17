/**
 * AsyncStorage 调试工具
 * 用于查看和管理 AsyncStorage 中的数据
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 查看所有 AsyncStorage 数据
 */
export const debugAsyncStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('=== AsyncStorage Debug ===');
    console.log(`📦 Total keys: ${keys.length}`);
    console.log('📋 Keys:', keys);
    console.log('\n--- Data ---');
    
    const allData: { [key: string]: any } = {};
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          allData[key] = parsed;
          console.log(`\n✅ ${key}:`, parsed);
        } catch {
          allData[key] = value;
          console.log(`\n📝 ${key}:`, value);
        }
      }
    }
    
    console.log('\n=== Summary ===');
    console.log('All data:', allData);
    
    return allData;
  } catch (error) {
    console.error('❌ Error reading AsyncStorage:', error);
    return null;
  }
};

/**
 * 查看特定 key 的数据
 */
export const debugSpecificKey = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        console.log(`\n✅ ${key}:`, parsed);
        return parsed;
      } catch {
        console.log(`\n📝 ${key}:`, value);
        return value;
      }
    } else {
      console.log(`\n❌ Key "${key}" not found`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error reading key "${key}":`, error);
    return null;
  }
};

/**
 * 查看积分数据
 */
export const debugUserPoints = async () => {
  return debugSpecificKey('userPoints');
};

/**
 * 查看所有 keys
 */
export const debugAllKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('=== All AsyncStorage Keys ===');
    console.log(`Total: ${keys.length} keys`);
    keys.forEach((key, index) => {
      console.log(`${index + 1}. ${key}`);
    });
    return keys;
  } catch (error) {
    console.error('❌ Error reading keys:', error);
    return [];
  }
};

/**
 * 获取 AsyncStorage 大小信息（估算）
 */
export const debugStorageSize = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    let totalSize = 0;
    const sizes: { [key: string]: number } = {};
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        const size = new Blob([value]).size;
        sizes[key] = size;
        totalSize += size;
      }
    }
    
    console.log('=== AsyncStorage Size ===');
    console.log(`Total size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log('Size by key:');
    Object.entries(sizes)
      .sort(([, a], [, b]) => b - a)
      .forEach(([key, size]) => {
        console.log(`  ${key}: ${(size / 1024).toFixed(2)} KB`);
      });
    
    return { totalSize, sizes };
  } catch (error) {
    console.error('❌ Error calculating size:', error);
    return null;
  }
};

/**
 * 清理所有 AsyncStorage 数据（仅用于调试）
 */
export const clearAllAsyncStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('✅ Cleared all AsyncStorage data');
    return true;
  } catch (error) {
    console.error('❌ Error clearing AsyncStorage:', error);
    return false;
  }
};

/**
 * 仅清除积分数据（保留其他 AsyncStorage 数据）
 */
export const clearLocalPointsOnly = async () => {
  try {
    await AsyncStorage.removeItem('userPoints');
    console.log('✅ Cleared userPoints from AsyncStorage');
    console.log('ℹ️ Other AsyncStorage data preserved');
    return true;
  } catch (error) {
    console.error('❌ Error clearing userPoints:', error);
    return false;
  }
};

// Expose functions to global in development environment for easy calling in React Native Debugger
if (__DEV__) {
  (global as any).debugAsyncStorage = debugAsyncStorage;
  (global as any).debugSpecificKey = debugSpecificKey;
  (global as any).debugUserPoints = debugUserPoints;
  (global as any).debugAllKeys = debugAllKeys;
  (global as any).debugStorageSize = debugStorageSize;
  (global as any).clearAllAsyncStorage = clearAllAsyncStorage;
  (global as any).clearLocalPointsOnly = clearLocalPointsOnly;
  
  console.log('🔧 AsyncStorage Debug Tools Available:');
  console.log('  - debugAsyncStorage() - View all data');
  console.log('  - debugSpecificKey(key) - View specific key');
  console.log('  - debugUserPoints() - View points data');
  console.log('  - debugAllKeys() - View all keys');
  console.log('  - debugStorageSize() - View storage size');
  console.log('  - clearLocalPointsOnly() - Clear points data only (recommended)');
  console.log('  - clearAllAsyncStorage() - Clear all AsyncStorage data');
}

