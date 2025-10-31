import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe } from '../contexts/RecipeContext';
import { useTried } from '../contexts/TriedContext';
import { useSocialStats } from '../contexts/SocialStatsContext';
import { useLike } from '../contexts/LikeContext';
import { useFavorite } from '../contexts/FavoriteContext';
import { sampleRecipes } from '../data/sampleRecipes';

interface ExploreScreenProps {
  navigation: any;
}

const ExploreScreen: React.FC<ExploreScreenProps> = ({ navigation }) => {
  const { state } = useRecipe();
  const { getTriedCount } = useTried();
  const { getStats } = useSocialStats();
  const { isLiked } = useLike();
  const { isFavorite } = useFavorite();
  const [searchQuery, setSearchQuery] = useState('');

  // 合并用户创建的公开菜谱和示例菜谱
  const allPublicRecipes = [
    ...state.recipes.filter(recipe => recipe.isPublic),
    ...sampleRecipes,
  ];

  const filteredRecipes = allPublicRecipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderRecipeCard = (recipe: any) => (
    <TouchableOpacity
      key={recipe.id}
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
    >
      {(recipe.image_url || recipe.imageUri || recipe.image) && (
        <Image 
          source={
            (() => {
              const src = (recipe.image_url || recipe.imageUri || recipe.image);
              return typeof src === 'string' ? { uri: src } : src;
            })()
          }
          style={styles.recipeImage} 
        />
      )}
      <View style={styles.recipeContent}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <View style={styles.recipeStats}>
            <View style={styles.recipeStat}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.recipeStatText}>{recipe.cookingTime}</Text>
            </View>
            {recipe.cookware && (
              <View style={styles.recipeStat}>
                <Ionicons name="restaurant-outline" size={14} color="#666" />
                <Text style={styles.recipeStatText}>{recipe.cookware}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.recipeDescription} numberOfLines={2}>
          {recipe.description}
        </Text>
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
        
        <View style={styles.recipeTags}>
          {recipe.tags.slice(0, 3).map((tag: string, index: number) => (
            <View key={index} style={styles.recipeTag}>
              <Text style={styles.recipeTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Recipes</Text>
        <Text style={styles.headerSubtitle}>Discover amazing recipes from our community</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search recipes, ingredients, or tags..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.recipesGrid}>
          {filteredRecipes.map(renderRecipeCard)}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 100, // 增加底部流白空间
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24),
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchTextInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  scrollContent: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 24) + 26, // 为header留出空间
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recipeCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  recipeContent: {
    padding: 12,
  },
  recipeHeader: {
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  recipeStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
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
    fontSize: 12,
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
    fontWeight: '600',
    color: '#333',
    marginLeft: 3,
  },
});

export default ExploreScreen;
