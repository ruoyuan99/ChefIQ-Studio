# 偏好推荐功能 - 方案评估报告

## 📋 功能需求

在 Explore 页面添加 "Recommend" 排序选项，根据用户个人偏好对食谱进行排序。

## 🔍 现有数据结构分析

### 1. 用户行为数据
- **LikeContext**: 用户点赞的食谱列表 (`likedRecipes: string[]`)
- **FavoriteContext**: 用户收藏的食谱列表 (`favoriteRecipes: Recipe[]`)
- **TriedContext**: 用户尝试过的食谱列表 (`triedRecipes: string[]`)
- **PointsContext**: 用户活动历史 (`activities: PointsActivity[]`)
  - 包含：`create_recipe`, `try_recipe`, `favorite_recipe`, `like_recipe` 等

### 2. 食谱特征数据
- **Tags**: 标签数组（如 "Italian", "Quick", "Vegetarian"）
- **CookingTime**: 烹饪时间（如 "30 minutes"）
- **Servings**: 份量（如 "4 servings"）
- **Cookware**: 厨具类型（如 "Chef iQ Mini Oven"）
- **Ingredients**: 食材列表
- **Category**: 类别（从 `items` 中提取）

### 3. 数据存储
- **本地**: AsyncStorage（离线支持）
- **云端**: Supabase（用户登录后同步）

## 💡 推荐算法方案

### 方案 1: 基于内容的推荐（Content-Based Filtering）✅ 推荐

#### 算法逻辑
1. **提取用户偏好特征**：
   - 从用户点赞/收藏/尝试的食谱中提取：
     - 常用标签（Tags）
     - 偏好的烹饪时间（CookingTime）
     - 偏好的份量（Servings）
     - 偏好的厨具（Cookware）
     - 常用食材（Ingredients）
     - 偏好的菜系（从 Tags 中提取）

2. **计算推荐分数**：
   ```
   Score(recipe) = 
     TagMatchScore * 0.4 +        // 标签匹配度（权重 40%）
     CookingTimeScore * 0.2 +     // 烹饪时间匹配度（权重 20%）
     CookwareScore * 0.15 +       // 厨具匹配度（权重 15%）
     IngredientsScore * 0.15 +    // 食材匹配度（权重 15%）
     ServingsScore * 0.1          // 份量匹配度（权重 10%）
   ```

3. **特征匹配计算**：
   - **标签匹配**: `(共同标签数 / 用户偏好标签总数) * 100`
   - **烹饪时间匹配**: 如果烹饪时间在用户偏好范围内，得分 100，否则 0
   - **厨具匹配**: 如果厨具匹配，得分 100，否则 0
   - **食材匹配**: `(共同食材数 / 用户偏好食材总数) * 100`
   - **份量匹配**: 如果份量在用户偏好范围内，得分 100，否则 0

#### 优点
- ✅ 不需要其他用户数据（适合初期）
- ✅ 可解释性强（用户知道为什么推荐）
- ✅ 实现简单，性能好
- ✅ 对冷启动友好（有少量数据即可工作）
- ✅ 不受数据稀疏性影响

#### 缺点
- ❌ 推荐可能过于相似（缺乏多样性）
- ❌ 无法发现用户潜在兴趣

#### 稳定性评估
- **数据依赖**: ⭐⭐⭐⭐⭐ (低，仅需用户自己的行为数据)
- **计算复杂度**: ⭐⭐⭐⭐⭐ (低，O(n) 复杂度)
- **性能**: ⭐⭐⭐⭐⭐ (优秀，可实时计算)
- **可扩展性**: ⭐⭐⭐⭐ (良好，易于添加新特征)

### 方案 2: 混合推荐（Hybrid Approach）✅ 长期推荐

#### 算法逻辑
结合内容过滤 + 简单协同过滤 + 热度加权

```
Score(recipe) = 
  ContentScore * 0.6 +      // 内容匹配度（60%）
  PopularityScore * 0.3 +   // 热度分数（30%）
  DiversityBonus * 0.1      // 多样性奖励（10%）
```

#### 优点
- ✅ 平衡了个性化和多样性
- ✅ 新用户也能获得合理推荐
- ✅ 可以发现潜在兴趣

#### 缺点
- ❌ 实现复杂度较高
- ❌ 需要更多数据（用户间交互）

#### 稳定性评估
- **数据依赖**: ⭐⭐⭐ (中等，需要用户间数据)
- **计算复杂度**: ⭐⭐⭐ (中等，O(n*m) 复杂度)
- **性能**: ⭐⭐⭐⭐ (良好，需要缓存)
- **可扩展性**: ⭐⭐⭐⭐⭐ (优秀，易于扩展)

### 方案 3: 基于规则的推荐（Rule-Based）⚠️ 不推荐

#### 算法逻辑
简单的 if-else 规则，如：
- 如果用户喜欢 "Italian" 标签，推荐所有 Italian 食谱
- 如果用户尝试过 "Quick" 食谱，推荐更多 Quick 食谱

#### 优点
- ✅ 实现最简单
- ✅ 性能最好

#### 缺点
- ❌ 推荐质量低
- ❌ 缺乏灵活性
- ❌ 无法处理复杂偏好

## 🎯 推荐实施方案

### 阶段 1: 基础内容推荐（当前阶段）✅

**实施内容**：
1. 创建 `UserPreferenceService` 服务
   - 分析用户行为数据（点赞、收藏、尝试）
   - 提取用户偏好特征
   - 计算偏好权重

2. 创建 `RecommendationService` 服务
   - 计算食谱推荐分数
   - 实现排序逻辑
   - 缓存推荐结果（提升性能）

3. 在 ExploreScreen 中集成
   - 添加 "Recommend" 排序选项
   - 调用推荐服务获取排序结果
   - 处理冷启动场景（新用户无数据）

### 阶段 2: 优化推荐（未来）

**实施内容**：
1. 添加多样性机制
   - 避免推荐过于相似的食谱
   - 引入探索性推荐（推荐用户可能感兴趣的新类型）

2. 添加热度加权
   - 结合食谱热度（点赞数、收藏数、尝试数）
   - 平衡个性化和流行度

3. 添加时间衰减
   - 近期行为权重更高
   - 避免推荐过时的偏好

## 📊 稳定性评估

### 1. 数据稳定性

#### 数据来源
- ✅ **用户行为数据**: 已存储在 LikeContext, FavoriteContext, TriedContext
- ✅ **食谱数据**: 已存储在 RecipeContext
- ✅ **数据同步**: AsyncStorage + Supabase 双重存储

#### 数据完整性
- ✅ **离线支持**: AsyncStorage 确保离线可用
- ✅ **数据同步**: Supabase 确保多设备同步
- ✅ **数据一致性**: Context API 确保数据一致性

#### 风险评估
- ⚠️ **新用户冷启动**: 新用户无行为数据，需要降级策略
  - **解决方案**: 使用热度排序作为默认推荐
- ⚠️ **数据稀疏性**: 用户行为数据可能较少
  - **解决方案**: 降低阈值，使用更宽泛的特征匹配

### 2. 性能稳定性

#### 计算复杂度
- **用户偏好提取**: O(n) - n 为用户行为记录数
- **推荐分数计算**: O(m) - m 为食谱总数
- **总体复杂度**: O(n + m) - 线性复杂度，性能优秀

#### 性能优化
- ✅ **缓存机制**: 缓存用户偏好和推荐结果
- ✅ **增量更新**: 仅在新行为发生时更新偏好
- ✅ **延迟计算**: 使用 `useMemo` 延迟计算推荐分数
- ✅ **分页加载**: 大规模数据时分页加载

#### 性能测试建议
- 测试 1000+ 食谱的场景
- 测试用户有 100+ 行为记录的场景
- 测试实时计算延迟（目标 < 100ms）

### 3. 用户体验稳定性

#### 冷启动处理
- ✅ **新用户**: 使用热度排序（Popular）作为默认
- ✅ **数据不足**: 结合内容推荐和热度推荐
- ✅ **无匹配**: 降级到热度排序

#### 推荐质量
- ✅ **可解释性**: 用户可以看到推荐理由（可选功能）
- ✅ **多样性**: 避免推荐过于相似的食谱
- ✅ **实时性**: 用户新行为立即影响推荐

#### 用户反馈
- ✅ **显式反馈**: 允许用户标记"不感兴趣"
- ✅ **隐式反馈**: 通过用户行为（点击、查看时长）优化推荐

### 4. 技术稳定性

#### 代码质量
- ✅ **类型安全**: TypeScript 确保类型安全
- ✅ **错误处理**: 完善的错误处理和降级策略
- ✅ **测试覆盖**: 单元测试和集成测试

#### 可维护性
- ✅ **模块化设计**: 独立的推荐服务，易于维护
- ✅ **配置化**: 推荐权重可配置，易于调整
- ✅ **文档完善**: 代码注释和文档

#### 可扩展性
- ✅ **插件化**: 易于添加新的推荐算法
- ✅ **A/B 测试**: 支持不同推荐算法的 A/B 测试
- ✅ **机器学习**: 未来可集成机器学习模型

## 🚀 实施建议

### 优先级 1: 基础内容推荐（1-2 天）

1. **创建 UserPreferenceService**
   - 分析用户行为数据
   - 提取偏好特征
   - 计算偏好权重

2. **创建 RecommendationService**
   - 实现推荐分数计算
   - 实现排序逻辑
   - 添加缓存机制

3. **集成到 ExploreScreen**
   - 添加 "Recommend" 排序选项
   - 调用推荐服务
   - 处理冷启动场景

### 优先级 2: 性能优化（1 天）

1. **添加缓存机制**
   - 缓存用户偏好（更新频率：每小时）
   - 缓存推荐结果（更新频率：用户行为变化时）

2. **优化计算性能**
   - 使用 `useMemo` 延迟计算
   - 使用 `Web Worker` 处理大量数据（可选）

### 优先级 3: 用户体验优化（1 天）

1. **添加推荐理由**
   - 显示推荐原因（如 "因为你喜欢 Italian 食谱"）

2. **添加多样性机制**
   - 避免推荐过于相似的食谱
   - 引入探索性推荐

## 📝 技术实现细节

### 1. UserPreferenceService

```typescript
interface UserPreference {
  preferredTags: { [tag: string]: number };      // 标签偏好（权重）
  preferredCookingTimes: string[];               // 偏好的烹饪时间
  preferredCookware: string[];                   // 偏好的厨具
  preferredIngredients: { [ingredient: string]: number }; // 食材偏好
  preferredServings: string[];                   // 偏好的份量
  preferredCuisines: string[];                   // 偏好的菜系
}

class UserPreferenceService {
  // 分析用户行为，提取偏好
  static analyzeUserPreferences(
    likedRecipes: string[],
    favoriteRecipes: Recipe[],
    triedRecipes: string[],
    allRecipes: Recipe[]
  ): UserPreference;

  // 计算偏好权重
  static calculatePreferenceWeights(preference: UserPreference): UserPreference;
}
```

### 2. RecommendationService

```typescript
class RecommendationService {
  // 计算食谱推荐分数
  static calculateRecommendationScore(
    recipe: Recipe,
    userPreference: UserPreference
  ): number;

  // 对食谱列表进行推荐排序
  static sortByRecommendation(
    recipes: Recipe[],
    userPreference: UserPreference
  ): Recipe[];

  // 获取推荐理由（可选）
  static getRecommendationReason(
    recipe: Recipe,
    userPreference: UserPreference
  ): string;
}
```

### 3. ExploreScreen 集成

```typescript
// 在 ExploreScreen 中添加
const [sortBy, setSortBy] = useState<'relevance' | 'popular' | 'newest' | 'oldest' | 'title' | 'recommend'>('relevance');

// 获取用户偏好
const userPreference = useMemo(() => {
  return UserPreferenceService.analyzeUserPreferences(
    likedRecipes,
    favoriteRecipes,
    triedRecipes,
    allPublicRecipes
  );
}, [likedRecipes, favoriteRecipes, triedRecipes, allPublicRecipes]);

// 应用推荐排序
const filteredRecipes = useMemo(() => {
  let filtered = // ... 筛选逻辑
  
  // 应用排序
  if (sortBy === 'recommend') {
    // 检查是否有足够的用户数据
    if (userPreference.preferredTags.length > 0 || 
        userPreference.preferredCookware.length > 0) {
      return RecommendationService.sortByRecommendation(filtered, userPreference);
    } else {
      // 冷启动：使用热度排序
      return filtered.sort((a, b) => {
        const aStats = getStats(a.id);
        const bStats = getStats(b.id);
        const aPopularity = aStats.likes + aStats.favorites + aStats.views;
        const bPopularity = bStats.likes + bStats.favorites + bStats.views;
        return bPopularity - aPopularity;
      });
    }
  }
  
  // ... 其他排序逻辑
}, [filtered, sortBy, userPreference]);
```

## ⚠️ 风险与 mitigation

### 风险 1: 新用户冷启动
- **风险**: 新用户无行为数据，无法生成推荐
- **Mitigation**: 
  - 使用热度排序作为默认推荐
  - 显示提示："基于你的偏好推荐，先试试收藏一些喜欢的食谱吧！"

### 风险 2: 推荐质量低
- **风险**: 推荐算法可能不够准确
- **Mitigation**: 
  - 使用 A/B 测试优化算法
  - 收集用户反馈（显式和隐式）
  - 定期调整推荐权重

### 风险 3: 性能问题
- **风险**: 大量食谱时计算延迟
- **Mitigation**: 
  - 使用缓存机制
  - 使用 `useMemo` 延迟计算
  - 分页加载大规模数据

### 风险 4: 数据不一致
- **风险**: 本地和云端数据不一致
- **Mitigation**: 
  - 使用 Supabase 实时同步
  - 定期同步用户行为数据
  - 处理离线场景

## ✅ 结论

### 推荐方案
**方案 1: 基于内容的推荐（Content-Based Filtering）**

### 稳定性评估
- **数据稳定性**: ⭐⭐⭐⭐⭐ (优秀)
- **性能稳定性**: ⭐⭐⭐⭐⭐ (优秀)
- **用户体验稳定性**: ⭐⭐⭐⭐ (良好)
- **技术稳定性**: ⭐⭐⭐⭐⭐ (优秀)

### 实施优先级
1. **高优先级**: 基础内容推荐（1-2 天）
2. **中优先级**: 性能优化（1 天）
3. **低优先级**: 用户体验优化（1 天）

### 总体评估
✅ **推荐实施** - 方案稳定、可行、易于实现，适合当前阶段。

## 📅 下一步行动

1. **创建 UserPreferenceService** (2-3 小时)
2. **创建 RecommendationService** (2-3 小时)
3. **集成到 ExploreScreen** (1-2 小时)
4. **测试和优化** (2-3 小时)
5. **性能测试** (1 小时)

**总计**: 约 1-2 天完成基础功能

