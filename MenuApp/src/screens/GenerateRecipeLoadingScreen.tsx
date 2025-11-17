import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  ScrollView,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useBeforeRemove } from '@react-navigation/native';
import { generateRecipeFromIngredients } from '../services/recipeImportService';
import { RecipeOption, CookingTimeCategory } from '../types';
import { showError } from '../utils/errorHandler';

interface GenerateRecipeLoadingScreenProps {
  navigation: any;
  route: {
    params: {
      ingredients: string[];
      dietaryRestrictions?: string[];
      cuisine?: string;
      servings?: string;
      cookingTime?: CookingTimeCategory;
      cookware: string;
    };
  };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// App feature introductions to cycle through
const FEATURE_INTRODUCTIONS = [
  {
    icon: 'sparkles',
    title: 'AI-Powered Recipe Generation',
    description: 'Our advanced AI creates personalized recipes tailored to your ingredients and preferences',
  },
  {
    icon: 'restaurant',
    title: 'Discover New Recipes',
    description: 'Explore a vast collection of recipes from the community and find your next favorite dish',
  },
  {
    icon: 'heart',
    title: 'Save Your Favorites',
    description: 'Build your personal recipe collection and easily access your favorite dishes anytime',
  },
  {
    icon: 'list',
    title: 'Smart Grocery Lists',
    description: 'Automatically generate shopping lists from your recipes and never forget an ingredient',
  },
  {
    icon: 'time',
    title: 'Cook with Confidence',
    description: 'Follow step-by-step cooking instructions with timers and helpful tips along the way',
  },
  {
    icon: 'share-social',
    title: 'Share & Connect',
    description: 'Share your culinary creations with friends and discover recipes from other home chefs',
  },
];

// Module-level tracking to prevent duplicate generation even across component remounts
// This persists across component instances, preventing duplicate API calls
let activeGenerationKey: string | null = null;
let isGenerationInProgress = false;
let mountCount = 0; // Track mount count for debugging

const GenerateRecipeLoadingScreen: React.FC<GenerateRecipeLoadingScreenProps> = ({ navigation, route }) => {
  // Validate route params - use safe defaults if missing
  const routeParams = route?.params || {};
  const ingredients = routeParams.ingredients || [];
  const dietaryRestrictions = routeParams.dietaryRestrictions;
  const cuisine = routeParams.cuisine;
  const servings = routeParams.servings;
  const cookingTime = routeParams.cookingTime;
  const cookware = routeParams.cookware || '';
  
  // Increment mount count
  mountCount += 1;
  
  // Only log detailed info on first mount, subsequent mounts just log count
  if (mountCount === 1) {
    console.log('📱 GenerateRecipeLoadingScreen mounted (first time) with params:', {
      ingredientsCount: ingredients?.length,
      cookware,
      cookingTime,
      cuisine,
      servings,
      hasParams: !!route?.params,
    });
  } else {
    // Subsequent mounts - just log count (this is normal in React Navigation, especially in dev mode)
    console.log(`📱 GenerateRecipeLoadingScreen remounted (count: ${mountCount}) - this is normal, generation will not duplicate`);
  }

  // Validate required params after a brief delay to allow UI to render
  // Use ref to prevent duplicate validation
  const hasValidated = useRef(false);
  
  useEffect(() => {
    // Only validate once
    if (hasValidated.current) {
      return;
    }
    
    const validateTimer = setTimeout(() => {
      if (!route?.params || !ingredients || ingredients.length === 0 || !cookware) {
        console.error('❌ GenerateRecipeLoadingScreen: Missing required params');
        hasValidated.current = true;
        showError('Error', 'Missing required information. Please try again.');
        navigation.goBack();
      } else {
        hasValidated.current = true;
      }
    }, 500); // Small delay to allow UI to render first
    
    return () => clearTimeout(validateTimer);
    // Remove navigation from dependencies - it's stable
  }, [route?.params, ingredients?.length, cookware]);

  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollEnabledRef = useRef(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Rotate animation for loading circle
  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();
    return () => rotateAnimation.stop();
  }, [rotateAnim]);

  // Auto-scroll through feature introductions
  useEffect(() => {
    const scrollToNext = () => {
      if (!autoScrollEnabledRef.current || !scrollViewRef.current) {
        return;
      }

      const nextIndex = (currentFeatureIndex + 1) % FEATURE_INTRODUCTIONS.length;
      const cardWidth = SCREEN_WIDTH - 80;
      const targetX = nextIndex * cardWidth;
      
      console.log(`🔄 Auto-scrolling to card ${nextIndex}, targetX: ${targetX}, currentIndex: ${currentFeatureIndex}`);
      
      scrollViewRef.current.scrollTo({
        x: targetX,
        animated: true,
      });
      
      // Update index immediately to ensure next scroll works correctly
      setCurrentFeatureIndex(nextIndex);
    };

    // Auto-scroll every 3 seconds
    const interval = setInterval(() => {
      if (autoScrollEnabledRef.current) {
        scrollToNext();
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentFeatureIndex]);

  // Handle manual scroll - use onMomentumScrollEnd for more accurate index detection
  const handleScroll = (event: any) => {
    const cardWidth = SCREEN_WIDTH - 80;
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / cardWidth);
    
    if (newIndex !== currentFeatureIndex && newIndex >= 0 && newIndex < FEATURE_INTRODUCTIONS.length) {
      console.log(`👆 Manual scroll detected: index ${currentFeatureIndex} -> ${newIndex}`);
      setCurrentFeatureIndex(newIndex);
      // Temporarily disable auto-scroll when user manually scrolls
      autoScrollEnabledRef.current = false;
      
      // Re-enable auto-scroll after 5 seconds of no manual scrolling
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        autoScrollEnabledRef.current = true;
        console.log('✅ Auto-scroll re-enabled after manual scroll');
      }, 5000);
    }
  };

  // Handle scroll end to ensure index is correctly updated
  const handleMomentumScrollEnd = (event: any) => {
    const cardWidth = SCREEN_WIDTH - 80;
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / cardWidth);
    
    if (newIndex >= 0 && newIndex < FEATURE_INTRODUCTIONS.length && newIndex !== currentFeatureIndex) {
      console.log(`🏁 Scroll ended at card ${newIndex}`);
      setCurrentFeatureIndex(newIndex);
    }
  };

  // Generate a unique key from params to identify this specific generation request
  const currentGenerationKey = React.useMemo(() => {
    return JSON.stringify({
      ingredients: ingredients?.sort().join(','),
      cookware,
      cookingTime,
      servings,
      cuisine,
      dietaryRestrictions: dietaryRestrictions?.sort().join(','),
    });
  }, [ingredients, cookware, cookingTime, servings, cuisine, dietaryRestrictions]);

  // Local ref for timeout cleanup
  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle navigation removal (back button, swipe back, etc.)
  const handleNavigationRemove = React.useCallback((e: any) => {
    // Prevent default navigation
    e.preventDefault();

    // Show confirmation dialog
    Alert.alert(
      'Cancel Generation?',
      'Are you sure you want to cancel recipe generation? This action cannot be undone.',
      [
        {
          text: 'Continue Generating',
          style: 'cancel',
          onPress: () => {
            // Do nothing, stay on screen
          },
        },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            // Clean up generation state
            if (generationTimeoutRef.current) {
              clearTimeout(generationTimeoutRef.current);
              generationTimeoutRef.current = null;
            }
            isGenerationInProgress = false;
            activeGenerationKey = null;
            mountCount = 0;
            // Navigate back - useBeforeRemove will allow this after we remove the listener
            navigation.dispatch(e.data.action);
          },
        },
      ]
    );
  }, [navigation]);

  // Handle navigation removal (works for both back button and swipe gestures)
  useBeforeRemove(handleNavigationRemove);

  // Handle Android hardware back button specifically
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Show confirmation dialog
        Alert.alert(
          'Cancel Generation?',
          'Are you sure you want to cancel recipe generation? This action cannot be undone.',
          [
            {
              text: 'Continue Generating',
              style: 'cancel',
            },
            {
              text: 'Cancel',
              style: 'destructive',
              onPress: () => {
                // Clean up generation state
                if (generationTimeoutRef.current) {
                  clearTimeout(generationTimeoutRef.current);
                  generationTimeoutRef.current = null;
                }
                isGenerationInProgress = false;
                activeGenerationKey = null;
                mountCount = 0;
                navigation.goBack();
              },
            },
          ]
        );
        return true; // Prevent default back behavior
      });

      return () => backHandler.remove();
    }
  }, [navigation]);

  // Generate recipes - use useFocusEffect to ensure it only runs when screen is focused
  // and use module-level tracking to prevent duplicate executions even across remounts
  useFocusEffect(
    React.useCallback(() => {
      // Skip if this exact generation request has already been started (module-level check)
      if (activeGenerationKey === currentGenerationKey) {
        // Only log once to avoid spam
        if (mountCount === 1) {
          console.log('⚠️ GenerateRecipeLoadingScreen: This generation request already started (module-level), skipping duplicate call');
        }
        return;
      }

      // Skip if currently generating (module-level check)
      if (isGenerationInProgress) {
        // Only log once to avoid spam
        if (mountCount === 1) {
          console.log('⚠️ GenerateRecipeLoadingScreen: Generation already in progress (module-level), skipping duplicate call');
        }
        return;
      }

      // Skip if missing required params
      if (!ingredients || ingredients.length === 0 || !cookware) {
        console.warn('⚠️ GenerateRecipeLoadingScreen: Missing required params, waiting for validation...');
        return;
      }

      // Mark this generation request as started (module-level)
      activeGenerationKey = currentGenerationKey;
      isGenerationInProgress = true;

      console.log('✅ GenerateRecipeLoadingScreen: All params validated, starting generation...');
      console.log('🔑 Generation key:', currentGenerationKey.substring(0, 50) + '...');
      console.log('📊 Module-level tracking: activeGenerationKey set, isGenerationInProgress = true');

      const generateRecipes = async () => {
        try {
          console.log('🍳 Starting recipe generation in loading screen...');
          console.log('📋 Generation params:', {
            ingredients: ingredients.join(', '),
            cookware,
            cookingTime,
            servings,
            cuisine,
            dietaryRestrictions,
          });
          
          const recipeOptions: RecipeOption[] = await generateRecipeFromIngredients(ingredients, {
            dietaryRestrictions: dietaryRestrictions && dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
            cuisine: cuisine && cuisine !== 'None' ? cuisine : undefined,
            servings: servings || undefined,
            cookingTime: cookingTime || undefined,
            cookware: cookware,
          });

          if (!recipeOptions || recipeOptions.length === 0) {
            throw new Error('No recipes were generated. Please try again with different inputs.');
          }

          console.log('✅ Recipe generation completed, navigating to results...');
          console.log('📊 Generated recipes:', recipeOptions.map(r => r.recipe?.title));
          
          // Mark as no longer generating before navigation (module-level)
          isGenerationInProgress = false;
          // Clear active generation key after successful completion
          activeGenerationKey = null;
          // Reset mount count for next generation
          mountCount = 0;
          
          // Navigate to results screen
          navigation.replace('GenerateRecipeResults', {
            recipeOptions,
            userIngredients: ingredients,
            selectedOptionIndex: 0,
          });
        } catch (error: any) {
          console.error('❌ Error generating recipe:', error);
          console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
          });
          
          // Mark as no longer generating (module-level)
          isGenerationInProgress = false;
          // Reset generation key so user can retry with same params
          activeGenerationKey = null;
          // Reset mount count for next generation
          mountCount = 0;
          
          // Navigate back to generate screen
          navigation.goBack();
          
          // Show error alert after navigation completes
          setTimeout(() => {
            Alert.alert(
              'Generation Failed',
              error.message || 'Failed to generate recipes. Please check your inputs and try again.',
              [{ text: 'OK' }]
            );
          }, 300);
        }
      };

      // Small delay to ensure UI is fully rendered and animations have started
      generationTimeoutRef.current = setTimeout(() => {
        generateRecipes();
      }, 300);

      // Cleanup function - runs when screen loses focus or component unmounts
      return () => {
        if (generationTimeoutRef.current) {
          clearTimeout(generationTimeoutRef.current);
          generationTimeoutRef.current = null;
        }
        // Only reset if generation hasn't completed (user navigated away)
        // Keep activeGenerationKey to prevent re-running if user comes back
        if (isGenerationInProgress) {
          console.log('⚠️ GenerateRecipeLoadingScreen: Screen lost focus during generation, cleaning up timeout...');
          // Don't reset module-level flags here - they will be reset when generation completes or fails
        }
      };
    }, [currentGenerationKey, ingredients, cookware, navigation])
  );

  const currentFeature = FEATURE_INTRODUCTIONS[currentFeatureIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent />
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Loading Animation */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCircle}>
            <ActivityIndicator size="large" color="#d96709" />
          </View>
          <Animated.View
            style={[
              styles.outerRing,
              {
                transform: [
                  {
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Generating Your Recipes</Text>
        <Text style={styles.subtitle}>This may take 30-40 seconds...</Text>

        {/* Feature Introduction Cards - Scrollable */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          style={styles.cardsScrollView}
          contentContainerStyle={styles.cardsScrollContent}
          snapToInterval={SCREEN_WIDTH - 80}
          snapToAlignment="start"
          decelerationRate="fast"
        >
          {FEATURE_INTRODUCTIONS.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureCard,
                { width: SCREEN_WIDTH - 80 },
              ]}
            >
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon as any} size={Platform.OS === 'android' ? 18 : 14} color="#d96709" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {FEATURE_INTRODUCTIONS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentFeatureIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <Ionicons name="information-circle-outline" size={16} color="#999" />
        <Text style={styles.bottomInfoText}>
          Creating three unique recipe options based on your ingredients
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  loadingContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 2,
  },
  outerRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#d96709',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    opacity: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: Platform.OS === 'android' ? 0 : 40,
    textAlign: 'center',
  },
  cardsScrollView: {
    marginBottom: Platform.OS === 'android' ? 0 : 16,
    height: Platform.OS === 'android' ? 25 : undefined, // Android: 降低为原来的一半（卡片minHeight 50的一半）
  },
  cardsScrollContent: {
    paddingHorizontal: 0,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 0 : 4,
    alignItems: 'center',
    shadowColor: '#E0E0E0', // 浅灰色阴影
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.6 : 0,
    shadowRadius: Platform.OS === 'ios' ? 8 : 0,
    elevation: 0, // Android 不使用 elevation，改用边框
    marginRight: 0,
    minHeight: 100,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0', // 浅灰色边框
  },
  featureIconContainer: {
    width: Platform.OS === 'android' ? 32 : 24, // Android: 增大图标容器
    height: Platform.OS === 'android' ? 32 : 24, // Android: 增大图标容器
    borderRadius: Platform.OS === 'android' ? 16 : 12, // Android: 相应调整圆角
    backgroundColor: '#fff5f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'android' ? 0 : 4,
    shadowColor: '#d96709',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 2 : 0,
    elevation: Platform.OS === 'android' ? 2 : 0,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  featureTitle: {
    fontSize: Platform.OS === 'android' ? 18 : 12, // Android: 再增大 (15 + 3 = 18)
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: Platform.OS === 'android' ? 0 : 2,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  featureDescription: {
    fontSize: Platform.OS === 'android' ? 15 : 10, // Android: 再增大 (13 + 2 = 15)
    color: '#666',
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 20 : 14, // Android: 相应增加行高 (17 + 3 = 20)
    paddingHorizontal: 0,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#d96709',
    width: 24,
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
  },
  bottomInfoText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },
});

export default GenerateRecipeLoadingScreen;

