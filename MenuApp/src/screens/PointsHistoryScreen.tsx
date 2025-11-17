import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePoints, PointsActivity } from '../contexts/PointsContext';
import { showError } from '../utils/errorHandler';
import PointsRulesModal from '../components/PointsRulesModal';

interface PointsHistoryScreenProps {
  navigation: any;
}

const PointsHistoryScreen: React.FC<PointsHistoryScreenProps> = ({ navigation }) => {
  const { state, getPointsHistory } = usePoints(); // clearAllPointsActivities removed - testing only
  const history = getPointsHistory();
  const [showRulesModal, setShowRulesModal] = useState(false);
  
  // Force refresh when state changes
  useEffect(() => {
    // This will trigger a re-render when state.activities changes
    console.log('PointsHistoryScreen: State updated, activities count:', state.activities.length);
  }, [state.activities]);

  // Group activities by date
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: PointsActivity[] } = {};
    
    history.forEach(activity => {
      const date = new Date(activity.timestamp);
      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });
    
    return groups;
  }, [history]);

  // Calculate statistics
  const stats = useMemo(() => {
    const typeCounts: { [key: string]: number } = {};
    let totalEarned = 0;
    
    history.forEach(activity => {
      typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
      totalEarned += activity.points;
    });
    
    return { typeCounts, totalEarned, totalActivities: history.length };
  }, [history]);

  const getActivityIcon = (type: PointsActivity['type']): string => {
    const icons: { [key: string]: string } = {
      create_recipe: 'restaurant',
      try_recipe: 'checkmark-circle',
      favorite_recipe: 'heart',
      like_recipe: 'thumbs-up',
      share_recipe: 'share-social',
      complete_profile: 'person',
      add_comment: 'chatbubble',
      daily_checkin: 'calendar',
      complete_survey: 'clipboard',
      recipe_liked_by_others: 'thumbs-up',
      recipe_favorited_by_others: 'bookmark',
      recipe_tried_by_others: 'checkmark-circle',
    };
    return icons[type] || 'star';
  };

  const getActivityColor = (type: PointsActivity['type']): string => {
    const colors: { [key: string]: string } = {
      create_recipe: '#FF6B35',
      try_recipe: '#4CAF50',
      favorite_recipe: '#E91E63',
      like_recipe: '#2196F3',
      share_recipe: '#9C27B0',
      complete_profile: '#FF9800',
      add_comment: '#00BCD4',
      daily_checkin: '#FF6B35',
      complete_survey: '#4CAF50',
      recipe_liked_by_others: '#2196F3',
      recipe_favorited_by_others: '#E91E63',
      recipe_tried_by_others: '#4CAF50',
    };
    return colors[type] || '#666';
  };

  const formatActivityType = (type: PointsActivity['type']): string => {
    const labels: { [key: string]: string } = {
      create_recipe: 'Created Recipe',
      try_recipe: 'Tried Recipe',
      favorite_recipe: 'Favorited Recipe',
      like_recipe: 'Liked Recipe',
      share_recipe: 'Shared Recipe',
      complete_profile: 'Completed Profile',
      add_comment: 'Added Comment',
      daily_checkin: 'Daily Check-in',
      complete_survey: 'Completed Survey',
      recipe_liked_by_others: 'Recipe Liked by Others',
      recipe_favorited_by_others: 'Recipe Favorited by Others',
      recipe_tried_by_others: 'Recipe Tried by Others',
    };
    return labels[type] || type;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // COMMENTED OUT - Testing purposes only
  // const handleClearAllHistory = () => {
  //   if (history.length === 0) {
  //     Alert.alert('No History', 'There is no points history to delete.');
  //     return;
  //   }

  //   Alert.alert(
  //     'Delete All Points History',
  //     'Are you sure you want to delete all points history? This action cannot be undone.',
  //     [
  //       {
  //         text: 'Cancel',
  //         style: 'cancel',
  //       },
  //       {
  //         text: 'Delete',
  //         style: 'destructive',
  //         onPress: async () => {
  //           try {
  //             const result = await clearAllPointsActivities();
  //             if (result.success) {
  //               Alert.alert('Success', 'All points history has been deleted.');
  //             } else {
  //               showError('Error', result.message || 'Failed to delete points history.');
  //             }
  //           } catch (error) {
  //             console.error('Error clearing points history:', error);
  //             showError('Error', 'Failed to delete points history. Please try again.');
  //           }
  //         },
  //       },
  //     ]
  //   );
  // };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Points History</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowRulesModal(true)}
          >
            <Ionicons name="information-circle-outline" size={24} color="#FF6B35" />
          </TouchableOpacity>
          {/* COMMENTED OUT - Testing purposes only */}
          {/* <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleClearAllHistory}
            disabled={history.length === 0}
          >
            <Ionicons 
              name="trash-outline" 
              size={24} 
              color={history.length === 0 ? "#ccc" : "#FF6B35"} 
            />
          </TouchableOpacity> */}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalActivities}</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalEarned}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.totalPoints}</Text>
              <Text style={styles.statLabel}>Current Points</Text>
            </View>
          </View>
        </View>

        {/* Activity Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Activity Breakdown</Text>
          {Object.entries(stats.typeCounts).map(([type, count]) => (
            <View key={type} style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownIcon, { backgroundColor: getActivityColor(type as PointsActivity['type']) + '20' }]}>
                  <Ionicons
                    name={getActivityIcon(type as PointsActivity['type']) as any}
                    size={18}
                    color={getActivityColor(type as PointsActivity['type'])}
                  />
                </View>
                <Text style={styles.breakdownText}>{formatActivityType(type as PointsActivity['type'])}</Text>
              </View>
              <Text style={styles.breakdownCount}>{count}x</Text>
            </View>
          ))}
        </View>

        {/* History Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {Object.keys(groupedHistory).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No activities yet</Text>
              <Text style={styles.emptySubtext}>Start cooking to earn points!</Text>
            </View>
          ) : (
            Object.entries(groupedHistory).map(([date, activities]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateLabel}>{date}</Text>
                {activities.map((activity) => (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={styles.activityLeft}>
                      <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) + '20' }]}>
                        <Ionicons
                          name={getActivityIcon(activity.type) as any}
                          size={20}
                          color={getActivityColor(activity.type)}
                        />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityDescription}>{activity.description}</Text>
                        <Text style={styles.activityTime}>{formatTime(activity.timestamp)}</Text>
                      </View>
                    </View>
                    <View style={styles.activityPoints}>
                      <Text style={[styles.pointsText, { color: getActivityColor(activity.type) }]}>
                        +{activity.points}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Points Rules Modal */}
      <PointsRulesModal
        visible={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0, // Add status bar height for Android
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  breakdownCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  breakdownText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  breakdownCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  timelineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  activityPoints: {
    marginLeft: 12,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default PointsHistoryScreen;

