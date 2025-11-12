# 单元测试设置指南

## 📋 测试框架选择

### 推荐方案: Jest + React Native Testing Library

- ✅ **Jest**: React Native 官方推荐的测试框架
- ✅ **React Native Testing Library**: 专门为 React Native 设计的测试工具
- ✅ **@testing-library/jest-native**: Jest 扩展，提供额外的匹配器

## 🔧 安装测试依赖

```bash
cd MenuApp
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native @types/jest
```

## 📝 配置文件

### jest.config.js

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@expo|expo|@react-navigation|@supabase)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
};
```

### package.json scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 🧪 测试文件结构

```
MenuApp/
├── src/
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── recipeImportService.test.ts
│   │   │   └── storageService.test.ts
│   │   └── recipeImportService.ts
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── imageCompression.test.ts
│   │   │   ├── recommendationService.test.ts
│   │   │   └── userPreferenceService.test.ts
│   │   └── imageCompression.ts
│   └── components/
│       ├── __tests__/
│       │   └── OptimizedImage.test.tsx
│       └── OptimizedImage.tsx
```

## 📊 测试覆盖范围

### 优先级 1: 核心服务
- [ ] `recipeImportService.ts` - 食谱导入服务
- [ ] `storageService.ts` - 图片上传服务
- [ ] `imageCompression.ts` - 图片压缩工具

### 优先级 2: 工具函数
- [ ] `recommendationService.ts` - 推荐服务
- [ ] `userPreferenceService.ts` - 用户偏好服务
- [ ] `recipeMatcher.ts` - 食谱匹配工具

### 优先级 3: 组件
- [ ] `OptimizedImage.tsx` - 优化图片组件
- [ ] `PointsDisplay.tsx` - 积分显示组件

### 优先级 4: 上下文
- [ ] `AuthContext.tsx` - 认证上下文
- [ ] `RecipeContext.tsx` - 食谱上下文
- [ ] `PointsContext.tsx` - 积分上下文

## 🧪 测试示例

### 服务测试示例

```typescript
// src/services/__tests__/recipeImportService.test.ts
import { importRecipeViaBackend } from '../recipeImportService';

describe('recipeImportService', () => {
  describe('importRecipeViaBackend', () => {
    it('should import recipe from URL', async () => {
      // Test implementation
    });
  });
});
```

### 工具函数测试示例

```typescript
// src/utils/__tests__/imageCompression.test.ts
import { compressRecipeImage } from '../imageCompression';

describe('imageCompression', () => {
  describe('compressRecipeImage', () => {
    it('should compress recipe image', async () => {
      // Test implementation
    });
  });
});
```

## 🚀 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并监听变化
npm run test:watch

# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 📈 测试覆盖率目标

- **服务层**: 80%+ 覆盖率
- **工具函数**: 90%+ 覆盖率
- **组件**: 70%+ 覆盖率
- **上下文**: 60%+ 覆盖率

## 🔍 测试最佳实践

1. **单元测试**: 测试单个函数或方法
2. **集成测试**: 测试多个组件的交互
3. **模拟依赖**: 使用 Jest mocks 模拟外部依赖
4. **测试隔离**: 每个测试应该独立运行
5. **测试命名**: 使用描述性的测试名称
6. **测试覆盖**: 覆盖正常流程和错误情况

## 📝 下一步

1. 安装测试依赖
2. 配置 Jest
3. 创建测试文件
4. 运行测试
5. 修复发现的问题
6. 提高测试覆盖率

