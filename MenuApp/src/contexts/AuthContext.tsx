import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; message: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitializing = useRef(true);
  const loadingUserProfile = useRef(false);

  useEffect(() => {
    // Get initial session
    getInitialSession();
    
    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.id);
        
        // Skip if we're still initializing (getInitialSession will handle it)
        // This prevents duplicate loading during app startup
        if (isInitializing.current) {
          console.log('⏭️ Skipping auth state change during initialization');
          return;
        }
        
        // Prevent duplicate loading if already loading
        if (loadingUserProfile.current) {
          console.log('⏭️ Skipping duplicate loadUserProfile call');
          return;
        }
        
        if (session?.user) {
          loadingUserProfile.current = true;
          try {
            await loadUserProfile(session.user);
          } finally {
            loadingUserProfile.current = false;
            setLoading(false);
          }
        } else {
          setUser(null);
          await AsyncStorage.removeItem('user');
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getInitialSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        loadingUserProfile.current = true;
        try {
          await loadUserProfile(session.user);
        } finally {
          loadingUserProfile.current = false;
        }
      }
    } catch (error) {
      console.error('Failed to get initial session:', error);
    } finally {
      isInitializing.current = false;
      setLoading(false);
    }
  };

  const loadUserProfile = async (authUser: any) => {
    try {
      // Get user details from database
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Failed to get user profile:', error);
        // If not found by id, try to merge existing data by email
        await createOrMergeUserProfile(authUser);
        return;
      }

      const userData: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatar_url,
        bio: profile.bio
      };

      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const createOrMergeUserProfile = async (authUser: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
          avatar_url: authUser.user_metadata?.avatar_url || null
        })
        .select()
        .single();

      if (error) {
        // If email unique key conflict (same email but different id exists), perform merge: change that email's record id to current authUser.id
        const isDuplicateEmail = (error as any)?.code === '23505' || ((error as any)?.message || '').includes('duplicate key value')
        if (isDuplicateEmail && authUser.email) {
          // Find old record with current email
          const { data: existingByEmail } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .maybeSingle();

          if (existingByEmail && existingByEmail.id !== authUser.id) {
            // Update that record with new id and latest data
            const { error: updateErr } = await supabase
              .from('users')
              .update({
                id: authUser.id,
                name: authUser.user_metadata?.name || existingByEmail.name || authUser.email?.split('@')[0],
                avatar_url: authUser.user_metadata?.avatar_url || existingByEmail.avatar_url || null,
              })
              .eq('email', authUser.email);
            if (updateErr) {
              console.error('Failed to merge user profile:', updateErr);
              return;
            }
          } else {
            console.error('Email already exists but cannot get old record, skipping merge');
            return;
          }
        } else {
          console.error('Failed to create user profile:', error);
          return;
        }
      }

      // If insert succeeded or merge completed, load with latest id/email
      if (!error) {
        const userData: User = {
          id: (data as any).id,
          email: (data as any).email,
          name: (data as any).name,
          avatar_url: (data as any).avatar_url
        };
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        return;
      }
      // If merge completed, re-read and set by id
      const { data: merged, error: mergedErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      if (!mergedErr && merged) {
        const mergedUser: User = {
          id: merged.id,
          email: merged.email,
          name: merged.name,
          avatar_url: merged.avatar_url,
        };
        setUser(mergedUser);
        await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
      }
    } catch (error) {
      console.error('Failed to create user profile:', error);
    }
  };

  const ensureAdminUserExists = async (adminUser: User) => {
    try {
      // Check if admin user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', adminUser.id)
        .single();

      if (!existingUser) {
        // Create admin user
        const { error } = await supabase
          .from('users')
          .insert({
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            avatar_url: adminUser.avatar_url
          });

        if (error) {
          console.error('Failed to create admin user:', error);
        } else {
          console.log('✅ Admin user created successfully');
        }
      } else {
        console.log('✅ Admin user already exists');
      }
    } catch (error) {
      console.error('Failed to ensure admin user exists:', error);
    }
  };

  const signUp = async (email: string, password: string, name?: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        // Create user profile
        await createOrMergeUserProfile(data.user);
        return { 
          success: true, 
          message: 'Registration successful! Please check your email to verify your account.' 
        };
      }

      return { success: false, message: 'Registration failed' };
    } catch (error) {
      return { success: false, message: `Registration failed: ${error}` };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      loadingUserProfile.current = true;
      
      // Normal Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        loadingUserProfile.current = false;
        return { success: false, message: error.message };
      }

      if (data.user) {
        // Load user profile and wait for it to complete
        try {
          await loadUserProfile(data.user);
          // Wait a bit to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 100));
          return { success: true, message: 'Login successful!' };
        } catch (profileError) {
          console.error('Failed to load user profile:', profileError);
          return { success: false, message: 'Login successful but failed to load profile' };
        } finally {
          loadingUserProfile.current = false;
        }
      }

      loadingUserProfile.current = false;
      return { success: false, message: 'Login failed' };
    } catch (error) {
      loadingUserProfile.current = false;
      return { success: false, message: `Login failed: ${error}` };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      const currentUser = user;
      await supabase.auth.signOut();
      setUser(null);
      await AsyncStorage.removeItem('user');
      
        // Clear login session data
        if (currentUser?.id) {
          try {
            const keys = await AsyncStorage.getAllKeys();
            // Remove session-based keys
            const loginSessionKey = `loginSession_${currentUser.id}`;
            const sessionId = await AsyncStorage.getItem(loginSessionKey);
            
            const keysToRemove: string[] = [loginSessionKey];
            if (sessionId) {
              keysToRemove.push(`modalShown_${sessionId}`);
            }
            
            // Also remove any old modalShown_session_ keys (legacy format)
            const oldSessionKeys = keys.filter(key => 
              key.startsWith(`modalShown_session_`) && key.includes(currentUser.id)
            );
            keysToRemove.push(...oldSessionKeys);
            
            if (keysToRemove.length > 0) {
              await AsyncStorage.multiRemove(keysToRemove);
            }
          } catch (error) {
            // Ignore cleanup errors
            console.log('Cleanup old session keys:', error);
          }
        }
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        return { success: false, message: 'User not logged in' };
      }

      // Update user profile, including updated_at timestamp
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update profile:', error);
        return { success: false, message: error.message };
      }

      // Update local user data
      const updatedUser: User = {
        id: data.id,
        email: data.email,
        name: data.name || undefined,
        avatar_url: data.avatar_url || undefined,
        bio: data.bio || undefined,
      };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      return { success: true, message: 'Profile updated successfully!' };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, message: `Update failed: ${error}` };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'chefiq://reset-password'
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Password reset email sent!' };
    } catch (error) {
      return { success: false, message: `Send failed: ${error}` };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
