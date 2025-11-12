import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, AccessibilityInfo, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePoints } from '../contexts/PointsContext';
import { useBadges } from '../contexts/BadgeContext';

const PointsDisplay: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const { state, getLevelInfo, addPoints, getPointsHistory } = usePoints();
  const { checkBadgeUnlock, getBadgeById } = useBadges();
  const { level, pointsToNextLevel, totalPoints } = getLevelInfo();
  const history = getPointsHistory();
  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }, []);
  const isTodayActivity = (type: string) =>
    history.some(h => {
      const d = new Date(h.timestamp);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      return h.type === type && key === todayKey;
    });
  const checkedInToday = useMemo(() => isTodayActivity('daily_checkin'), [history, todayKey]);
  const createdToday = useMemo(() => isTodayActivity('create_recipe'), [history, todayKey]);
  const likedToday = useMemo(() => isTodayActivity('like_recipe'), [history, todayKey]);
  const triedToday = useMemo(() => isTodayActivity('try_recipe'), [history, todayKey]);
  const [checkinActive, setCheckinActive] = useState<boolean>(checkedInToday);
  useEffect(() => {
    setCheckinActive(checkedInToday);
  }, [checkedInToday]);

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

  const calculateProgress = (): number => {
    if (pointsToNextLevel <= 0) return 100; // Max level

    const LEVEL_THRESHOLDS = [
      { level: 1, points: 0 },
      { level: 2, points: 100 },
      { level: 3, points: 250 },
      { level: 4, points: 500 },
      { level: 5, points: 1000 },
      { level: 6, points: 2000 },
      { level: 7, points: 3500 },
      { level: 8, points: 5000 },
      { level: 9, points: 7500 },
      { level: 10, points: 10000 },
    ];

    const currentThreshold = LEVEL_THRESHOLDS.find(l => l.level === level);
    const nextThreshold = LEVEL_THRESHOLDS.find(l => l.level === level + 1);

    if (!currentThreshold || !nextThreshold) return 100;

    const pointsInCurrentLevel = totalPoints - currentThreshold.points;
    const pointsNeededForLevel = nextThreshold.points - currentThreshold.points;

    return Math.min(100, (pointsInCurrentLevel / pointsNeededForLevel) * 100);
  };

  const progressPercentage = calculateProgress();

  // Floating animation setup for side bubbles
  const ltAnim = useRef(new Animated.Value(0)).current; // left top
  const lbAnim = useRef(new Animated.Value(0)).current; // left bottom
  const rtAnim = useRef(new Animated.Value(0)).current; // right top
  const rbAnim = useRef(new Animated.Value(0)).current; // right bottom
  const loops = useRef<Animated.CompositeAnimation[]>([]);
  const centerScale = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  const startLoop = (
    val: Animated.Value,
    duration: number,
    delay: number
  ) => {
    const seq = Animated.loop(
      Animated.sequence([
        Animated.timing(val, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(val, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loops.current.push(seq);
    seq.start();
  };

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => {
      // @ts-ignore RN < 0.72 compatibility
      sub?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      loops.current.forEach(l => l.stop && l.stop());
      loops.current = [];
      return;
    }
    // Staggered loops with slightly different durations
    startLoop(ltAnim, 4200, 200);
    startLoop(lbAnim, 4800, 500);
    startLoop(rtAnim, 3600, 350);
    startLoop(rbAnim, 5400, 650);
    // Center breathing animation
    const centerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(centerScale, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(centerScale, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loops.current.push(centerLoop, glowLoop);
    centerLoop.start();
    glowLoop.start();
    return () => {
      loops.current.forEach(l => l.stop && l.stop());
      loops.current = [];
    };
  }, [reduceMotion]);

  const floatStyle = (val: Animated.Value, dx: number, dy: number) => {
    const translateX = val.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
    const translateY = val.interpolate({ inputRange: [0, 1], outputRange: [0, -dy] });
    const scale = val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
    return { transform: [{ translateX }, { translateY }, { scale }] };
  };

  const content = (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Points Center</Text>
        {onPress && <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />}
      </View>
      <View style={styles.circleOuter}>
        {/* Multi-layer glow ring to simulate gradient depth */}
        <View style={styles.circleGlowOuter} />
        <Animated.View
          style={[
            styles.circleGlowMid,
            { opacity: glowOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.45] }) },
          ]}
        />
        <View style={styles.circleGlowInner} />
        <Animated.View
          style={[
            styles.circleInner,
            { transform: [{ scale: centerScale.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }] },
          ]}
        >
          <Text style={styles.circleLabel}>My Points</Text>
          <Text style={styles.circlePoints}>{totalPoints}</Text>
          <Text style={styles.circleLevel}>{getLevelTitle(level)}</Text>
        </Animated.View>
        {/* Left bubbles */}
        <Animated.View style={[styles.bubble, styles.bubbleLeftTop, floatStyle(ltAnim, 3, 5), checkinActive && styles.bubbleActive]}>
          <TouchableOpacity
            activeOpacity={checkinActive ? 1 : 0.8}
            style={styles.bubbleContent}
            disabled={checkinActive}
            onPress={async () => {
              if (checkinActive) return;
              try {
                await addPoints('daily_checkin', 'Daily Check-in', undefined, false);
                setCheckinActive(true);
                // Check for badge unlocks
                const unlocked = await checkBadgeUnlock('first_checkin');
                if (unlocked) {
                  const badge = getBadgeById('first_checkin');
                  if (badge) {
                    Alert.alert(
                      '🎉 Badge Unlocked!',
                      `You earned the "${badge.name}" badge!\n\n${badge.description}`,
                      [{ text: 'Awesome!' }]
                    );
                  }
                }
                // Check for streak badges
                await checkBadgeUnlock('checkin_streak_7');
                await checkBadgeUnlock('checkin_streak_30');
              } catch (e) {
                // no-op
              }
            }}
          >
            <Text style={[styles.bubblePoints, checkinActive && styles.bubblePointsActive]}>+15</Text>
            <Text style={[styles.bubbleLabel, checkinActive && styles.bubbleLabelActive]}>Daily Check-in</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.bubble, styles.bubbleLeftBottom, floatStyle(lbAnim, 3, 5), createdToday && styles.bubbleActive]}>
          <View style={styles.bubbleContent}>
            <Text style={[styles.bubblePoints, createdToday && styles.bubblePointsActive]}>+50</Text>
            <Text style={[styles.bubbleLabel, createdToday && styles.bubbleLabelActive]}>Publish Recipe</Text>
          </View>
        </Animated.View>
        {/* Right bubbles */}
        <Animated.View style={[styles.bubble, styles.bubbleRightTop, floatStyle(rtAnim, 3, 5), likedToday && styles.bubbleActive]}>
          <View style={styles.bubbleContent}>
            <Text style={[styles.bubblePoints, likedToday && styles.bubblePointsActive]}>+12</Text>
            <Text style={[styles.bubbleLabel, likedToday && styles.bubbleLabelActive]}>Get Likes</Text>
          </View>
        </Animated.View>
        <Animated.View style={[styles.bubble, styles.bubbleRightBottom, floatStyle(rbAnim, 3, 5), triedToday && styles.bubbleActive]}>
          <View style={styles.bubbleContent}>
            <Text style={[styles.bubblePoints, triedToday && styles.bubblePointsActive]}>+20</Text>
            <Text style={[styles.bubbleLabel, triedToday && styles.bubbleLabelActive]}>Try a Recipe</Text>
          </View>
        </Animated.View>
      </View>
      {pointsToNextLevel > 0 && (
        <View style={styles.footerRow}>
          <Text style={styles.progressLabel}>{pointsToNextLevel} points to next level</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%`, backgroundColor: getLevelColor(level) },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    marginTop: 0,
    width: '100%',
  },
  card: {
    backgroundColor: '#DA6809',
    borderRadius: 0,
    paddingVertical: 20,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  circleOuter: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 230,
  },
  // Layered glow rings (no extra deps)
  circleGlowOuter: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  circleGlowMid: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  circleGlowInner: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  circleInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  bubble: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    paddingHorizontal: 6,
  },
  bubbleActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DA6809',
  },
  bubblePoints: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bubblePointsActive: {
    color: '#DA6809',
  },
  bubbleLabel: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  bubbleLabelActive: {
    color: '#DA6809',
  },
  bubbleContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleLeftTop: {
    left: 12,
    top: 4,
  },
  bubbleLeftBottom: {
    left: 22,
    bottom: 4,
  },
  bubbleRightTop: {
    right: 12,
    top: 4,
  },
  bubbleRightBottom: {
    right: 22,
    bottom: 4,
  },
  circleLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  circlePoints: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  circleLevel: {
    marginTop: 10,
    fontSize: 11,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 20,
  },
  progressLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default PointsDisplay;
