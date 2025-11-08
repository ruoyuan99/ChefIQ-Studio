import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    // 获取初始会话
    getInitialSession();
    
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          await AsyncStorage.removeItem('user');
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getInitialSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user);
      }
    } catch (error) {
      console.error('获取初始会话失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (authUser: any) => {
    try {
      // 从数据库获取用户详细信息
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('获取用户资料失败:', error);
        // 如果按 id 未找到，尝试按 email 合并已有资料
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
        // 如果是邮箱唯一键冲突（已存在同邮箱但不同 id），执行合并：把该邮箱的记录 id 改为当前 authUser.id
        const isDuplicateEmail = (error as any)?.code === '23505' || ((error as any)?.message || '').includes('duplicate key value')
        if (isDuplicateEmail && authUser.email) {
          // 找到当前邮箱的旧记录
          const { data: existingByEmail } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .maybeSingle();

          if (existingByEmail && existingByEmail.id !== authUser.id) {
            // 将该记录更新为新 id 与最新资料
            const { error: updateErr } = await supabase
              .from('users')
              .update({
                id: authUser.id,
                name: authUser.user_metadata?.name || existingByEmail.name || authUser.email?.split('@')[0],
                avatar_url: authUser.user_metadata?.avatar_url || existingByEmail.avatar_url || null,
              })
              .eq('email', authUser.email);
            if (updateErr) {
              console.error('合并用户资料失败:', updateErr);
              return;
            }
          } else {
            console.error('邮箱已存在但无法获取旧记录，跳过合并');
            return;
          }
        } else {
          console.error('Failed to create user profile:', error);
          return;
        }
      }

      // 如果是 insert 成功，或已完成合并，则以最新 id/email 载入
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
      // 合并完成的情况，按 id 重新读取并设置
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
      console.error('创建用户资料失败:', error);
    }
  };

  const ensureAdminUserExists = async (adminUser: User) => {
    try {
      // 检查管理员用户是否已存在
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', adminUser.id)
        .single();

      if (!existingUser) {
        // 创建管理员用户
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
        // 创建用户资料
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
      
      // 正常Supabase登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user);
        return { success: true, message: 'Login successful!' };
      }

      return { success: false, message: 'Login failed' };
    } catch (error) {
      return { success: false, message: `Login failed: ${error}` };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      await AsyncStorage.removeItem('user');
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

      // 更新用户资料，包括 updated_at 时间戳
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

      // 更新本地用户数据
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

      return { success: true, message: '密码重置邮件已发送！' };
    } catch (error) {
      return { success: false, message: `发送失败: ${error}` };
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
