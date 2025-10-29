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
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <RecipeProvider>
        <FavoriteProvider>
          <GroceriesProvider>
            <LikeProvider>
              <TriedProvider>
                <PointsProvider>
                  <SocialStatsProvider>
                    <CommentProvider>
                      <AppNavigator />
                      <StatusBar style="auto" />
                    </CommentProvider>
                  </SocialStatsProvider>
                </PointsProvider>
              </TriedProvider>
            </LikeProvider>
          </GroceriesProvider>
        </FavoriteProvider>
      </RecipeProvider>
    </AuthProvider>
  );
}