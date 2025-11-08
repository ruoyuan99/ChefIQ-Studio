import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
 
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SocialStats {
  likes: number;
  favorites: number;
  views: number;
  tried: number;
}

interface SocialStatsState {
  stats: { [recipeId: string]: SocialStats };
}

type SocialStatsAction =
  | { type: 'SET_STATS'; payload: { recipeId: string; stats: SocialStats } }
  | { type: 'INCREMENT_LIKES'; payload: string }
  | { type: 'INCREMENT_FAVORITES'; payload: string }
  | { type: 'INCREMENT_VIEWS'; payload: string }
  | { type: 'INCREMENT_TRIED'; payload: string }
  | { type: 'LOAD_STATS'; payload: { [recipeId: string]: SocialStats } };

const initialState: SocialStatsState = {
  stats: {},
};

const socialStatsReducer = (state: SocialStatsState, action: SocialStatsAction): SocialStatsState => {
  switch (action.type) {
    case 'SET_STATS':
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.payload.recipeId]: action.payload.stats,
        },
      };
    case 'INCREMENT_LIKES':
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.payload]: {
            ...state.stats[action.payload],
            likes: (state.stats[action.payload]?.likes || 0) + 1,
          },
        },
      };
    case 'INCREMENT_FAVORITES':
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.payload]: {
            ...state.stats[action.payload],
            favorites: (state.stats[action.payload]?.favorites || 0) + 1,
          },
        },
      };
    case 'INCREMENT_VIEWS':
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.payload]: {
            ...state.stats[action.payload],
            views: (state.stats[action.payload]?.views || 0) + 1,
          },
        },
      };
    case 'INCREMENT_TRIED':
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.payload]: {
            ...state.stats[action.payload],
            tried: (state.stats[action.payload]?.tried || 0) + 1,
          },
        },
      };
    case 'LOAD_STATS':
      return {
        ...state,
        stats: action.payload,
      };
    default:
      return state;
  }
};

interface SocialStatsContextType {
  state: SocialStatsState;
  getStats: (recipeId: string) => SocialStats;
  fetchStats: (recipeId: string) => Promise<void>;
  incrementViews: (recipeId: string) => void;
  adjustLikes: (recipeId: string, delta: 1 | -1) => void;
  adjustFavorites: (recipeId: string, delta: 1 | -1) => void;
  adjustTried: (recipeId: string, delta: 1 | -1) => void;
}

const SocialStatsContext = createContext<SocialStatsContextType | undefined>(undefined);

export const SocialStatsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(socialStatsReducer, initialState);

  // 加载保存的统计数据
  useEffect(() => {
    const loadStats = async () => {
      try {
        const storedStats = await AsyncStorage.getItem('socialStats');
        if (storedStats) {
          dispatch({ type: 'LOAD_STATS', payload: JSON.parse(storedStats) });
        }
      } catch (error) {
        console.error('Failed to load social stats from storage', error);
      }
    };
    loadStats();
  }, []);

  // 保存统计数据到AsyncStorage
  useEffect(() => {
    const saveStats = async () => {
      try {
        await AsyncStorage.setItem('socialStats', JSON.stringify(state.stats));
      } catch (error) {
        console.error('Failed to save social stats to storage', error);
      }
    };
    saveStats();
  }, [state.stats]);

  // 从 Supabase 加载某个菜谱的社交统计
  const fetchStats = async (recipeId: string) => {
    // Skip non-UUID ids (e.g., sample_* recipes)
    if (!/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(recipeId)) {
      return;
    }
    try {
      const { data, error } = await supabase
        .from('social_stats')
        .select('likes_count, favorites_count, views_count, tries_count')
        .eq('recipe_id', recipeId)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch social stats from Supabase:', error);
        return;
      }

      // Count distinct viewers from view table
      const { count, error: viewErr } = await supabase
        .from('social_stat_views')
        .select('user_id', { count: 'exact', head: true })
        .eq('recipe_id', recipeId);
      if (viewErr) {
        console.error('Failed to count views:', viewErr);
      }

      const statsFromDb: SocialStats = {
        likes: data?.likes_count ?? 0,
        favorites: data?.favorites_count ?? 0,
        // views reflects distinct viewers
        views: count ?? data?.views_count ?? 0,
        tried: data?.tries_count ?? 0,
      };

      dispatch({ type: 'SET_STATS', payload: { recipeId, stats: statsFromDb } });
    } catch (err) {
      console.error('Failed to fetch social stats:', err);
    }
  };

  const getStats = (recipeId: string): SocialStats => {
    const s = state.stats[recipeId];
    if (!s) {
      return { likes: 0, favorites: 0, views: 2, tried: 0 };
    }
    return {
      likes: s.likes || 0,
      favorites: s.favorites || 0,
      // Ensure UI never shows < 2 for initial display
      views: Math.max(2, s.views || 0),
      tried: s.tried || 0,
    };
  };

  const upsertAll = (recipeId: string, stats: SocialStats, errorLabel: string) => {
    if (!/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(recipeId)) {
      return;
    }
    supabase
      .from('social_stats')
      .upsert({
        recipe_id: recipeId,
        likes_count: stats.likes,
        favorites_count: stats.favorites,
        tries_count: stats.tried,
        views_count: stats.views,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.error(`Failed to upsert ${errorLabel}:`, error);
      });
  };

  const adjustLikes = (recipeId: string, delta: 1 | -1) => {
    const current = getStats(recipeId);
    const next: SocialStats = {
      ...current,
      likes: Math.max(0, current.likes + delta),
    };
    dispatch({ type: 'SET_STATS', payload: { recipeId, stats: next } });
    upsertAll(recipeId, next, 'likes');
  };

  const adjustFavorites = (recipeId: string, delta: 1 | -1) => {
    const current = getStats(recipeId);
    const next: SocialStats = {
      ...current,
      favorites: Math.max(0, current.favorites + delta),
    };
    dispatch({ type: 'SET_STATS', payload: { recipeId, stats: next } });
    upsertAll(recipeId, next, 'favorites');
  };

  const incrementViews = (recipeId: string) => {
    const current = getStats(recipeId);
    const next = { ...current, views: current.views + 1 };
    dispatch({ type: 'SET_STATS', payload: { recipeId, stats: next } });
    // Distinct views per user: insert into view table once per (recipe,user)
    const isUuid = /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(recipeId);
    if (!isUuid) return;
    (async () => {
      try {
        let userId: string | null = null;
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          userId = authData.user.id;
        } else {
          const stored = await AsyncStorage.getItem('user');
          if (stored) {
            const u = JSON.parse(stored);
            if (u?.id) userId = u.id;
          }
        }
        if (!userId) return;

        // Insert view row (ignore duplicates on unique constraint)
        const { error } = await supabase
          .from('social_stat_views')
          .upsert(
            [{ recipe_id: recipeId, user_id: userId, viewed_at: new Date().toISOString() }],
            { onConflict: 'recipe_id,user_id', ignoreDuplicates: true }
          );
        if (error) {
          console.error('Failed to upsert distinct view:', error);
          return;
        }
        // Recount and sync totals
        const { count } = await supabase
          .from('social_stat_views')
          .select('user_id', { count: 'exact', head: true })
          .eq('recipe_id', recipeId);
        const updated: SocialStats = { ...next, views: count ?? next.views };
        dispatch({ type: 'SET_STATS', payload: { recipeId, stats: updated } });
        upsertAll(recipeId, updated, 'views');
      } catch (e) {
        console.error('Failed distinct view flow:', e);
      }
    })();
  };

  const adjustTried = (recipeId: string, delta: 1 | -1) => {
    const current = getStats(recipeId);
    const next: SocialStats = {
      ...current,
      tried: Math.max(0, current.tried + delta),
    };
    dispatch({ type: 'SET_STATS', payload: { recipeId, stats: next } });
    upsertAll(recipeId, next, 'tried');
  };

  return (
    <SocialStatsContext.Provider value={{ 
      state, 
      getStats,
      fetchStats,
      incrementViews, 
      adjustLikes,
      adjustFavorites,
      adjustTried,
    }}>
      {children}
    </SocialStatsContext.Provider>
  );
};

export const useSocialStats = () => {
  const context = useContext(SocialStatsContext);
  if (context === undefined) {
    throw new Error('useSocialStats must be used within a SocialStatsProvider');
  }
  return context;
};
