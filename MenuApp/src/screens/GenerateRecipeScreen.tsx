import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GenerateRecipeScreenProps {
  navigation: any;
  route: any;
}

const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Keto',
  'Paleo',
  'Low-Carb',
  'Low-Sodium',
  'Halal',
  'Kosher',
];

const CUISINES = [
  'American',
  'Italian',
  'Chinese',
  'Japanese',
  'Mexican',
  'Indian',
  'Thai',
  'French',
  'Mediterranean',
  'Korean',
  'Middle Eastern',
  'Spanish',
  'Greek',
  'Vietnamese',
  'None',
];

const SERVINGS_OPTIONS = ['2', '4', '6', '8', '10+'];

const COOKING_TIME_OPTIONS = ['Quick', 'Medium', 'Long'] as const;
// CookingTimeCategory is imported from '../types'

const COOKWARE_OPTIONS = [
  'Oven',
  'Microwave',
  'Air Fryer',
  'Rice Cooker',
  'Stovetop',
  'Grill',
  'Slow Cooker',
  'Pressure Cooker',
  'Blender',
  'Food Processor',
];

const QUICK_INGREDIENTS = [
  'Chicken',
  'Beef',
  'Pork',
  'Shrimp',
  'Salmon',
  'Tofu',
  'Tomato',
  'Onion',
  'Bell Pepper',
  'Potato',
] as const;

const GenerateRecipeScreen: React.FC<GenerateRecipeScreenProps> = ({ navigation }) => {
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [selectedServings, setSelectedServings] = useState<string>('');
  const [selectedCookingTime, setSelectedCookingTime] = useState<string>('');
  const [selectedCookware, setSelectedCookware] = useState<string>('');

  const handleAddIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setIngredientInput('');
    }
  };

const handleQuickAddIngredient = (ingredient: string) => {
  if (!ingredient) return;
  // Avoid duplicates but allow reordering by keeping existing list
  if (!ingredients.includes(ingredient)) {
    setIngredients([...ingredients, ingredient]);
  }
  setIngredientInput('');
};

  const handleRemoveIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(ing => ing !== ingredient));
  };

  const handleToggleDietaryRestriction = (restriction: string) => {
    if (dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
    } else {
      setDietaryRestrictions([...dietaryRestrictions, restriction]);
    }
  };

  const handleGenerate = () => {
    if (ingredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    if (!selectedCookware) {
      Alert.alert('Error', 'Please select a cookware');
      return;
    }

    console.log('🚀 Navigating to loading screen with params:', {
      ingredients,
      dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
      cuisine: selectedCuisine && selectedCuisine !== 'None' ? selectedCuisine : undefined,
      servings: selectedServings || undefined,
      cookingTime: selectedCookingTime || undefined,
      cookware: selectedCookware,
    });

    // Navigate to loading screen immediately
    // Don't wrap in requestAnimationFrame - React Navigation handles this internally
    try {
      navigation.navigate('GenerateRecipeLoading', {
        ingredients,
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
        cuisine: selectedCuisine && selectedCuisine !== 'None' ? selectedCuisine : undefined,
        servings: selectedServings || undefined,
        cookingTime: selectedCookingTime || undefined,
        cookware: selectedCookware,
      });
      console.log('✅ Navigation triggered successfully');
    } catch (error) {
      console.error('❌ Navigation error:', error);
      Alert.alert('Error', 'Failed to navigate to loading screen. Please try again.');
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleClose}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate Recipe from Ingredients</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ingredients Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients *</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter ingredient (e.g., chicken, tomato, onion)"
              value={ingredientInput}
              onChangeText={setIngredientInput}
              onSubmitEditing={handleAddIngredient}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddIngredient}
              disabled={!ingredientInput.trim()}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.quickIngredientsSection}>
            <View style={styles.quickIngredientsHeader}>
              <Text style={styles.quickIngredientsLabel}>Popular Ingredients</Text>
              <Text style={styles.quickIngredientsHint}>Tap to add instantly</Text>
            </View>
            <View style={styles.quickIngredientsWrap}>
              {QUICK_INGREDIENTS.map((item) => {
                const isSelected = ingredients.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.quickIngredientChip,
                      isSelected && styles.quickIngredientChipSelected,
                    ]}
                    onPress={() => handleQuickAddIngredient(item)}
                  >
                    <Text
                      style={[
                        styles.quickIngredientChipText,
                        isSelected && styles.quickIngredientChipTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Ingredients List */}
          {ingredients.length > 0 && (
            <View style={styles.ingredientsList}>
              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientTag}>
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveIngredient(ingredient)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {ingredients.length === 0 && (
            <Text style={styles.errorText}>Please add at least one ingredient</Text>
          )}
        </View>

        {/* Cookware - Required, Second */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cookware *</Text>
          <View style={styles.optionsGrid}>
            {COOKWARE_OPTIONS.map((cookware) => (
              <TouchableOpacity
                key={cookware}
                style={[
                  styles.optionButton,
                  selectedCookware === cookware && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedCookware(cookware)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedCookware === cookware && styles.optionTextSelected,
                  ]}
                >
                  {cookware}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {!selectedCookware && (
            <Text style={styles.errorText}>Please select a cookware</Text>
          )}
        </View>

        {/* Cooking Time - Optional */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooking Time (Optional)</Text>
          <View style={styles.optionsGrid}>
            {COOKING_TIME_OPTIONS.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.optionButton,
                  selectedCookingTime === time && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedCookingTime(time === selectedCookingTime ? '' : time)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedCookingTime === time && styles.optionTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedCookingTime && (
            <Text style={styles.helperText}>
              {selectedCookingTime === 'Quick' && 'Quick: Less than 30 minutes'}
              {selectedCookingTime === 'Medium' && 'Medium: 30-60 minutes'}
              {selectedCookingTime === 'Long' && 'Long: More than 60 minutes'}
            </Text>
          )}
        </View>

        {/* Dietary Restrictions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Restrictions (Optional)</Text>
          <View style={styles.optionsGrid}>
            {DIETARY_RESTRICTIONS.map((restriction) => (
              <TouchableOpacity
                key={restriction}
                style={[
                  styles.optionButton,
                  dietaryRestrictions.includes(restriction) && styles.optionButtonSelected,
                ]}
                onPress={() => handleToggleDietaryRestriction(restriction)}
              >
                <Text
                  style={[
                    styles.optionText,
                    dietaryRestrictions.includes(restriction) && styles.optionTextSelected,
                  ]}
                >
                  {restriction}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cuisine */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuisine (Optional)</Text>
          <View style={styles.optionsGrid}>
            {CUISINES.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.optionButton,
                  selectedCuisine === cuisine && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedCuisine(cuisine === selectedCuisine ? '' : cuisine)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedCuisine === cuisine && styles.optionTextSelected,
                  ]}
                >
                  {cuisine}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Servings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servings (Optional)</Text>
          <View style={styles.optionsGrid}>
            {SERVINGS_OPTIONS.map((serving) => (
              <TouchableOpacity
                key={serving}
                style={[
                  styles.optionButton,
                  selectedServings === serving && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedServings(serving === selectedServings ? '' : serving)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedServings === serving && styles.optionTextSelected,
                  ]}
                >
                  {serving}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Generate Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.generateButton, 
            (ingredients.length === 0 || !selectedCookware) && styles.generateButtonDisabled
          ]}
          onPress={handleGenerate}
          disabled={ingredients.length === 0 || !selectedCookware}
        >
          <Ionicons name="sparkles" size={20} color="#fff" />
          <Text style={styles.generateButtonText}>Generate Recipe</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24),
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
    paddingBottom: 100,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#d96709',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickIngredientsSection: {
    marginBottom: 12,
  },
  quickIngredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickIngredientsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  quickIngredientsHint: {
    fontSize: 12,
    color: '#999',
  },
  quickIngredientsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginRight: -8,
  },
  quickIngredientChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    minWidth: 64,
    alignItems: 'center',
  },
  quickIngredientChipSelected: {
    backgroundColor: '#d96709',
    borderColor: '#d96709',
  },
  quickIngredientChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  quickIngredientChipTextSelected: {
    color: '#fff',
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  ingredientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  ingredientText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
    marginRight: 6,
  },
  removeButton: {
    padding: 2,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginRight: -8,
    marginBottom: -8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  optionButtonSelected: {
    backgroundColor: '#d96709',
    borderColor: '#d96709',
  },
  optionText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  generateButton: {
    backgroundColor: '#d96709',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    color: '#d96709',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default GenerateRecipeScreen;

