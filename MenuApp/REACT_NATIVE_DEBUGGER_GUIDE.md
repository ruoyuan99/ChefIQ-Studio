# React Native Debugger 使用指南

## 什么是 React Native Debugger？

React Native Debugger 是一个独立的调试工具，用于调试 React Native 应用。它结合了 React DevTools 和 Chrome DevTools，提供了一个完整的调试环境。

## 安装方式

### 方法 1: 使用 Homebrew (macOS - 推荐)

```bash
brew install --cask react-native-debugger
```

### 方法 2: 从 GitHub 下载

1. 访问：https://github.com/jhen0409/react-native-debugger/releases
2. 下载最新版本的 `.dmg` 文件（macOS）
3. 安装到 Applications 文件夹

### 方法 3: 使用 npm 全局安装（不推荐，已废弃）

```bash
npm install -g react-native-debugger
```

## 打开 React Native Debugger

### 步骤 1: 启动应用

在您的项目中运行应用：

```bash
cd MenuApp
npm start
# 或
npx expo start
```

### 步骤 2: 启动 React Native Debugger

1. **从 Applications 打开**：
   - 打开 Finder
   - 进入 Applications 文件夹
   - 找到 "React Native Debugger"
   - 双击打开

2. **或使用命令行**：
   ```bash
   open -a "React Native Debugger"
   ```

### 步骤 3: 连接应用

在您的应用中：
- **iOS 模拟器**：按 `Cmd + D`，然后选择 "Debug"
- **Android 模拟器**：按 `Cmd + M` (Mac) 或 `Ctrl + M` (Windows/Linux)，然后选择 "Debug"
- **真机**：摇动设备，然后选择 "Debug"

或者直接在 Expo 开发菜单中：
- **iOS 模拟器**：按 `Cmd + D`
- **Android 模拟器**：按 `Cmd + M`
- 选择 "Debug with Chrome" 或 "Open Debugger"

## 使用 React Native Debugger

### 打开控制台

在 React Native Debugger 窗口中：
1. 点击底部的 "Console" 标签
2. 或者按 `Cmd + Option + J` (Mac) / `Ctrl + Shift + J` (Windows/Linux)

### 查看 AsyncStorage 数据

在控制台中输入：

```javascript
// 查看所有 AsyncStorage 数据
debugAsyncStorage()

// 查看积分数据
debugUserPoints()

// 查看所有 keys
debugAllKeys()

// 清除积分数据
clearLocalPointsOnly()

// 查看存储大小
debugStorageSize()
```

### 调试组件

1. 点击 "React" 标签
2. 使用 React DevTools 查看组件树
3. 检查组件的 props 和 state

### 网络请求

1. 点击 "Network" 标签
2. 查看所有网络请求
3. 检查请求和响应数据

## 常见问题

### 问题 1: 无法连接

**解决方法**：
1. 确保应用正在运行
2. 确保 React Native Debugger 已打开
3. 在应用中选择 "Debug" 或 "Open Debugger"
4. 检查端口是否被占用（默认端口 8081）

### 问题 2: 调试工具不可用

**解决方法**：
1. 确保应用在开发模式下运行（`__DEV__ = true`）
2. 重新启动应用和调试器
3. 检查控制台是否有错误信息

### 问题 3: AsyncStorage 函数未定义

**解决方法**：
1. 确保应用已完全启动
2. 等待几秒钟让全局函数加载
3. 检查应用控制台是否有 "🔧 AsyncStorage Debug Tools Available" 的日志

## 快捷键

- **打开/关闭开发者菜单**：
  - iOS: `Cmd + D`
  - Android: `Cmd + M` (Mac) / `Ctrl + M` (Windows)

- **刷新应用**：
  - iOS: `Cmd + R`
  - Android: 双击 `R` 键

- **打开 Chrome DevTools**：`Cmd + Option + I` (Mac)

## 替代方案

### 使用 Chrome DevTools

如果不想安装 React Native Debugger，也可以使用 Chrome DevTools：

1. 在应用中选择 "Debug with Chrome"
2. Chrome 浏览器会自动打开
3. 按 `Cmd + Option + J` 打开控制台
4. 在控制台中输入调试命令

**注意**：Chrome DevTools 可能无法使用 React DevTools 的所有功能。

### 使用 Expo DevTools

如果使用 Expo：

1. 运行 `npx expo start`
2. 浏览器会自动打开 Expo DevTools
3. 点击 "Debug Remote JS" 连接到调试器

### 使用 Flipper

Flipper 是 Meta (Facebook) 开发的调试工具：

1. 下载并安装 Flipper：https://fbflipper.com/
2. 安装 Flipper 插件：
   ```bash
   npm install --save-dev flipper-plugin-react-native-async-storage
   ```
3. 启动应用并连接 Flipper

## 推荐的调试流程

1. **启动应用**：
   ```bash
   cd MenuApp
   npx expo start
   ```

2. **打开 React Native Debugger**：
   ```bash
   open -a "React Native Debugger"
   ```

3. **在应用中启用调试**：
   - iOS 模拟器：按 `Cmd + D` → 选择 "Debug"
   - Android 模拟器：按 `Cmd + M` → 选择 "Debug"

4. **在调试器中查看数据**：
   ```javascript
   debugUserPoints()
   ```

5. **进行调试操作**：
   ```javascript
   clearLocalPointsOnly()
   ```

## 验证调试器已连接

在 React Native Debugger 的控制台中，您应该看到：
- ✅ 应用已连接
- ✅ 可以看到应用的日志输出
- ✅ 可以执行全局函数（如 `debugAsyncStorage()`）

如果看不到这些，说明调试器未正确连接，请重新连接。

