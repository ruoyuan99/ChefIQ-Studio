export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface Instruction {
  id: string;
  step: number;
  description: string;
  imageUri?: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  items: MenuItem[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  shareCode?: string;
  imageUri?: string | number | null;
  image_url?: string | null; // 云端图片地址
  authorAvatar?: string | number | null; // 作者头像
  authorName?: string; // 作者姓名
  authorBio?: string; // 作者简介
  tags: string[];
  cookingTime: string;
  servings: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  cookware?: string; // 主要厨具类型
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Home: { initialTab?: string };
  RecipeList: undefined;
  RecipeName: undefined;
  CreateRecipe: { recipeName?: string };
  EditRecipe: { recipeId: string };
  RecipeDetail: { recipeId: string; returnTo?: string };
  CookStep: { recipeId: string };
  SupabaseTest: undefined;
  DataMigration: undefined;
  ShareRecipe: { recipeId: string };
  FavoriteRecipe: undefined;
  Explore: undefined;
  Groceries: undefined;
  Profile: undefined;
  EditProfile: undefined;
};
