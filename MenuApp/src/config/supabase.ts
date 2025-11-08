import { createClient } from '@supabase/supabase-js'

// Supabase配置 - 使用您的实际项目信息
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://txendredncvrbxnxphbm.supabase.co'
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZW5kcmVkbmN2cmJ4bnhwaGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3OTAsImV4cCI6MjA3NzI1ODc5MH0.EH6kk2dmx80Vm0-OsXAYZeU9vu_JZ0ElNh1WHEHzFfM'

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseKey)

// 数据库类型定义
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          bio: string | null
          total_points: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          bio?: string | null
          total_points?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          bio?: string | null
          total_points?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          cooking_time: string | null
          servings: number | null
          cookware: string | null
          is_public: boolean
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url?: string | null
          cooking_time?: string | null
          servings?: number | null
          cookware?: string | null
          is_public?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          cooking_time?: string | null
          servings?: number | null
          cookware?: string | null
          is_public?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          recipe_id: string
          name: string
          amount: string
          unit: string
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          name: string
          amount: string
          unit: string
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          name?: string
          amount?: string
          unit?: string
          created_at?: string
        }
      }
      instructions: {
        Row: {
          id: string
          recipe_id: string
          step_number: number
          description: string
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          step_number: number
          description: string
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          step_number?: number
          description?: string
          image_url?: string | null
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          content: string
          likes_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          content: string
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          content?: string
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          recipe_id: string
          tag_name: string
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          tag_name: string
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          tag_name?: string
          created_at?: string
        }
      }
    }
  }
}

// 类型化的Supabase客户端
export type SupabaseClient = typeof supabase
