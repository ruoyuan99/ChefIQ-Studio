import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe } from '../contexts/RecipeContext';
import { useSocialStats } from '../contexts/SocialStatsContext';
import PointsDisplay from '../components/PointsDisplay';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { state } = useRecipe();
  const { getStats } = useSocialStats();

  // 计算用户所有食谱的社交统计
  const calculateSocialStats = () => {
    let totalLikes = 0;
    let totalFavorites = 0;
    let totalTried = 0;
    let totalViews = 0;

    state.recipes.forEach(recipe => {
      const stats = getStats(recipe.id);
      totalLikes += stats.likes;
      totalFavorites += stats.favorites;
      totalTried += stats.tried;
      totalViews += stats.views;
    });

    return {
      totalLikes,
      totalFavorites,
      totalTried,
      totalViews,
    };
  };

  const socialStats = calculateSocialStats();

  const userStats = {
    totalRecipes: state.recipes.length,
    publicRecipes: state.recipes.filter(recipe => recipe.isPublic).length,
    draftRecipes: state.recipes.filter(recipe => !recipe.isPublic).length,
    totalDishes: state.recipes.reduce((acc, recipe) => acc + recipe.items.length, 0),
    ...socialStats,
  };

  const menuItems = [
    {
      title: 'My Recipes',
      icon: 'restaurant-outline',
      onPress: () => navigation.navigate('RecipeList'),
    },
    {
      title: 'Favorite Recipes',
      icon: 'heart-outline',
      onPress: () => navigation.navigate('FavoriteRecipe'),
    },
    {
      title: 'Supabase Test',
      icon: 'server-outline',
      onPress: () => navigation.navigate('SupabaseTest'),
    },
    {
      title: 'Data Migration',
      icon: 'cloud-upload-outline',
      onPress: () => navigation.navigate('DataMigration'),
    },
    {
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => {
        // TODO: Navigate to settings
      },
    },
    {
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => {
        // TODO: Navigate to help
      },
    },
    {
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => {
        // TODO: Navigate to about
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Points Display */}
        <PointsDisplay />
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#FF6B35" />
            </View>
          </View>
          <Text style={styles.userName}>Recipe Chef</Text>
          <Text style={styles.userEmail}>chef@recipeapp.com</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="restaurant" size={18} color="#FF6B35" style={styles.statIcon} />
              <Text style={styles.statNumber}>{userStats.totalRecipes}</Text>
              <Text style={styles.statLabel}>My Recipes</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="globe" size={18} color="#FF6B35" style={styles.statIcon} />
              <Text style={styles.statNumber}>{userStats.publicRecipes}</Text>
              <Text style={styles.statLabel}>Published</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="eye" size={18} color="#FF6B35" style={styles.statIcon} />
              <Text style={styles.statNumber}>{userStats.totalViews}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="heart" size={18} color="#FF6B35" style={styles.statIcon} />
              <Text style={styles.statNumber}>{userStats.totalLikes}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="bookmark" size={18} color="#FF6B35" style={styles.statIcon} />
              <Text style={styles.statNumber}>{userStats.totalFavorites}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={18} color="#FF6B35" style={styles.statIcon} />
              <Text style={styles.statNumber}>{userStats.totalTried}</Text>
              <Text style={styles.statLabel}>Tried</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Menu</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon} size={24} color="#666" />
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Recipe App</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
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
    paddingBottom: 20,
  },
  profileHeader: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    backgroundColor: 'white',
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '31%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: 'white',
    marginTop: 16,
  },
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 20,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
  },
});

export default ProfileScreen;
