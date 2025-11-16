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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
      
      scrollViewRef.current.scrollTo({
        x: nextIndex * cardWidth,
        animated: true,
      });
      
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

  // Handle manual scroll
  const handleScroll = (event: any) => {
    const cardWidth = SCREEN_WIDTH - 80;
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / cardWidth);
    
    if (newIndex !== currentFeatureIndex && newIndex >= 0 && newIndex < FEATURE_INTRODUCTIONS.length) {
      setCurrentFeatureIndex(newIndex);
      // Temporarily disable auto-scroll when user manually scrolls
      autoScrollEnabledRef.current = false;
      
      // Re-enable auto-scroll after 5 seconds of no manual scrolling
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        autoScrollEnabledRef.current = true;
      }, 5000);
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
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.cardsScrollView}
          contentContainerStyle={styles.cardsScrollContent}
          snapToInterval={SCREEN_WIDTH - 80}
          decelerationRate="fast"
        >
          {FEATURE_INTRODUCTIONS.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureCard,
                { width: SCREEN_WIDTH - 80 },
                Platform.OS === 'android' && { backgroundColor: '#fafafa' },
              ]}
            >
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon as any} size={36} color="#d96709" />
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
    marginBottom: 40,
    textAlign: 'center',
  },
  cardsScrollView: {
    marginBottom: 24,
  },
  cardsScrollContent: {
    paddingHorizontal: 0,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0,
    shadowRadius: Platform.OS === 'ios' ? 12 : 0,
    elevation: Platform.OS === 'android' ? 8 : 3,
    marginRight: 0,
    minHeight: 160,
    justifyContent: 'center',
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: Platform.OS === 'android' ? '#f0f0f0' : 'transparent',
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff5f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#d96709',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
    elevation: Platform.OS === 'android' ? 3 : 0,
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: Platform.OS === 'android' ? '#ffe8de' : 'transparent',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
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

