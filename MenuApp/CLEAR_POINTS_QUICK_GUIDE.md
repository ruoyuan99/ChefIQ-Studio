# 清除 AsyncStorage 积分数据 - 快速指南

## 问题

在 Chrome DevTools 中使用 `clearLocalPoints()` 时出现 `ReferenceError: clearLocalPoints is not defined` 错误。

**原因**：Chrome DevTools 运行在 Chrome 的 JavaScript 引擎中，无法直接访问 React Native 环境中定义的全局函数。

## 解决方案（3 种方法）

### 方法 1: 使用应用内的清除按钮（最简单 ⭐ 推荐）

1. **打开应用**，进入 "Points History" 页面
2. **在右上角**，您会看到一个垃圾桶图标 🗑️（仅在开发环境显示）
3. **点击垃圾桶图标**
4. **确认清除操作**
5. **完成！** 积分数据已清除

**优点**：
- ✅ 最简单，无需打开调试器
- ✅ 立即生效
- ✅ 有确认对话框，防止误操作

### 方法 2: 使用 React Native Debugger

1. **安装 React Native Debugger**（如果还没安装）：
   ```bash
   brew install --cask react-native-debugger
   ```

2. **启动应用**：
   ```bash
   cd MenuApp
   npx expo start
   ```

3. **打开 React Native Debugger**：
   ```bash
   open -a "React Native Debugger"
   ```

4. **在应用中启用调试**：
   - iOS: 按 `Cmd + D` → 选择 "Debug"
   - Android: 按 `Cmd + M` → 选择 "Debug"

5. **在 React Native Debugger 控制台中输入**：
   ```javascript
   clearLocalPointsOnly()
   ```

**优点**：
- ✅ 可以在控制台中查看结果
- ✅ 可以执行其他调试命令
- ✅ 功能最完整

### 方法 3: 在 Chrome DevTools 中使用（需要修改）

Chrome DevTools 无法直接访问 React Native 的全局函数，但可以通过以下方式：

1. **确保应用已连接调试器**
2. **在 Chrome DevTools 控制台中**，由于 WebSocket 连接问题，可能无法使用

**更好的替代方案**：使用方法 1 或方法 2

## 推荐的清除流程

### 快速清除（推荐）

1. 打开应用
2. 进入 "Points History" 页面
3. 点击右上角的垃圾桶图标 🗑️
4. 确认清除
5. 完成！

### 使用调试器清除

1. 打开 React Native Debugger
2. 在应用中启用调试
3. 在控制台中输入：
   ```javascript
   clearLocalPointsOnly()
   ```

## 验证清除结果

清除后，您可以：

1. **查看应用**：积分应该显示为 0
2. **查看 Points History**：应该为空
3. **在调试器中验证**：
   ```javascript
   viewPoints()  // 应该返回 null
   debugUserPoints()  // 应该显示无数据
   ```

## 注意事项

1. **仅清除 AsyncStorage**：这些方法只清除本地 AsyncStorage 数据，不影响 Supabase 数据库
2. **数据恢复**：如果用户已登录，下次启动应用时会从 Supabase 数据库重新加载
3. **未登录用户**：如果用户未登录，清除后数据将无法恢复（除非从其他设备同步）

## 清除所有 AsyncStorage 数据

如果需要清除所有 AsyncStorage 数据（包括积分、菜谱、收藏等）：

### 在应用中使用清除按钮
- 目前只有清除积分数据的按钮
- 如需清除所有数据，请使用调试器

### 在 React Native Debugger 中
```javascript
clearAllAsyncStorage()
```

## 故障排除

### 问题 1: 清除按钮不显示

**原因**：应用可能不在开发模式下运行

**解决**：
1. 确保使用 `npx expo start` 启动应用
2. 确保不是生产构建
3. 检查控制台是否有 `__DEV__` 相关的日志

### 问题 2: 清除后数据仍然存在

**原因**：可能是从 Supabase 数据库重新加载了

**解决**：
1. 清除 AsyncStorage 后，如果用户已登录，数据会从数据库重新加载
2. 如果需要完全清除，需要同时清除数据库中的数据
3. 或者临时退出登录后再清除

### 问题 3: Chrome DevTools 无法连接

**原因**：WebSocket 连接问题

**解决**：
1. 使用方法 1（应用内的清除按钮）- 最简单
2. 或使用 React Native Debugger
3. 参考 `DEBUGGER_CONNECTION_FIX.md` 修复连接问题

## 总结

**最简单的方法**：使用应用内的清除按钮 🗑️
- 打开 "Points History" 页面
- 点击右上角的垃圾桶图标
- 确认清除
- 完成！

**功能最全的方法**：使用 React Native Debugger
- 可以查看数据
- 可以清除数据
- 可以执行其他调试操作

**不推荐**：在 Chrome DevTools 中直接操作（连接问题太多）

