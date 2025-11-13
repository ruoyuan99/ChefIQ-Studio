import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

/**
 * 清除所有积分活动记录
 * 包括：
 * 1. AsyncStorage 中的 userPoints
 * 2. Supabase user_points 表中的所有记录
 * 3. 重置 users 表中的 total_points 为 0
 */
export const clearAllPointsActivities = async (userId?: string): Promise<{ success: boolean; message: string; deletedCount?: number }> => {
  try {
    let deletedCount = 0;

    // 1. 清除 AsyncStorage 中的 userPoints
    try {
      await AsyncStorage.removeItem('userPoints');
      console.log('✅ Cleared userPoints from AsyncStorage');
    } catch (error) {
      console.error('Error clearing AsyncStorage userPoints:', error);
    }

    // 2. 清除 Supabase 中的 user_points 记录
    if (userId) {
      try {
        // 先获取记录数量
        const { count, error: countError } = await supabase
          .from('user_points')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (countError) {
          console.log('Note: user_points table may not exist or error counting:', countError.message);
        } else if (count !== null && count > 0) {
          // 删除所有积分活动记录
          const { data: deleteData, error: deleteError } = await supabase
            .from('user_points')
            .delete()
            .eq('user_id', userId)
            .select();

          if (deleteError) {
            console.error('❌ Error deleting user_points from Supabase:', deleteError);
            console.error('Error details:', JSON.stringify(deleteError, null, 2));
            // 如果删除失败，尝试使用 RPC 或直接 SQL（如果权限允许）
            throw new Error(`Failed to delete points: ${deleteError.message}`);
          } else {
            console.log(`✅ Cleared ${count} points activities from Supabase`);
            console.log('Deleted records:', deleteData?.length || 0);
            deletedCount = count;
          }
        } else {
          console.log('ℹ️ No points activities found in Supabase');
        }

        // 3. 重置 users 表中的 total_points 为 0
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            total_points: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          console.log('Note: total_points field may not exist in users table:', updateError.message);
        } else {
          console.log('✅ Reset total_points to 0 in users table');
        }
      } catch (error) {
        console.error('Error clearing Supabase points activities:', error);
      }
    } else {
      console.log('⚠️ No userId provided. Only cleared AsyncStorage.');
    }

    return {
      success: true,
      message: `Cleared all points activities. Deleted ${deletedCount} records from database.`,
      deletedCount,
    };
  } catch (error: any) {
    console.error('❌ Error clearing all points activities:', error);
    const errorMessage = error?.message || String(error);
    return {
      success: false,
      message: `Failed to clear points activities: ${errorMessage}`,
      deletedCount: 0,
    };
  }
};

