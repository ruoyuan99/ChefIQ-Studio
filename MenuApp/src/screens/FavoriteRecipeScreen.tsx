import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getFontWeight } from '../styles/theme';
import { useLike } from '../contexts/LikeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorite } from '../contexts/FavoriteContext';
import { useTried } from '../contexts/TriedContext';
import { useSocialStats } from '../contexts/SocialStatsContext';
import OptimizedImage from '../components/OptimizedImage';

interface FavoriteRecipeScreenProps {
  navigation: any;
}

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

const FavoriteRecipeScreen: React.FC<FavoriteRecipeScreenProps> = ({ navigation }) => {
  const { state } = useFavorite();
  const { getTriedCount } = useTried();
  const { getStats } = useSocialStats();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const hasCheckedRef = useRef<boolean>(false);

  // 检查并显示弹窗（基于登录会话）- 每次登录时显示一次
  useEffect(() => {
    const checkAndShowModal = async () => {
      // 如果没有用户，不显示弹窗
      if (!user || !user.id) {
        hasCheckedRef.current = false;
        setShowCreateModal(false);
        return;
      }

      // 如果已经检查过，不再重复检查（避免重复触发）
      if (hasCheckedRef.current) {
        return;
      }

      try {
        // 获取或创建当前登录会话键
        const loginSessionKey = `loginSession_${user.id}`;
        let sessionId = await AsyncStorage.getItem(loginSessionKey);

        // 如果不存在会话ID，说明是新登录，创建新的会话ID
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await AsyncStorage.setItem(loginSessionKey, sessionId);
          console.log('🆕 New login session detected:', sessionId);
        }

        // 检查当前会话是否已经显示过弹窗
        const modalShownKey = `modalShown_${sessionId}`;
        const modalShown = await AsyncStorage.getItem(modalShownKey);

        // 如果当前会话还没有显示过弹窗，显示弹窗
        if (!modalShown) {
          console.log('🆕 First time in this login session, showing create recipe modal');
          setShowCreateModal(true);
          // 标记当前会话已显示过弹窗
          await AsyncStorage.setItem(modalShownKey, 'true');
        } else {
          console.log('✅ Modal already shown in this session, not showing again');
          setShowCreateModal(false);
        }
        
        hasCheckedRef.current = true;
      } catch (error) {
        console.error('Error checking login session status:', error);
        // 如果出错，默认不显示弹窗（避免重复）
        setShowCreateModal(false);
        hasCheckedRef.current = true;
      }
    };

    // 当用户ID变化时，重置检查状态
    hasCheckedRef.current = false;
    checkAndShowModal();
  }, [user?.id]);
  
  // 使用FavoriteContext中的recipes（已包含示例recipes）
  const allFavoriteRecipes = state.favoriteRecipes;
  const { isLiked } = useLike();
  const { isTried } = useTried();

  const renderFavoriteCard = (recipe: any) => (
    <View key={recipe.id} style={styles.favoriteCardWrapper}>
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
        style={styles.favoriteCard}
        onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
        activeOpacity={0.9}
      >
        <OptimizedImage
          source={recipe.image_url || recipe.imageUri || recipe.image}
          style={styles.favoriteImage}
          contentFit="cover"
          showLoader={true}
          cachePolicy="memory-disk"
          priority="normal"
        />
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
                <Text style={styles.favoriteStatText}>{formatCookingTimeMinutes(recipe.cookingTime)}</Text>
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
    </View>
  );

  const handleCreateRecipe = async () => {
    setShowCreateModal(false);
    navigation.navigate('RecipeName');
  };

  const handleCloseModal = async () => {
    setShowCreateModal(false);
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
        {/* Generate Recipe from Ingredients Card - Same style as favorite recipe cards with orange glow */}
        <View style={styles.generateRecipeCardWrapper}>
          {/* Orange glow effect layers */}
          <View style={styles.orangeGlowContainer}>
            <View style={[styles.orangeGlowLayer, styles.orangeGlowLayer1]} />
            <View style={[styles.orangeGlowLayer, styles.orangeGlowLayer2]} />
            <View style={[styles.orangeGlowLayer, styles.orangeGlowLayer3]} />
            <View style={[styles.orangeGlowLayer, styles.orangeGlowLayer4]} />
            <View style={[styles.orangeGlowLayer, styles.orangeGlowLayer5]} />
          </View>
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
          <TouchableOpacity 
            style={styles.generateRecipeCard}
            onPress={() => navigation.navigate('GenerateRecipe')}
            activeOpacity={0.9}
          >
            <OptimizedImage
              source={require('../../assets/GenerateFromIngredients2.png')}
              style={styles.generateRecipeImage}
              contentFit="cover"
              showLoader={true}
              cachePolicy="memory-disk"
              priority="normal"
            />
            <View style={styles.generateRecipeContentContainer}>
              <View style={styles.generateRecipeInfo}>
                <Text style={styles.generateRecipeTitle}>Generate from Ingredients</Text>
                <Text style={styles.generateRecipeDescription}>Not sure what to cook? Let AI turn your fridge into recipes.</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

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
    backgroundColor: 'white',
    paddingBottom: Platform.OS === 'ios' ? 100 : 0, // iOS需要安全区域，Android不需要额外padding
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0, // Android添加状态栏高度
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
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Android上完全移除空白，iOS保留小间距
  },
  // Generate Recipe Card Styles - Same as favorite recipe cards with orange gradient glow
  generateRecipeCardWrapper: {
    marginBottom: 20,
    position: 'relative',
  },
  // Light gold gradient glow effect
  orangeGlowContainer: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
    zIndex: -2,
    pointerEvents: 'none',
  },
  orangeGlowLayer: {
    position: 'absolute',
    backgroundColor: '#FFD89B', // Light gold color
    borderRadius: 16,
  },
  orangeGlowLayer1: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  orangeGlowLayer2: {
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    opacity: 0.15,
  },
  orangeGlowLayer3: {
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    opacity: 0.12,
  },
  orangeGlowLayer4: {
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 19,
    opacity: 0.08,
  },
  orangeGlowLayer5: {
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    opacity: 0.05,
  },
  generateRecipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#FFD89B', // Light gold shadow
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    } : {
      elevation: 8,
    }),
  },
  generateRecipeImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  generateRecipeContentContainer: {
    padding: 20,
  },
  generateRecipeInfo: {
    flex: 1,
  },
  generateRecipeTitle: {
    fontSize: 18,
    fontWeight: getFontWeight('600') as any,
    color: '#333',
    marginBottom: 6,
  },
  generateRecipeDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
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
  favoriteCardWrapper: {
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
  favoriteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
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
    fontWeight: getFontWeight('600') as any,
    color: '#333',
    marginBottom: 6,
  },
  favoriteDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'justify',
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
