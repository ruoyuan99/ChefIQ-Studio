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
  image_url?: string | null; // Cloud image URL
  authorAvatar?: string | number | null; // Author avatar
  authorName?: string; // Author name
  authorBio?: string; // Author bio
  tags: string[];
  cookingTime: string;
  servings: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  cookware?: string; // Main cookware type
  youtubeVideos?: YouTubeVideo[]; // YouTube video recommendations
  youtubeSearchUrl?: string; // YouTube search link
}

export type CookingTimeCategory = 'Quick' | 'Medium' | 'Long';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  channelTitle?: string;
  publishedAt?: string;
  url: string;
  embedUrl: string;
  cookingTimeCategory?: CookingTimeCategory; // Quick (<30min), Medium (30-60min), Long (>60min)
}

export interface RecipeOption {
  recipe: Recipe;
  youtubeVideos?: YouTubeVideo[];
  youtubeSearchUrl?: string;
  optionIndex?: number;
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
  CreateRecipe: { recipeName?: string; fromChallenge?: boolean };
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
  GenerateRecipe: undefined;
  GenerateRecipeLoading: {
    ingredients: string[];
    dietaryRestrictions?: string[];
    cuisine?: string;
    servings?: string;
    cookingTime?: CookingTimeCategory;
    cookware: string;
  };
  GenerateRecipeResults: {
    generatedRecipe?: Recipe;
    youtubeVideos?: YouTubeVideo[];
    youtubeSearchUrl?: string;
    userIngredients: string[];
    recipeOptions?: RecipeOption[];
    selectedOptionIndex?: number;
  };
  ChefIQChallenge: undefined;
  PointsHistory: undefined;
};
