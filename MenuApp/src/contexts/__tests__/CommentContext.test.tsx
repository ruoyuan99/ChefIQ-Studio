import React from 'react';
import { render } from '@testing-library/react-native';
import { CommentProvider, useComment } from '../CommentContext';

// Mock dependencies
jest.mock('../AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user', email: 'test@example.com' } }),
}));

jest.mock('../../services/realTimeSyncService', () => ({
  RealTimeSyncService: {
    syncComment: jest.fn(),
  },
}));

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      order: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
};

jest.mock('../../config/supabase', () => ({
  supabase: mockSupabase,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

function renderHook<T>(hook: () => T, options?: { wrapper?: React.ComponentType }) {
  let result: { current: T } = { current: null as any };
  const TestComponent = () => {
    result.current = hook();
    return null;
  };
  const Wrapper = options?.wrapper || React.Fragment;
  render(
    <Wrapper>
      <TestComponent />
    </Wrapper>
  );
  return { result };
}

describe('CommentContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CommentProvider>{children}</CommentProvider>
  );

  describe('useComment', () => {
    it('should provide comment context', () => {
      const { result } = renderHook(() => useComment(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.addComment).toBeDefined();
      expect(result.current.deleteComment).toBeDefined();
      expect(result.current.toggleCommentLike).toBeDefined();
      expect(result.current.getComments).toBeDefined();
    });

    it('should add a comment', () => {
      const { result } = renderHook(() => useComment(), { wrapper });
      
      const comment = {
        id: 'comment-1',
        recipeId: 'recipe-1',
        authorName: 'Test User',
        content: 'Test comment',
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
      };

      result.current.addComment(comment);
      
      const comments = result.current.getComments('recipe-1');
      expect(comments.length).toBeGreaterThan(0);
    });

    it('should delete a comment', () => {
      const { result } = renderHook(() => useComment(), { wrapper });
      
      const comment = {
        id: 'comment-1',
        recipeId: 'recipe-1',
        authorName: 'Test User',
        content: 'Test comment',
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
      };

      result.current.addComment(comment);
      expect(result.current.getComments('recipe-1').length).toBe(1);
      
      result.current.deleteComment('recipe-1', 'comment-1');
      expect(result.current.getComments('recipe-1').length).toBe(0);
    });

    it('should toggle comment like', () => {
      const { result } = renderHook(() => useComment(), { wrapper });
      
      const comment = {
        id: 'comment-1',
        recipeId: 'recipe-1',
        authorName: 'Test User',
        content: 'Test comment',
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
      };

      result.current.addComment(comment);
      result.current.toggleCommentLike('recipe-1', 'comment-1');
      
      const comments = result.current.getComments('recipe-1');
      expect(comments[0].isLiked).toBe(true);
      expect(comments[0].likes).toBe(1);
    });
  });
});

