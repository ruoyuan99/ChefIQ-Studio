/**
 * Recipe Import Backend Configuration
 * 
 * Configure your backend server URL here.
 * For development: use localhost
 * For production: replace with your deployed backend URL
 */

import { Platform } from 'react-native';

// Your computer's local network IP (for real devices)
// Update this with your actual IP address if using a real device
// Find it with: ifconfig | grep "inet " | grep -v 127.0.0.1
const LOCAL_NETWORK_IP = '192.168.10.153'; // Update this with your computer's IP

// Development: Local backend server
// Note: 
// - Using local network IP for all cases to ensure it works on both simulators and real devices
// - If you're on iOS simulator and prefer localhost, change to: 'http://localhost:3001'
// - If you're on Android emulator and prefer 10.0.2.2, change to: 'http://10.0.2.2:3001'
const getDevBackendUrl = (): string => {
  // Use local network IP - works for both simulators and real devices
  // This ensures consistency across all platforms
  return `http://${LOCAL_NETWORK_IP}:3001`;
};

// Production: Replace with your deployed backend URL
// Examples:
// - Heroku: 'https://your-app.herokuapp.com'
// - Railway: 'https://your-app.railway.app'
// - Render: 'https://your-app.onrender.com'
// - Custom domain: 'https://api.yourdomain.com'
const PROD_BACKEND_URL = 'https://your-backend-domain.com';

/**
 * Get the backend URL based on environment
 * Supports environment variables for flexible configuration
 */
export const getBackendUrl = (): string => {
  // Priority 1: Use environment variable if available (works for both dev and prod)
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  
  // Priority 2: Environment-specific environment variables
  if (__DEV__) {
    // Development: Use dev-specific env var or fallback to local network IP
    if (process.env.EXPO_PUBLIC_BACKEND_URL_DEV) {
      return process.env.EXPO_PUBLIC_BACKEND_URL_DEV;
    }
    return getDevBackendUrl();
  }
  
  // Production: Use prod-specific env var or fallback to configured URL
  if (process.env.EXPO_PUBLIC_BACKEND_URL_PROD) {
    return process.env.EXPO_PUBLIC_BACKEND_URL_PROD;
  }
  
  return PROD_BACKEND_URL;
};

/**
 * Recipe Import API endpoint
 */
export const RECIPE_IMPORT_ENDPOINT = '/api/import-recipe';

/**
 * Recipe Optimize API endpoint
 */
export const RECIPE_OPTIMIZE_ENDPOINT = '/api/optimize-recipe';

/**
 * Recipe Scan from Image API endpoint
 */
export const RECIPE_SCAN_ENDPOINT = '/api/scan-recipe';

/**
 * Recipe Import from Text API endpoint
 */
export const RECIPE_TEXT_IMPORT_ENDPOINT = '/api/import-recipe-text';

/**
 * Generate Recipe from Ingredients API endpoint
 */
export const RECIPE_GENERATE_FROM_INGREDIENTS_ENDPOINT = '/api/generate-recipe-from-ingredients';

