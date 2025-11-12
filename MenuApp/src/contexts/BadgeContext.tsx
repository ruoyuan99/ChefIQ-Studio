import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { usePoints } from './PointsContext';
import { useRecipe } from './RecipeContext';

export type BadgeId =
  | 'first_checkin'
  | 'checkin_streak_7'
  | 'checkin_streak_30'
  | 'first_recipe'
  | 'recipe_creator_10'
  | 'recipe_creator_50'
  | 'first_try'
  | 'cuisine_explorer_5'
  | 'cuisine_explorer_10'
  | 'recipe_improver_5'
  | 'social_butterfly_10'
  | 'social_butterfly_50'
  | 'speed_chef_15'
  | 'chef_iq_champion';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'daily' | 'creation' | 'exploration' | 'social' | 'achievement';
  unlockedAt?: Date;
}

export const BADGE_DEFINITIONS: Record<BadgeId, Omit<Badge, 'unlockedAt'>> = {
  first_checkin: {
    id: 'first_checkin',
    name: 'First Steps',
    description: 'Completed your first daily check-in',
    icon: 'calendar',
    color: '#4CAF50',
    category: 'daily',
  },
  checkin_streak_7: {
    id: 'checkin_streak_7',
    name: 'Week Warrior',
    description: 'Checked in for 7 consecutive days',
    icon: 'flame',
    color: '#FF6B35',
    category: 'daily',
  },
  checkin_streak_30: {
    id: 'checkin_streak_30',
    name: 'Monthly Master',
    description: 'Checked in for 30 consecutive days',
    icon: 'trophy',
    color: '#FFD700',
    category: 'daily',
  },
  first_recipe: {
    id: 'first_recipe',
    name: 'Creator',
    description: 'Published your first recipe',
    icon: 'restaurant',
    color: '#2196F3',
    category: 'creation',
  },
  recipe_creator_10: {
    id: 'recipe_creator_10',
    name: 'Recipe Master',
    description: 'Published 10 recipes',
    icon: 'library',
    color: '#9C27B0',
    category: 'creation',
  },
  recipe_creator_50: {
    id: 'recipe_creator_50',
    name: 'Culinary Legend',
    description: 'Published 50 recipes',
    icon: 'star',
    color: '#FFD700',
    category: 'creation',
  },
  first_try: {
    id: 'first_try',
    name: 'Adventurer',
    description: 'Tried your first recipe',
    icon: 'checkmark-circle',
    color: '#4CAF50',
    category: 'exploration',
  },
  cuisine_explorer_5: {
    id: 'cuisine_explorer_5',
    name: 'World Traveler',
    description: 'Tried recipes from 5 different cuisines',
    icon: 'globe',
    color: '#00BCD4',
    category: 'exploration',
  },
  cuisine_explorer_10: {
    id: 'cuisine_explorer_10',
    name: 'Global Chef',
    description: 'Tried recipes from 10 different cuisines',
    icon: 'earth',
    color: '#FF6B35',
    category: 'exploration',
  },
  recipe_improver_5: {
    id: 'recipe_improver_5',
    name: 'Innovator',
    description: 'Improved 5 recipes from others',
    icon: 'bulb',
    color: '#FF9800',
    category: 'creation',
  },
  social_butterfly_10: {
    id: 'social_butterfly_10',
    name: 'Popular',
    description: 'Received 10 likes on your recipes',
    icon: 'heart',
    color: '#E91E63',
    category: 'social',
  },
  social_butterfly_50: {
    id: 'social_butterfly_50',
    name: 'Celebrity Chef',
    description: 'Received 50 likes on your recipes',
    icon: 'star',
    color: '#FFD700',
    category: 'social',
  },
  speed_chef_15: {
    id: 'speed_chef_15',
    name: 'Speed Chef',
    description: 'Completed a recipe in under 15 minutes',
    icon: 'flash',
    color: '#FFC107',
    category: 'achievement',
  },
  chef_iq_champion: {
    id: 'chef_iq_champion',
    name: 'Chef iQ Champion',
    description: 'Participated in Chef iQ Challenge',
    icon: 'trophy',
    color: '#FFD700',
    category: 'achievement',
  },
};

interface BadgeContextType {
  badges: Badge[];
  unlockedBadges: Set<BadgeId>;
  checkBadgeUnlock: (badgeId: BadgeId) => Promise<boolean>;
  getBadgeById: (badgeId: BadgeId) => Badge | undefined;
  getBadgesByCategory: (category: Badge['category']) => Badge[];
  recentlyUnlocked: BadgeId[];
  clearRecentlyUnlocked: () => void;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export const BadgeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { state: pointsState } = usePoints();
  const { state: recipeState } = useRecipe();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<BadgeId[]>([]);

  const unlockedBadges = new Set(badges.filter(b => b.unlockedAt).map(b => b.id));

  // Load badges from storage/Supabase
  useEffect(() => {
    const loadBadges = async () => {
      if (!user?.id) {
        // Load from AsyncStorage for anonymous users
        try {
          const stored = await AsyncStorage.getItem('userBadges');
          if (stored) {
            const parsed = JSON.parse(stored);
            const badgeList = parsed.map((b: any) => ({
              ...b,
              unlockedAt: b.unlockedAt ? new Date(b.unlockedAt) : undefined,
            }));
            setBadges(badgeList);
          } else {
            // Initialize with all badges locked
            const initialBadges = Object.values(BADGE_DEFINITIONS).map(def => ({
              ...def,
              unlockedAt: undefined,
            }));
            setBadges(initialBadges);
          }
        } catch (error) {
          console.error('Failed to load badges from storage:', error);
        }
        return;
      }

      // Load from Supabase for logged-in users
      try {
        const { data, error } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.log('user_badges table may not exist, using local storage');
          // Fallback to local storage
          const stored = await AsyncStorage.getItem('userBadges');
          if (stored) {
            const parsed = JSON.parse(stored);
            const badgeList = parsed.map((b: any) => ({
              ...b,
              unlockedAt: b.unlockedAt ? new Date(b.unlockedAt) : undefined,
            }));
            setBadges(badgeList);
          } else {
            const initialBadges = Object.values(BADGE_DEFINITIONS).map(def => ({
              ...def,
              unlockedAt: undefined,
            }));
            setBadges(initialBadges);
          }
        } else if (data) {
          // Map Supabase data to badges
          const unlockedIds = new Set(data.map((d: any) => d.badge_id));
          const badgeList = Object.values(BADGE_DEFINITIONS).map(def => ({
            ...def,
            unlockedAt: unlockedIds.has(def.id)
              ? new Date(data.find((d: any) => d.badge_id === def.id)?.unlocked_at || new Date())
              : undefined,
          }));
          setBadges(badgeList);
        }
      } catch (error) {
        console.error('Failed to load badges from Supabase:', error);
      }
    };

    loadBadges();
  }, [user?.id]);

  // Save badges to storage/Supabase
  useEffect(() => {
    const saveBadges = async () => {
      if (badges.length === 0) return;

      // Save to AsyncStorage
      try {
        const toStore = badges.map(b => ({
          ...b,
          unlockedAt: b.unlockedAt?.toISOString(),
        }));
        await AsyncStorage.setItem('userBadges', JSON.stringify(toStore));
      } catch (error) {
        console.error('Failed to save badges to storage:', error);
      }

      // Save to Supabase for logged-in users
      if (user?.id) {
        try {
          const unlocked = badges.filter(b => b.unlockedAt);
          for (const badge of unlocked) {
            const { error } = await supabase
              .from('user_badges')
              .upsert({
                user_id: user.id,
                badge_id: badge.id,
                unlocked_at: badge.unlockedAt?.toISOString(),
              }, {
                onConflict: 'user_id,badge_id',
              });

            if (error) {
              console.log('user_badges table may not exist:', error.message);
            }
          }
        } catch (error) {
          console.error('Failed to save badges to Supabase:', error);
        }
      }
    };

    saveBadges();
  }, [badges, user?.id]);

  // Check badge unlock conditions
  const checkBadgeUnlock = async (badgeId: BadgeId): Promise<boolean> => {
    // If already unlocked, skip
    if (unlockedBadges.has(badgeId)) {
      return false;
    }

    // Get latest state (may have changed since component render)
    const latestPointsState = pointsState;
    const latestRecipeState = recipeState;

    let shouldUnlock = false;

    switch (badgeId) {
      case 'first_checkin':
        shouldUnlock = latestPointsState.activities.some(
          a => a.type === 'daily_checkin'
        );
        break;

      case 'checkin_streak_7':
      case 'checkin_streak_30': {
        const checkins = latestPointsState.activities
          .filter(a => a.type === 'daily_checkin')
          .map(a => new Date(a.timestamp))
          .sort((a, b) => b.getTime() - a.getTime());

        if (checkins.length === 0) break;

        let streak = 1;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < checkins.length - 1; i++) {
          const current = new Date(checkins[i]);
          current.setHours(0, 0, 0, 0);
          const next = new Date(checkins[i + 1]);
          next.setHours(0, 0, 0, 0);

          const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }

        const requiredStreak = badgeId === 'checkin_streak_7' ? 7 : 30;
        shouldUnlock = streak >= requiredStreak;
        break;
      }

      case 'first_recipe':
      case 'recipe_creator_10':
      case 'recipe_creator_50': {
        const publishedCount = latestRecipeState.recipes.filter(r => r.isPublic).length;
        if (badgeId === 'first_recipe') {
          shouldUnlock = publishedCount >= 1;
        } else if (badgeId === 'recipe_creator_10') {
          shouldUnlock = publishedCount >= 10;
        } else if (badgeId === 'recipe_creator_50') {
          shouldUnlock = publishedCount >= 50;
        }
        break;
      }

      case 'first_try':
        shouldUnlock = latestPointsState.activities.some(a => a.type === 'try_recipe');
        break;

      case 'cuisine_explorer_5':
      case 'cuisine_explorer_10': {
        // This would require tracking cuisine types for tried recipes
        // For now, we'll use a simple heuristic based on recipe tags
        const triedRecipes = latestPointsState.activities
          .filter(a => a.type === 'try_recipe' && a.recipeId)
          .map(a => a.recipeId);

        const uniqueCuisines = new Set<string>();
        triedRecipes.forEach(recipeId => {
          const recipe = latestRecipeState.recipes.find(r => r.id === recipeId);
          if (recipe) {
            recipe.tags.forEach(tag => {
              const lowerTag = tag.toLowerCase();
              if (lowerTag.includes('asian') || lowerTag.includes('italian') || lowerTag.includes('mexican') ||
                  lowerTag.includes('french') || lowerTag.includes('indian') || lowerTag.includes('chinese') ||
                  lowerTag.includes('japanese') || lowerTag.includes('thai') || lowerTag.includes('mediterranean') ||
                  lowerTag.includes('american')) {
                uniqueCuisines.add(lowerTag);
              }
            });
          }
        });

        const required = badgeId === 'cuisine_explorer_5' ? 5 : 10;
        shouldUnlock = uniqueCuisines.size >= required;
        break;
      }

      case 'recipe_improver_5':
        // This would require tracking recipe improvements
        // For now, we'll check if user has created recipes based on others
        // This is a placeholder - would need actual improvement tracking
        shouldUnlock = false; // TODO: Implement recipe improvement tracking
        break;

      case 'social_butterfly_10':
      case 'social_butterfly_50': {
        // This would require tracking likes received on user's recipes
        // For now, we'll use a placeholder
        // TODO: Integrate with social stats to get actual like counts
        shouldUnlock = false; // TODO: Implement social stats integration
        break;
      }

      case 'speed_chef_15':
        // This would require tracking cooking completion time
        // For now, we'll use a placeholder
        shouldUnlock = false; // TODO: Implement cooking time tracking
        break;

      case 'chef_iq_champion':
        // Check if user has published a recipe with Chef iQ Challenge tag
        shouldUnlock = latestRecipeState.recipes.some(
          r => r.isPublic && r.tags.includes('Chef iQ Challenge')
        );
        break;

      default:
        shouldUnlock = false;
    }

    if (shouldUnlock) {
      // Unlock the badge
      setBadges(prev => prev.map(badge =>
        badge.id === badgeId
          ? { ...badge, unlockedAt: new Date() }
          : badge
      ));

      // Add to recently unlocked
      setRecentlyUnlocked(prev => [...prev, badgeId]);

      return true;
    }

    return false;
  };

  // Check all badges periodically when activities or recipes change
  // Note: This is a fallback check. Primary badge checks should be triggered
  // explicitly after user actions (check-in, publish, try, etc.)
  useEffect(() => {
    const checkAllBadges = async () => {
      const badgeIds = Object.keys(BADGE_DEFINITIONS) as BadgeId[];
      for (const badgeId of badgeIds) {
        // Only check, don't show notifications here (notifications are shown in action handlers)
        await checkBadgeUnlock(badgeId);
      }
    };

    // Check badges when points or recipes change (with debounce to avoid excessive checks)
    const timeoutId = setTimeout(() => {
      if (pointsState.activities.length > 0 || recipeState.recipes.length > 0) {
        checkAllBadges();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [pointsState.activities.length, recipeState.recipes.length]);

  const getBadgeById = (badgeId: BadgeId): Badge | undefined => {
    return badges.find(b => b.id === badgeId);
  };

  const getBadgesByCategory = (category: Badge['category']): Badge[] => {
    return badges.filter(b => b.category === category);
  };

  const clearRecentlyUnlocked = () => {
    setRecentlyUnlocked([]);
  };

  return (
    <BadgeContext.Provider
      value={{
        badges,
        unlockedBadges,
        checkBadgeUnlock,
        getBadgeById,
        getBadgesByCategory,
        recentlyUnlocked,
        clearRecentlyUnlocked,
      }}
    >
      {children}
    </BadgeContext.Provider>
  );
};

export const useBadges = () => {
  const context = useContext(BadgeContext);
  if (context === undefined) {
    throw new Error('useBadges must be used within a BadgeProvider');
  }
  return context;
};

