import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../config/supabase';

// Mock dependencies
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ 
      data: { 
        subscription: { 
          unsubscribe: jest.fn() 
        } 
      } 
    })),
    resetPasswordForEmail: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
};

jest.mock('../../config/supabase', () => ({
  supabase: mockSupabase,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  const TestComponent: React.FC<{ testFn: (auth: ReturnType<typeof useAuth>) => void }> = ({ testFn }) => {
    const auth = useAuth();
    React.useEffect(() => {
      testFn(auth);
    }, [auth]);
    return null;
  };

  describe('AuthProvider', () => {
    beforeEach(() => {
      // Reset mocks before each test
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      });
    });

    it('should provide auth context', () => {
      render(
        <AuthProvider>
          <TestComponent testFn={(auth) => {
            expect(auth).toBeDefined();
            expect(auth.user).toBeDefined();
            expect(auth.loading).toBeDefined();
            expect(auth.signIn).toBeDefined();
            expect(auth.signUp).toBeDefined();
            expect(auth.signOut).toBeDefined();
            expect(auth.updateProfile).toBeDefined();
            expect(auth.resetPassword).toBeDefined();
          }} />
        </AuthProvider>
      );
    });

    it('should initialize with existing session', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: mockUser,
          },
        },
      });

      const mockFrom = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                avatar_url: null,
                bio: null,
              },
              error: null,
            }),
          })),
        })),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockFrom);

      render(
        <AuthProvider>
          <TestComponent testFn={(auth) => {
            // Context should be available
            expect(auth).toBeDefined();
          }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      });
    });
  });

  describe('signIn', () => {
    beforeEach(() => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      });
    });

    it('should sign in successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: {
          user: mockUser,
        },
        error: null,
      });

      const mockFrom = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: mockUser.id,
                email: mockUser.email,
                name: null,
                avatar_url: null,
                bio: null,
              },
              error: null,
            }),
          })),
        })),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockFrom);

      let authResult: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <TestComponent testFn={(auth) => {
            authResult = auth;
          }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authResult).not.toBeNull();
      });

      if (authResult) {
        const result = await authResult.signIn('test@example.com', 'password123');
        expect(result.success).toBe(true);
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      }
    });

    it('should handle sign in errors', async () => {
      (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      });

      let authResult: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <TestComponent testFn={(auth) => {
            authResult = auth;
          }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authResult).not.toBeNull();
      });

      if (authResult) {
        const result = await authResult.signIn('test@example.com', 'wrong');
        expect(result.success).toBe(false);
        expect(result.message).toBe('Invalid credentials');
      }
    });
  });

  describe('signUp', () => {
    beforeEach(() => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      });
    });

    it('should sign up successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'new@example.com',
      };

      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: {
          user: mockUser,
        },
        error: null,
      });

      const mockFrom = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: mockUser.id,
                email: mockUser.email,
                name: 'new',
                avatar_url: null,
              },
              error: null,
            }),
          })),
        })),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockFrom);

      let authResult: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <TestComponent testFn={(auth) => {
            authResult = auth;
          }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authResult).not.toBeNull();
      });

      if (authResult) {
        const result = await authResult.signUp('new@example.com', 'password123', 'New User');
        expect(result.success).toBe(true);
        expect(mockSupabase.auth.signUp).toHaveBeenCalled();
      }
    });
  });

  describe('signOut', () => {
    beforeEach(() => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      });
    });

    it('should sign out successfully', async () => {
      (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      let authResult: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <TestComponent testFn={(auth) => {
            authResult = auth;
          }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authResult).not.toBeNull();
      });

      if (authResult) {
        await authResult.signOut();
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
      }
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      });
    });

    it('should update profile successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Old Name',
      };

      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: mockUser,
          },
        },
      });

      const mockFrom = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                avatar_url: null,
                bio: null,
              },
              error: null,
            }),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: mockUser.id,
                  email: mockUser.email,
                  name: 'New Name',
                  avatar_url: null,
                  bio: null,
                },
                error: null,
              }),
            })),
          })),
        })),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(mockFrom);

      let authResult: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <TestComponent testFn={(auth) => {
            authResult = auth;
          }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authResult).not.toBeNull();
        expect(authResult?.user).not.toBeNull();
      });

      if (authResult && authResult.user) {
        const result = await authResult.updateProfile({ name: 'New Name' });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      });
    });

    it('should send password reset email', async () => {
      (mockSupabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        error: null,
      });

      let authResult: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <TestComponent testFn={(auth) => {
            authResult = auth;
          }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authResult).not.toBeNull();
      });

      if (authResult) {
        const result = await authResult.resetPassword('test@example.com');
        expect(result.success).toBe(true);
        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          expect.objectContaining({
            redirectTo: 'chefiq://reset-password',
          })
        );
      }
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent testFn={() => {}} />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});

