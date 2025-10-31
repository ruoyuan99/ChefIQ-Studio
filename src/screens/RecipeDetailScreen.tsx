import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Image,
  StatusBar,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe } from '../contexts/RecipeContext';
import { useFavorite } from '../contexts/FavoriteContext';
import { useGroceries } from '../contexts/GroceriesContext';
import { useLike } from '../contexts/LikeContext';
import { useTried } from '../contexts/TriedContext';
import { usePoints } from '../contexts/PointsContext';
import { useSocialStats } from '../contexts/SocialStatsContext';
import { useComment } from '../contexts/CommentContext';
import { useAuth } from '../contexts/AuthContext';
import { sampleRecipes } from '../data/sampleRecipes';
import { MenuItem, Ingredient, Instruction } from '../types';

interface RecipeDetailScreenProps {
  navigation: any;
  route: any;
}

const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { getRecipeById, updateRecipe, state } = useRecipe();
  const { toggleFavorite, isFavorite } = useFavorite();
  const { addItemsToGroceries } = useGroceries();
  const { toggleLike, isLiked } = useLike();
  const { toggleTried, isTried, getTriedCount } = useTried();
  const { addPoints } = usePoints();
  const { getStats, fetchStats, incrementViews, adjustLikes, adjustFavorites, adjustTried } = useSocialStats();

  // Derived display helpers for social numbers with sensible minimums
  const getDisplayLikes = (id: string) => {
    const n = getStats(id).likes;
    return isLiked(id) ? Math.max(2, n) : n;
  };
  const getDisplayFavorites = (id: string) => {
    const n = getStats(id).favorites;
    return isFavorite(id) ? Math.max(2, n) : n;
  };
  const getDisplayTried = (id: string) => {
    const n = getStats(id).tried;
    return isTried(id) ? Math.max(2, n) : n;
  };
  const { getComments, addComment, toggleCommentLike } = useComment();
  
  // 添加份数调整状态
  const [currentServings, setCurrentServings] = useState(4);
  
  // 留言相关状态
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { user: authUser } = useAuth();
  
  // 根据ID判断数据来源
  const recipeId = route.params.recipeId;
  let recipe: any;
  let isUserCreated: boolean;
  
  // 初始化份数
  useEffect(() => {
    if (recipe) {
      const servings = parseInt(recipe.servings) || 4;
      setCurrentServings(servings);
    }
  }, [recipe]);
  
  // 判断是否为示例recipe（ID以'sample_'开头）
  if (recipeId.startsWith('sample_')) {
    // 示例recipe
    recipe = sampleRecipes.find(r => r.id === recipeId);
    isUserCreated = false;
  } else {
    // 用户创建的recipe，从context获取
    recipe = getRecipeById(recipeId);
    isUserCreated = true;
  }

  // 调试信息
  console.log('RecipeDetailScreen - Route params:', route.params);
  console.log('RecipeDetailScreen - Recipe ID:', recipeId);
  console.log('RecipeDetailScreen - Is sample recipe:', recipeId.startsWith('sample_'));
  console.log('RecipeDetailScreen - Is user created:', isUserCreated);
  console.log('RecipeDetailScreen - All recipes in context:', state.recipes.length);
  console.log('RecipeDetailScreen - Recipe IDs in context:', state.recipes.map((r: any) => r.id));
  console.log('RecipeDetailScreen - Found recipe:', !!recipe);
  console.log('RecipeDetailScreen - Recipe data:', {
    id: recipe?.id,
    title: recipe?.title,
    description: recipe?.description,
    ingredients: recipe?.ingredients?.length || 0,
    instructions: recipe?.instructions?.length || 0,
    cookingTime: recipe?.cookingTime,
    servings: recipe?.servings,
    tags: recipe?.tags?.length || 0,
    imageUri: recipe?.imageUri ? 'Has image' : 'No image'
  });

  // Custom in-app share button (non-native header)

  if (!recipe) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Recipe not found</Text>
        </View>
      </View>
    );
  }

  // Load social stats from Supabase and bump views once when opening
  useEffect(() => {
    if (recipeId && !recipeId.startsWith('sample_')) {
      fetchStats(recipeId);
      incrementViews(recipeId);
    }
  }, [recipeId]);


  const handleShare = async () => {
    try {
      const shareContent = {
        title: recipe.title,
        message: `${recipe.title}\n\n${recipe.description}`,
      };
      await Share.share(shareContent);
      
      // 添加分享积分
      addPoints('share_recipe', `Shared ${recipe.title}`, recipe.id);
    } catch (error) {
      Alert.alert('Share Failed', 'Unable to share recipe');
    }
  };

  const handleLike = () => {
    const wasLiked = isLiked(recipe.id);
    toggleLike(recipe.id);
    
    if (!wasLiked) {
      addPoints('like_recipe', `Liked ${recipe.title}`, recipe.id);
    }
    // update social stats
    adjustLikes(recipe.id, wasLiked ? -1 : 1);
    
    Alert.alert(
      wasLiked ? 'Unliked' : 'Liked',
      wasLiked 
        ? `You unliked ${recipe.title}.`
        : `You liked ${recipe.title}.`
    );
  };

  const handleFavorite = () => {
    const wasFavorite = isFavorite(recipe.id);
    toggleFavorite(recipe);
    
    if (!wasFavorite) {
      addPoints('favorite_recipe', `Favorited ${recipe.title}`, recipe.id);
    }
    // update social stats
    adjustFavorites(recipe.id, wasFavorite ? -1 : 1);
    
    Alert.alert(
      wasFavorite ? 'Removed from Favorites' : 'Added to Favorites',
      wasFavorite 
        ? `${recipe.title} has been removed from your favorites.`
        : `${recipe.title} has been added to your favorites.`
    );
  };

  const handleTried = () => {
    const wasTried = isTried(recipe.id);
    toggleTried(recipe.id);
    // update social stats
    adjustTried(recipe.id, wasTried ? -1 : 1);
    
    if (!wasTried) {
      addPoints('try_recipe', `Tried ${recipe.title}`, recipe.id);
    }
    
    Alert.alert(
      wasTried ? 'Removed from Tried' : 'Added to Tried',
      wasTried 
        ? `You removed ${recipe.title} from your tried recipes.`
        : `You marked ${recipe.title} as tried! Great job!`
    );
  };

  const handleAddToGroceries = () => {
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      const ingredientsForGroceries = recipe.ingredients.map((ingredient: Ingredient) => ({
        name: ingredient.name,
        amount: ingredient.amount.toString(),
        unit: ingredient.unit,
      }));
      addItemsToGroceries(recipe.id, recipe.title, ingredientsForGroceries);
      Alert.alert(
        'Added to Groceries',
        `Ingredients from "${recipe.title}" have been added to your groceries list.`
      );
    } else {
      Alert.alert('No Ingredients', 'This recipe has no ingredients to add to groceries.');
    }
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      addComment(recipe.id, commentText.trim());
      setCommentText('');
      setShowCommentModal(false);
      addPoints('add_comment', `Commented on ${recipe.title}`, recipe.id);
      Alert.alert('Comment Added', 'Your comment has been added successfully!');
    } else {
      Alert.alert('Empty Comment', 'Please enter a comment before submitting.');
    }
  };

  const handleCommentLike = (commentId: string) => {
    toggleCommentLike(recipe.id, commentId);
  };

  // Cook step by step 处理函数
  const handleStartCooking = () => {
    navigation.navigate('CookStep', { recipeId: recipe.id });
  };


  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {/* Custom Header with Back Button and Share Button */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (route.params?.returnTo) {
              navigation.navigate(route.params.returnTo as any);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={() => navigation.navigate('ShareRecipe', { recipeId })}
        >
          <Ionicons name="share-outline" size={24} color="#d96709" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Recipe Main Image */}
        {(recipe.image_url || recipe.imageUri || recipe.image) && (
          <View style={styles.recipeImageSection}>
            <Image 
              source={
                (() => {
                  const src = (recipe.image_url || recipe.imageUri || recipe.image);
                  return typeof src === 'string' ? { uri: src } : src;
                })()
              } 
              style={styles.recipeImage} 
            />
          </View>
        )}

        {/* Recipe Name */}
        <View style={styles.recipeNameSection}>
          <Text style={styles.recipeName}>{recipe.title}</Text>
          
          {/* Tried it Section */}
          <View style={styles.triedSection}>
            <TouchableOpacity 
              style={[
                styles.triedButton,
                isTried(recipe.id) && styles.triedButtonActive
              ]}
              onPress={handleTried}
            >
              <Ionicons 
                name={isTried(recipe.id) ? "checkmark-circle" : "checkmark-circle-outline"} 
                size={20} 
                color={isTried(recipe.id) ? "#4CAF50" : "#666"} 
              />
              <Text style={[
                styles.triedButtonText,
                isTried(recipe.id) && styles.triedButtonTextActive
              ]}>
                {isTried(recipe.id) ? "Tried it!" : "Try it!"}
              </Text>
            </TouchableOpacity>
          <Text style={styles.triedCount}>
            {getTriedCount(recipe.id)} people tried this recipe
          </Text>
        </View>

          
          <View style={styles.authorInfo}>
            <View style={styles.authorAvatar}>
              {recipe.authorAvatar ? (
                <Image 
                  source={
                    typeof recipe.authorAvatar === 'string' 
                      ? { uri: recipe.authorAvatar } 
                      : recipe.authorAvatar
                  }
                  style={styles.authorAvatarImage}
                />
              ) : (
                <Ionicons 
                  name="person" 
                  size={24} 
                  color="white" 
                />
              )}
            </View>
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>
                {recipe.authorName || (isUserCreated ? (authUser?.name || (authUser?.email ? authUser.email.split('@')[0] : 'You')) : 'Chef iQ Community')}
              </Text>
              {!isUserCreated && recipe.authorBio && (
                <Text style={styles.authorBio}>{recipe.authorBio}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Cooking Time and Cookware */}
        <View style={styles.cookingInfoSection}>
          <View style={styles.cookingInfoRow}>
            <View style={styles.cookingInfoItem}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.cookingInfoLabel}>Cooking Time</Text>
              <Text style={styles.cookingInfoValue}>{recipe.cookingTime || 'Not specified'}</Text>
            </View>
            {recipe.cookware && (
              <View style={styles.cookingInfoItem}>
                <Ionicons name="restaurant-outline" size={20} color="#666" />
                <Text style={styles.cookingInfoLabel}>Cookware</Text>
                <Text style={styles.cookingInfoValue}>{recipe.cookware}</Text>
              </View>
            )}
          </View>
          
          {/* Recipe Description */}
          {recipe.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{recipe.description}</Text>
            </View>
          )}
          
          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.tagsScrollView}
              contentContainerStyle={styles.tagsList}
            >
              {recipe.tags.map((tag: string, index: number) => (
                <View key={index} style={styles.tagItem}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <View style={styles.ingredientsSection}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsControlsRow}>
              <View style={styles.servingsSelector}>
                <Text style={styles.servingsLabel}>Servings:</Text>
                <View style={styles.servingsControls}>
                  <TouchableOpacity 
                    style={[
                      styles.servingsButton,
                      currentServings <= 1 && styles.servingsButtonDisabled
                    ]}
                    onPress={() => {
                      if (currentServings > 1) {
                        setCurrentServings(currentServings - 1);
                      }
                    }}
                    disabled={currentServings <= 1}
                  >
                      <Ionicons 
                        name="remove" 
                        size={16} 
                        color={currentServings <= 1 ? "#ccc" : "#FF6B35"} 
                      />
                  </TouchableOpacity>
                  <Text style={styles.servingsCount}>{currentServings}</Text>
                  <TouchableOpacity 
                    style={[
                      styles.servingsButton,
                      currentServings >= 99 && styles.servingsButtonDisabled
                    ]}
                    onPress={() => {
                      if (currentServings < 99) {
                        setCurrentServings(currentServings + 1);
                      }
                    }}
                    disabled={currentServings >= 99}
                  >
                      <Ionicons 
                        name="add" 
                        size={16} 
                        color={currentServings >= 99 ? "#ccc" : "#FF6B35"} 
                      />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.groceriesButton}
                onPress={handleAddToGroceries}
              >
                <Ionicons name="cart-outline" size={20} color="#FF6B35" />
                <Text style={styles.groceriesButtonText}>Groceries</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ingredient: Ingredient, index: number) => {
                const originalServings = parseInt(recipe.servings) || 4;
                const scaleFactor = currentServings / originalServings;
                const scaledAmount = (ingredient.amount * scaleFactor).toFixed(1);
                
                return (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.ingredientAmount}>
                      {scaledAmount} {ingredient.unit}
                    </Text>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Instructions */}
        {recipe.instructions && recipe.instructions.length > 0 && (
          <View style={styles.instructionsSection}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            
            <View style={styles.cookStepButtonContainer}>
              <TouchableOpacity
                style={styles.cookStepButton}
                onPress={handleStartCooking}
              >
                <Ionicons name="play-circle" size={20} color="white" />
                <Text style={styles.cookStepButtonText}>Cook Step by Step</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.instructionsList}>
              {recipe.instructions.map((instruction: Instruction, index: number) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionStep}>
                    <Text style={styles.stepNumber}>{instruction.step}</Text>
                  </View>
                  <View style={styles.instructionContent}>
                    <Text style={styles.instructionDescription}>{instruction.description}</Text>
                    {instruction.imageUri && (
                      <Image source={{ uri: instruction.imageUri }} style={styles.instructionImage} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Comments Section at the end of detail page */}
        <View style={styles.commentsSectionInline}>
          <Text style={styles.sectionTitle}>Comments</Text>

          {getComments(recipe.id).length === 0 ? (
            <Text style={styles.commentsEmptyText}>No comments yet. Be the first to comment!</Text>
          ) : (
            <View style={styles.commentsInlineList}>
              {getComments(recipe.id).map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                    <Text style={styles.commentDate}>
                      {comment.createdAt.toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                  <TouchableOpacity
                    style={styles.commentLikeButton}
                    onPress={() => handleCommentLike(comment.id)}
                  >
                    <Ionicons
                      name={comment.isLiked ? "heart" : "heart-outline"}
                      size={16}
                      color={comment.isLiked ? "#FF6B35" : "#999"}
                    />
                    <Text style={[
                      styles.commentLikeText,
                      { color: comment.isLiked ? "#FF6B35" : "#999" }
                    ]}>
                      {comment.likes}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Bottom fixed bar: Social stats + Comment input */}
      <View style={styles.bottomBarContainer}>
        {/* Social Stats */}
        <View style={styles.socialStatsFooter}>
        <TouchableOpacity 
          style={styles.socialStatButton}
          onPress={handleLike}
        >
          <Ionicons 
            name={isLiked(recipe.id) ? "heart" : "heart-outline"} 
            size={20} 
            color={isLiked(recipe.id) ? "#FF6B35" : "#999"} 
          />
          <Text style={[
            styles.socialStatNumber,
            { color: isLiked(recipe.id) ? "#FF6B35" : "#999" }
          ]}>
            {getDisplayLikes(recipe.id)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialStatButton}
          onPress={handleFavorite}
        >
          <Ionicons 
            name={isFavorite(recipe.id) ? "bookmark" : "bookmark-outline"} 
            size={20} 
            color={isFavorite(recipe.id) ? "#FF6B35" : "#999"} 
          />
          <Text style={[
            styles.socialStatNumber,
            { color: isFavorite(recipe.id) ? "#FF6B35" : "#999" }
          ]}>
            {getDisplayFavorites(recipe.id)}
          </Text>
        </TouchableOpacity>

        <View style={styles.socialStatButton}>
          <Ionicons name="eye-outline" size={20} color="#999" />
          <Text style={styles.socialStatNumber}>{getStats(recipe.id).views}</Text>
        </View>

        <TouchableOpacity 
          style={styles.socialStatButton}
          onPress={handleTried}
        >
          <Ionicons 
            name={isTried(recipe.id) ? "checkmark-circle" : "checkmark-circle-outline"} 
            size={20} 
            color={isTried(recipe.id) ? "#4CAF50" : "#999"} 
          />
          <Text style={[
            styles.socialStatNumber,
            { color: isTried(recipe.id) ? "#4CAF50" : "#999" }
          ]}>
            {getDisplayTried(recipe.id)}
          </Text>
        </TouchableOpacity>
        </View>
        {/* Comment Input Row */}
        <View style={styles.commentInputRowBottom}>
          <TextInput
            style={styles.commentInputBottom}
            placeholder="Write a comment..."
            value={commentText}
            onChangeText={setCommentText}
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleAddComment}
            multiline={true}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.commentSendButtonBottom}
            onPress={handleAddComment}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCommentModal}
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCommentModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.commentsList}>
              {getComments(recipe.id).map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                    <Text style={styles.commentDate}>
                      {comment.createdAt.toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                  <TouchableOpacity
                    style={styles.commentLikeButton}
                    onPress={() => handleCommentLike(comment.id)}
                  >
                    <Ionicons
                      name={comment.isLiked ? "heart" : "heart-outline"}
                      size={16}
                      color={comment.isLiked ? "#FF6B35" : "#999"}
                    />
                    <Text style={[
                      styles.commentLikeText,
                      { color: comment.isLiked ? "#FF6B35" : "#999" }
                    ]}>
                      {comment.likes}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddComment}
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16, // 为header留出空间
    paddingBottom: 24,
  },
  // Recipe Image Section
  recipeImageSection: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  // Recipe Name Section
  recipeNameSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  recipeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 36,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authorAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  authorDetails: {
    flex: 1,
    alignItems: 'flex-start',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  authorBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Tried it Section
  triedSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  triedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  triedButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  triedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  triedButtonTextActive: {
    color: '#4CAF50',
  },
  triedCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  // Cooking Info Section
  cookingInfoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cookingInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cookingInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  cookingInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  cookingInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  // Description Section
  descriptionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  // Ingredients Section
  ingredientsControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  groceriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  groceriesButtonText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 6,
  },
  servingsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingsLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  servingsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  servingsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 10,
    minWidth: 18,
    textAlign: 'center',
  },
  servingsButtonDisabled: {
    backgroundColor: '#f0f0f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  tagsScrollView: {
    marginTop: 16,
  },
  tagsList: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  tagItem: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  ingredientsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ingredientAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 80,
    marginRight: 12,
  },
  ingredientName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  // Instructions Section
  instructionsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  stepNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionContent: {
    flex: 1,
  },
  instructionDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  instructionImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  menuInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  menuDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  menuStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  // Social Stats Footer
  socialStatsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  bottomBarContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 10,
  },
  socialStatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 60,
    justifyContent: 'center',
  },
  socialStatNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: '#999',
  },
  // Bottom Comment Input Row
  commentInputRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentInputBottom: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    minHeight: 40,
    maxHeight: 100,
  },
  commentSendButtonBottom: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  customHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24),
    paddingBottom: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 1000,
  },
  favoritedButton: {
    backgroundColor: '#FF6B35', // 使用橙色表示已收藏状态
  },
  // Comment Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // Inline comments section at end of page
  commentsSectionInline: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  commentInputInline: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 12,
  },
  commentSendButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsEmptyText: {
    fontSize: 14,
    color: '#666',
  },
  commentsInlineList: {
    marginTop: 4,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  commentsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  commentItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
    marginRight: 12,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Cook Step by Step Styles
  cookStepButtonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cookStepButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cookStepButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  cookStepButtonCompleted: {
    backgroundColor: '#4CAF50',
  },
});

export default RecipeDetailScreen;

