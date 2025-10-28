import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  addComment: (recipeId: string, content: string) => void;
  deleteComment: (recipeId: string, commentId: string) => void;
  toggleCommentLike: (recipeId: string, commentId: string) => void;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

export const CommentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(commentReducer, initialState);

  // 加载保存的评论
  useEffect(() => {
    const loadComments = async () => {
      try {
        const storedComments = await AsyncStorage.getItem('comments');
        if (storedComments) {
          const parsedComments = JSON.parse(storedComments);
          // 转换日期字符串为Date对象
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
    loadComments();
  }, []);

  // 保存评论到AsyncStorage
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

  const addComment = (recipeId: string, content: string) => {
    const newComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipeId,
      authorName: 'Recipe Chef', // 默认用户名
      authorAvatar: undefined,
      content,
      createdAt: new Date(),
      likes: Math.floor(Math.random() * 10), // 模拟随机点赞数
      isLiked: false,
    };
    dispatch({ type: 'ADD_COMMENT', payload: newComment });
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
