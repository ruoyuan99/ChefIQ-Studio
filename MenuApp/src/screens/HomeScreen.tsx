import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe } from '../contexts/RecipeContext';
import BottomTabNavigator from '../components/BottomTabNavigator';
import ExploreScreen from './ExploreScreen';
import GroceriesScreen from './GroceriesScreen';
import ProfileScreen from './ProfileScreen';
import FavoriteRecipeScreen from './FavoriteRecipeScreen';
import ImportRecipeModal from '../components/ImportRecipeModal';
import ScanRecipeModal from '../components/ScanRecipeModal';
import TextImportModal from '../components/TextImportModal';

interface HomeScreenProps {
  navigation: any;
  route?: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  const { state } = useRecipe();
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'home');
  const [showRecipeOptions, setShowRecipeOptions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showTextImportModal, setShowTextImportModal] = useState(false);

  useEffect(() => {
    console.log('showRecipeOptions changed:', showRecipeOptions);
  }, [showRecipeOptions]);

  // 自动显示创建食谱弹窗
  useEffect(() => {
    // 延迟显示弹窗，确保页面完全加载
    const timer = setTimeout(() => {
      console.log('Auto-showing create recipe modal');
      setShowRecipeOptions(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const recipeStats = {
    totalRecipes: state.recipes.length,
    totalItems: state.recipes.reduce((acc, recipe) => acc + recipe.items.length, 0),
    publicRecipes: state.recipes.filter(recipe => recipe.isPublic).length,
  };

  const quickActions = [
    {
      title: 'Create New Recipe',
      icon: 'add-circle' as any,
      color: '#FF6B35',
      onPress: () => {
        console.log('Create New Recipe clicked, setting showRecipeOptions to true');
        setShowRecipeOptions(true);
      },
    },
    {
      title: 'My Recipes',
      icon: 'restaurant' as any,
      color: '#FF6B35',
      onPress: () => navigation.navigate('RecipeList'),
    },
    {
      title: 'Favorite Recipe',
      icon: 'heart' as any,
      color: '#FF6B35',
      onPress: () => setActiveTab('favorite'),
    },
  ];

  const handleCreateNewRecipe = () => {
    setShowRecipeOptions(false);
    navigation.navigate('RecipeName');
  };

  const handleImportFromWebsite = () => {
    setShowRecipeOptions(false);
    // Show import modal directly
    setShowImportModal(true);
  };

  const handleImportRecipe = (importedRecipe: any) => {
    // Backend now returns complete Recipe schema
    // Navigate to CreateRecipe screen with imported data
    navigation.navigate('CreateRecipe', { 
      importedRecipe: importedRecipe 
    });
  };

  const handleScanFromImage = () => {
    setShowRecipeOptions(false);
    setShowScanModal(true);
  };

  const handleScanImport = (recipe: any, imageUri?: string) => {
    setShowScanModal(false);
    // Navigate to CreateRecipe screen with scanned recipe and image URI
    navigation.navigate('CreateRecipe', {
      importedRecipe: recipe,
      scannedImageUri: imageUri, // Pass the image URI to use as recipe photo
    });
  };

  const handleImportFromText = () => {
    setShowRecipeOptions(false);
    setShowTextImportModal(true);
  };

  const handleTextImport = (recipe: any) => {
    setShowTextImportModal(false);
    // Navigate to CreateRecipe screen with imported recipe
    navigation.navigate('CreateRecipe', {
      importedRecipe: recipe,
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Recipe App</Text>
              <Text style={styles.subtitle}>Smart Recipe Management</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{recipeStats.totalRecipes}</Text>
                <Text style={styles.statLabel}>Total Recipes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{recipeStats.totalItems}</Text>
                <Text style={styles.statLabel}>Total Dishes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{recipeStats.publicRecipes}</Text>
                <Text style={styles.statLabel}>Public Recipes</Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.actionButton, { borderLeftColor: action.color }]}
                  onPress={action.onPress}
                >
                  <View style={styles.actionContent}>
                    <Ionicons
                      name={action.icon}
                      size={24}
                      color={action.color}
                    />
                    <Text style={styles.actionButtonText}>{action.title}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {state.recipes.length > 0 && (
              <View style={styles.recentContainer}>
                <Text style={styles.sectionTitle}>Recent Recipes</Text>
                {state.recipes.slice(0, 3).map(recipe => (
                  <TouchableOpacity
                    key={recipe.id}
                    style={styles.recentMenu}
                    onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
                  >
                    <View style={styles.recentMenuContent}>
                      <Text style={styles.recentMenuTitle}>{recipe.title}</Text>
                      <Text style={styles.recentMenuItems}>
                        {recipe.items.length} items
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        );
      case 'favorite':
        return <FavoriteRecipeScreen navigation={navigation} />;
      case 'explore':
        return <ExploreScreen navigation={navigation} />;
      case 'groceries':
        return <GroceriesScreen navigation={navigation} />;
      case 'profile':
        return <ProfileScreen navigation={navigation} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
      <BottomTabNavigator 
        navigation={navigation} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreatePress={() => setShowRecipeOptions(true)}
      />
      
      {/* Recipe Creation Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRecipeOptions}
        onRequestClose={() => setShowRecipeOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create Recipe</Text>
            <Text style={styles.modalSubtitle}>Choose how you'd like to create your recipe</Text>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleCreateNewRecipe}
            >
              <Text style={styles.optionTitle}>Create New Recipe</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleImportFromWebsite}
            >
              <Text style={styles.optionTitle}>Import from Website</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleScanFromImage}
            >
              <Text style={styles.optionTitle}>Scan from Image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleImportFromText}
            >
              <Text style={styles.optionTitle}>Import from Text</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: '#666' }]}
              onPress={() => setShowRecipeOptions(false)}
            >
              <Text style={styles.optionTitle}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Import Recipe Modal */}
      <ImportRecipeModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(recipe) => {
          setShowImportModal(false);
          handleImportRecipe(recipe);
        }}
      />

      {/* Scan Recipe Modal */}
      <ScanRecipeModal
        visible={showScanModal}
        onClose={() => setShowScanModal(false)}
        onImport={handleScanImport}
      />

      {/* Text Import Modal */}
      <TextImportModal
        visible={showTextImportModal}
        onClose={() => setShowTextImportModal(false)}
        onImport={handleTextImport}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 100, // 增加底部流白空间
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 16,
    flex: 1,
  },
  recentContainer: {
    marginBottom: 20,
  },
  recentMenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentMenuContent: {
    flex: 1,
  },
  recentMenuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  recentMenuItems: {
    fontSize: 14,
    color: '#666',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default HomeScreen;