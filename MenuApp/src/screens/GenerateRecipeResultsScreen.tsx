import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Buttons, Typography } from '../styles/theme';
import { Recipe, YouTubeVideo, CookingTimeCategory, RecipeOption } from '../types';
import { findRelatedRecipes } from '../utils/recipeMatcher';
import { useRecipe } from '../contexts/RecipeContext';
import { sampleRecipes } from '../data/sampleRecipes';
import OptimizedImage from '../components/OptimizedImage';

interface GenerateRecipeResultsScreenProps {
  navigation: any;
  route: {
    params: {
      recipeOptions?: RecipeOption[];
      generatedRecipe?: Recipe;
      youtubeVideos?: YouTubeVideo[];
      youtubeSearchUrl?: string;
      userIngredients: string[];
      selectedOptionIndex?: number;
    };
  };
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_PADDING = 20; // Increased from 16 to 20 for more side spacing
const CARD_INNER_PADDING = 20;
const CARD_WIDTH = WINDOW_WIDTH - CARD_HORIZONTAL_PADDING * 2;

const GenerateRecipeResultsScreen: React.FC<GenerateRecipeResultsScreenProps> = ({ navigation, route }) => {
  const {
    recipeOptions: routeRecipeOptions = [],
    generatedRecipe: legacyGeneratedRecipe,
    youtubeVideos: legacyYoutubeVideos = [],
    youtubeSearchUrl: legacyYoutubeSearchUrl,
    userIngredients = [],
    selectedOptionIndex: initialSelectedOptionIndex = 0,
  } = route.params;
  const { state } = useRecipe();
  
  const effectiveOptions: RecipeOption[] = React.useMemo(() => {
    if (routeRecipeOptions.length > 0) {
      return routeRecipeOptions;
    }

    if (legacyGeneratedRecipe) {
      const fallbackVideos = Array.isArray(legacyGeneratedRecipe.youtubeVideos)
        ? legacyGeneratedRecipe.youtubeVideos
        : Array.isArray(legacyYoutubeVideos)
        ? legacyYoutubeVideos
        : [];
      const fallbackSearchUrl = legacyGeneratedRecipe.youtubeSearchUrl || legacyYoutubeSearchUrl;

      return [
        {
          recipe: legacyGeneratedRecipe,
          youtubeVideos: fallbackVideos,
          youtubeSearchUrl: fallbackSearchUrl,
          optionIndex: 0,
        },
      ];
    }

    return [];
  }, [legacyGeneratedRecipe, legacyYoutubeSearchUrl, legacyYoutubeVideos, routeRecipeOptions]);

  const [selectedOptionIndex, setSelectedOptionIndex] = React.useState(() => {
    if (effectiveOptions.length === 0) {
      return 0;
    }
    return Math.min(Math.max(initialSelectedOptionIndex, 0), effectiveOptions.length - 1);
  });

  React.useEffect(() => {
    if (effectiveOptions.length === 0) {
      setSelectedOptionIndex(0);
      return;
    }
    setSelectedOptionIndex((prev) => Math.min(prev, effectiveOptions.length - 1));
  }, [effectiveOptions.length]);

  const scrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    if (!effectiveOptions.length) {
      return;
    }
    scrollRef.current?.scrollTo({ x: selectedOptionIndex * WINDOW_WIDTH, animated: false });
  }, [effectiveOptions.length]);

  const currentOption: RecipeOption | null = effectiveOptions[selectedOptionIndex] || null;

  React.useEffect(() => {
    if (!effectiveOptions.length) {
      return;
    }
    scrollRef.current?.scrollTo({ x: selectedOptionIndex * WINDOW_WIDTH, animated: true });
  }, [selectedOptionIndex, effectiveOptions.length]);

  const generatedRecipe = currentOption?.recipe;

  if (!generatedRecipe) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
          Unable to display recipe results. Please try generating recipes again.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[Buttons.primary.container, { marginTop: 16, width: '60%' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={Buttons.primary.text}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('🥘 Recipe options count:', effectiveOptions.length);
  console.log('🥘 Selected option index:', selectedOptionIndex);
  console.log('🥘 Current recipe title:', generatedRecipe.title);

  const currentYoutubeVideosRaw = currentOption?.youtubeVideos;
  const safeOptionYoutubeVideos = Array.isArray(currentYoutubeVideosRaw) ? currentYoutubeVideosRaw : [];
  const safeRecipeYoutubeVideos = Array.isArray(generatedRecipe.youtubeVideos) ? generatedRecipe.youtubeVideos : [];

  const allVideos = [...safeOptionYoutubeVideos, ...safeRecipeYoutubeVideos];
  const uniqueVideosMap = new Map<string, YouTubeVideo>();
  const videosWithoutId: YouTubeVideo[] = [];

  allVideos.forEach((video) => {
    if (video.videoId) {
      if (!uniqueVideosMap.has(video.videoId)) {
        uniqueVideosMap.set(video.videoId, video);
      } else {
        console.log(`⚠️  Frontend: Duplicate video detected and skipped: ${video.videoId} - ${video.title}`);
      }
    } else {
      videosWithoutId.push(video);
    }
  });

  const displayYoutubeVideos = Array.from(uniqueVideosMap.values()).concat(videosWithoutId);

  if (allVideos.length !== displayYoutubeVideos.length) {
    console.log(`📺 Frontend: Removed ${allVideos.length - displayYoutubeVideos.length} duplicate videos`);
  }

  const displayYoutubeSearchUrl = currentOption?.youtubeSearchUrl || generatedRecipe.youtubeSearchUrl || legacyYoutubeSearchUrl;

  console.log('📺 GenerateRecipeResultsScreen - Final display YouTube videos:', displayYoutubeVideos?.length || 0);
  console.log('📺 GenerateRecipeResultsScreen - Final display YouTube search URL:', displayYoutubeSearchUrl);
  console.log('📺 GenerateRecipeResultsScreen - Will show YouTube section?', displayYoutubeVideos.length > 0 || !!displayYoutubeSearchUrl);

  const allPublicRecipes = [
    ...state.recipes.filter((recipe) => recipe.isPublic && recipe.title.toLowerCase() !== generatedRecipe.title.toLowerCase()),
    ...sampleRecipes.filter((recipe) => recipe.title.toLowerCase() !== generatedRecipe.title.toLowerCase()),
  ];

  const relatedRecipes = findRelatedRecipes(userIngredients, allPublicRecipes, 10);
  
  const handleSelectRecipe = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };
  
  const handleUseGeneratedRecipe = () => {
    navigation.navigate('CreateRecipe', {
      importedRecipe: generatedRecipe,
    });
  };
  
  const handleBack = () => {
    navigation.goBack();
  };

  const renderIngredientsChips = (recipe: Recipe) => {
    const chips = recipe.ingredients?.slice(0, 4) || [];
    if (chips.length === 0) {
      return null;
    }
    return (
      <View style={styles.ingredientsChipWrap}>
        {chips.map((ingredient) => (
          <View key={ingredient.id} style={styles.ingredientChip}>
            <Text style={styles.ingredientChipText}>{ingredient.name}</Text>
          </View>
        ))}
      </View>
    );
  };

  const recipeCards = effectiveOptions.length > 0 ? effectiveOptions : [currentOption];
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Results</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.aiGeneratedSection}>
          <View style={styles.aiGeneratedSectionHeader}>
            <Ionicons name="sparkles" size={24} color="#d96709" />
            <Text style={styles.sectionTitle}>AI Generated Recipes</Text>
          </View>
          
          {effectiveOptions.length > 1 && (
            <Text style={styles.aiGeneratedSectionSubtitle}>Swipe horizontally to preview different AI recipes</Text>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / WINDOW_WIDTH);
            if (index >= 0 && index < recipeCards.length) {
              setSelectedOptionIndex(index);
            }
          }}
          contentContainerStyle={styles.horizontalScrollViewContent}
          style={styles.horizontalScrollView}
        >
            {recipeCards.map((option, index) => {
              const recipe = option?.recipe;
              if (!recipe) {
                return null;
              }
              const metaItems = [
                recipe.cookingTime ? { icon: 'time-outline' as const, text: recipe.cookingTime } : null,
                recipe.servings ? { icon: 'people-outline' as const, text: recipe.servings } : null,
                recipe.cookware ? { icon: 'restaurant-outline' as const, text: recipe.cookware } : null,
              ].filter(Boolean) as Array<{ icon: keyof typeof Ionicons.glyphMap; text: string }>;

              const primaryInstruction = recipe.instructions?.[0]?.description;

              return (
                <View key={`recipe-card-${index}`} style={styles.recipeCardContainer}>
                  <View style={styles.recipeCard}>
                    <View style={styles.recipeCardContent}>
                      <View style={styles.recipeCardHeader}>
                        <Text style={styles.recipeCardTitle}>{recipe.title}</Text>
                        <Text style={styles.recipeCardDescription} numberOfLines={3}>{recipe.description}</Text>
                      </View>

                    {metaItems.length > 0 && (
              <View style={styles.recipeMeta}>
                        {metaItems.map((item, metaIndex) => (
                          <View key={`meta-${metaIndex}`} style={styles.metaItem}>
                            <Ionicons name={item.icon} size={16} color="#666" />
                            <Text style={styles.metaText}>{item.text}</Text>
                  </View>
                        ))}
                  </View>
                )}

                    {renderIngredientsChips(recipe)}

                    {primaryInstruction && (
                      <View style={styles.recipeNote}>
                        <Ionicons name="list-outline" size={18} color="#d96709" style={{ marginRight: 8 }} />
                        <Text style={styles.recipeNoteText} numberOfLines={3}>{primaryInstruction}</Text>
                  </View>
                )}

              <TouchableOpacity
                style={styles.useRecipeButton}
                      onPress={() => {
                        navigation.navigate('CreateRecipe', {
                          importedRecipe: recipe,
                        });
                      }}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.useRecipeButtonText}>Use This Recipe</Text>
              </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
        </ScrollView>
        
        {/* Page indicators */}
        {effectiveOptions.length > 1 && (
          <View style={styles.pageIndicatorContainer}>
            {effectiveOptions.map((_, idx) => (
              <View
                key={`indicator-${idx}`}
                style={[
                  styles.pageIndicator,
                  idx === selectedOptionIndex && styles.pageIndicatorActive,
                ]}
              />
            ))}
          </View>
        )}
        
        {(displayYoutubeVideos.length > 0 || displayYoutubeSearchUrl) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="logo-youtube" size={24} color="#FF0000" />
              <Text style={styles.sectionTitle}>Recipes from Youtube</Text>
            </View>
            
            {displayYoutubeVideos.length > 0 ? (
              <>
                {displayYoutubeVideos.slice(0, 3).map((video: YouTubeVideo, index: number) => {
                  const uniqueKey = video.videoId ? `video-${video.videoId}` : `video-${index}-${Date.now()}`;

                  return (
                    <TouchableOpacity
                      key={uniqueKey}
                      style={styles.youtubeVideoCard}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (video.url) {
                          Linking.openURL(video.url);
                        } else if (video.videoId) {
                          Linking.openURL(`https://www.youtube.com/watch?v=${video.videoId}`);
                        }
                      }}
                    >
                      <View style={styles.youtubeThumbnailContainer}>
                        {video.thumbnail ? (
                          <>
                            <OptimizedImage
                              source={video.thumbnail}
                              style={styles.youtubeThumbnail}
                              contentFit="cover"
                              showLoader={true}
                              cachePolicy="memory-disk"
                              priority="normal"
                            />
                            <View style={styles.youtubePlayButtonOverlay}>
                              <Ionicons name="play-circle" size={56} color="#FF0000" />
                            </View>
                          </>
                        ) : (
                          <View style={styles.youtubeThumbnailPlaceholder}>
                            <Ionicons name="play-circle" size={64} color="#FF0000" />
                          </View>
                        )}
                      </View>
                      <View style={styles.youtubeVideoInfo}>
                        <Text style={styles.youtubeVideoTitle}>{video.title}</Text>
                        {video.description && (
                          <Text style={styles.youtubeDescription} numberOfLines={3} ellipsizeMode="tail">
                            {video.description}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : (
              <View style={styles.noVideosMessage}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={styles.noVideosText}>
                  No video previews are available.
                  {displayYoutubeSearchUrl ? ' Tap the button below to search on YouTube.' : ' Please try again later.'}
                </Text>
              </View>
            )}
            
            {displayYoutubeSearchUrl && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Search more videos on YouTube"
                style={[Buttons.primary.container, { backgroundColor: '#FF0000', marginTop: 12 }]}
                onPress={() => Linking.openURL(displayYoutubeSearchUrl)}
              >
                <Ionicons name="logo-youtube" size={20} color="#fff" />
                <Text style={[Buttons.primary.text, { marginLeft: 8 }]}>Search on YouTube</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {relatedRecipes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="restaurant" size={24} color="#d96709" />
              <Text style={styles.sectionTitle}>Related Recipes</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Recipes in the app that match your ingredients</Text>

            {relatedRecipes.length === 0 ? (
              <View style={styles.noVideosMessage}>
                <Ionicons name="search-outline" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={styles.noVideosText}>
                  No related recipes found. Try adjusting your ingredients or generate again.
                </Text>
              </View>
            ) : (
            relatedRecipes.slice(0, 3).map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.relatedRecipeCard}
                onPress={() => handleSelectRecipe(recipe)}
              >
                <OptimizedImage
                  source={(recipe.imageUri || recipe.image_url) as string}
                  style={styles.relatedRecipeImage}
                  contentFit="cover"
                  showLoader={true}
                  cachePolicy="memory-disk"
                  priority="normal"
                />
                <View style={styles.relatedRecipeInfo}>
                  <Text style={styles.relatedRecipeTitle}>{recipe.title}</Text>
                  {recipe.description ? (
                    <Text style={styles.relatedRecipeDescription} numberOfLines={2}>
                      {recipe.description}
                    </Text>
                  ) : null}
                  <View style={styles.relatedRecipeMeta}>
                    {recipe.cookingTime && (
                      <Text style={styles.relatedRecipeMetaText}>{recipe.cookingTime}</Text>
                    )}
                    {recipe.servings && (
                      <Text style={[styles.relatedRecipeMetaText, { marginLeft: 8 }]}>{recipe.servings}</Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#d96709" />
              </TouchableOpacity>
            )))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb-outline" size={24} color="#d96709" />
            <Text style={styles.sectionTitle}>Need a Different Recipe?</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Adjust your ingredients or cookware and generate again. You can also import recipes from a URL or scan from an image.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Try again"
              style={Buttons.secondary.container}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
              <Text style={Buttons.secondary.text}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Import recipe from URL"
              style={Buttons.secondary.container}
              onPress={() => navigation.navigate('ImportRecipe', { mode: 'url' })}
            >
              <Ionicons name="link-outline" size={20} color={Colors.primary} />
              <Text style={Buttons.secondary.text}>Import from URL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 52 : ((StatusBar.currentHeight || 24) + 8), // Increased padding for more distance from top
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
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
  // Special styling for AI Generated Recipes section to make it more compact
  aiGeneratedSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    paddingBottom: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  // Compact header for AI Generated Recipes section
  aiGeneratedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    marginLeft: 32,
  },
  // Compact subtitle for AI Generated Recipes section
  aiGeneratedSectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8, // Reduced from 16 to 8 for more compact layout
    marginLeft: 32,
  },
  // Generated Recipe Preview
  recipePreviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 16,
    marginRight: -8,
  },
  recipeOptionChip: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  recipeOptionChipActive: {
    backgroundColor: '#d96709',
    borderColor: '#d96709',
  },
  recipeOptionChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  recipeOptionChipTextActive: {
    color: '#fff',
  },
  recipeInfo: {
    padding: 16,
  },
  useRecipeButton: {
    ...Buttons.primary.container,
    marginHorizontal: CARD_INNER_PADDING,
    marginBottom: CARD_INNER_PADDING,
    marginTop: 8,
  },
  useRecipeButtonText: Buttons.primary.text,
  // YouTube Videos
  youtubeVideoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  youtubeThumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    backgroundColor: '#ddd',
  },
  youtubeThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
  },
  youtubeThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  youtubePlayButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  youtubeVideoInfo: {
    padding: 12,
    paddingTop: 10,
  },
  youtubeDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    textAlign: 'left',
  },
  youtubeSearchButton: Buttons.primary.container,
  youtubeSearchButtonText: Buttons.primary.text,
  noVideosMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  noVideosText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    lineHeight: 20,
  },
  // Related Recipes
  relatedRecipeCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  relatedRecipeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  relatedRecipeImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'white',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedRecipeInfo: {
    flex: 1,
  },
  relatedRecipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  relatedRecipeDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    lineHeight: 16,
  },
  relatedRecipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relatedRecipeMetaText: {
    fontSize: 12,
    color: '#999',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginTop: 8,
  },
  // New styles for horizontal card slider
  horizontalScrollView: {
    marginLeft: -20,
    marginRight: -20,
    marginBottom: 8, // Reduced from 16 to 8 for more compact layout
    overflow: 'visible', // Allow shadow to be visible
  },
  horizontalScrollViewContent: {
    paddingHorizontal: 0,
  },
  recipeCardContainer: {
    width: WINDOW_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    paddingVertical: Platform.OS === 'android' ? 0 : 8, // iOS needs padding for shadow, Android uses elevation
    position: 'relative',
    overflow: 'visible', // Allow shadow to be visible
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 16, // Increased from 12 to 16 for more rounded corners
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 }, // Increased shadow offset for more depth
      shadowOpacity: 0.2, // Increased shadow opacity for better visibility
      shadowRadius: 12, // Increased shadow radius for softer, more visible shadow
      overflow: 'visible', // iOS needs overflow visible for shadow to show
    } : {
      // Use same shadow as YouTube cards on Android
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden', // Android can use hidden for content clipping
    }),
    width: CARD_WIDTH,
    alignSelf: 'center',
  },
  recipeCardContent: {
    borderRadius: 16, // Match parent borderRadius
    overflow: 'hidden', // Clip content inside while allowing parent shadow to show
  },
  recipeCardHeader: {
    paddingHorizontal: CARD_INNER_PADDING,
    paddingTop: CARD_INNER_PADDING,
    paddingBottom: 16,
  },
  recipeCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    lineHeight: 28,
  },
  recipeCardDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 0,
  },
  recipeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: CARD_INNER_PADDING,
    marginTop: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  recipeNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: CARD_INNER_PADDING,
    marginTop: 4,
    marginBottom: 12,
  },
  recipeNoteText: {
    fontSize: 14,
    color: '#d96709',
    lineHeight: 20,
    flex: 1,
  },
  ingredientsChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: CARD_INNER_PADDING,
    marginTop: 4,
    marginBottom: 12,
  },
  ingredientChip: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  ingredientChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4, // Reduced from 12 to 4 to decrease distance from recipe cards
    marginBottom: 20, // Increased from 8 to 20 to increase distance to YouTube section
    paddingHorizontal: 20,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  pageIndicatorActive: {
    backgroundColor: '#d96709',
    width: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '45%',
  },
  secondaryButtonText: {
    color: '#d96709',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  youtubeVideoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
});

export default GenerateRecipeResultsScreen;

