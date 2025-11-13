import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

/**
 * 清除所有 daily check-in 记录
 * 包括：
 * 1. AsyncStorage 中的 daily_checkin 记录
 * 2. Supabase user_points 表中的 daily_checkin 记录
 * 3. 重新计算总积分
 */
export const clearAllDailyCheckin = async (userId?: string): Promise<{ success: boolean; message: string; deletedCount?: number }> => {
  try {
    let deletedCount = 0;
    let totalPointsToRemove = 0;

    // 1. 清除 AsyncStorage 中的 daily_checkin 记录
    try {
      const storedPoints = await AsyncStorage.getItem('userPoints');
      if (storedPoints) {
        const { totalPoints, activities } = JSON.parse(storedPoints);
        
        // 过滤掉 daily_checkin 记录
        const filteredActivities = activities.filter((activity: any) => {
          if (activity.type === 'daily_checkin') {
            totalPointsToRemove += activity.points || 15; // daily_checkin 通常是 15 分
            deletedCount++;
            return false;
          }
          return true;
        });

        // 重新计算总积分
        const newTotalPoints = Math.max(0, totalPoints - totalPointsToRemove);

        // 保存更新后的数据
        await AsyncStorage.setItem('userPoints', JSON.stringify({
          totalPoints: newTotalPoints,
          activities: filteredActivities,
        }));

        console.log(`✅ Cleared ${deletedCount} daily check-in records from AsyncStorage`);
        console.log(`📉 Removed ${totalPointsToRemove} points from total`);
      }
    } catch (error) {
      console.error('Error clearing AsyncStorage daily check-in records:', error);
    }

    // 2. 清除 Supabase 中的 daily_checkin 记录
    if (userId) {
      try {
        // 先获取所有 daily_checkin 记录以计算需要移除的积分
        const { data: checkinRecords, error: fetchError } = await supabase
          .from('user_points')
          .select('id, points')
          .eq('user_id', userId)
          .eq('activity_type', 'daily_checkin');

        if (fetchError) {
          console.log('Note: user_points table may not exist or error fetching:', fetchError.message);
        } else if (checkinRecords && checkinRecords.length > 0) {
          const supabaseDeletedCount = checkinRecords.length;
          const supabasePointsToRemove = checkinRecords.reduce((sum, record) => sum + (record.points || 15), 0);

          // 删除所有 daily_checkin 记录
          const { error: deleteError } = await supabase
            .from('user_points')
            .delete()
            .eq('user_id', userId)
            .eq('activity_type', 'daily_checkin');

          if (deleteError) {
            console.error('Error deleting daily check-in records from Supabase:', deleteError);
          } else {
            console.log(`✅ Cleared ${supabaseDeletedCount} daily check-in records from Supabase`);
            console.log(`📉 Removed ${supabasePointsToRemove} points from Supabase`);
            deletedCount += supabaseDeletedCount;
            totalPointsToRemove += supabasePointsToRemove;

            // 更新 users 表中的总积分
            const { data: userData } = await supabase
              .from('users')
              .select('total_points')
              .eq('id', userId)
              .single();

            if (userData) {
              const currentTotal = userData.total_points || 0;
              const newTotal = Math.max(0, currentTotal - supabasePointsToRemove);

              const { error: updateError } = await supabase
                .from('users')
                .update({ 
                  total_points: newTotal,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', userId);

              if (updateError) {
                console.log('Note: total_points field may not exist in users table:', updateError.message);
              } else {
                console.log(`✅ Updated total_points in users table: ${currentTotal} → ${newTotal}`);
              }
            }
          }
        } else {
          console.log('ℹ️ No daily check-in records found in Supabase');
        }
      } catch (error) {
        console.error('Error clearing Supabase daily check-in records:', error);
      }
    }

    return {
      success: true,
      message: `Cleared ${deletedCount} daily check-in records. Removed ${totalPointsToRemove} points.`,
      deletedCount,
    };
  } catch (error) {
    console.error('Error clearing daily check-in records:', error);
    return {
      success: false,
      message: `Failed to clear daily check-in records: ${error}`,
    };
  }
};

