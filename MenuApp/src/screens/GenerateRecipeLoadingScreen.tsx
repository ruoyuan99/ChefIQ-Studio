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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateRecipeFromIngredients } from '../services/recipeImportService';
import { RecipeOption, CookingTimeCategory } from '../types';

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

const GenerateRecipeLoadingScreen: React.FC<GenerateRecipeLoadingScreenProps> = ({ navigation, route }) => {
  // Validate route params - use safe defaults if missing
  const routeParams = route?.params || {};
  const ingredients = routeParams.ingredients || [];
  const dietaryRestrictions = routeParams.dietaryRestrictions;
  const cuisine = routeParams.cuisine;
  const servings = routeParams.servings;
  const cookingTime = routeParams.cookingTime;
  const cookware = routeParams.cookware || '';
  
  console.log('📱 GenerateRecipeLoadingScreen mounted with params:', {
    ingredientsCount: ingredients?.length,
    cookware,
    cookingTime,
    cuisine,
    servings,
    hasParams: !!route?.params,
  });

  // Validate required params after a brief delay to allow UI to render
  useEffect(() => {
    const validateTimer = setTimeout(() => {
      if (!route?.params || !ingredients || ingredients.length === 0 || !cookware) {
        console.error('❌ GenerateRecipeLoadingScreen: Missing required params');
        Alert.alert('Error', 'Missing required information. Please try again.');
        navigation.goBack();
      }
    }, 500); // Small delay to allow UI to render first
    
    return () => clearTimeout(validateTimer);
  }, [route?.params, ingredients, cookware, navigation]);

  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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

  // Cycle through feature introductions
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change feature
        setCurrentFeatureIndex((prev) => (prev + 1) % FEATURE_INTRODUCTIONS.length);
        // Fade in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [fadeAnim, scaleAnim]);

  // Generate recipes - only run if we have valid params
  useEffect(() => {
    // Skip if missing required params - but still show loading screen
    if (!ingredients || ingredients.length === 0 || !cookware) {
      console.warn('⚠️ GenerateRecipeLoadingScreen: Missing required params, waiting for validation...');
      // Don't return early - let the validation useEffect handle navigation
      return;
    }

    console.log('✅ GenerateRecipeLoadingScreen: All params validated, starting generation...');

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
    const timer = setTimeout(() => {
      generateRecipes();
    }, 300);

    return () => clearTimeout(timer);
  }, [ingredients, dietaryRestrictions, cuisine, servings, cookingTime, cookware, navigation]);

  const currentFeature = FEATURE_INTRODUCTIONS[currentFeatureIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" translucent />
      
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

        {/* Feature Introduction Card */}
        <Animated.View
          style={[
            styles.featureCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.featureIconContainer}>
            <Ionicons name={currentFeature.icon as any} size={48} color="#d96709" />
          </View>
          <Text style={styles.featureTitle}>{currentFeature.title}</Text>
          <Text style={styles.featureDescription}>{currentFeature.description}</Text>
        </Animated.View>

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
    backgroundColor: '#f5f5f5',
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
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: SCREEN_WIDTH - 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
    minHeight: 200,
    justifyContent: 'center',
  },
  featureIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff5f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
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

