import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateRecipeFromIngredients } from '../services/recipeImportService';

interface GenerateRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (recipe: any) => void;
}

const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
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

const COOKWARE_OPTIONS = [
  'Stovetop – Pan or Pot',
  'Air Fryer',
  'Oven',
  'Grill',
  'Slow Cooker',
  'Pressure Cooker',
  'Wok',
];

const GenerateRecipeModal: React.FC<GenerateRecipeModalProps> = ({
  visible,
  onClose,
  onGenerate,
}) => {
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [selectedServings, setSelectedServings] = useState<string>('');
  const [selectedCookware, setSelectedCookware] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleAddIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setIngredientInput('');
    }
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

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    if (!selectedCookware) {
      Alert.alert('Error', 'Please select a cookware');
      return;
    }

    setLoading(true);
    try {
      const recipe = await generateRecipeFromIngredients(ingredients, {
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
        cuisine: selectedCuisine && selectedCuisine !== 'None' ? selectedCuisine : undefined,
        servings: selectedServings || undefined,
        cookware: selectedCookware,
      });

      onGenerate(recipe);
      handleClose();
    } catch (error: any) {
      console.error('Error generating recipe:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to generate recipe. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIngredientInput('');
    setIngredients([]);
    setDietaryRestrictions([]);
    setSelectedCuisine('');
    setSelectedServings('');
    setSelectedCookware('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Generate from Ingredients</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Ingredients Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Add ingredient"
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
            </View>

            {/* Cookware - Required, Second */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cookware *</Text>
              <View style={styles.optionsGrid}>
                {COOKWARE_OPTIONS.filter(cookware => cookware !== 'None').map((cookware) => (
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
              style={[styles.generateButton, (loading || ingredients.length === 0 || !selectedCookware) && styles.generateButtonDisabled]}
              onPress={handleGenerate}
              disabled={loading || ingredients.length === 0 || !selectedCookware}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.generateButtonText}>Generate Recipe</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: 500,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
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
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  ingredientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 14,
    color: '#333',
    marginRight: 6,
  },
  removeButton: {
    padding: 2,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#d96709',
    borderColor: '#d96709',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
});

export default GenerateRecipeModal;

