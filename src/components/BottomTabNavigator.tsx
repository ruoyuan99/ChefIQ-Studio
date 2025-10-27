import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomTabNavigatorProps {
  navigation: any;
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  onCreatePress?: () => void;
}

const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({ navigation, activeTab, onTabChange, onCreatePress }) => {
  const tabs = [
    {
      id: 'favorite',
      icon: 'bookmark-outline',
      activeIcon: 'bookmark',
      label: 'Favorite',
      route: 'FavoriteRecipe',
    },
    {
      id: 'explore',
      icon: 'calendar-outline',
      activeIcon: 'calendar',
      label: 'Explore',
      route: 'Explore',
    },
    {
      id: 'create',
      icon: 'add',
      label: '',
      route: 'RecipeName',
      isCenter: true,
    },
    {
      id: 'groceries',
      icon: 'cart-outline',
      activeIcon: 'cart',
      label: 'Groceries',
      route: 'Groceries',
    },
    {
      id: 'profile',
      icon: 'menu-outline',
      activeIcon: 'menu',
      label: 'More',
      route: 'Profile',
    },
  ];

  const handleTabPress = (tab: any) => {
    if (tab.isCenter) {
      // 中心按钮调用onCreatePress回调
      if (onCreatePress) {
        onCreatePress();
      } else {
        navigation.navigate('RecipeName');
      }
    } else if (onTabChange) {
      onTabChange(tab.id);
    } else if (tab.route) {
      navigation.navigate(tab.route);
    }
  };

  const isActive = (tabId: string) => activeTab === tabId;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabItem,
              tab.isCenter && styles.centerTab,
              isActive(tab.id) && styles.activeTab,
            ]}
            onPress={() => handleTabPress(tab)}
          >
            {tab.isCenter ? (
              <View style={styles.centerTabContainer}>
                <View style={styles.centerTabGlow}>
                  <View style={styles.centerTabIcon}>
                    <Ionicons
                      name={tab.icon}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={[
                styles.tabIcon,
                isActive(tab.id) && styles.activeTabIcon
              ]}>
                <Ionicons
                  name={isActive(tab.id) && tab.activeIcon ? tab.activeIcon : tab.icon}
                  size={20}
                  color={
                    isActive(tab.id) 
                      ? '#FF6B35' 
                      : '#999999'
                  }
                />
              </View>
            )}
            {!tab.isCenter && (
              <Text style={[
                styles.tabLabel,
                isActive(tab.id) && styles.activeTabLabel
              ]}>
                {tab.label}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // 上边界阴影效果
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  tabBar: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-around',
      paddingVertical: 6,
      paddingHorizontal: 16,
      height: 100, // 增加高度以容纳底部流白
      paddingBottom: 24, // 增加底部流白
      paddingTop: 16,
      zIndex: 2,
      backgroundColor: 'white',
    },
    tabItem: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      flex: 1,
      paddingVertical: 1,
      paddingTop: 2,
    },
  centerTab: {
    flex: 0,
    marginHorizontal: 16,
  },
  activeTab: {
    // Active tab styling
  },
  tabIcon: {
    marginBottom: 2,
  },
    centerTabContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 0,
      marginTop: -14,
    },
    centerTabGlow: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#FFAB91',
      alignItems: 'center',
      justifyContent: 'center',
      // 外发光效果
      shadowColor: '#FF6B35',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.6,
      shadowRadius: 15,
      elevation: 15,
    },
    centerTabIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#FF6B35',
      alignItems: 'center',
      justifyContent: 'center',
      // 主要阴影效果 - 向下投射
      shadowColor: '#FF6B35',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
      // 边框高光效果
      borderWidth: 2,
      borderColor: '#FF8A65',
    },
  activeTabIcon: {
    // Active icon styling
  },
  tabLabel: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#FF6B35',
    fontWeight: '500',
  },
});

export default BottomTabNavigator;
