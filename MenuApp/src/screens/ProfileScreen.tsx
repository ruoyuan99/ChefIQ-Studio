import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Buttons, Colors } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { useRecipe } from '../contexts/RecipeContext';
import { useSocialStats } from '../contexts/SocialStatsContext';
import { useBadges } from '../contexts/BadgeContext';
import PointsDisplay from '../components/PointsDisplay';
import OptimizedImage from '../components/OptimizedImage';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { state } = useRecipe();
  const { getStats } = useSocialStats();
  const { badges, getBadgesByCategory, unlockedBadges } = useBadges();

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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.navigate('Login');
          }
        }
      ]
    );
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
      title: 'Sign Out',
      icon: 'log-out-outline',
      onPress: handleSignOut,
      style: 'destructive'
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Points Display */}
        <PointsDisplay onPress={() => navigation.navigate('PointsHistory')} />
        
        {/* Chef iQ Challenge Card - Prominent placement at top */}
        <TouchableOpacity
          style={styles.challengeCard}
          onPress={() => navigation.navigate('ChefIQChallenge')}
          activeOpacity={0.8}
        >
          <View style={styles.challengeCardContent}>
            <View style={styles.challengeIconContainer}>
              <Ionicons name="trophy" size={32} color="#FFD700" />
            </View>
            <View style={styles.challengeTextContainer}>
              <Text style={styles.challengeTitle}>Chef iQ Challenge</Text>
              <Text style={styles.challengeDescription}>Test your cooking skills and compete with others!</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
          </View>
        </TouchableOpacity>
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {user?.avatar_url ? (
                <OptimizedImage
                  source={user.avatar_url}
                  style={styles.avatarImage}
                  contentFit="cover"
                  showLoader={true}
                  cachePolicy="memory-disk"
                  priority="high"
                />
              ) : (
              <Ionicons name="person" size={40} color="#FF6B35" />
              )}
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'Recipe Chef'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'chef@recipeapp.com'}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            style={[Buttons.secondary.container, { paddingVertical: 10, paddingHorizontal: 16 }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={16} color={Colors.primary} />
            <Text style={Buttons.secondary.text}>Edit Profile</Text>
          </TouchableOpacity>
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

        {/* Badges Section */}
        <View style={styles.badgesContainer}>
          <View style={styles.badgesHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.badgesCount}>
              {unlockedBadges.size} / {badges.length}
            </Text>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesScrollContent}
            style={styles.badgesScrollView}
          >
            {badges
              .sort((a, b) => {
                // Sort: unlocked badges first, then locked badges
                const aUnlocked = unlockedBadges.has(a.id);
                const bUnlocked = unlockedBadges.has(b.id);
                if (aUnlocked && !bUnlocked) return -1;
                if (!aUnlocked && bUnlocked) return 1;
                return 0;
              })
              .map((badge) => {
                const isUnlocked = unlockedBadges.has(badge.id);
                return (
                  <View
                    key={badge.id}
                    style={[
                      styles.badgeItemHorizontal,
                      !isUnlocked && styles.badgeItemLocked,
                    ]}
                  >
                    <View
                      style={[
                        styles.badgeIconContainer,
                        { backgroundColor: isUnlocked ? badge.color : '#e0e0e0' },
                      ]}
                    >
                      <Ionicons
                        name={badge.icon as any}
                        size={24}
                        color={isUnlocked ? '#fff' : '#999'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.badgeName,
                        !isUnlocked && styles.badgeNameLocked,
                      ]}
                      numberOfLines={1}
                    >
                      {badge.name}
                    </Text>
                    {isUnlocked && (
                      <View style={styles.badgeUnlockedIndicator}>
                        <Ionicons name="checkmark-circle" size={16} color={badge.color} />
                      </View>
                    )}
                  </View>
                );
              })}
          </ScrollView>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon as any} size={24} color="#666" />
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
    backgroundColor: 'white',
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
  avatarImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
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
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d96709',
  },
  editButtonText: {
    fontSize: 14,
    color: '#d96709',
    fontWeight: '600',
    marginLeft: 6,
  },
  challengeCard: {
    backgroundColor: 'white',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  challengeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  challengeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  challengeTextContainer: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  badgesContainer: {
    backgroundColor: 'white',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgesCount: {
    fontSize: 14,
    color: '#DA6809',
    fontWeight: '600',
  },
  badgesScrollView: {
    marginHorizontal: -20,
  },
  badgesScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  badgeItemHorizontal: {
    width: 100,
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  badgeItemLocked: {
    opacity: 0.6,
  },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: '#999',
  },
  badgeUnlockedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
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
