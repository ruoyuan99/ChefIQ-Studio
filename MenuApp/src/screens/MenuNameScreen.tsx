import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RecipeNameScreenProps {
  navigation: any;
}

const RecipeNameScreen: React.FC<RecipeNameScreenProps> = ({ navigation }) => {
  const [recipeName, setRecipeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const handleContinue = () => {
    if (!recipeName.trim()) {
      Alert.alert('Error', 'Please enter a recipe name');
      return;
    }

    if (recipeName.trim().length < 3) {
      Alert.alert('Error', 'Recipe name must be at least 3 characters long');
      return;
    }

    setIsLoading(true);
    
    // Simulate a brief loading state
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('CreateRecipe', { recipeName: recipeName.trim() });
    }, 500);
  };

  const handleSkip = () => {
    navigation.navigate('CreateRecipe');
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  const handleInputPress = () => {
    if (!isInputFocused) {
      textInputRef.current?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Recipe</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="restaurant" size={64} color="#4CAF50" />
            </View>
            
            <Text style={styles.title}>Let's start by giving your recipe a name</Text>
            <Text style={styles.subtitle}>
              Choose a descriptive name that will help others find your recipe
            </Text>

            <View style={styles.inputContainer}>
              <TouchableOpacity 
                style={[
                  styles.textInput,
                  isInputFocused && styles.textInputFocused
                ]}
                onPress={handleInputPress}
                activeOpacity={1}
              >
                <TextInput
                  ref={textInputRef}
                  style={styles.textInputInner}
                  value={recipeName}
                  onChangeText={setRecipeName}
                  placeholder="Enter recipe name"
                  placeholderTextColor="#999"
                  maxLength={50}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </TouchableOpacity>
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>
                  {recipeName.length}/50
                </Text>
              </View>
            </View>

            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Popular recipe names:</Text>
              <View style={styles.suggestionsList}>
                {[
                  'Grandma\'s Chocolate Chip Cookies',
                  'Classic Spaghetti Carbonara',
                  'Homemade Chicken Noodle Soup',
                  'Perfect Chocolate Cake',
                  'Grilled Salmon with Herbs',
                  'Traditional Beef Stew'
                ].map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => setRecipeName(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!recipeName.trim() || isLoading) && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!recipeName.trim() || isLoading}
          >
            {isLoading ? (
              <Text style={styles.continueButtonText}>Creating...</Text>
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
    justifyContent: 'center',
    minHeight: 500,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 32,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInputFocused: {
    borderColor: '#4CAF50',
  },
  textInputInner: {
    padding: 16,
    fontSize: 18,
    minHeight: 56,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: '#999',
  },
  suggestionsContainer: {
    marginTop: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionItem: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default RecipeNameScreen;
