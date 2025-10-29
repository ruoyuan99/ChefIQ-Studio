# 📝 English Translation Guide

## ✅ Completed Files

### 1. AuthContext.tsx
- ✅ All error messages translated to English
- ✅ All success messages translated to English
- ✅ All console logs translated to English

### 2. autoSyncService.ts (Partial)
- ✅ Main sync messages translated
- ✅ User sync messages translated
- ⚠️ Still has some Chinese messages in recipe/ingredient/instruction sync functions

## 🔧 RLS Policy Fix for Admin User

### SQL Script Location
`database/fix_admin_rls.sql`

### Execute in Supabase Dashboard
1. Go to SQL Editor
2. Copy and paste the content from `fix_admin_rls.sql`
3. Click "Run"

This will create RLS policies that allow the admin user to be created without auth.

## 📋 Files Still Needing Translation

### High Priority (User-Facing)
1. **LoginScreen.tsx** - Login/registration error messages
2. **RegisterScreen.tsx** - Registration form labels and messages
3. **ProfileScreen.tsx** - Profile menu items
4. **RecipeDetailScreen.tsx** - Recipe display text
5. **CreateRecipeScreen.tsx** - Form labels and validation messages

### Medium Priority (Console Logs)
6. **realTimeSyncService.ts** - Sync log messages
7. **RecipeContext.tsx** - Recipe operation logs
8. **FavoriteContext.tsx** - Favorite operation logs
9. **CommentContext.tsx** - Comment operation logs

### Low Priority (Internal)
10. **supabaseService.ts** - Service error messages
11. **dataMigrationService.ts** - Migration logs (may not be needed)
12. **SupabaseTestScreen.tsx** - Test screen messages
13. Other context files with Chinese comments/logs

## 🚀 Quick Fix Instructions

### To finish autoSyncService.ts:
Replace these patterns:

```typescript
// Find:
console.log(`✅ 菜谱同步完成: ${recipe.title}`);
// Replace with:
console.log(`✅ Recipe sync completed: ${recipe.title}`);

// Find:
console.error(`❌ 菜谱同步失败: ${recipe.title}`, error);
// Replace with:
console.error(`❌ Recipe sync failed: ${recipe.title}`, error);

// Similar patterns for:
// - 食材同步 (Ingredient sync)
// - 步骤同步 (Instruction sync)  
// - 标签同步 (Tag sync)
// - 收藏同步 (Favorite sync)
// - 评论同步 (Comment sync)
// - 社交统计同步 (Social stats sync)
```

## 📝 Translation Patterns

### Common Replacements:

| Chinese | English |
|---------|---------|
| 失败 | failed |
| 成功 | successful/success |
| 同步 | sync |
| 创建 | create/create |
| 更新 | update |
| 删除 | delete |
| 登录 | login |
| 注册 | registration |
| 错误 | error |
| 提示 | message/prompt |

## 🎯 Priority Actions

1. **Fix RLS Policy** - Execute `database/fix_admin_rls.sql` in Supabase
2. **Translate User-Facing Messages** - Login, Register, Profile screens
3. **Translate Console Logs** - For better debugging
4. **Test Admin Login** - Verify it works after RLS fix

---

**Note**: The most critical user-facing messages should be translated first. Console logs can be done incrementally.
