# 测试修复说明

## 问题总结

测试失败主要有以下几个原因：

### 1. 路径问题
- **错误**: `Cannot find module '../contexts/PointsContext'`
- **原因**: 测试文件中的相对路径不正确
- **解决**: 将 `../contexts` 改为 `../../contexts`（因为测试文件在 `__tests__` 子目录中）

### 2. Supabase Mock问题
- **错误**: `"supabase" is read-only`
- **原因**: 不能直接给导入的常量赋值
- **解决**: 使用 `jest.mock()` 在模块加载前mock，而不是直接赋值

### 3. Expo导入问题
- **错误**: `ReferenceError: You are trying to 'import' a file outside of the scope of the test code`
- **原因**: Expo的winter runtime在测试环境中无法正常工作
- **解决**: 在 `jest.setup.mocks.js` 中添加全局mock

## 已修复的文件

### 路径修复
- ✅ `src/components/__tests__/PointsDisplay.test.tsx`
- ✅ `src/screens/__tests__/LoginScreen.test.tsx`
- ✅ `src/contexts/__tests__/CommentContext.test.tsx`

### Supabase Mock修复
- ✅ `src/contexts/__tests__/AuthContext.test.tsx`
- ✅ `src/services/__tests__/autoSyncService.test.ts`
- ✅ `src/services/__tests__/cloudRecipeService.test.ts`

### Expo导入修复
- ✅ `jest.setup.mocks.js` - 添加了全局 `__ExpoImportMetaRegistry`
- ✅ `src/utils/__tests__/shareCard.test.ts` - Mock移到import之前

## 如果测试仍然失败

### 对于Expo导入错误
如果仍然看到 `ReferenceError: You are trying to 'import' a file outside of the scope of the test code`，可以尝试：

1. **使用Node测试环境**（在jest.config.js中）:
```javascript
testEnvironment: 'node',
```

2. **或者完全mock expo模块**:
在 `jest.setup.mocks.js` 中添加：
```javascript
jest.mock('expo', () => ({}), { virtual: true });
```

### 对于路径问题
确保所有mock路径都是相对于测试文件位置的：
- 从 `src/components/__tests__/` 访问 `src/contexts/` 应该用 `../../contexts/`
- 从 `src/screens/__tests__/` 访问 `src/contexts/` 应该用 `../../contexts/`
- 从 `src/contexts/__tests__/` 访问 `src/services/` 应该用 `../../services/`

### 对于Supabase Mock
确保在所有使用supabase的测试文件中：
1. 先定义 `mockSupabase` 对象
2. 然后使用 `jest.mock('../../config/supabase', () => ({ supabase: mockSupabase }))`
3. 不要尝试直接赋值 `(supabase as any) = mockSupabase`

## 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- PointsDisplay.test.tsx

# 查看详细输出
npm test -- --verbose
```

## 注意事项

1. **Mock顺序很重要**: Mock必须在import之前
2. **路径要正确**: 相对路径要考虑到测试文件在`__tests__`子目录中
3. **Expo模块**: 某些Expo模块在测试环境中需要特殊处理

