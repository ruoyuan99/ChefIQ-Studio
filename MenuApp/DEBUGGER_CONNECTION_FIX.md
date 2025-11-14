# React Native Debugger 连接问题修复指南

## 问题描述

看到错误：`WebSocket connection to 'ws://localhost:8081/debugger-proxy?role=debugger&name=Chrome' failed`

这表示 React Native Debugger 无法连接到 Expo 开发服务器。

## 解决方案

### 方法 1: 确保 Expo 开发服务器正在运行

1. **检查 Expo 是否运行**：
   ```bash
   cd MenuApp
   npx expo start
   ```

2. **确保看到以下信息**：
   - Metro bundler 正在运行
   - 显示二维码和开发服务器地址
   - 端口 8081 已启动

### 方法 2: 检查端口是否被占用

```bash
# 检查端口 8081 是否被占用
lsof -ti:8081

# 如果返回进程 ID，说明端口被占用
# 可以杀死该进程：
kill -9 $(lsof -ti:8081)
```

### 方法 3: 重置连接

1. **关闭 React Native Debugger**
2. **在应用中禁用调试**：
   - iOS: 按 `Cmd + D` → 选择 "Stop Debugging"
   - Android: 按 `Cmd + M` → 选择 "Stop Debugging"
3. **重新启动 Expo**：
   ```bash
   # 停止当前 Expo 进程 (Ctrl + C)
   # 然后重新启动
   npx expo start --clear
   ```
4. **重新打开 React Native Debugger**
5. **在应用中重新启用调试**：
   - iOS: 按 `Cmd + D` → 选择 "Debug"
   - Android: 按 `Cmd + M` → 选择 "Debug"

### 方法 4: 使用不同的端口

如果端口 8081 有问题，可以尝试使用其他端口：

```bash
# 使用自定义端口启动 Expo
npx expo start --port 8082
```

然后在 React Native Debugger 中：
1. 点击右上角的设置图标
2. 更改端口为 8082

### 方法 5: 清除缓存并重新启动

```bash
cd MenuApp

# 清除 Expo 缓存
npx expo start --clear

# 或者清除所有缓存
rm -rf node_modules/.cache
npx expo start --clear
```

### 方法 6: 检查防火墙设置

确保防火墙没有阻止端口 8081：
- macOS: 系统设置 → 网络 → 防火墙
- 允许 Node.js 和 Expo 通过防火墙

### 方法 7: 使用 Chrome DevTools 作为替代

如果 React Native Debugger 持续有问题，可以使用 Chrome DevTools：

1. **在应用中**：
   - iOS: 按 `Cmd + D` → 选择 "Debug with Chrome"
   - Android: 按 `Cmd + M` → 选择 "Debug with Chrome"

2. **Chrome 会自动打开**
3. **按 `Cmd + Option + J` 打开控制台**

## 完整重置步骤

如果以上方法都不行，执行完整重置：

```bash
cd "/Users/ruoyuangao/Desktop/Chef iQ RN/MenuApp"

# 1. 停止所有相关进程
killall node
killall -9 node

# 2. 清除端口占用
lsof -ti:8081 | xargs kill -9

# 3. 清除缓存
rm -rf .expo
rm -rf node_modules/.cache
npx expo start --clear
```

## 验证连接

连接成功后，您应该看到：

1. **在 React Native Debugger 中**：
   - 不再有 WebSocket 错误
   - 可以看到应用的日志输出
   - 控制台显示 "🔧 AsyncStorage Debug Tools Available"

2. **在应用中**：
   - 开发者菜单显示 "Stop Debugging"（而不是 "Debug"）
   - 应用可能稍微变慢（这是正常的，因为正在调试）

## 常见错误原因

1. **Expo 服务器未运行** - 最常见
2. **端口被占用** - 另一个进程在使用 8081
3. **防火墙阻止** - 系统防火墙阻止了连接
4. **网络配置问题** - localhost 无法访问
5. **缓存问题** - 旧的缓存导致连接失败

## 快速检查清单

- [ ] Expo 开发服务器正在运行
- [ ] 端口 8081 没有被占用
- [ ] 防火墙允许连接
- [ ] 应用已选择 "Debug" 选项
- [ ] React Native Debugger 已打开
- [ ] 已清除缓存并重新启动

## 如果问题仍然存在

1. **检查 Expo 版本**：
   ```bash
   npx expo --version
   ```

2. **更新 Expo**：
   ```bash
   npm install -g expo-cli@latest
   ```

3. **检查网络连接**：
   ```bash
   curl http://localhost:8081/status
   ```
   应该返回 JSON 响应

4. **查看详细日志**：
   在 Expo 启动时查看是否有错误信息

