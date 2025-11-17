import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { POINTS_RULES, DAILY_LIMITS } from '../contexts/PointsContext';

interface PointsRulesModalProps {
  visible: boolean;
  onClose: () => void;
}

const PointsRulesModal: React.FC<PointsRulesModalProps> = ({ visible, onClose }) => {
  const getActivityIcon = (type: string): string => {
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

  const getActivityColor = (type: string): string => {
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

  const getActivityDescription = (type: string): string => {
    const descriptions: { [key: string]: string } = {
      create_recipe: 'Create and publish a new recipe',
      try_recipe: 'Mark a recipe as tried',
      favorite_recipe: 'Add a recipe to your favorites',
      like_recipe: 'Like a recipe',
      share_recipe: 'Share a recipe with others',
      complete_profile: 'Complete your profile information',
      add_comment: 'Add a comment on a recipe',
      daily_checkin: 'Daily check-in (once per day)',
      complete_survey: 'Complete post-cooking survey (taste, difficulty, will make again)',
      recipe_liked_by_others: 'Your recipe was liked by someone else',
      recipe_favorited_by_others: 'Your recipe was favorited by someone else',
      recipe_tried_by_others: 'Your recipe was tried by someone else',
    };
    return descriptions[type] || type;
  };

  const getDailyLimitText = (type: string): string | null => {
    const limit = DAILY_LIMITS[type as keyof typeof DAILY_LIMITS];
    if (!limit) return null;
    
    const points = POINTS_RULES[type as keyof typeof POINTS_RULES];
    const maxPoints = limit * points;
    
    return `Daily limit: ${limit} times (max ${maxPoints} points/day)`;
  };

  // Separate user activities and creator rewards
  const userActivities = [
    'create_recipe',
    'try_recipe',
    'favorite_recipe',
    'like_recipe',
    'share_recipe',
    'complete_profile',
    'add_comment',
    'daily_checkin',
    'complete_survey',
  ];

  const creatorRewards = [
    'recipe_liked_by_others',
    'recipe_favorited_by_others',
    'recipe_tried_by_others',
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Points Rules</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Introduction */}
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>How to Earn Points</Text>
            <Text style={styles.introText}>
              Earn points by engaging with recipes, creating content, and interacting with the community. 
              Points help you level up and unlock achievements!
            </Text>
          </View>

          {/* User Activities Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Activities</Text>
            <Text style={styles.sectionSubtitle}>Earn points by using the app</Text>
            
            {userActivities.map((type) => {
              const points = POINTS_RULES[type as keyof typeof POINTS_RULES];
              const dailyLimit = getDailyLimitText(type);
              
              return (
                <View key={type} style={styles.ruleItem}>
                  <View style={styles.ruleLeft}>
                    <View style={[styles.ruleIcon, { backgroundColor: getActivityColor(type) + '20' }]}>
                      <Ionicons
                        name={getActivityIcon(type) as any}
                        size={20}
                        color={getActivityColor(type)}
                      />
                    </View>
                    <View style={styles.ruleContent}>
                      <Text style={styles.ruleDescription}>{getActivityDescription(type)}</Text>
                      {dailyLimit && (
                        <Text style={styles.ruleLimit}>{dailyLimit}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.rulePoints}>
                    <Text style={[styles.pointsValue, { color: getActivityColor(type) }]}>
                      +{points}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Creator Rewards Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Creator Rewards</Text>
            <Text style={styles.sectionSubtitle}>
              Earn points when others interact with your recipes
            </Text>
            
            {creatorRewards.map((type) => {
              const points = POINTS_RULES[type as keyof typeof POINTS_RULES];
              const dailyLimit = getDailyLimitText(type);
              
              return (
                <View key={type} style={styles.ruleItem}>
                  <View style={styles.ruleLeft}>
                    <View style={[styles.ruleIcon, { backgroundColor: getActivityColor(type) + '20' }]}>
                      <Ionicons
                        name={getActivityIcon(type) as any}
                        size={20}
                        color={getActivityColor(type)}
                      />
                    </View>
                    <View style={styles.ruleContent}>
                      <Text style={styles.ruleDescription}>{getActivityDescription(type)}</Text>
                      {dailyLimit && (
                        <Text style={styles.ruleLimit}>{dailyLimit}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.rulePoints}>
                    <Text style={[styles.pointsValue, { color: getActivityColor(type) }]}>
                      +{points}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Level System Info */}
          <View style={styles.levelCard}>
            <Text style={styles.levelTitle}>Level System</Text>
            <Text style={styles.levelText}>
              As you earn points, you'll level up! Higher levels unlock new achievements and badges.
            </Text>
            <View style={styles.levelThresholds}>
              <Text style={styles.levelThresholdText}>Level 1: 0 points</Text>
              <Text style={styles.levelThresholdText}>Level 2: 100 points</Text>
              <Text style={styles.levelThresholdText}>Level 3: 250 points</Text>
              <Text style={styles.levelThresholdText}>Level 4: 500 points</Text>
              <Text style={styles.levelThresholdText}>Level 5: 1000 points</Text>
              <Text style={styles.levelThresholdText}>Level 6: 2000 points</Text>
              <Text style={styles.levelThresholdText}>Level 7: 3500 points</Text>
              <Text style={styles.levelThresholdText}>Level 8: 5000 points</Text>
              <Text style={styles.levelThresholdText}>Level 9: 7500 points</Text>
              <Text style={styles.levelThresholdText}>Level 10: 10000 points</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  introCard: {
    backgroundColor: '#FFF3E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  ruleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ruleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ruleContent: {
    flex: 1,
  },
  ruleDescription: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  ruleLimit: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  rulePoints: {
    marginLeft: 12,
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  levelCard: {
    backgroundColor: '#F2F6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B6DFF',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  levelThresholds: {
    gap: 4,
  },
  levelThresholdText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});

export default PointsRulesModal;

