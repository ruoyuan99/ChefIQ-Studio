import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Alert, Linking } from 'react-native';

export async function captureCardToPng(componentRef: any, opts?: { width?: number }): Promise<string> {
  const uri = await captureRef(componentRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: opts?.width, // allow high-res export for long cards
  });
  return uri;
}

export async function shareImage(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}

export async function saveToPhotos(uri: string): Promise<void> {
  try {
    // Check if MediaLibrary is available first
    const isAvailable = await MediaLibrary.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Media library is not available on this device');
    }

    // Check current permissions first
    let permissionStatus;
    try {
      permissionStatus = await MediaLibrary.getPermissionsAsync();
    } catch (getPermError: any) {
      // If getPermissionsAsync fails, try requesting directly
      console.log('getPermissionsAsync failed, trying requestPermissionsAsync:', getPermError);
    }

    // Request permissions if not already granted
    let status = permissionStatus?.status;
    if (status !== 'granted') {
      try {
        const result = await MediaLibrary.requestPermissionsAsync();
        status = result.status;
      } catch (permError: any) {
        // Handle the specific AndroidManifest error
        if (permError?.message?.includes('AUDIO permission') || 
            permError?.message?.includes('AndroidManifest')) {
          if (Platform.OS === 'android') {
            Alert.alert(
              'Configuration Required',
              'The app needs to be rebuilt with proper permissions configuration. This feature requires a development build.\n\n' +
              'Note: Expo Go has limited media library access. Please create a development build to use this feature.',
              [
                { text: 'OK', style: 'default' }
              ]
            );
            throw new Error('App needs to be rebuilt with proper permissions. Please create a development build.');
          }
        }
        throw permError;
      }
    }
    
    if (status !== 'granted') {
      if (Platform.OS === 'android') {
        Alert.alert(
          'Permission Required',
          'Please grant storage permission to save images. You can enable it in the app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: async () => {
                try {
                  // Try to open app settings
                  if (await Linking.canOpenURL('app-settings:')) {
                    await Linking.openURL('app-settings:');
                  } else {
                    // Fallback: try to open general settings
                    await Linking.openSettings();
                  }
                } catch (error) {
                  console.error('Failed to open settings:', error);
                  Alert.alert(
                    'Settings', 
                    'Please go to Settings > Apps > Chef iQ > Permissions and enable Storage permission.'
                  );
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to save images. You can enable it in Settings > Privacy > Photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: async () => {
                try {
                  if (await Linking.canOpenURL('app-settings:')) {
                    await Linking.openURL('app-settings:');
                  } else {
                    await Linking.openSettings();
                  }
                } catch (error) {
                  console.error('Failed to open settings:', error);
                }
              }
            }
          ]
        );
      }
      throw new Error('Permission not granted');
    }

    // Save the image to library
    await MediaLibrary.saveToLibraryAsync(uri);

    return;
  } catch (error: any) {
    console.error('Error saving image to photos:', error);
    
    // Provide user-friendly error messages
    if (error?.message?.includes('AndroidManifest') || 
        error?.message?.includes('AUDIO permission') ||
        error?.message?.includes('development build')) {
      // This error is already handled above with a user-friendly message
      throw error;
    }
    
    throw error;
  }
}


