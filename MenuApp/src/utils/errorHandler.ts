import { Alert } from 'react-native';

/**
 * Error handler utility that only shows error alerts in development mode
 * In production, errors are only logged to console
 * 
 * @param title - Error title (default: 'Error')
 * @param message - Error message
 * @param options - Optional Alert options
 */
export const showError = (
  title: string = 'Error',
  message: string,
  options?: { text?: string; onPress?: () => void }[]
) => {
  // Always log errors to console
  console.error(`[Error] ${title}: ${message}`);
  
  // Only show Alert in development mode
  if (__DEV__) {
    Alert.alert(title, message, options || [{ text: 'OK' }]);
  }
};

/**
 * Show error alert (always shows, for critical errors that users need to see)
 * Use this for errors that users must be aware of even in production
 * 
 * @param title - Error title
 * @param message - Error message
 * @param options - Optional Alert options
 */
export const showCriticalError = (
  title: string,
  message: string,
  options?: { text?: string; onPress?: () => void }[]
) => {
  console.error(`[Critical Error] ${title}: ${message}`);
  Alert.alert(title, message, options || [{ text: 'OK' }]);
};

