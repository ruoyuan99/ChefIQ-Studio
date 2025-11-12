# 测试问题修复指南

## 🐛 当前问题

### 问题 1: Jest Expo 模块兼容性

**错误**: `SyntaxError: Cannot use import statement outside a module`

**原因**: Expo SDK 54 使用 ES 模块，Jest 需要正确配置才能处理

## 🔧 解决方案

### 方案 1: 更新 Jest 配置 (推荐)

1. **更新 `jest.config.js`**:
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-image|expo-image-manipulator|expo-file-system|expo-media-library|@supabase|expo-modules-core)/)',
  ],
  // ... 其他配置
};
```

2. **确保 Babel 配置正确**:
```javascript
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [],
  };
};
```

### 方案 2: 使用简化测试配置

对于纯函数和服务测试，可以使用更简单的配置:

```javascript
// jest.config.simple.js
module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### 方案 3: 分离测试类型

1. **纯函数测试**: 使用 Node 环境
2. **组件测试**: 使用 React Native 环境
3. **集成测试**: 使用 E2E 测试框架

## 🚀 快速修复步骤

### 步骤 1: 检查 Babel 配置

```bash
# 检查 babel.config.js 是否存在
ls -la babel.config.js

# 如果不存在，创建它
cat > babel.config.js << 'EOF'
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
EOF
```

### 步骤 2: 更新 Jest 配置

更新 `jest.config.js` 中的 `transformIgnorePatterns`:

```javascript
transformIgnorePatterns: [
  'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-image|expo-image-manipulator|expo-file-system|expo-media-library|@supabase|expo-modules-core)/)',
],
```

### 步骤 3: 运行测试

```bash
# 运行单个测试文件
npm test -- src/utils/__tests__/recipeMatcher.test.ts

# 运行所有测试
npm test
```

## 📝 测试文件修复

### recipeMatcher.test.ts
- ✅ 测试用例已创建
- ✅ 覆盖主要功能
- ⚠️ 需要修复导入问题

### imageCompression.test.ts
- ✅ 测试用例已创建
- ✅ 模拟了 expo-image-manipulator
- ⚠️ 需要修复导入问题

### recipeImportService.test.ts
- ✅ 测试用例已创建
- ✅ 模拟了 fetch API
- ⚠️ 需要修复导入问题

## 🔍 调试技巧

### 1. 检查 Jest 配置
```bash
# 显示 Jest 配置
npm test -- --showConfig
```

### 2. 运行单个测试
```bash
# 运行特定测试
npm test -- -t "should calculate exact match score"
```

### 3. 查看详细输出
```bash
# 显示详细输出
npm test -- --verbose
```

### 4. 清理缓存
```bash
# 清理 Jest 缓存
npm test -- --clearCache
```

## ✅ 验证修复

运行以下命令验证修复:

```bash
# 1. 运行工具函数测试
npm test -- src/utils/__tests__/recipeMatcher.test.ts

# 2. 运行服务测试
npm test -- src/services/__tests__/recipeImportService.test.ts

# 3. 运行所有测试
npm test
```

## 📊 预期结果

修复后，应该看到:
- ✅ 所有测试通过
- ✅ 无导入错误
- ✅ 测试覆盖率报告生成

## 🎯 下一步

1. 修复 Jest 配置问题
2. 运行测试并修复失败用例
3. 提高测试覆盖率
4. 添加更多测试用例

## 📞 需要帮助?

如果问题仍然存在，请检查:
1. Node.js 版本 (推荐 18+)
2. npm 版本 (推荐 9+)
3. Expo SDK 版本
4. Jest 版本兼容性

