import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFontWeight } from '../styles/theme';
import { useRecipe } from '../contexts/RecipeContext';
import { useTried } from '../contexts/TriedContext';
import { useSocialStats } from '../contexts/SocialStatsContext';
import { useLike } from '../contexts/LikeContext';
import { useFavorite } from '../contexts/FavoriteContext';
import { sampleRecipes } from '../data/sampleRecipes';
import { UserPreferenceService } from '../services/userPreferenceService';
import { RecommendationService } from '../services/recommendationService';
import { CloudRecipeService } from '../services/cloudRecipeService';
import { Recipe } from '../types';
import OptimizedImage from '../components/OptimizedImage';

interface ExploreScreenProps {
  navigation: any;
}

interface FilterState {
  cookingTime: string | null;
  cookware: string | null;
  selectedTags: string[];
}

// Main cookware options
const COOKWARE_OPTIONS = [
  'Stovetop – Pan or Pot',
  'Air Fryer',
  'Oven',
  'Grill',
  'Slow Cooker',
  'Pressure Cooker',
  'Wok',
];

/**
 * Format cooking time to display as "x minutes" format
 * Extracts number and formats as "X minutes" (singular "minute" for 1)
 */
const formatCookingTimeMinutes = (cookingTime: string | number | undefined | null): string => {
  if (!cookingTime) return '';
  
  let minutes: number;
  
  // If it's a number, use it directly
  if (typeof cookingTime === 'number') {
    minutes = cookingTime;
  } else if (typeof cookingTime === 'string') {
    // Remove "分钟", "min", "minutes" and extract number
    const cleaned = cookingTime.replace(/分钟|min|minutes/gi, '').trim();
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed)) {
      minutes = parsed;
    } else {
      // If no number found, try to extract any number from the string
      const numberMatch = cookingTime.match(/\d+/);
      if (numberMatch) {
        minutes = parseInt(numberMatch[0], 10);
      } else {
        return cookingTime; // Return original if can't parse
      }
    }
  } else {
    return '';
  }
  
  // Format as "X minute(s)"
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
};

const ExploreScreen: React.FC<ExploreScreenProps> = ({ navigation }) => {
  const { state } = useRecipe();
  const { getTriedCount } = useTried();
  const { getStats } = useSocialStats();
  const likeContext = useLike();
  const favoriteContext = useFavorite();
  const triedContext = useTried();
  const { isLiked } = likeContext;
  const { isFavorite } = favoriteContext;
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'popular' | 'newest' | 'oldest' | 'title' | 'recommend'>('relevance');
  const [cloudPublicRecipes, setCloudPublicRecipes] = useState<Recipe[]>([]);
  
  const [filters, setFilters] = useState<FilterState>({
    cookingTime: null,
    cookware: null,
    selectedTags: [],
  });

  // 从云端获取所有public recipes
  useEffect(() => {
    const fetchPublicRecipes = async () => {
      try {
        const publicRecipes = await CloudRecipeService.fetchPublicRecipes();
        setCloudPublicRecipes(publicRecipes);
      } catch (error) {
        console.error('Failed to fetch public recipes from cloud:', error);
      }
    };

    fetchPublicRecipes();
  }, []);

  // 合并用户创建的公开菜谱、云端public recipes和示例菜谱
  // 统一来源：示例食谱只从硬编码的 sampleRecipes 数组获取，不从数据库获取
  // 去重：如果本地recipe和云端recipe有相同的ID，优先使用本地版本（可能更新）
  const allPublicRecipes = useMemo(() => {
    // 本地公开食谱（用户创建的）
    const localPublicRecipes = state.recipes.filter(recipe => recipe.isPublic);
    const localRecipeIds = new Set(localPublicRecipes.map(r => r.id));
    
    // 云端公开食谱（已过滤掉示例食谱，只包含用户创建的公开食谱）
    // 过滤掉与本地recipes重复的部分（优先使用本地版本）
    const uniqueCloudRecipes = cloudPublicRecipes.filter(
      cloudRecipe => !localRecipeIds.has(cloudRecipe.id)
    );
    
    // 创建所有已存在的recipe IDs集合（本地 + 云端）
    const allExistingIds = new Set([
      ...localRecipeIds,
      ...uniqueCloudRecipes.map(r => r.id)
    ]);
    
    // 示例食谱（只从硬编码的 sampleRecipes 数组获取）
    // 过滤掉与本地或云端recipes重复的部分（如果用户保存了示例食谱，不重复显示）
    const uniqueSampleRecipes = sampleRecipes.filter(
      sampleRecipe => !allExistingIds.has(sampleRecipe.id)
    );
    
    // 合并所有来源
    return [
      ...localPublicRecipes,
      ...uniqueCloudRecipes,
      ...uniqueSampleRecipes,
    ];
  }, [state.recipes, cloudPublicRecipes]);

  // Get user interactions for recommendation
  const likedRecipeIds = likeContext.state.likedRecipes;
  const favoriteRecipes = favoriteContext.state.favoriteRecipes;
  const triedRecipeIds = triedContext.state.triedRecipes;

  // Analyze user preferences (memoized for performance)
  const userPreference = useMemo(() => {
    return UserPreferenceService.analyzeUserPreferences(
      likedRecipeIds,
      favoriteRecipes,
      triedRecipeIds,
      allPublicRecipes
    );
  }, [likedRecipeIds, favoriteRecipes, triedRecipeIds, allPublicRecipes]);

  // Check if user has enough data for recommendation
  const hasEnoughDataForRecommendation = useMemo(() => {
    return UserPreferenceService.hasEnoughData(userPreference);
  }, [userPreference]);

  // 获取所有可用的筛选选项
  const availableOptions = useMemo(() => {
    const cookwareSet = new Set<string>();
    const tagsSet = new Set<string>();
    
    allPublicRecipes.forEach(recipe => {
      if (recipe.cookware) cookwareSet.add(recipe.cookware);
      recipe.tags?.forEach(tag => tagsSet.add(tag));
    });
    
    return {
      cookware: Array.from(cookwareSet).sort(),
      tags: Array.from(tagsSet).sort(),
    };
  }, [allPublicRecipes]);

  // 烹饪时间筛选函数
  const matchesCookingTime = (recipe: any): boolean => {
    if (!filters.cookingTime) return true;
    const timeStr = recipe.cookingTime || '';
    
    switch (filters.cookingTime) {
      case 'quick':
        return timeStr.includes('< 15') || timeStr.includes('15') || timeStr.includes('10');
      case 'medium':
        return timeStr.includes('20') || timeStr.includes('25') || timeStr.includes('30');
      case 'long':
        return timeStr.includes('35') || timeStr.includes('40') || timeStr.includes('45') || timeStr.includes('50') || timeStr.includes('60') || timeStr.includes('>');
      default:
        return true;
    }
  };

  // 应用所有筛选和排序
  const filteredRecipes = useMemo(() => {
    let filtered = allPublicRecipes.filter(recipe => {
      // 搜索筛选
      const matchesSearch = 
        !searchQuery ||
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;
      
      // 烹饪时间筛选
      if (!matchesCookingTime(recipe)) return false;
      
      // 厨具筛选
      if (filters.cookware && recipe.cookware !== filters.cookware) return false;
      
      // 标签筛选（至少匹配一个）
      if (filters.selectedTags.length > 0) {
        const hasMatchingTag = filters.selectedTags.some(selectedTag =>
          recipe.tags?.some((tag: string) => tag.toLowerCase() === selectedTag.toLowerCase())
        );
        if (!hasMatchingTag) return false;
      }
      
      return true;
    });

    // 应用排序
    let sorted = [...filtered];
    
    if (sortBy === 'recommend') {
      // Recommendation sorting
      if (hasEnoughDataForRecommendation) {
        // Use recommendation service to sort
        sorted = RecommendationService.sortByRecommendation(filtered, userPreference);
      } else {
        // Cold start: Fall back to popularity sorting
        sorted = sorted.sort((a, b) => {
          const aStats = getStats(a.id);
          const bStats = getStats(b.id);
          const aPopularity = aStats.likes + aStats.favorites + aStats.views + getTriedCount(a.id);
          const bPopularity = bStats.likes + bStats.favorites + bStats.views + getTriedCount(b.id);
          return bPopularity - aPopularity;
        });
      }
    } else {
      // Other sorting options
      sorted = sorted.sort((a, b) => {
        switch (sortBy) {
          case 'popular':
            const aStats = getStats(a.id);
            const bStats = getStats(b.id);
            const aPopularity = aStats.likes + aStats.favorites + aStats.views + getTriedCount(a.id);
            const bPopularity = bStats.likes + bStats.favorites + bStats.views + getTriedCount(b.id);
            return bPopularity - aPopularity;
          case 'newest':
            return (new Date(b.createdAt || b.updatedAt || 0).getTime()) - (new Date(a.createdAt || a.updatedAt || 0).getTime());
          case 'oldest':
            return (new Date(a.createdAt || a.updatedAt || 0).getTime()) - (new Date(b.createdAt || b.updatedAt || 0).getTime());
          case 'title':
            return a.title.localeCompare(b.title);
          case 'relevance':
          default:
            // 如果有搜索词，按相关性排序（标题匹配优先）
            if (searchQuery) {
              const aTitleMatch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
              const bTitleMatch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
              if (aTitleMatch && !bTitleMatch) return -1;
              if (!aTitleMatch && bTitleMatch) return 1;
            }
            return 0;
        }
      });
    }

    return sorted;
  }, [allPublicRecipes, searchQuery, filters, sortBy, getStats, getTriedCount, userPreference, hasEnoughDataForRecommendation]);

  // 清除所有筛选
  const clearFilters = () => {
    setFilters({
      cookingTime: null,
      cookware: null,
      selectedTags: [],
    });
  };

  // 检查是否有活动的筛选
  const hasActiveFilters = filters.cookingTime || filters.cookware || 
    filters.selectedTags.length > 0;

  // 切换标签选择
  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  };

  const renderRecipeCard = (recipe: any) => (
    <View key={recipe.id} style={styles.recipeCardWrapper}>
      {/* Android上的渐变阴影效果 - 在卡片外部 */}
      {Platform.OS === 'android' && (
        <View style={styles.cardShadowContainer}>
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer1]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer2]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer3]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer4]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer5]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer6]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer7]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer8]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer9]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer10]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer11]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer12]} />
        </View>
      )}
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
      >
      <View style={styles.recipeImageContainer}>
        <OptimizedImage
          source={recipe.image_url || recipe.imageUri || recipe.image}
          style={styles.recipeImage}
          contentFit="cover"
          showLoader={true}
          cachePolicy="memory-disk"
          priority="normal"
        />
        {/* Chef iQ Challenge Badge */}
        {recipe.tags && recipe.tags.includes('Chef iQ Challenge') && (
          <View style={styles.challengeBadge}>
            <Ionicons name="trophy" size={12} color="#d96709" />
            <Text style={styles.challengeBadgeText}>Chef iQ Challenge</Text>
          </View>
        )}
      </View>
      <View style={styles.recipeContent}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <View style={styles.recipeStats}>
            {recipe.cookingTime && (
              <View style={styles.recipeStat}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.recipeStatText}>{formatCookingTimeMinutes(recipe.cookingTime)}</Text>
              </View>
            )}
            {recipe.cookware && (
              <View style={styles.recipeStat}>
                <Ionicons name="restaurant-outline" size={14} color="#666" />
                <Text style={styles.recipeStatText}>{recipe.cookware}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.recipeTriedInfo}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#4CAF50" />
          <Text style={styles.recipeTriedText}>
            {getTriedCount(recipe.id)} people tried this
          </Text>
        </View>
        
        {/* Social Stats */}
          <View style={styles.recipeSocialStats}>
          <View style={styles.socialStatItem}>
            <Ionicons name="heart" size={12} color="#FF6B35" />
              <Text style={styles.socialStatText}>{isLiked(recipe.id) ? Math.max(2, getStats(recipe.id).likes) : getStats(recipe.id).likes}</Text>
          </View>
          <View style={styles.socialStatItem}>
            <Ionicons name="bookmark" size={12} color="#FF6B35" />
              <Text style={styles.socialStatText}>{isFavorite(recipe.id) ? Math.max(2, getStats(recipe.id).favorites) : getStats(recipe.id).favorites}</Text>
          </View>
          <View style={styles.socialStatItem}>
            <Ionicons name="eye" size={12} color="#FF6B35" />
            <Text style={styles.socialStatText}>{getStats(recipe.id).views}</Text>
          </View>
        </View>
        
      </View>
      </TouchableOpacity>
    </View>
  );

  // Render Chef iQ Challenge card - same style as recipe cards
  const renderChallengeCard = () => (
    <View key="chef-iq-challenge" style={styles.recipeCardWrapper}>
      {/* Android上的渐变阴影效果 - 在卡片外部 */}
      {Platform.OS === 'android' && (
        <View style={styles.cardShadowContainer}>
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer1]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer2]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer3]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer4]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer5]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer6]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer7]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer8]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer9]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer10]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer11]} />
          <View style={[styles.cardShadowLayer, styles.cardShadowLayer12]} />
        </View>
      )}
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => navigation.navigate('ChefIQChallenge')}
        activeOpacity={0.9}
      >
        <View style={styles.challengeImageContainer}>
          <OptimizedImage
            source={require('../../assets/ChefiQChallenge.png')}
            style={styles.challengeImage}
            contentFit="cover"
            showLoader={true}
            cachePolicy="memory-disk"
            priority="normal"
          />
        </View>
        <View style={styles.recipeContent}>
          <View style={styles.recipeHeader}>
            <Text style={styles.recipeTitle}>Chef iQ Challenge</Text>
            <View style={styles.recipeStats}>
              <View style={styles.recipeStat}>
                <Ionicons name="restaurant-outline" size={14} color="#666" />
                <Text style={styles.recipeStatText}>Chef iQ Mini Oven</Text>
              </View>
            </View>
          </View>
          <View style={styles.challengeDescription}>
            <Text style={styles.challengeDescriptionText}>
              Join the cooking competition and share your best recipes!
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const DEFAULT_HEADER_HEIGHT = (Platform.OS === 'ios' ? 8 : (StatusBar.currentHeight || 24)) + 6 + 8 + 40 + 32;
  const [headerHeight, setHeaderHeight] = useState(0);
  const [filtersPanelHeight, setFiltersPanelHeight] = useState(0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View
        style={styles.fixedHeaderContainer}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore Recipes</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchInput}>
              <Ionicons name="search" size={18} color="#666" />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Search recipes..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity
              style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons 
                name="filter" 
                size={18} 
                color={hasActiveFilters ? "#fff" : "#d96709"} 
              />
              {hasActiveFilters && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {[filters.cookingTime, filters.cookware].filter(Boolean).length + filters.selectedTags.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton, 
                (sortBy !== 'relevance') && styles.sortButtonActive
              ]}
              onPress={() => setShowSortOptions(true)}
            >
              <Ionicons 
                name={sortBy === 'recommend' ? 'heart' : 'swap-vertical'} 
                size={18} 
                color={(sortBy !== 'relevance') ? "#fff" : "#d96709"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Panel - Fixed at top */}
        {showFilters && (
          <View 
            style={styles.filtersPanel}
            onLayout={(event) => setFiltersPanelHeight(event.nativeEvent.layout.height)}
          >
            <ScrollView style={styles.filtersScroll} showsVerticalScrollIndicator={false}>
              {/* 烹饪时间筛选 */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Cooking Time</Text>
                <View style={styles.filterOptions}>
                  {['quick', 'medium', 'long'].map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.filterOption,
                        filters.cookingTime === time && styles.filterOptionActive,
                      ]}
                      onPress={() => setFilters(prev => ({
                        ...prev,
                        cookingTime: prev.cookingTime === time ? null : time,
                      }))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.cookingTime === time && styles.filterOptionTextActive,
                      ]}>
                        {time === 'quick' ? '< 30 min' : time === 'medium' ? '30-60 min' : '> 60 min'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 厨具筛选 */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Cookware</Text>
                <View style={styles.filterOptions}>
                  {COOKWARE_OPTIONS.map((ware) => (
                    <TouchableOpacity
                      key={ware}
                      style={[
                        styles.filterOption,
                        filters.cookware === ware && styles.filterOptionActive,
                      ]}
                      onPress={() => setFilters(prev => ({
                        ...prev,
                        cookware: prev.cookware === ware ? null : ware,
                      }))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.cookware === ware && styles.filterOptionTextActive,
                      ]}>
                        {ware}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>


              {/* 标签筛选 */}
              {availableOptions.tags.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Tags</Text>
                  <View style={styles.filterOptions}>
                    {availableOptions.tags.slice(0, 10).map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.filterOption,
                          filters.selectedTags.includes(tag) && styles.filterOptionActive,
                        ]}
                        onPress={() => toggleTag(tag)}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          filters.selectedTags.includes(tag) && styles.filterOptionTextActive,
                        ]}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* 清除筛选按钮 */}
              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={clearFilters}
                >
                  <Ionicons name="close-circle" size={20} color="#d96709" />
                  <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: (headerHeight || DEFAULT_HEADER_HEIGHT) + (showFilters ? filtersPanelHeight : 0) + 8 },
        ]}
      >

      {/* 排序选项 Modal */}
      <Modal
        visible={showSortOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortOptions(false)}
        >
          <View style={styles.sortModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortOptions(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.sortOptions}>
              {[
                { value: 'relevance', label: 'Relevance', icon: 'search' },
                { value: 'recommend', label: 'Recommended', icon: 'heart' },
                { value: 'popular', label: 'Most Popular', icon: 'flame' },
                { value: 'newest', label: 'Newest First', icon: 'time' },
                { value: 'oldest', label: 'Oldest First', icon: 'hourglass' },
                { value: 'title', label: 'Title (A-Z)', icon: 'text' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    sortBy === option.value && styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    setSortBy(option.value as any);
                    setShowSortOptions(false);
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={sortBy === option.value ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.value && styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No recipes found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your filters or search</Text>
          </View>
        ) : (
          <>
            {sortBy === 'recommend' && (
              <>
                {hasEnoughDataForRecommendation ? (
                  <View style={styles.recommendationHeader}>
                    <Ionicons name="heart" size={20} color="#d96709" />
                    <Text style={styles.recommendationHeaderText}>
                      Personalized recommendations based on your preferences
                    </Text>
                  </View>
                ) : (
                  <View style={styles.recommendationHint}>
                    <Ionicons name="information-circle" size={16} color="#d96709" />
                    <Text style={styles.recommendationHintText}>
                      Like or favorite recipes to get personalized recommendations. Showing popular recipes for now.
                    </Text>
                  </View>
                )}
              </>
            )}
            <View style={styles.recipesGrid}>
              {/* Left column: even indices (0, 2, 4, 6, 8, 10, 12, 14...) */}
              <View style={styles.recipeColumn}>
                {filteredRecipes.map((recipe, index) => {
                  // Left column: even indices (0, 2, 4, 6, 8, 10, 12, 14...)
                  if (index % 2 === 0) {
                    // Left column positions: 1st (index 0), 2nd (index 2), 3rd (index 4), 4th (index 6),
                    // 5th (index 8), 6th (index 10), 7th (index 12), 8th (index 14)...
                    // Challenge card should be at 8th position (after index 14) if left column has 8+ items
                    if (index === 14) {
                      // Check if there are at least 8 items in left column (indices 0, 2, 4, 6, 8, 10, 12, 14)
                      // This means filteredRecipes.length >= 15 (indices 0-14)
                      return (
                        <React.Fragment key={`left-${index}`}>
                          {renderRecipeCard(recipe)}
                          {filteredRecipes.length >= 15 && renderChallengeCard()}
                        </React.Fragment>
                      );
                    }
                    return renderRecipeCard(recipe);
                  }
                  return null;
                })}
                {/* If there are no recipes, show challenge card first */}
                {filteredRecipes.length === 0 && renderChallengeCard()}
              </View>
              {/* Right column: odd indices (1, 3, 5, 7, 9, 11, 13, 15...) */}
              <View style={styles.recipeColumn}>
                {filteredRecipes.map((recipe, index) => {
                  // Right column: odd indices (1, 3, 5, 7, 9, 11, 13, 15...)
                  if (index % 2 === 1) {
                    // Right column positions: 1st (index 1), 2nd (index 3), 3rd (index 5)...
                    // Challenge card should always be at 2nd position (before index 3)
                    if (index === 3) {
                      // Always show challenge card before index 3 (right column 2nd position)
                      return (
                        <React.Fragment key={`right-${index}`}>
                          {renderChallengeCard()}
                          {renderRecipeCard(recipe)}
                        </React.Fragment>
                      );
                    }
                    return renderRecipeCard(recipe);
                  }
                  return null;
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  fixedHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 8 : (StatusBar.currentHeight || 24),
    paddingHorizontal: 20,
    paddingBottom: 6,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: getFontWeight('bold') as any,
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchTextInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d96709',
    borderRadius: 10,
    position: 'relative',
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#d96709',
    borderColor: '#d96709',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#d96709',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d96709',
  },
  sortButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d96709',
    borderRadius: 10,
  },
  sortButtonActive: {
    backgroundColor: '#d96709',
    borderColor: '#d96709',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sortModalTitle: {
    fontSize: 20,
    fontWeight: getFontWeight('bold') as any,
    color: '#333',
  },
  sortOptions: {
    // gap handled by marginBottom in sortOption
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: '#d96709',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  sortOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filtersPanel: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 300, // Limit max height for scrollable content
  },
  filtersScroll: {
    // 移除 maxHeight，完全展开
  },
  filterSection: {
    padding: 12, // 从 16 减小到 12，使布局更紧凑
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterSectionTitle: {
    fontSize: 15, // 从 16 减小到 15，调小一号
    fontWeight: getFontWeight('600') as any,
    color: '#333',
    marginBottom: 8, // 从 12 减小到 8，使布局更紧凑
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 12, // 从 16 减小到 12，使布局更紧凑
    paddingVertical: 6, // 从 8 减小到 6，使布局更紧凑
    borderRadius: 16, // 从 20 减小到 16，使布局更紧凑
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 6, // 从 8 减小到 6，使布局更紧凑
    marginBottom: 6, // 从 8 减小到 6，使布局更紧凑
  },
  filterOptionActive: {
    backgroundColor: '#d96709',
    borderColor: '#d96709',
  },
  filterOptionText: {
    fontSize: 11, // 从 11.5 减小到 11，调小一号
    color: '#666',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12, // 从 16 减小到 12，使布局更紧凑
    marginTop: 6, // 从 8 减小到 6，使布局更紧凑
    marginBottom: 12, // 从 16 减小到 12，使布局更紧凑
  },
  clearFiltersText: {
    fontSize: 15, // 从 16 减小到 15，调小一号
    fontWeight: getFontWeight('600') as any,
    color: '#d96709',
    marginLeft: 6, // 从 8 减小到 6，使布局更紧凑
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: getFontWeight('600') as any,
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // 为底部标签栏留出空间
  },
  recipesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recipeColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  recipeCardWrapper: {
    width: '100%',
    marginBottom: 16,
    position: 'relative',
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#A0A0A0',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
    } : {
      elevation: 10,
    }),
  },
  recipeCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    // No fixed height - height will be determined by content
  },
  // Android渐变阴影效果 - 使用多层同心矩形模拟向外扩散的阴影
  cardShadowContainer: {
    position: 'absolute',
    top: -3.5,
    left: -3.5,
    right: -3.5,
    bottom: -3.5,
    borderRadius: 15.5,
    zIndex: -1,
    pointerEvents: 'none',
  },
  cardShadowLayer: {
    position: 'absolute',
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
  },
  cardShadowLayer1: {
    top: -0.3,
    left: -0.3,
    right: -0.3,
    bottom: -0.3,
    borderRadius: 16.3,
    opacity: 0.07,
  },
  cardShadowLayer2: {
    top: -0.6,
    left: -0.6,
    right: -0.6,
    bottom: -0.6,
    borderRadius: 16.6,
    opacity: 0.06125,
  },
  cardShadowLayer3: {
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    opacity: 0.0525,
  },
  cardShadowLayer4: {
    top: -1.5,
    left: -1.5,
    right: -1.5,
    bottom: -1.5,
    borderRadius: 17.5,
    opacity: 0.04375,
  },
  cardShadowLayer5: {
    top: -1.8,
    left: -1.8,
    right: -1.8,
    bottom: -1.8,
    borderRadius: 17.8,
    opacity: 0.035,
  },
  cardShadowLayer6: {
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    opacity: 0.030625,
  },
  cardShadowLayer7: {
    top: -2.3,
    left: -2.3,
    right: -2.3,
    bottom: -2.3,
    borderRadius: 18.3,
    opacity: 0.02625,
  },
  cardShadowLayer8: {
    top: -2.6,
    left: -2.6,
    right: -2.6,
    bottom: -2.6,
    borderRadius: 18.6,
    opacity: 0.021875,
  },
  cardShadowLayer9: {
    top: -2.8,
    left: -2.8,
    right: -2.8,
    bottom: -2.8,
    borderRadius: 18.8,
    opacity: 0.0175,
  },
  cardShadowLayer10: {
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 19,
    opacity: 0.013125,
  },
  cardShadowLayer11: {
    top: -3.2,
    left: -3.2,
    right: -3.2,
    bottom: -3.2,
    borderRadius: 19.2,
    opacity: 0.00875,
  },
  cardShadowLayer12: {
    top: -3.5,
    left: -3.5,
    right: -3.5,
    bottom: -3.5,
    borderRadius: 19.5,
    opacity: 0.004375,
  },
  recipeImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  recipeImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  challengeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  challengeBadgeText: {
    fontSize: 10,
    color: '#d96709',
    fontWeight: '600',
    marginLeft: 4,
  },
  recipeContent: {
    padding: 12,
  },
  recipeHeader: {
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 15.5,
    fontWeight: getFontWeight('600') as any,
    color: '#333',
    marginBottom: 4,
  },
  recipeStats: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  recipeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recipeStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  challengeImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  challengeImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  challengeDescription: {
    marginTop: 8,
  },
  challengeDescriptionText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  recipeTriedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  recipeTriedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  recipeTag: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  recipeTagText: {
    fontSize: 10,
    color: '#FF6B35',
    fontWeight: '500',
  },
  // Social Stats
  recipeSocialStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  socialStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  socialStatText: {
    fontSize: 11,
    fontWeight: getFontWeight('600') as any,
    color: '#333',
    marginLeft: 3,
  },
  recommendationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginHorizontal: 16,
  },
  recommendationHintText: {
    fontSize: 12,
    color: '#d96709',
    marginLeft: 8,
    flex: 1,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  recommendationHeaderText: {
    fontSize: 14,
    color: '#d96709',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default ExploreScreen;
