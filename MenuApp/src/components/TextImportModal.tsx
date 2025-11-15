import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { importRecipeFromText } from '../services/recipeImportService';

interface TextImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (recipe: any) => void;
}

const TextImportModal: React.FC<TextImportModalProps> = ({
  visible,
  onClose,
  onImport,
}) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAIImport = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter recipe text');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Importing recipe from text...');
      const recipe = await importRecipeFromText(text.trim());
      console.log('✅ Recipe imported successfully:', recipe.title);
      
      // Import the parsed recipe
      onImport(recipe);
      setText('');
      onClose();
    } catch (error: any) {
      console.error('❌ Recipe import error:', error);
      let errorMessage = error.message || 'Failed to import recipe from text.';
      
      // Provide helpful error messages
      if (errorMessage.includes('AI text parsing is not available')) {
        errorMessage = 
          'AI text parsing requires OpenAI API key.\n\n' +
          'Please set OPENAI_API_KEY in the backend .env file to enable text parsing.';
      } else if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
        errorMessage = 
          'Cannot connect to backend server.\n\n' +
          'If using a real device:\n' +
          '1. Make sure your device and computer are on the same Wi-Fi network\n' +
          '2. Update LOCAL_NETWORK_IP in src/config/recipeImport.ts with your computer\'s IP\n' +
          '3. Restart the backend server\n\n' +
          'If using simulator/emulator:\n' +
          '1. Make sure backend server is running on port 3001\n' +
          '2. Check backend server logs\n\n' +
          `Original error: ${error.message}`;
      }
      
      Alert.alert('Import Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Import Recipe from Text</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            nestedScrollEnabled={true}
          >
            <Text style={styles.label}>Paste Recipe Text</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Paste your recipe text here...&#10;&#10;Example:&#10;Chocolate Chip Cookies&#10;&#10;Ingredients:&#10;2 cups flour&#10;1 cup sugar&#10;...&#10;&#10;Instructions:&#10;1. Mix ingredients...&#10;2. Bake at 350°F..."
              placeholderTextColor="#999"
              value={text}
              onChangeText={setText}
              multiline={true}
              textAlignVertical="top"
              numberOfLines={10}
            />
            <Text style={styles.hint}>
              Paste any recipe text. AI will extract and structure the information.
            </Text>

            <TouchableOpacity
              style={[
                styles.button, 
                styles.aiImportButton, 
                styles.singleButton,
                (loading || !text.trim()) && styles.buttonDisabled
              ]}
              onPress={handleAIImport}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={20} color="#fff" />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>AI Import</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#d96709" style={{ marginRight: 12 }} />
              <Text style={styles.infoText}>
                AI will extract recipe title, ingredients, instructions, cooking time, servings, and more from your text.
              </Text>
            </View>
          </ScrollView>
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
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    // Content will scroll if needed
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    minHeight: 200,
    maxHeight: 300,
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  singleButton: {
    width: '100%',
  },
  aiImportButton: {
    backgroundColor: '#9c27b0', // Purple color for AI
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default TextImportModal;

