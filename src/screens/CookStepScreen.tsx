import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  Alert,
  SafeAreaView,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe } from '../contexts/RecipeContext';
import { sampleRecipes } from '../data/sampleRecipes';
import { Instruction } from '../types';

interface CookStepScreenProps {
  navigation: any;
  route: any;
}

const CookStepScreen: React.FC<CookStepScreenProps> = ({ navigation, route }) => {
  const { getRecipeById } = useRecipe();
  const { recipeId } = route.params;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showIngredients, setShowIngredients] = useState(false);
  const [servingSize, setServingSize] = useState(4); // 默认4人份
  
  // 获取屏幕宽度用于滑动手势
  const screenWidth = Dimensions.get('window').width;
  
  // 在 recipe 加载后设置正确的 serving size
  useEffect(() => {
    if (recipe?.servings) {
      const servings = parseFloat(recipe.servings);
      if (!isNaN(servings) && servings > 0) {
        setServingSize(Math.min(99, Math.max(1, servings)));
      }
    }
  }, [recipe]);
  
  // 计算调整后的食材用量
  const calculateAdjustedAmount = (ingredient: any) => {
    const originalServings = parseFloat(recipe?.servings) || 4;
    const currentServings = parseFloat(servingSize) || 4;
    const multiplier = currentServings / originalServings;
    const amount = parseFloat(ingredient.amount) || 0;
    const adjustedAmount = amount * multiplier;
    
    // 检查是否为有效数字
    if (isNaN(adjustedAmount) || !isFinite(adjustedAmount)) {
      return ingredient.amount || '0';
    }
    
    // 保留一位小数，如果是整数则不显示小数点
    return adjustedAmount % 1 === 0 ? adjustedAmount.toString() : adjustedAmount.toFixed(1);
  };
  
  // 创建 PanResponder 处理滑动手势
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // 如果水平滑动距离大于垂直滑动距离，则处理手势
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      // 这里可以添加滑动过程中的视觉反馈
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx } = gestureState;
      const threshold = screenWidth * 0.3; // 滑动阈值：屏幕宽度的30%
      
      if (dx > threshold) {
        // 向右滑动，显示上一步
        handlePreviousStep();
      } else if (dx < -threshold) {
        // 向左滑动，显示下一步
        handleNextStep();
      }
    },
  });
  
  // 根据ID判断数据来源
  let recipe: any;
  if (recipeId.startsWith('sample_')) {
    recipe = sampleRecipes.find(r => r.id === recipeId);
  } else {
    recipe = getRecipeById(recipeId);
  }

  if (!recipe || !recipe.instructions || recipe.instructions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF6B35" />
          <Text style={styles.errorTitle}>Recipe Not Found</Text>
          <Text style={styles.errorText}>This recipe doesn't have cooking instructions.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalSteps = recipe.instructions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteStep = () => {
    const newCompletedSteps = new Set(completedSteps);
    newCompletedSteps.add(currentStep);
    setCompletedSteps(newCompletedSteps);
    
    // Auto advance to next step if not the last step
    if (currentStep < totalSteps - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 1000);
    }
  };

  const handleFinishCooking = () => {
    Alert.alert(
      'Congratulations! 🎉', 
      'You have completed cooking this recipe!',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const currentInstruction = recipe.instructions[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{recipe.title}</Text>
          <Text style={styles.headerSubtitle}>Cook Step by Step</Text>
        </View>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setCurrentStep(0)}
        >
          <Ionicons name="refresh" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {totalSteps}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round(progress)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
      </View>

      {/* Step Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        {...panResponder.panHandlers}
      >
        <View style={styles.stepContainer}>
          {/* Step Number */}
          <View style={styles.stepNumberContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{currentInstruction.step}</Text>
            </View>
            {completedSteps.has(currentStep) && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
            )}
          </View>

          {/* Step Description */}
          <Text style={styles.stepDescription}>
            {currentInstruction.description}
          </Text>

          {/* Swipe Hint */}
          <View style={styles.swipeHint}>
            <Ionicons name="chevron-back" size={16} color="#999" />
            <Text style={styles.swipeHintText}>Swipe to navigate</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </View>

          {/* Step Image */}
          {currentInstruction.imageUri && (
            <View style={styles.stepImageContainer}>
              <Image 
                source={{ uri: currentInstruction.imageUri }} 
                style={styles.stepImage} 
              />
            </View>
          )}

          {/* Complete Step Button */}
          <TouchableOpacity
            style={[
              styles.completeButton,
              completedSteps.has(currentStep) && styles.completeButtonCompleted
            ]}
            onPress={handleCompleteStep}
          >
            <Ionicons 
              name={completedSteps.has(currentStep) ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.completeButtonText}>
              {completedSteps.has(currentStep) ? "Completed" : "Mark Complete"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            currentStep === 0 && styles.navButtonDisabled
          ]}
          onPress={handlePreviousStep}
          disabled={currentStep === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={currentStep === 0 ? "#ccc" : "#FF6B35"} 
          />
          <Text style={[
            styles.navButtonText,
            { color: currentStep === 0 ? "#ccc" : "#FF6B35" }
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

            {/* Review Button - Center */}
            <TouchableOpacity
              style={styles.ingredientsButton}
              onPress={() => setShowIngredients(true)}
            >
              <Ionicons name="eye" size={20} color="white" />
              <Text style={styles.ingredientsButtonText}>Review</Text>
            </TouchableOpacity>

        {/* Next/Finish Button - Right */}
        {currentStep === totalSteps - 1 ? (
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishCooking}
          >
            <Ionicons name="checkmark" size={20} color="white" />
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextStep}
          >
            <Text style={styles.navButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#FF6B35" />
          </TouchableOpacity>
        )}
      </View>

      {/* Review Modal */}
      {showIngredients && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recipe Review</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowIngredients(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.reviewContent} showsVerticalScrollIndicator={true}>
              {/* Ingredients Section */}
              <View style={styles.reviewSection}>
                <View style={styles.ingredientsHeader}>
                  <Text style={styles.reviewSectionTitle}>Ingredients ({recipe.ingredients?.length || 0})</Text>
                  
                  {/* Serving Size Selector */}
                  <View style={styles.servingSelector}>
                    <Text style={styles.servingLabel}>Servings:</Text>
                    <View style={styles.servingControls}>
                      <TouchableOpacity
                        style={[styles.servingButton, servingSize <= 1 && styles.servingButtonDisabled]}
                        onPress={() => {
                          const newSize = Math.max(1, Number(servingSize) - 1);
                          setServingSize(newSize);
                        }}
                        disabled={servingSize <= 1}
                      >
                        <Ionicons name="remove" size={16} color={servingSize <= 1 ? "#ccc" : "#FF6B35"} />
                      </TouchableOpacity>
                      
                      <Text style={styles.servingValue}>{Number(servingSize)}</Text>
                      
                      <TouchableOpacity
                        style={[styles.servingButton, servingSize >= 99 && styles.servingButtonDisabled]}
                        onPress={() => {
                          const newSize = Math.min(99, Number(servingSize) + 1);
                          setServingSize(newSize);
                        }}
                        disabled={servingSize >= 99}
                      >
                        <Ionicons name="add" size={16} color={servingSize >= 99 ? "#ccc" : "#FF6B35"} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((ingredient: any, index: number) => (
                    <View key={index} style={styles.ingredientItem}>
                      <Text style={styles.ingredientAmount}>
                        {calculateAdjustedAmount(ingredient)} {ingredient.unit}
                      </Text>
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No ingredients available</Text>
                )}
              </View>

              {/* Instructions Section */}
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Cooking Steps ({recipe.instructions?.length || 0})</Text>
                {recipe.instructions && recipe.instructions.length > 0 ? (
                  recipe.instructions.map((instruction: any, index: number) => {
                    const isCompleted = completedSteps.has(index);
                    return (
                      <View key={instruction.id || index} style={[styles.stepItem, isCompleted && styles.stepItemCompleted]}>
                        <View style={[styles.stepNumberContainer, isCompleted && styles.stepNumberContainerCompleted]}>
                          <Text style={styles.stepNumber}>{index + 1}</Text>
                          {isCompleted && (
                            <Ionicons name="checkmark" size={12} color="white" style={styles.stepCheckmark} />
                          )}
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={[styles.stepText, isCompleted && styles.stepTextCompleted]}>
                            {instruction.description || instruction.step || 'No description available'}
                          </Text>
                          {isCompleted && (
                            <Text style={styles.stepStatusText}>✓ Completed</Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>No instructions available</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  progressSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepNumber: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  completedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDescription: {
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 16,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    alignSelf: 'center',
  },
  swipeHintText: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 8,
    fontWeight: '500',
  },
  stepImageContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stepImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  completeButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  completeButtonCompleted: {
    backgroundColor: '#4CAF50',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FF6B35',
    backgroundColor: 'white',
  },
  navButtonDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f8f9fa',
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginHorizontal: 4,
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Ingredients Button
  ingredientsButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  ingredientsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Ingredients Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  ingredientsList: {
    maxHeight: 400,
    padding: 20,
  },
  reviewContent: {
    padding: 20,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
    paddingBottom: 8,
  },
  ingredientsHeader: {
    marginBottom: 16,
  },
  servingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  servingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  servingButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  servingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  stepItemCompleted: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
    position: 'relative',
  },
  stepNumberContainerCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepCheckmark: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 4,
  },
  stepTextCompleted: {
    color: '#2e7d32',
    textDecorationLine: 'line-through',
  },
  stepStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ingredientAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    minWidth: 80,
    marginRight: 16,
  },
  ingredientName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});

export default CookStepScreen;
