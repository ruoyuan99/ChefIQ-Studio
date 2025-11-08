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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { scanRecipeFromImage } from '../services/recipeImportService';

interface ScanRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (recipe: any, imageUri?: string) => void;
}

const ScanRecipeModal: React.FC<ScanRecipeModalProps> = ({
  visible,
  onClose,
  onImport,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const handleSelectImage = async () => {
    // Request camera roll permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required to scan recipes from images!');
      return;
    }

    // Show image picker options
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {
          text: 'Choose from Library',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
                base64: true,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setSelectedImage(asset.uri);
                setImageBase64(asset.base64);
              }
            } catch (error: any) {
              console.error('Error picking image:', error);
              Alert.alert('Error', 'Failed to pick image. Please try again.');
            }
          },
        },
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.granted === false) {
                Alert.alert('Permission Required', 'Permission to access camera is required!');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.8,
                base64: true,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setSelectedImage(asset.uri);
                setImageBase64(asset.base64);
              }
            } catch (error: any) {
              console.error('Error taking photo:', error);
              Alert.alert('Error', 'Failed to take photo. Please try again.');
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleAIImport = async () => {
    if (!imageBase64) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setLoading(true);
    try {
      console.log('📸 Scanning recipe from image...');
      const recipe = await scanRecipeFromImage(imageBase64);
      console.log('✅ Recipe scanned successfully:', recipe.title);
      
      // Import the scanned recipe
      onImport(recipe, selectedImage || undefined);
      setSelectedImage(null);
      setImageBase64(undefined);
      onClose();
    } catch (error: any) {
      console.error('❌ Recipe scan error:', error);
      let errorMessage = error.message || 'Failed to scan recipe from image.';
      
      // Provide helpful error messages
      if (errorMessage.includes('AI image scanning is not available')) {
        errorMessage = 
          'AI image scanning requires OpenAI API key.\n\n' +
          'Please set OPENAI_API_KEY in the backend .env file to enable image scanning.';
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
      
      Alert.alert('Scan Failed', errorMessage);
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
            <Text style={styles.title}>Scan Recipe from Image</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.label}>Select Recipe Image</Text>
            
            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={handleSelectImage}
                >
                  <Ionicons name="camera-outline" size={20} color="#d96709" />
                  <Text style={styles.changeImageText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectImageButton}
                onPress={handleSelectImage}
              >
                <Ionicons name="image-outline" size={40} color="#d96709" />
                <Text style={styles.selectImageText}>Select Image</Text>
                <Text style={styles.selectImageHint}>Choose from library or take a photo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button, 
                styles.aiImportButton, 
                styles.singleButton,
                (loading || !selectedImage) && styles.buttonDisabled
              ]}
              onPress={handleAIImport}
              disabled={loading || !selectedImage}
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
                AI will analyze the image and extract recipe information including title, ingredients, instructions, and more.
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
  selectImageButton: {
    borderWidth: 2,
    borderColor: '#d96709',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#FFF3E0',
  },
  selectImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d96709',
    marginTop: 12,
  },
  selectImageHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  imageContainer: {
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
  },
  changeImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d96709',
    marginLeft: 8,
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

export default ScanRecipeModal;

