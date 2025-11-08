import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePoints } from '../contexts/PointsContext';

const PointsDisplay: React.FC = () => {
  const { state, getLevelInfo } = usePoints();
  const { level, pointsToNextLevel, totalPoints } = getLevelInfo();

  const getLevelTitle = (level: number): string => {
    const titles: { [key: number]: string } = {
      1: 'Beginner Chef',
      2: 'Home Cook',
      3: 'Recipe Enthusiast',
      4: 'Cooking Explorer',
      5: 'Kitchen Master',
      6: 'Culinary Artist',
      7: 'Recipe Creator',
      8: 'Chef Pro',
      9: 'Culinary Expert',
      10: 'Master Chef',
    };
    return titles[level] || 'Chef';
  };

  const getLevelColor = (level: number): string => {
    if (level >= 8) return '#FFD700'; // Gold
    if (level >= 5) return '#C0C0C0'; // Silver
    if (level >= 3) return '#CD7F32'; // Bronze
    return '#4CAF50'; // Green
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trophy" size={24} color={getLevelColor(level)} />
        <Text style={styles.title}>Points & Level</Text>
      </View>
      
      <View style={styles.pointsContainer}>
        <View style={styles.pointsInfo}>
          <Text style={styles.pointsNumber}>{totalPoints}</Text>
          <Text style={styles.pointsLabel}>Points</Text>
        </View>
        
        <View style={styles.levelInfo}>
          <Text style={[styles.levelNumber, { color: getLevelColor(level) }]}>
            Level {level}
          </Text>
          <Text style={styles.levelTitle}>{getLevelTitle(level)}</Text>
        </View>
      </View>
      
      {pointsToNextLevel > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {pointsToNextLevel} points to next level
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(100, ((totalPoints % 100) / 100) * 100)}%`,
                  backgroundColor: getLevelColor(level)
                }
              ]} 
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsInfo: {
    alignItems: 'center',
  },
  pointsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  levelInfo: {
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  levelTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default PointsDisplay;
