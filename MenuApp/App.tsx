import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { RecipeProvider } from './src/contexts/RecipeContext';
import { FavoriteProvider } from './src/contexts/FavoriteContext';
import { GroceriesProvider } from './src/contexts/GroceriesContext';
import { LikeProvider } from './src/contexts/LikeContext';
import { TriedProvider } from './src/contexts/TriedContext';
import { PointsProvider } from './src/contexts/PointsContext';
import { SocialStatsProvider } from './src/contexts/SocialStatsContext';
import { CommentProvider } from './src/contexts/CommentContext';
import { BadgeProvider } from './src/contexts/BadgeContext';
import AppNavigator from './src/navigation/AppNavigator';

// Import debug tools (only in development environment)
if (__DEV__) {
  require('./src/utils/debugAsyncStorage');
  require('./src/utils/clearLocalPoints');
  
  // Global functions available in Chrome DevTools
  // Note: Chrome DevTools cannot directly access React Native modules
  // These functions need to be used in React Native Debugger
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  (global as any).clearPoints = async () => {
    try {
      await AsyncStorage.removeItem('userPoints');
      console.log('✅ Points data cleared');
      return { success: true, message: 'Points data cleared' };
    } catch (error) {
      console.error('❌ Clear failed:', error);
      return { success: false, error };
    }
  };
  
  (global as any).viewPoints = async () => {
    try {
      const data = await AsyncStorage.getItem('userPoints');
      if (data) {
        const parsed = JSON.parse(data);
        console.log('📊 Points data:', parsed);
        return parsed;
      } else {
        console.log('ℹ️ No points data');
        return null;
      }
    } catch (error) {
      console.error('❌ Read failed:', error);
      return null;
    }
  };
  
  console.log('🔧 Chrome DevTools available functions:');
  console.log('  - clearPoints() - Clear points data');
  console.log('  - viewPoints() - View points data');
  console.log('⚠️ Note: These functions need to be used in React Native Debugger, Chrome DevTools may not be able to access them');
}

export default function App() {
  return (
    <AuthProvider>
      <RecipeProvider>
        <FavoriteProvider>
          <GroceriesProvider>
            <LikeProvider>
              <TriedProvider>
                <PointsProvider>
                  <BadgeProvider>
                    <SocialStatsProvider>
                      <CommentProvider>
                        <AppNavigator />
                        <StatusBar style="auto" />
                      </CommentProvider>
                    </SocialStatsProvider>
                  </BadgeProvider>
                </PointsProvider>
              </TriedProvider>
            </LikeProvider>
          </GroceriesProvider>
        </FavoriteProvider>
      </RecipeProvider>
    </AuthProvider>
  );
}