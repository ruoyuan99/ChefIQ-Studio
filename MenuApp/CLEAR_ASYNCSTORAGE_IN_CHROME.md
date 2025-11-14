# 在 Chrome DevTools 中清除 AsyncStorage 积分数据

## 问题

在 Chrome DevTools 中使用 `clearLocalPoints()` 时出现 `ReferenceError: clearLocalPoints is not defined` 错误。

## 解决方案

### 方法 1: 直接使用 AsyncStorage API（推荐）

在 Chrome DevTools 控制台中，直接使用 AsyncStorage API：

```javascript
// 方法 1: 使用 AsyncStorage 直接清除（最简单）
// 首先需要访问 AsyncStorage
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// 清除积分数据
AsyncStorage.removeItem('userPoints').then(() => {
  console.log('✅ 已清除积分数据');
}).catch((error) => {
  console.error('❌ 清除失败:', error);
});
```

**但是，在 Chrome DevTools 中无法直接访问 AsyncStorage**，因为它是 React Native 的原生模块。

### 方法 2: 在应用代码中添加临时清除功能（推荐）

#### 步骤 1: 在应用中添加清除按钮

在 `PointsHistoryScreen.tsx` 中添加一个临时的清除按钮（仅开发环境）：

```typescript
// 在开发环境中添加清除按钮
{__DEV__ && (
  <TouchableOpacity
    style={styles.debugButton}
    onPress={async () => {
      await AsyncStorage.removeItem('userPoints');
      Alert.alert('成功', '已清除本地积分数据');
    }}
  >
    <Text>清除积分数据 (调试)</Text>
  </TouchableOpacity>
)}
```

#### 步骤 2: 或者在应用启动时添加全局函数

在 `App.tsx` 中添加：

```typescript
if (__DEV__) {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  // 暴露到全局，方便在 Chrome DevTools 中使用
  (global as any).clearPoints = async () => {
    await AsyncStorage.removeItem('userPoints');
    console.log('✅ 已清除积分数据');
    return 'Success';
  };
  
  (global as any).viewPoints = async () => {
    const data = await AsyncStorage.getItem('userPoints');
    console.log('积分数据:', data ? JSON.parse(data) : '无数据');
    return data;
  };
}
```

### 方法 3: 使用 React Native Debugger（最佳方案）

React Native Debugger 可以访问全局函数，但 Chrome DevTools 不行。

1. **安装 React Native Debugger**：
   ```bash
   brew install --cask react-native-debugger
   ```

2. **启动应用和调试器**：
   - 启动 Expo: `npx expo start`
   - 打开 React Native Debugger
   - 在应用中按 `Cmd + D` → 选择 "Debug"

3. **在 React Native Debugger 控制台中**：
   ```javascript
   clearLocalPointsOnly()
   ```

### 方法 4: 在代码中直接调用清除函数

创建一个临时的测试屏幕或按钮：

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 在任何屏幕中调用
const clearPoints = async () => {
  try {
    await AsyncStorage.removeItem('userPoints');
    console.log('✅ 已清除积分数据');
    Alert.alert('成功', '已清除本地积分数据');
  } catch (error) {
    console.error('❌ 清除失败:', error);
    Alert.alert('错误', '清除失败');
  }
};
```

## 快速解决方案：添加全局函数到 App.tsx

让我为您添加一个可以在 Chrome DevTools 中使用的全局函数。

