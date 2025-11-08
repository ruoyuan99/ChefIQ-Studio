import { supabase } from '../config/supabase'
import { Database } from '../config/supabase'

// 类型定义
type Recipe = Database['public']['Tables']['recipes']['Row']
type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
type RecipeUpdate = Database['public']['Tables']['recipes']['Update']

type Ingredient = Database['public']['Tables']['ingredients']['Row']
type IngredientInsert = Database['public']['Tables']['ingredients']['Insert']

type Instruction = Database['public']['Tables']['instructions']['Row']
type InstructionInsert = Database['public']['Tables']['instructions']['Insert']

type Comment = Database['public']['Tables']['comments']['Row']
type CommentInsert = Database['public']['Tables']['comments']['Insert']

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']

// 菜谱服务
export class RecipeService {
  // 获取所有菜谱
  static async getRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // 获取单个菜谱
  static async getRecipe(id: string): Promise<Recipe | null> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  // 创建菜谱
  static async createRecipe(recipe: RecipeInsert): Promise<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipe)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 更新菜谱
  static async updateRecipe(id: string, recipe: RecipeUpdate): Promise<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .update({ ...recipe, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 删除菜谱
  static async deleteRecipe(id: string): Promise<void> {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // 搜索菜谱
  static async searchRecipes(query: string): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}

// 食材服务
export class IngredientService {
  // 获取菜谱的食材
  static async getRecipeIngredients(recipeId: string): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  // 添加食材
  static async addIngredient(ingredient: IngredientInsert): Promise<Ingredient> {
    const { data, error } = await supabase
      .from('ingredients')
      .insert(ingredient)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 批量添加食材
  static async addIngredients(ingredients: IngredientInsert[]): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from('ingredients')
      .insert(ingredients)
      .select()
    
    if (error) throw error
    return data || []
  }

  // 删除食材
  static async deleteIngredient(id: string): Promise<void> {
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// 步骤服务
export class InstructionService {
  // 获取菜谱的步骤
  static async getRecipeInstructions(recipeId: string): Promise<Instruction[]> {
    const { data, error } = await supabase
      .from('instructions')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('step_number', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  // 添加步骤
  static async addInstruction(instruction: InstructionInsert): Promise<Instruction> {
    const { data, error } = await supabase
      .from('instructions')
      .insert(instruction)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 批量添加步骤
  static async addInstructions(instructions: InstructionInsert[]): Promise<Instruction[]> {
    const { data, error } = await supabase
      .from('instructions')
      .insert(instructions)
      .select()
    
    if (error) throw error
    return data || []
  }

  // 更新步骤
  static async updateInstruction(id: string, instruction: Partial<InstructionInsert>): Promise<Instruction> {
    const { data, error } = await supabase
      .from('instructions')
      .update(instruction)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 删除步骤
  static async deleteInstruction(id: string): Promise<void> {
    const { error } = await supabase
      .from('instructions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// 评论服务
export class CommentService {
  // 获取菜谱的评论
  static async getRecipeComments(recipeId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users:user_id(name, avatar_url)
      `)
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // 添加评论
  static async addComment(comment: CommentInsert): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 删除评论
  static async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // 点赞评论
  static async likeComment(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('comment_likes')
      .insert({ comment_id: commentId, user_id: userId })
    
    if (error) throw error

    // 更新评论点赞数
    const { error: updateError } = await supabase.rpc('increment_comment_likes', {
      comment_id: commentId
    })
    
    if (updateError) throw updateError
  }

  // 取消点赞评论
  static async unlikeComment(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId)
    
    if (error) throw error

    // 更新评论点赞数
    const { error: updateError } = await supabase.rpc('decrement_comment_likes', {
      comment_id: commentId
    })
    
    if (updateError) throw updateError
  }
}

// 用户服务
export class UserService {
  // 获取用户信息
  static async getUser(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  // 创建用户
  static async createUser(user: UserInsert): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 更新用户信息
  static async updateUser(id: string, user: Partial<UserInsert>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...user, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// 收藏服务
export class FavoriteService {
  // 获取用户的收藏
  static async getUserFavorites(userId: string): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        recipes:recipe_id(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data?.map(item => item.recipes).filter(Boolean) || []
  }

  // 添加收藏
  static async addFavorite(userId: string, recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, recipe_id: recipeId })
    
    if (error) throw error
  }

  // 取消收藏
  static async removeFavorite(userId: string, recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
    
    if (error) throw error
  }

  // 检查是否已收藏
  static async isFavorite(userId: string, recipeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return !!data
  }
}
