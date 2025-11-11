import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useLike } from '../contexts/LikeContext';
 
import { useFavorite } from '../contexts/FavoriteContext';
import { useTried } from '../contexts/TriedContext';
import { useSocialStats } from '../contexts/SocialStatsContext';

interface FavoriteRecipeScreenProps {
  navigation: any;
}

const FavoriteRecipeScreen: React.FC<FavoriteRecipeScreenProps> = ({ navigation }) => {
  const { state } = useFavorite();
  const { getTriedCount } = useTried();
  const { getStats } = useSocialStats();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 检查用户是否已经看过弹窗
  useEffect(() => {
    const checkModalStatus = async () => {
      try {
        const hasSeenModal = await AsyncStorage.getItem('hasSeenCreateRecipeModal');
        if (!hasSeenModal) {
          setShowCreateModal(true);
        }
      } catch (error) {
        console.error('Error checking modal status:', error);
        // 如果出错，默认显示弹窗
        setShowCreateModal(true);
      }
    };
    
    checkModalStatus();
  }, []);
  
  // 使用FavoriteContext中的recipes（已包含示例recipes）
  const allFavoriteRecipes = state.favoriteRecipes;
  const { isLiked } = useLike();
  const { isTried } = useTried();

  const renderFavoriteCard = (recipe: any) => (
    <TouchableOpacity
      key={recipe.id}
      style={styles.favoriteCard}
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
          style={styles.favoriteImage} 
        />
      )}
      <View style={styles.favoriteContent}>
        <View style={styles.favoriteInfo}>
          <Text style={styles.favoriteTitle}>{recipe.title}</Text>
          <Text style={styles.favoriteDescription}>{recipe.description}</Text>
          <View style={styles.favoriteTags}>
            {recipe.tags.slice(0, 3).map((tag: string, index: number) => (
              <View key={index} style={styles.favoriteTag}>
                <Text style={styles.favoriteTagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.favoriteStats}>
            <View style={styles.favoriteStat}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.favoriteStatText}>{recipe.cookingTime}</Text>
            </View>
            {recipe.cookware && (
              <View style={styles.favoriteStat}>
                <Ionicons name="restaurant-outline" size={14} color="#666" />
                <Text style={styles.favoriteStatText}>{recipe.cookware}</Text>
              </View>
            )}
          </View>
          
          {/* Social Stats */}
          <View style={styles.favoriteSocialStats}>
            <View style={styles.socialStatItem}>
              <Ionicons name="heart" size={12} color="#FF6B35" />
              <Text style={styles.socialStatText}>{isLiked(recipe.id) ? Math.max(2, getStats(recipe.id).likes) : getStats(recipe.id).likes}</Text>
            </View>
            <View style={styles.socialStatItem}>
              <Ionicons name="bookmark" size={12} color="#FF6B35" />
              <Text style={styles.socialStatText}>{Math.max(2, getStats(recipe.id).favorites)}</Text>
            </View>
            <View style={styles.socialStatItem}>
              <Ionicons name="eye" size={12} color="#FF6B35" />
              <Text style={styles.socialStatText}>{getStats(recipe.id).views}</Text>
            </View>
            <View style={styles.socialStatItem}>
              <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
              <Text style={styles.socialStatText}>{isTried(recipe.id) ? Math.max(2, getStats(recipe.id).tried) : getStats(recipe.id).tried}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleCreateRecipe = async () => {
    setShowCreateModal(false);
    try {
      // 保存用户已经看过弹窗的状态
      await AsyncStorage.setItem('hasSeenCreateRecipeModal', 'true');
    } catch (error) {
      console.error('Error saving modal status:', error);
    }
    navigation.navigate('RecipeName');
  };

  const handleCloseModal = async () => {
    setShowCreateModal(false);
    try {
      // 保存用户已经看过弹窗的状态
      await AsyncStorage.setItem('hasSeenCreateRecipeModal', 'true');
    } catch (error) {
      console.error('Error saving modal status:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="restaurant" size={32} color="#FF6B35" />
              </View>
              <Text style={styles.modalTitle}>Create Your Own Recipe!</Text>
              <Text style={styles.modalSubtitle}>
                Share your culinary creations with the community. Your unique recipes could inspire others!
              </Text>
            </View>
            
            <View style={styles.modalFeatures}>
              <View style={styles.featureItem}>
                <Ionicons name="camera" size={20} color="#FF6B35" />
                <Text style={styles.featureText}>Add beautiful photos</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="list" size={20} color="#FF6B35" />
                <Text style={styles.featureText}>Detailed ingredients & steps</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="people" size={20} color="#FF6B35" />
                <Text style={styles.featureText}>Share with community</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary} 
                onPress={handleCloseModal}
              >
                <Text style={styles.modalButtonSecondaryText}>Maybe Later</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary} 
                onPress={handleCreateRecipe}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.modalButtonPrimaryText}>Create Recipe</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Generate Recipe from Ingredients Card */}
        <TouchableOpacity 
          style={styles.generateRecipeCard}
          onPress={() => navigation.navigate('GenerateRecipe')}
        >
          <View style={styles.generateRecipeHeader}>
            <View style={styles.generateRecipeIconContainer}>
              <Ionicons name="sparkles" size={28} color="#d96709" />
            </View>
            <View style={styles.generateRecipeContent}>
              <Text style={styles.generateRecipeTitle}>Generate Recipe from Ingredients</Text>
              <Text style={styles.generateRecipeSubtitle}>Not sure what to cook? Let AI turn your fridge into recipes.</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#d96709" />
          </View>
        </TouchableOpacity>

        <View style={styles.recipesSection}>
          <Text style={styles.sectionSubtitle}>
            {allFavoriteRecipes.length} favorite recipes
          </Text>
          
          {allFavoriteRecipes.length > 0 ? (
            allFavoriteRecipes.map(renderFavoriteCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No favorite recipes yet</Text>
              <Text style={styles.emptySubtext}>Add recipes to your favorites to see them here</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 100, // 增加底部流白空间
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
  },
  // Generate Recipe Card Styles
  generateRecipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  generateRecipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  generateRecipeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  generateRecipeContent: {
    flex: 1,
  },
  generateRecipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  generateRecipeSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  recipesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  favoriteCard: {
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
  favoriteImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  favoriteContent: {
    padding: 20,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  favoriteDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  favoriteTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  favoriteTag: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  favoriteTagText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  favoriteStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  favoriteStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  favoriteStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalFeatures: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  // Social Stats
  favoriteSocialStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
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

export default FavoriteRecipeScreen;
