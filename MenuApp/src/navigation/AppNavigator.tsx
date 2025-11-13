import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SplashScreen from '../screens/SplashScreen';
import RecipeListScreen from '../screens/RecipeListScreen';
import RecipeNameScreen from '../screens/RecipeNameScreen';
import CreateRecipeScreen from '../screens/CreateRecipeScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import CookStepScreen from '../screens/CookStepScreen';
import ShareRecipeScreen from '../screens/ShareRecipeScreen';
import FavoriteRecipeScreen from '../screens/FavoriteRecipeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import GroceriesScreen from '../screens/GroceriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SupabaseTestScreen from '../screens/SupabaseTestScreen';
import DataMigrationScreen from '../screens/DataMigrationScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import GenerateRecipeScreen from '../screens/GenerateRecipeScreen';
import GenerateRecipeLoadingScreen from '../screens/GenerateRecipeLoadingScreen';
import GenerateRecipeResultsScreen from '../screens/GenerateRecipeResultsScreen';
import ChefIQChallengeScreen from '../screens/ChefIQChallengeScreen';
import PointsHistoryScreen from '../screens/PointsHistoryScreen';
import BottomTabNavigator from '../components/BottomTabNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: {
            backgroundColor: 'white',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
          },
          headerTintColor: '#333',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
        {/** Register screen removed for competition build */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Recipe App',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="RecipeList"
          component={RecipeListScreen}
          options={{
            title: 'My Recipes',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="RecipeName"
          component={RecipeNameScreen}
          options={{
            title: 'Create New Recipe',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="CreateRecipe"
          component={CreateRecipeScreen}
          options={{
            title: 'Create New Recipe',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="EditRecipe"
          component={CreateRecipeScreen}
          options={{
            title: 'Edit Recipe',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="RecipeDetail"
          component={RecipeDetailScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CookStep"
          component={CookStepScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SupabaseTest"
          component={SupabaseTestScreen}
          options={{
            title: 'Supabase Test',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="DataMigration"
          component={DataMigrationScreen}
          options={{
            title: 'Data Migration',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="ShareRecipe"
          component={ShareRecipeScreen}
          options={{
            title: 'Share Recipe',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="FavoriteRecipe"
          component={FavoriteRecipeScreen}
          options={{
            title: 'Favorite Recipes',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Explore"
          component={ExploreScreen}
          options={{
            title: 'Explore',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Groceries"
          component={GroceriesScreen}
          options={{
            title: 'Groceries',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'Profile',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{
            title: 'Edit Profile',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="GenerateRecipe"
          component={GenerateRecipeScreen}
          options={{
            title: 'Generate from Ingredients',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="GenerateRecipeLoading"
          component={GenerateRecipeLoadingScreen}
          options={{
            title: 'Generating Recipes',
            headerShown: false,
            gestureEnabled: false, // Prevent going back during loading
          }}
        />
        <Stack.Screen
          name="GenerateRecipeResults"
          component={GenerateRecipeResultsScreen}
          options={{
            title: 'Recipe Results',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ChefIQChallenge"
          component={ChefIQChallengeScreen}
          options={{
            title: 'Chef iQ Challenge',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PointsHistory"
          component={PointsHistoryScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
