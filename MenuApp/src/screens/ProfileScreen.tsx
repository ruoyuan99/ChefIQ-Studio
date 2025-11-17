import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Buttons, Colors, getFontWeight } from '../styles/theme';
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
      title: 'Generate from Ingredients',
      icon: 'sparkles-outline',
      onPress: () => navigation.navigate('GenerateRecipe'),
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Edit Profile Button - 在 profile header 内 */}
          <View style={styles.profileHeaderTop}>
            <View style={styles.profileHeaderSpacer} />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileTopRow}>
            {/* 左侧头像 - 1/3 */}
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
            
            {/* 右侧用户名和邮箱 - 2/3 */}
            <View style={styles.profileInfoContainer}>
              <Text style={styles.userName}>{user?.name || 'Recipe Chef'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'chef@recipeapp.com'}</Text>
            </View>
          </View>
          
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => navigation.navigate('RecipeList')}
              activeOpacity={0.7}
            >
              <Ionicons name="restaurant" size={18} color="#FF6B35" style={styles.statIcon} />
              <Text style={styles.statNumber}>{userStats.totalRecipes}</Text>
              <Text style={styles.statLabel}>My Recipes</Text>
            </TouchableOpacity>
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

        {/* Points Display */}
        <View style={styles.pointsDisplayWrapper}>
          <PointsDisplay onPress={() => navigation.navigate('PointsHistory')} />
        </View>
        
        {/* Chef iQ Challenge Card */}
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
                        size={20}
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
                        <Ionicons name="checkmark-circle" size={14} color={badge.color} />
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
    paddingBottom: Platform.OS === 'ios' ? 100 : 0, // iOS需要安全区域，Android不需要额外padding
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0, // Android添加状态栏高度
  },
  pointsDisplayWrapper: {
    marginTop: -8, // 负边距缩短与 Social Stats 的距离
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Android上完全移除空白，iOS保留小间距
  },
  profileHeader: {
    backgroundColor: 'white',
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  profileHeaderSpacer: {
    flex: 1,
  },
  editProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(218, 104, 9, 0.2)',
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: '33.33%', // 左侧1/3
    alignItems: 'center',
    justifyContent: 'center',
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
  profileInfoContainer: {
    flex: 1, // 右侧2/3
    paddingLeft: 16,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: getFontWeight('bold') as any,
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 0, // 移除底部间距，因为不再在头像下方
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
    fontWeight: getFontWeight('bold') as any,
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
    fontWeight: getFontWeight('600') as any,
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12, // 减少顶部间距，缩短与 Profile 的距离
    width: '100%',
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
    fontWeight: getFontWeight('bold') as any,
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
    justifyContent: 'space-between', // 让标题在左，计数在右
    alignItems: 'center',
    marginBottom: 8, // 减少底部间距，缩短与图标之间的距离
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
    paddingVertical: 4, // 减少垂直padding
  },
  badgeItemHorizontal: {
    width: 80, // 缩小宽度从100到80
    alignItems: 'center',
    marginRight: 8, // 减少卡片间距从12到8
    paddingVertical: 8, // 减少垂直padding从12到8
    paddingHorizontal: 6, // 减少水平padding从8到6
    borderRadius: 10, // 稍微减小圆角
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  badgeItemLocked: {
    opacity: 0.6,
  },
  badgeIconContainer: {
    width: 48, // 缩小图标容器从56到48
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4, // 减少底部间距从8到4
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeName: {
    fontSize: 11, // 减小字体从12到11
    fontWeight: getFontWeight('600') as any,
    color: '#333',
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: '#999',
  },
  badgeUnlockedIndicator: {
    position: 'absolute',
    top: 2, // 调整位置以适应更小的卡片
    right: 2,
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
    fontWeight: getFontWeight('600') as any,
    color: '#333',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
  },
});

export default ProfileScreen;
