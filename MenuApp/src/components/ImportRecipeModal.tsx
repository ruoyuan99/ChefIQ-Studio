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
import { Buttons, Colors } from '../styles/theme';
import { importRecipeFromURL, importRecipeViaBackend, optimizeRecipeViaBackend } from '../services/recipeImportService';

interface ImportRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  // Backend now returns complete Recipe schema
  onImport: (recipe: any) => void;
}

const ImportRecipeModal: React.FC<ImportRecipeModalProps> = ({
  visible,
  onClose,
  onImport,
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isBlocked, setIsBlocked] = useState(false); // Track if website blocks import

  const handleImport = () => {
    if (!previewData) {
      Alert.alert('Error', 'Please preview the recipe first');
      return;
    }

    if (isBlocked) {
      Alert.alert(
        'Import Not Available',
        'This website does not allow importing recipes. The website source has restricted access to protect intellectual property. Please try importing from a different recipe website.',
        [{ text: 'OK' }]
      );
      return;
    }

    onImport(previewData);
    setUrl('');
    setPreviewData(null);
    setIsBlocked(false);
    onClose();
  };

  const handleAIImport = async () => {
    if (!previewData) {
      Alert.alert('Error', 'Please preview the recipe first');
      return;
    }

    if (isBlocked) {
      Alert.alert(
        'Import Not Available',
        'This website does not allow importing recipes. The website source has restricted access to protect intellectual property. Please try importing from a different recipe website.',
        [{ text: 'OK' }]
      );
      return;
    }

    setOptimizing(true);
    try {
      const optimizedRecipe = await optimizeRecipeViaBackend(previewData);
      onImport(optimizedRecipe);
      setUrl('');
      setPreviewData(null);
      setIsBlocked(false);
      onClose();
    } catch (error: any) {
      console.error('AI optimization error:', error);
      let errorMessage = error.message || 'Failed to optimize recipe with AI.';
      
      // Check if it's a website restriction error
      if (errorMessage.includes('does not allow importing') || 
          errorMessage.includes('restricted access') ||
          errorMessage.includes('protect intellectual property')) {
        setIsBlocked(true);
        setPreviewData(null);
        Alert.alert(
          'Import Not Available',
          'This website does not allow importing recipes. The website source has restricted access to protect intellectual property. Please try importing from a different recipe website.',
          [{ text: 'OK' }]
        );
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
        Alert.alert('AI Optimization Failed', errorMessage);
      } else if (errorMessage.includes('AI optimization is not available')) {
        errorMessage = 
          'AI optimization requires OpenAI API key.\n\n' +
          'Please set OPENAI_API_KEY in the backend .env file to enable AI optimization.';
        Alert.alert('AI Optimization Failed', errorMessage);
      } else {
        Alert.alert('AI Optimization Failed', errorMessage);
      }
    } finally {
      setOptimizing(false);
    }
  };

  const handlePreview = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    // Reset blocked state when trying a new URL
    setIsBlocked(false);
    setPreviewData(null);
    setLoading(true);
    
    try {
      // Try backend first, fallback to direct parsing
      let recipe;
      try {
        recipe = await importRecipeViaBackend(url);
        // Success - clear blocked state
        setIsBlocked(false);
      } catch (backendError: any) {
        console.log('Backend import failed:', backendError);
        const backendMsg = String((backendError && (backendError.message as any)) || backendError || '');
        // If backend indicates website restriction/IP protection, do NOT fallback to direct parsing
        if (
          backendMsg.includes('does not allow importing') ||
          backendMsg.includes('restricted access') ||
          backendMsg.includes('protect intellectual property')
        ) {
          throw backendError; // handled by outer catch: will alert + disable buttons
        }
        // Otherwise, try direct parsing as a fallback
        recipe = await importRecipeFromURL(url);
        // Success - clear blocked state
        setIsBlocked(false);
      }
      setPreviewData(recipe);
    } catch (error: any) {
      console.error('Preview error:', error);
      let errorMessage = error.message || 'Failed to preview recipe.';
      
      // Check if it's a website restriction error
      if (errorMessage.includes('does not allow importing') || 
          errorMessage.includes('restricted access') ||
          errorMessage.includes('protect intellectual property')) {
        // Set blocked state to disable import buttons
        setIsBlocked(true);
        setPreviewData(null); // Clear preview data
        
        // Show alert
        Alert.alert(
          'Import Not Available',
          'This website does not allow importing recipes. The website source has restricted access to protect intellectual property. Please try importing from a different recipe website.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
        // Network connection error - don't block, just show error
        setIsBlocked(false);
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
        Alert.alert('Preview Failed', errorMessage);
      } else {
        // Other errors - don't block, just show error
        setIsBlocked(false);
        Alert.alert('Preview Failed', errorMessage);
      }
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
            <Text style={styles.title}>Import Recipe from Website</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            nestedScrollEnabled={true}
          >
            <Text style={styles.label}>Recipe URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://www.recipetineats.com/chicken-chasseur/"
              placeholderTextColor="#999"
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                // Reset blocked state when URL changes
                if (isBlocked) {
                  setIsBlocked(false);
                  setPreviewData(null);
                }
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.hint}>
              Enter a recipe URL that supports Recipe Schema.org format
            </Text>

            {previewData && (
              <View style={styles.preview}>
                <Text style={styles.previewTitle}>Preview</Text>
                <Text style={styles.previewText}>
                  <Text style={styles.bold}>Title:</Text> {previewData.title}
                </Text>
                {previewData.description && (
                  <Text style={styles.previewText} numberOfLines={2}>
                    <Text style={styles.bold}>Description:</Text> {previewData.description}
                  </Text>
                )}
                <Text style={styles.previewText}>
                  <Text style={styles.bold}>Ingredients:</Text> {previewData.ingredients.length}
                </Text>
                <Text style={styles.previewText}>
                  <Text style={styles.bold}>Instructions:</Text> {previewData.instructions.length}
                </Text>
              </View>
            )}

            {!previewData ? (
              // Initial state: only show Preview button
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Preview recipe from URL"
                style={[Buttons.secondary.container, { width: '100%', opacity: (loading || !url.trim() || isBlocked) ? 0.6 : 1 }]}
                onPress={handlePreview}
                disabled={loading || !url.trim() || isBlocked}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <>
                    <Ionicons name="eye-outline" size={20} color={Colors.primary} />
                    <Text style={Buttons.secondary.text}>Preview</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              // After preview data: show two buttons - Import and AI Import
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Import recipe"
                  style={[Buttons.primary.container, { flex: 1, marginRight: 8, opacity: (loading || optimizing || isBlocked) ? 0.6 : 1 }]}
                  onPress={handleImport}
                  disabled={loading || optimizing || isBlocked}
                >
                  {loading || optimizing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="download-outline" size={20} color="#fff" />
                      <Text style={Buttons.primary.text}>Import</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="AI Import recipe"
                  style={[Buttons.primary.container, { flex: 1, marginLeft: 8, backgroundColor: '#7B1FA2', opacity: (loading || optimizing || isBlocked) ? 0.6 : 1 }]}
                  onPress={handleAIImport}
                  disabled={loading || optimizing || isBlocked}
                >
                  {optimizing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="sparkles-outline" size={20} color="#fff" />
                      <Text style={Buttons.primary.text}>AI Import</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            {isBlocked && (
              <View style={styles.blockedMessage}>
                <Ionicons name="lock-closed-outline" size={20} color="#d96709" />
                <Text style={styles.blockedText}>
                  This website does not allow importing recipes. Please try a different website.
                </Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#d96709" style={{ marginRight: 12 }} />
              <Text style={styles.infoText}>
                This feature works best with websites that use Recipe Schema.org structured data
                (most major recipe sites support this).
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    minHeight: 48,
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  preview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
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
  previewButton: {
    backgroundColor: '#666',
  },
  importButton: {
    backgroundColor: '#d96709',
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
  blockedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  blockedText: {
    flex: 1,
    fontSize: 14,
    color: '#d96709',
    marginLeft: 8,
    lineHeight: 20,
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

export default ImportRecipeModal;

