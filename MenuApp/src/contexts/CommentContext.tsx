import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealTimeSyncService } from '../services/realTimeSyncService';
import { useAuth } from './AuthContext';
import { supabase } from '../config/supabase';

export interface Comment {
  id: string;
  recipeId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
}

interface CommentState {
  comments: { [recipeId: string]: Comment[] };
}

type CommentAction =
  | { type: 'SET_COMMENTS'; payload: { recipeId: string; comments: Comment[] } }
  | { type: 'ADD_COMMENT'; payload: Comment }
  | { type: 'DELETE_COMMENT'; payload: { recipeId: string; commentId: string } }
  | { type: 'TOGGLE_COMMENT_LIKE'; payload: { recipeId: string; commentId: string } }
  | { type: 'LOAD_COMMENTS'; payload: { [recipeId: string]: Comment[] } };

const initialState: CommentState = {
  comments: {},
};

const commentReducer = (state: CommentState, action: CommentAction): CommentState => {
  switch (action.type) {
    case 'SET_COMMENTS':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.recipeId]: action.payload.comments,
        },
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.recipeId]: [
            ...(state.comments[action.payload.recipeId] || []),
            action.payload,
          ],
        },
      };
    case 'DELETE_COMMENT':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.recipeId]: (state.comments[action.payload.recipeId] || []).filter(
            comment => comment.id !== action.payload.commentId
          ),
        },
      };
    case 'TOGGLE_COMMENT_LIKE':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.recipeId]: (state.comments[action.payload.recipeId] || []).map(
            comment =>
              comment.id === action.payload.commentId
                ? {
                    ...comment,
                    isLiked: !comment.isLiked,
                    likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
                  }
                : comment
          ),
        },
      };
    case 'LOAD_COMMENTS':
      return {
        ...state,
        comments: action.payload,
      };
    default:
      return state;
  }
};

interface CommentContextType {
  state: CommentState;
  getComments: (recipeId: string) => Comment[];
  addComment: (recipeId: string, content: string) => Promise<void>;
  deleteComment: (recipeId: string, commentId: string) => void;
  toggleCommentLike: (recipeId: string, commentId: string) => void;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

export const CommentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(commentReducer, initialState);
  const { user } = useAuth();

  // Load comments from Supabase when user is authenticated
  useEffect(() => {
    const loadCommentsFromSupabase = async () => {
      // Load all comments (not just current user's) so we can see all users' comments on recipes
      try {
        // Fetch all comments grouped by recipe_id for display
        const { data: comments, error } = await supabase
          .from('comments')
          .select(`
            id,
            recipe_id,
            content,
            likes_count,
            created_at,
            user_id,
            users:user_id(name, avatar_url)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to load comments from Supabase:', error);
          // Fallback to AsyncStorage if Supabase fails
          loadCommentsFromStorage();
          return;
        }

        // Group comments by recipe_id
        const commentsByRecipe: { [recipeId: string]: Comment[] } = {};
        if (comments) {
          comments.forEach((comment: any) => {
            if (!commentsByRecipe[comment.recipe_id]) {
              commentsByRecipe[comment.recipe_id] = [];
            }
            // Handle case where comment.users might be an object or array
            const userData = Array.isArray(comment.users) 
              ? comment.users[0] 
              : comment.users;
            
            commentsByRecipe[comment.recipe_id].push({
              id: comment.id,
              recipeId: comment.recipe_id,
              authorName: userData?.name || 'Recipe Chef',
              authorAvatar: userData?.avatar_url,
              content: comment.content,
              createdAt: new Date(comment.created_at),
              likes: comment.likes_count || 0,
              isLiked: false, // TODO: Load from comment_likes table
            });
          });
        }

        dispatch({ type: 'LOAD_COMMENTS', payload: commentsByRecipe });
      } catch (error) {
        console.error('Error loading comments from Supabase:', error);
        loadCommentsFromStorage();
      }
    };

    const loadCommentsFromStorage = async () => {
      try {
        const storedComments = await AsyncStorage.getItem('comments');
        if (storedComments) {
          const parsedComments = JSON.parse(storedComments);
          // Convert date strings back to Date objects
          Object.keys(parsedComments).forEach(recipeId => {
            parsedComments[recipeId] = parsedComments[recipeId].map((comment: any) => ({
              ...comment,
              createdAt: new Date(comment.createdAt),
            }));
          });
          dispatch({ type: 'LOAD_COMMENTS', payload: parsedComments });
        }
      } catch (error) {
        console.error('Failed to load comments from storage', error);
      }
    };

    if (user?.id) {
      loadCommentsFromSupabase();
    } else {
      loadCommentsFromStorage();
    }
  }, [user?.id]);

  // Save comments to AsyncStorage whenever they change
  useEffect(() => {
    const saveComments = async () => {
      try {
        await AsyncStorage.setItem('comments', JSON.stringify(state.comments));
      } catch (error) {
        console.error('Failed to save comments to storage', error);
      }
    };
    saveComments();
  }, [state.comments]);

  const getComments = (recipeId: string): Comment[] => {
    return state.comments[recipeId] || [];
  };

  const addComment = async (recipeId: string, content: string) => {
    if (!user?.id) {
      // If user is not logged in, save comment locally only
      const newComment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipeId,
        authorName: user?.name || 'Recipe Chef',
        authorAvatar: user?.avatar_url,
        content,
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
      };
      dispatch({ type: 'ADD_COMMENT', payload: newComment });
      return;
    }

    try {
      // Sync comment to Supabase
      const { data: commentData, error } = await supabase
        .from('comments')
        .insert({
          recipe_id: recipeId,
          user_id: user.id,
          content: content.trim(),
          likes_count: 0,
        })
        .select(`
          id,
          recipe_id,
          content,
          likes_count,
          created_at,
          user_id,
          users:user_id(name, avatar_url)
        `)
        .single();

      if (error) {
        console.error('Failed to add comment to Supabase:', error);
        // Fallback to local storage if Supabase fails
        const newComment: Comment = {
          id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          recipeId,
          authorName: user?.name || 'Recipe Chef',
          authorAvatar: user?.avatar_url,
          content,
          createdAt: new Date(),
          likes: 0,
          isLiked: false,
        };
        dispatch({ type: 'ADD_COMMENT', payload: newComment });
        return;
      }

      // Successfully added to Supabase
      // Handle case where commentData.users might be an object or array
      const userData = Array.isArray(commentData.users) 
        ? commentData.users[0] 
        : commentData.users;
      
      const newComment: Comment = {
        id: commentData.id,
        recipeId: commentData.recipe_id,
        authorName: userData?.name || user?.name || 'Recipe Chef',
        authorAvatar: userData?.avatar_url || user?.avatar_url,
        content: commentData.content,
        createdAt: new Date(commentData.created_at),
        likes: commentData.likes_count || 0,
        isLiked: false,
      };
      dispatch({ type: 'ADD_COMMENT', payload: newComment });
    } catch (error) {
      console.error('Error adding comment:', error);
      // Fallback to local only
      const newComment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipeId,
        authorName: user?.name || 'Recipe Chef',
        authorAvatar: user?.avatar_url,
        content,
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
      };
      dispatch({ type: 'ADD_COMMENT', payload: newComment });
    }
  };

  const deleteComment = (recipeId: string, commentId: string) => {
    dispatch({ type: 'DELETE_COMMENT', payload: { recipeId, commentId } });
  };

  const toggleCommentLike = (recipeId: string, commentId: string) => {
    dispatch({ type: 'TOGGLE_COMMENT_LIKE', payload: { recipeId, commentId } });
  };

  return (
    <CommentContext.Provider value={{ 
      state, 
      getComments, 
      addComment, 
      deleteComment, 
      toggleCommentLike 
    }}>
      {children}
    </CommentContext.Provider>
  );
};

export const useComment = () => {
  const context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error('useComment must be used within a CommentProvider');
  }
  return context;
};
