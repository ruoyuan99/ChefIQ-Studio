# AsyncStorage 积分信息存储说明

## 存储位置

### Key 名称
```typescript
'userPoints'
```

### 存储代码位置
- **文件**: `MenuApp/src/contexts/PointsContext.tsx`
- **保存**: 第 213-225 行
- **加载**: 第 188-203 行

## 数据结构

### 存储格式
```json
{
  "totalPoints": number,
  "activities": [
    {
      "id": string,
      "type": "create_recipe" | "try_recipe" | "favorite_recipe" | "like_recipe" | "share_recipe" | "complete_profile" | "add_comment" | "daily_checkin",
      "points": number,
      "description": string,
      "timestamp": string,  // ISO 8601 格式，例如 "2024-01-15T10:30:00.000Z"
      "recipeId": string | null
    }
  ]
}
```

### 示例数据
```json
{
  "totalPoints": 150,
  "activities": [
    {
      "id": "1705310400000",
      "type": "daily_checkin",
      "points": 15,
      "description": "Daily Check-in",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "recipeId": null
    },
    {
      "id": "1705224000000",
      "type": "create_recipe",
      "points": 50,
      "description": "Created recipe: Chicken Curry",
      "timestamp": "2024-01-14T08:00:00.000Z",
      "recipeId": "recipe-uuid-here"
    }
  ]
}
```

## 物理存储位置

### iOS
- **路径**: `~/Library/Application Support/[App Name]/AsyncStorage/`
- **文件名**: 由 React Native 自动管理
- **格式**: SQLite 数据库或键值对存储

### Android
- **路径**: `/data/data/[package.name]/databases/AsyncStorage/`
- **格式**: SQLite 数据库或 SharedPreferences（取决于 React Native 版本）

## 存储时机

### 自动保存
1. **当积分活动变化时**：每次 `state.activities` 或 `state.totalPoints` 改变时自动保存
2. **触发条件**：
   - 添加新积分活动 (`ADD_POINTS`)
   - 设置积分数据 (`SET_POINTS`)
   - 重置积分 (`RESET_POINTS`)

### 保存代码
```typescript
// 在 PointsContext.tsx 的 useEffect 中
useEffect(() => {
  const savePoints = async () => {
    try {
      const activitiesToSave = state.activities.map(activity => ({
        ...activity,
        timestamp: activity.timestamp.toISOString(), // 转换为 ISO 字符串
      }));
      await AsyncStorage.setItem('userPoints', JSON.stringify({
        totalPoints: state.totalPoints,
        activities: activitiesToSave,
      }));
    } catch (error) {
      console.error('Failed to save points to storage', error);
    }
  };
  savePoints();
}, [state.totalPoints, state.activities, user?.id]);
```

## 加载时机

### 自动加载
1. **应用启动时**：如果用户未登录，从 AsyncStorage 加载
2. **用户登录后**：从 Supabase 数据库加载（如果失败，回退到 AsyncStorage）
3. **用户未登录时**：直接从 AsyncStorage 加载

### 加载代码
```typescript
const loadPointsFromStorage = async () => {
  try {
    const storedPoints = await AsyncStorage.getItem('userPoints');
    if (storedPoints) {
      const { totalPoints, activities } = JSON.parse(storedPoints);
      // 转换日期字符串为 Date 对象
      const parsedActivities = activities.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp),
      }));
      dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities: parsedActivities } });
    }
  } catch (error) {
    console.error('Failed to load points from storage', error);
  }
};
```

## 数据同步

### 与 Supabase 的同步
1. **用户登录时**：
   - 优先从 Supabase 数据库加载
   - 如果失败，从 AsyncStorage 加载
   - 将 AsyncStorage 的数据同步到 Supabase

2. **用户未登录时**：
   - 只使用 AsyncStorage
   - 不进行数据库同步

3. **添加积分时**：
   - 立即更新本地状态
   - 保存到 AsyncStorage
   - 如果用户已登录，同步到 Supabase

## 如何访问数据

### 在代码中访问
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 读取积分数据
const getUserPoints = async () => {
  try {
    const storedPoints = await AsyncStorage.getItem('userPoints');
    if (storedPoints) {
      const data = JSON.parse(storedPoints);
      console.log('Total Points:', data.totalPoints);
      console.log('Activities:', data.activities);
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error reading userPoints:', error);
    return null;
  }
};

// 清空积分数据
const clearUserPoints = async () => {
  try {
    await AsyncStorage.removeItem('userPoints');
    console.log('✅ Cleared userPoints from AsyncStorage');
  } catch (error) {
    console.error('Error clearing userPoints:', error);
  }
};
```

### 在 React Native Debugger 中访问
1. 打开 React Native Debugger
2. 在控制台中输入：
```javascript
// 读取数据
AsyncStorage.getItem('userPoints').then(data => console.log(JSON.parse(data)));

// 查看所有 keys
AsyncStorage.getAllKeys().then(keys => console.log(keys));

// 清空数据
AsyncStorage.removeItem('userPoints').then(() => console.log('Cleared'));
```

## 注意事项

1. **数据格式**：
   - `timestamp` 存储为 ISO 8601 字符串格式
   - 加载时需要转换为 `Date` 对象

2. **数据大小**：
   - AsyncStorage 有大小限制（通常 6MB）
   - 如果积分活动过多，可能需要清理旧数据

3. **数据持久化**：
   - AsyncStorage 数据在应用卸载时会丢失
   - 用户登录后应同步到 Supabase 数据库

4. **数据同步**：
   - 用户登录时，AsyncStorage 和 Supabase 会自动同步
   - 如果数据库中的数据更新，AsyncStorage 也会更新

## 相关文件

- `MenuApp/src/contexts/PointsContext.tsx` - 积分上下文，包含存储和加载逻辑
- `MenuApp/src/utils/clearAllPointsActivities.ts` - 清理积分数据的工具函数
- `MenuApp/src/utils/clearDailyCheckin.ts` - 清理每日签到的工具函数

## 调试技巧

### 查看存储的数据
```typescript
// 在 React Native Debugger 中
import AsyncStorage from '@react-native-async-storage/async-storage';

AsyncStorage.getItem('userPoints').then(data => {
  if (data) {
    const parsed = JSON.parse(data);
    console.log('Total Points:', parsed.totalPoints);
    console.log('Activities Count:', parsed.activities.length);
    console.log('Activities:', parsed.activities);
  } else {
    console.log('No userPoints found in AsyncStorage');
  }
});
```

### 查看所有 AsyncStorage keys
```typescript
AsyncStorage.getAllKeys().then(keys => {
  console.log('All AsyncStorage keys:', keys);
  // 应该包含 'userPoints'
});
```

### 清空积分数据
```typescript
AsyncStorage.removeItem('userPoints').then(() => {
  console.log('✅ Cleared userPoints');
});
```

