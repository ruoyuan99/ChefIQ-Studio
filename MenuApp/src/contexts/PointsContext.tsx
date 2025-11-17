import React, { createContext, useReducer, useContext, ReactNode, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { clearAllDailyCheckin } from '../utils/clearDailyCheckin';
import { clearAllPointsActivities } from '../utils/clearAllPointsActivities';

export interface PointsActivity {
  id: string;
  type: 'create_recipe' | 'try_recipe' | 'favorite_recipe' | 'like_recipe' | 'share_recipe' | 'complete_profile' | 'add_comment' | 'daily_checkin' | 'complete_survey' | 'recipe_liked_by_others' | 'recipe_favorited_by_others' | 'recipe_tried_by_others';
  points: number;
  description: string;
  timestamp: Date;
  recipeId?: string;
}

interface PointsState {
  totalPoints: number;
  activities: PointsActivity[];
  level: number;
  pointsToNextLevel: number;
}

type PointsAction =
  | { type: 'ADD_POINTS'; payload: PointsActivity }
  | { type: 'SET_POINTS'; payload: { totalPoints: number; activities: PointsActivity[] } }
  | { type: 'RESET_POINTS' };

const initialState: PointsState = {
  totalPoints: 0,
  activities: [],
  level: 1,
  pointsToNextLevel: 100,
};

// Points rules
export const POINTS_RULES = {
  create_recipe: 50,
  try_recipe: 20,
  favorite_recipe: 10,
  like_recipe: 5,
  share_recipe: 15,
  complete_profile: 25,
  add_comment: 8,
  daily_checkin: 15,
  complete_survey: 10, // Complete survey after cooking (5-10 points, using max 10 points to improve completion rate)
  recipe_liked_by_others: 1, // Recipe liked by others (daily limit: 10 points)
  recipe_favorited_by_others: 2, // Recipe favorited by others (daily limit: 10 points)
  recipe_tried_by_others: 3, // Recipe tried by others (daily limit: 10 points)
};

// Daily limits for creator rewards
export const DAILY_LIMITS = {
  recipe_liked_by_others: 10, // Max 10 likes per day = 10 points
  recipe_favorited_by_others: 5, // Max 5 favorites per day = 10 points
  recipe_tried_by_others: 3, // Max 3 tries per day = 9 points (close to 10 points)
};

// Level system
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

const pointsReducer = (state: PointsState, action: PointsAction): PointsState => {
  switch (action.type) {
    case 'ADD_POINTS':
      const newTotalPoints = state.totalPoints + action.payload.points;
      const newLevel = calculateLevel(newTotalPoints);
      const newPointsToNextLevel = calculatePointsToNextLevel(newTotalPoints, newLevel);
      
      return {
        ...state,
        totalPoints: newTotalPoints,
        activities: [...state.activities, action.payload],
        level: newLevel,
        pointsToNextLevel: newPointsToNextLevel,
      };
    case 'SET_POINTS':
      const level = calculateLevel(action.payload.totalPoints);
      const pointsToNextLevel = calculatePointsToNextLevel(action.payload.totalPoints, level);
      
      return {
        ...state,
        totalPoints: action.payload.totalPoints,
        activities: action.payload.activities,
        level,
        pointsToNextLevel,
      };
    case 'RESET_POINTS':
      return initialState;
    default:
      return state;
  }
};

const calculateLevel = (points: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].points) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
};

const calculatePointsToNextLevel = (points: number, currentLevel: number): number => {
  const nextLevel = currentLevel + 1;
  const nextLevelThreshold = LEVEL_THRESHOLDS.find(l => l.level === nextLevel);
  if (!nextLevelThreshold) {
    return 0; // Already at highest level
  }
  return nextLevelThreshold.points - points;
};

interface PointsContextType {
  state: PointsState;
  addPoints: (type: keyof typeof POINTS_RULES, description: string, recipeId?: string) => Promise<void>;
  addPointsToCreator: (creatorUserId: string, type: 'recipe_liked_by_others' | 'recipe_favorited_by_others' | 'recipe_tried_by_others', recipeId: string, recipeTitle: string) => Promise<void>;
  getPointsHistory: () => PointsActivity[];
  getLevelInfo: () => { level: number; pointsToNextLevel: number; totalPoints: number };
  clearDailyCheckin: () => Promise<{ success: boolean; message: string; deletedCount?: number }>;
  clearAllPointsActivities: () => Promise<{ success: boolean; message: string; deletedCount?: number }>;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const PointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(pointsReducer, initialState);
  const { user } = useAuth();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user?.id && previousUserIdRef.current !== user.id) {
      dispatch({ type: 'RESET_POINTS' });
      AsyncStorage.removeItem('userPoints').catch(console.error);
    }
    if (!user && previousUserIdRef.current) {
      dispatch({ type: 'RESET_POINTS' });
    }
    previousUserIdRef.current = user?.id || null;
  }, [user?.id]);

  // Load points data from Supabase
  useEffect(() => {
    const loadPointsFromSupabase = async () => {
      if (!user?.id) {
        // If user is not logged in, load from AsyncStorage
        loadPointsFromStorage();
        return;
      }

      try {
        // Load total points from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('total_points')
          .eq('id', user.id)
          .single();

        // Load points history from user_points table
        const { data: pointsHistory, error: historyError } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (userError && !historyError) {
          // If users table doesn't have total_points field, this is normal
          console.log('total_points field may not exist, using calculated points');
        }

        // Calculate total points (from history or users table)
        let totalPoints = userData?.total_points || 0;
        const activities: PointsActivity[] = [];

        if (pointsHistory && !historyError) {
          // If history exists, use it
          pointsHistory.forEach((point: any) => {
            activities.push({
              id: point.id,
              type: point.activity_type as any,
              points: point.points,
              description: point.description || '',
              timestamp: new Date(point.created_at),
              recipeId: point.recipe_id,
            });
          });
          // Recalculate total
          totalPoints = activities.reduce((sum, activity) => sum + activity.points, 0);
        } else {
          // If no history, load from AsyncStorage
          loadPointsFromStorage();
          return;
        }

        // Update state
        dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities } });
      } catch (error) {
        console.error('Error loading points from Supabase:', error);
        loadPointsFromStorage();
      }
    };

    const loadPointsFromStorage = async () => {
      try {
        const storedPoints = await AsyncStorage.getItem('userPoints');
        if (storedPoints) {
          const { totalPoints, activities } = JSON.parse(storedPoints);
          // Convert date strings to Date objects
          const parsedActivities = activities.map((activity: any) => ({
            ...activity,
            timestamp: new Date(activity.timestamp),
          }));
          dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities: parsedActivities } });
        }
      } catch (error) {
        console.error('Failed to load points from storage', error);
      }
    };

    if (user?.id) {
      loadPointsFromSupabase();
    } else {
      loadPointsFromStorage();
    }
  }, [user?.id]);

  // Save points data to AsyncStorage and Supabase
  useEffect(() => {
    const savePoints = async () => {
      // Save to AsyncStorage
      try {
        // Convert Date objects to strings for JSON serialization
        const activitiesToSave = state.activities.map(activity => ({
          ...activity,
          timestamp: activity.timestamp.toISOString(),
        }));
        await AsyncStorage.setItem('userPoints', JSON.stringify({
          totalPoints: state.totalPoints,
          activities: activitiesToSave,
        }));
      } catch (error) {
        console.error('Failed to save points to storage', error);
      }

      // Sync to Supabase (if user is logged in)
      if (user?.id && state.activities.length > 0) {
        try {
          // Update total points in users table
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              total_points: state.totalPoints,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (updateError) {
            // If field doesn't exist, this is normal, just log
            console.log('total_points field may not exist in users table:', updateError.message);
          }

          // Get existing activities from database (for deduplication)
          // Since database IDs are UUIDs and local IDs are timestamps, we match by type + description + created_at
          const { data: existingPoints } = await supabase
            .from('user_points')
            .select('activity_type, description, created_at, points')
            .eq('user_id', user.id);

          // Create identifiers for existing activities (using combination of type + description + timestamp)
          // Timestamp matching allows 1 second error (due to possible millisecond differences)
          const existingKeys = new Set<string>();
          if (existingPoints) {
            existingPoints.forEach((point: any) => {
              const timestamp = new Date(point.created_at).getTime();
              // Use second-level precision matching (allow 1 second error)
              const timestampKey = Math.floor(timestamp / 1000);
              const key = `${point.activity_type}_${point.description}_${timestampKey}`;
              existingKeys.add(key);
            });
          }

          // Sync all unsynced points activities to user_points table
          const activitiesToSync = state.activities.filter(activity => {
            // Check if this activity already exists in database
            const timestamp = activity.timestamp.getTime();
            const timestampKey = Math.floor(timestamp / 1000);
            const key = `${activity.type}_${activity.description}_${timestampKey}`;
            return !existingKeys.has(key);
          });

          if (activitiesToSync.length > 0) {
            const pointsToInsert = activitiesToSync.map(activity => ({
              user_id: user.id,
              points: activity.points,
              activity_type: activity.type,
              description: activity.description,
              recipe_id: activity.recipeId || null,
              created_at: activity.timestamp.toISOString(),
            }));

            // Helper function to insert points with retry for foreign key errors
            const insertPointsBatch = async (points: typeof pointsToInsert, retryCount = 0): Promise<boolean> => {
              const { error: insertError } = await supabase
                .from('user_points')
                .insert(points);

              if (insertError) {
                // Check if it's a foreign key constraint error (recipe not yet in database)
                const isForeignKeyError = insertError.code === '23503' || 
                                         insertError.message?.includes('foreign key constraint') ||
                                         insertError.message?.includes('Key is not present in table "recipes"');
                
                if (isForeignKeyError && retryCount < 3) {
                  // Filter out activities with recipe_id that might not exist yet
                  // Only retry activities without recipe_id or split the batch
                  const activitiesWithRecipeId = points.filter(p => p.recipe_id);
                  const activitiesWithoutRecipeId = points.filter(p => !p.recipe_id);
                  
                  // First, try to insert activities without recipe_id (these should always work)
                  if (activitiesWithoutRecipeId.length > 0) {
                    await supabase
                      .from('user_points')
                      .insert(activitiesWithoutRecipeId);
                  }
                  
                  // For activities with recipe_id, wait and retry (recipe might sync soon)
                  if (activitiesWithRecipeId.length > 0) {
                    const delay = (retryCount + 1) * 1000; // 1s, 2s, 3s
                    console.log(`⚠️ Some recipes not found in database yet, retrying ${activitiesWithRecipeId.length} activities in ${delay}ms (attempt ${retryCount + 1}/3)`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return insertPointsBatch(activitiesWithRecipeId, retryCount + 1);
                  }
                  
                  return true; // All activities without recipe_id were inserted
                } else {
                  // Max retries reached or other error
                  if (isForeignKeyError) {
                    console.warn(`⚠️ Failed to sync some activities after ${retryCount + 1} attempts. Some recipes may not be synced yet. This is OK for newly created recipes.`);
                    // Try to insert activities without recipe_id anyway
                    const activitiesWithoutRecipeId = points.filter(p => !p.recipe_id);
                    if (activitiesWithoutRecipeId.length > 0) {
                      await supabase
                        .from('user_points')
                        .insert(activitiesWithoutRecipeId);
                    }
                  } else {
                    console.log('Failed to sync activities to user_points:', insertError.message);
                  }
                  return false;
                }
              }
              
              return true;
            };

            const success = await insertPointsBatch(pointsToInsert);
            if (success) {
              console.log(`✅ Synced ${pointsToInsert.length} activities to database`);
              
              // After verifying data is successfully saved to database, clear all points data in AsyncStorage
              setTimeout(async () => {
                try {
                  const { count } = await supabase
                    .from('user_points')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                  // If there is data in database, sync was successful, clear all points data in local AsyncStorage
                  if (count !== null && count > 0) {
                    await AsyncStorage.removeItem('userPoints');
                    console.log('✅ Cleared all userPoints from AsyncStorage after successful sync');
                  }
                } catch (error) {
                  console.error('Error verifying sync and clearing AsyncStorage:', error);
                }
              }, 1000); // Delay 1 second to ensure database is updated
            }
          } else {
            // If all activities are synced (activitiesToSync.length === 0), verify then clear all AsyncStorage
            setTimeout(async () => {
              try {
                const { count } = await supabase
                  .from('user_points')
                  .select('*', { count: 'exact', head: true })
                  .eq('user_id', user.id);

                // If there is data in database, clear all points data in local AsyncStorage
                if (count !== null && count > 0) {
                  await AsyncStorage.removeItem('userPoints');
                  console.log('✅ Cleared all userPoints from AsyncStorage (all activities already synced)');
                }
              } catch (error) {
                console.error('Error verifying sync and clearing AsyncStorage:', error);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('Failed to sync points to Supabase:', error);
        }
      }
    };
    savePoints();
  }, [state.totalPoints, state.activities, user?.id]);

  const addPoints = async (type: keyof typeof POINTS_RULES, description: string, recipeId?: string) => {
    const points = POINTS_RULES[type];
    
    // Check daily limits (for being liked/favorited/tried)
    const creatorRewardTypes: Array<'recipe_liked_by_others' | 'recipe_favorited_by_others' | 'recipe_tried_by_others'> = 
      ['recipe_liked_by_others', 'recipe_favorited_by_others', 'recipe_tried_by_others'];
    
    if (creatorRewardTypes.includes(type as any) && user?.id) {
      try {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        
        // Check how many times this type of points has been earned today
        const { data: todayActivities, error: checkError } = await supabase
          .from('user_points')
          .select('id')
          .eq('user_id', user.id)
          .eq('activity_type', type)
          .gte('created_at', todayStart.toISOString())
          .lt('created_at', todayEnd.toISOString());
        
        if (checkError) {
          console.error('Error checking daily limit:', checkError);
          // Don't block, continue execution
        } else {
          const todayCount = todayActivities?.length || 0;
          const dailyLimit = DAILY_LIMITS[type as keyof typeof DAILY_LIMITS];
          
          if (todayCount >= dailyLimit) {
            // Daily limit reached, don't add points
            console.log(`Daily limit reached for ${type}: ${todayCount}/${dailyLimit}`);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking daily limit:', error);
        // Don't block, continue execution
      }
    }
    
    // If it's daily_checkin, first check if already checked in today in database
    if (type === 'daily_checkin' && user?.id) {
      try {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        
        // Check if there's already a daily_checkin record today in database
        const { data: existingCheckin, error: checkError } = await supabase
          .from('user_points')
          .select('id')
          .eq('user_id', user.id)
          .eq('activity_type', 'daily_checkin')
          .gte('created_at', todayStart.toISOString())
          .lt('created_at', todayEnd.toISOString())
          .limit(1);

        if (checkError) {
          console.error('Error checking existing daily check-in:', checkError);
          throw new Error('Failed to check existing check-in');
        }

        if (existingCheckin && existingCheckin.length > 0) {
          // Already checked in today, don't allow duplicate check-in
          throw new Error('You have already checked in today.');
        }
      } catch (error) {
        // If it's a duplicate check-in error, throw directly
        if (error instanceof Error && error.message === 'You have already checked in today.') {
          throw error;
        }
        // Throw other errors as well
        throw error;
      }
    }

    const activity: PointsActivity = {
      id: Date.now().toString(),
      type,
      points,
      description,
      timestamp: new Date(),
      recipeId,
    };
    // Update local state
    dispatch({ type: 'ADD_POINTS', payload: activity });

    // Immediately sync to Supabase (if user is logged in)
    // Note: Here we use state.totalPoints + points to calculate new total
    // Because dispatch is async, we need to manually calculate
    if (user?.id) {
      try {
        // Get current total points and calculate new total
        const newTotalPoints = state.totalPoints + points;
        
        // Update total points in users table
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            total_points: newTotalPoints,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          console.log('Failed to update total_points:', updateError.message);
        }

        // Immediately add new points activity to user_points table
        // This ensures new activity is saved immediately without waiting for useEffect to trigger
        // Helper function to insert points with retry logic (for newly created recipes)
        const insertPoints = async (retryCount = 0): Promise<boolean> => {
          const { error: insertError } = await supabase
            .from('user_points')
            .insert({
              user_id: user.id,
              points: points,
              activity_type: type,
              description: description,
              recipe_id: recipeId || null,
              created_at: activity.timestamp.toISOString(),
            });

          if (insertError) {
            // Check if it's a foreign key constraint error (recipe not yet in database)
            // Error code 23503 = foreign key constraint violation
            const isForeignKeyError = insertError.code === '23503' || 
                                     insertError.message?.includes('foreign key constraint') ||
                                     insertError.message?.includes('Key is not present in table "recipes"');
            
            if (isForeignKeyError && recipeId && retryCount < 3) {
              // Recipe might not be synced yet, wait and retry
              const delay = (retryCount + 1) * 1000; // 1s, 2s, 3s
              console.log(`⚠️ Recipe ${recipeId} not found in database yet for points, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return insertPoints(retryCount + 1);
            } else {
              // Max retries reached or other error - log but don't throw
              if (isForeignKeyError && recipeId) {
                console.warn(`⚠️ Failed to insert points for recipe ${recipeId} after ${retryCount + 1} attempts. Recipe may not be synced yet. This is OK for newly created recipes. Will retry in useEffect.`);
              } else {
                console.log('Failed to insert user_points:', insertError.message);
              }
              // If insert fails, will retry sync in useEffect
              return false;
            }
          }
          
          return true;
        };

        const success = await insertPoints();
        if (success) {
          console.log('✅ Activity saved to database:', type);
        }
      } catch (error) {
        console.error('Failed to sync points to Supabase:', error);
        // If fails, will retry sync in useEffect
      }
    }
  };

  /**
   * Add points to recipe creator (when their recipe is liked/favorited/tried)
   * @param creatorUserId Creator's user ID
   * @param type Points type
   * @param recipeId Recipe ID
   * @param recipeTitle Recipe title
   */
  const addPointsToCreator = async (
    creatorUserId: string,
    type: 'recipe_liked_by_others' | 'recipe_favorited_by_others' | 'recipe_tried_by_others',
    recipeId: string,
    recipeTitle: string
  ) => {
    // If creator is current user, don't add points to self (avoid duplication)
    if (creatorUserId === user?.id) {
      return;
    }

    const points = POINTS_RULES[type];
    const dailyLimit = DAILY_LIMITS[type];

    try {
      // Check how many times creator has earned this type of points today
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const { data: todayActivities, error: checkError } = await supabase
        .from('user_points')
        .select('id')
        .eq('user_id', creatorUserId)
        .eq('activity_type', type)
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString());

      if (checkError) {
        console.error('Error checking daily limit for creator:', checkError);
        return;
      }

      const todayCount = todayActivities?.length || 0;
      if (todayCount >= dailyLimit) {
        // Daily limit reached
        console.log(`Creator daily limit reached for ${type}: ${todayCount}/${dailyLimit}`);
        return;
      }

      // Get creator's current total points
      const { data: creatorData, error: creatorError } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', creatorUserId)
        .single();

      if (creatorError) {
        console.error('Error fetching creator points:', creatorError);
        return;
      }

      const currentTotalPoints = creatorData?.total_points || 0;
      const newTotalPoints = currentTotalPoints + points;

      // Update creator's total points
      const { error: updateError } = await supabase
        .from('users')
        .update({
          total_points: newTotalPoints,
          updated_at: new Date().toISOString(),
        })
        .eq('id', creatorUserId);

      if (updateError) {
        console.error('Error updating creator total_points:', updateError);
        return;
      }

      // Add points activity record
      const description = type === 'recipe_liked_by_others'
        ? `Your recipe "${recipeTitle}" was liked`
        : type === 'recipe_favorited_by_others'
        ? `Your recipe "${recipeTitle}" was favorited`
        : `Your recipe "${recipeTitle}" was tried`;

      const { error: insertError } = await supabase
        .from('user_points')
        .insert({
          user_id: creatorUserId,
          points: points,
          activity_type: type,
          description: description,
          recipe_id: recipeId,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error inserting creator points:', insertError);
        // Rollback total points
        await supabase
          .from('users')
          .update({
            total_points: currentTotalPoints,
            updated_at: new Date().toISOString(),
          })
          .eq('id', creatorUserId);
        return;
      }

      console.log(`✅ Added ${points} points to creator ${creatorUserId} for ${type}`);
    } catch (error) {
      console.error('Failed to add points to creator:', error);
    }
  };

  const getPointsHistory = () => {
    return state.activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const getLevelInfo = () => {
    return {
      level: state.level,
      pointsToNextLevel: state.pointsToNextLevel,
      totalPoints: state.totalPoints,
    };
  };

  const clearDailyCheckin = async () => {
    const result = await clearAllDailyCheckin(user?.id);
    
    // If clear successful, reload points data
    if (result.success) {
      // Reload points data
      if (user?.id) {
        try {
          const { data: pointsHistory } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          const { data: userData } = await supabase
            .from('users')
            .select('total_points')
            .eq('id', user.id)
            .single();

          let totalPoints = userData?.total_points || 0;
          const activities: PointsActivity[] = [];

          if (pointsHistory) {
            pointsHistory.forEach((point: any) => {
              activities.push({
                id: point.id,
                type: point.activity_type as any,
                points: point.points,
                description: point.description || '',
                timestamp: new Date(point.created_at),
                recipeId: point.recipe_id,
              });
            });
            totalPoints = activities.reduce((sum, activity) => sum + activity.points, 0);
          }

          dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities } });
        } catch (error) {
          console.error('Error reloading points after clearing check-in:', error);
        }
      } else {
        // Reload from AsyncStorage
        try {
          const storedPoints = await AsyncStorage.getItem('userPoints');
          if (storedPoints) {
            const { totalPoints, activities } = JSON.parse(storedPoints);
            const parsedActivities = activities.map((activity: any) => ({
              ...activity,
              timestamp: new Date(activity.timestamp),
            }));
            dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities: parsedActivities } });
          }
        } catch (error) {
          console.error('Error reloading points from storage:', error);
        }
      }
    }
    
    return result;
  };

  const clearAllPoints = async () => {
    console.log('🧹 Starting to clear all points activities...');
    console.log('User ID:', user?.id);
    
    const result = await clearAllPointsActivities(user?.id);
    
    console.log('Clear result:', result);
    
    // Regardless of success, reset local state and force reload
    if (result.success) {
      // First reset local state
      dispatch({ type: 'RESET_POINTS' });
      
      // Clear AsyncStorage (confirm again)
      try {
        await AsyncStorage.removeItem('userPoints');
        console.log('✅ Confirmed: AsyncStorage cleared');
      } catch (error) {
        console.error('Error clearing AsyncStorage:', error);
      }
      
      // Wait a bit to ensure database operation completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force reload points data (should be empty)
      if (user?.id) {
        try {
          // Load from database (should be empty)
          const { data: pointsHistory, error: historyError } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('total_points')
            .eq('id', user.id)
            .single();

          console.log('Reloaded pointsHistory:', pointsHistory?.length || 0, 'records');
          console.log('History error:', historyError);
          console.log('User data:', userData);
          console.log('User error:', userError);

          let totalPoints = userData?.total_points || 0;
          let activities: PointsActivity[] = [];

          if (pointsHistory && pointsHistory.length > 0) {
            console.warn('⚠️ Warning: Points history still exists after clearing!');
            activities = pointsHistory.map((point: any) => ({
              id: point.id,
              type: point.activity_type as any,
              points: point.points,
              description: point.description || '',
              timestamp: new Date(point.created_at),
              recipeId: point.recipe_id,
            }));
            totalPoints = activities.reduce((sum, activity) => sum + activity.points, 0);
          } else {
            console.log('✅ Confirmed: No points history in database');
            totalPoints = 0;
            activities = [];
          }

          dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities } });
        } catch (error) {
          console.error('Error reloading points after clearing:', error);
          // Even if error, ensure state is empty
          dispatch({ type: 'RESET_POINTS' });
        }
      } else {
        // Reload from AsyncStorage (should be empty)
        try {
          const storedPoints = await AsyncStorage.getItem('userPoints');
          if (storedPoints) {
            console.warn('⚠️ Warning: AsyncStorage still has points data!');
            const { totalPoints, activities } = JSON.parse(storedPoints);
            const parsedActivities = activities.map((activity: any) => ({
              ...activity,
              timestamp: new Date(activity.timestamp),
            }));
            dispatch({ type: 'SET_POINTS', payload: { totalPoints, activities: parsedActivities } });
          } else {
            console.log('✅ Confirmed: AsyncStorage is empty');
            // If no data, ensure state is empty
            dispatch({ type: 'RESET_POINTS' });
          }
        } catch (error) {
          console.error('Error reloading points from storage:', error);
          // Even if error, ensure state is empty
          dispatch({ type: 'RESET_POINTS' });
        }
      }
    } else {
      // Even if clear failed, try to reset local state
      console.error('❌ Clear failed, but resetting local state anyway');
      dispatch({ type: 'RESET_POINTS' });
      try {
        await AsyncStorage.removeItem('userPoints');
      } catch (error) {
        console.error('Error clearing AsyncStorage:', error);
      }
    }
    
    return result;
  };

  return (
    <PointsContext.Provider value={{ state, addPoints, addPointsToCreator, getPointsHistory, getLevelInfo, clearDailyCheckin, clearAllPointsActivities: clearAllPoints }}>
      {children}
    </PointsContext.Provider>
  );
};

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};
