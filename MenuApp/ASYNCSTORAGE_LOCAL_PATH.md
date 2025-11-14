# AsyncStorage 本地存储位置

## 物理存储路径

AsyncStorage 的数据存储位置取决于您使用的平台和 React Native 版本。

### iOS (模拟器)

#### React Native CLI 构建
- **路径**: `~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Library/RCTAsyncLocalStorage_V1/`
- **文件**: `manifest.json` 和 SQLite 数据库文件

#### Expo Go
- **路径**: `~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Library/Application Support/RCTAsyncLocalStorage_V1/`
- **文件**: `manifest.json` 和 SQLite 数据库文件

#### 快速查找方法
```bash
# 在终端中查找（替换 [APP_NAME] 为您的应用名称）
find ~/Library/Developer/CoreSimulator/Devices -name "RCTAsyncLocalStorage_V1" -type d 2>/dev/null

# 或者查找 manifest.json
find ~/Library/Developer/CoreSimulator/Devices -name "manifest.json" -path "*/RCTAsyncLocalStorage_V1/*" 2>/dev/null
```

### iOS (真机)

真机的存储路径无法直接访问，需要通过：
- Xcode 的 Devices and Simulators 工具
- 导出应用沙盒数据
- 或者使用 React Native Debugger 查看数据

### Android (模拟器)

#### React Native CLI 构建
- **路径**: `/data/data/[PACKAGE_NAME]/databases/RKStorage` (SQLite 数据库)
- **路径**: `/data/data/[PACKAGE_NAME]/shared_prefs/` (SharedPreferences)

#### Expo Go
- **路径**: `/data/data/host.exp.exponent/databases/RKStorage`
- **路径**: `/data/data/host.exp.exponent/shared_prefs/`

#### 访问方法（需要 root 或使用 adb）
```bash
# 通过 adb shell 访问（替换 [PACKAGE_NAME] 为您的包名）
adb shell
run-as [PACKAGE_NAME]
cd databases
ls -la RKStorage*

# 或者使用 adb pull 导出数据
adb pull /data/data/[PACKAGE_NAME]/databases/RKStorage ./asyncstorage_backup
```

### Android (真机)

真机需要 root 权限或使用 adb 调试访问。

## 查看 AsyncStorage 数据的方法

### 方法 1: React Native Debugger

在 React Native Debugger 的控制台中输入：

```javascript
// 查看所有 keys
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.getAllKeys().then(keys => console.log('All keys:', keys));

// 查看 userPoints 数据
AsyncStorage.getItem('userPoints').then(data => {
  if (data) {
    const parsed = JSON.parse(data);
    console.log('User Points:', parsed);
  } else {
    console.log('No userPoints found');
  }
});

// 查看所有数据
AsyncStorage.getAllKeys().then(keys => {
  Promise.all(keys.map(key => 
    AsyncStorage.getItem(key).then(value => ({ key, value }))
  )).then(allData => {
    console.log('All AsyncStorage data:', allData);
  });
});
```

### 方法 2: 在代码中添加调试工具

在您的应用代码中添加临时调试代码：

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 查看所有 AsyncStorage 数据
export const debugAsyncStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('=== AsyncStorage Debug ===');
    console.log('Total keys:', keys.length);
    console.log('Keys:', keys);
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      try {
        const parsed = JSON.parse(value || '');
        console.log(`\n${key}:`, parsed);
      } catch {
        console.log(`\n${key}:`, value);
      }
    }
  } catch (error) {
    console.error('Error reading AsyncStorage:', error);
  }
};

// 在开发环境中调用
if (__DEV__) {
  // 可以通过 React Native Debugger 调用
  (global as any).debugAsyncStorage = debugAsyncStorage;
}
```

### 方法 3: 使用 React Native 开发工具

1. 打开 React Native Debugger
2. 在控制台中输入上面的代码
3. 或者使用 Flipper 查看 AsyncStorage 数据

### 方法 4: 直接查看文件系统 (iOS 模拟器)

```bash
# 1. 找到应用的数据目录
xcrun simctl get_app_container booted [BUNDLE_ID] data

# 2. 或者使用 find 命令
find ~/Library/Developer/CoreSimulator/Devices -name "RCTAsyncLocalStorage_V1" 2>/dev/null

# 3. 查看数据（替换路径）
cat ~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Library/Application\ Support/RCTAsyncLocalStorage_V1/manifest.json
```

## 实际存储格式

### SQLite 数据库结构

AsyncStorage 在底层使用 SQLite 数据库存储数据：

```sql
-- 表名通常是 "AsyncStorage" 或 "RCTAsyncLocalStorage_V1"
CREATE TABLE IF NOT EXISTS "AsyncStorage" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT
);

-- 示例数据
INSERT INTO "AsyncStorage" VALUES ('userPoints', '{"totalPoints":150,"activities":[...]}');
```

### 查看 SQLite 数据库

```bash
# iOS 模拟器
sqlite3 ~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Library/Application\ Support/RCTAsyncLocalStorage_V1/RCTAsyncLocalStorage_V1.sqlite3

# 查看所有表
.tables

# 查看所有数据
SELECT * FROM AsyncStorage;

# 查看 userPoints
SELECT * FROM AsyncStorage WHERE key = 'userPoints';
```

## 清理 AsyncStorage 数据

### 方法 1: 通过代码清理
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 清理所有数据
AsyncStorage.clear().then(() => console.log('✅ Cleared all AsyncStorage'));

// 清理特定 key
AsyncStorage.removeItem('userPoints').then(() => console.log('✅ Removed userPoints'));
```

### 方法 2: 删除模拟器应用
- iOS 模拟器：长按应用图标删除，或重置模拟器
- Android 模拟器：在设置中卸载应用

### 方法 3: 删除数据库文件
```bash
# iOS 模拟器
rm -rf ~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Library/Application\ Support/RCTAsyncLocalStorage_V1/

# Android 模拟器（需要 root）
adb shell
run-as [PACKAGE_NAME]
rm -rf databases/RKStorage*
```

## 在您的项目中添加调试工具

我建议在您的项目中添加一个调试工具文件，方便查看 AsyncStorage 数据。

创建文件：`MenuApp/src/utils/debugAsyncStorage.ts`

