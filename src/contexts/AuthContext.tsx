import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
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
        // 如果用户不存在，创建一个
        await createUserProfile(authUser);
        return;
      }

      const userData: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatar_url
      };

      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('加载用户资料失败:', error);
    }
  };

  const createUserProfile = async (authUser: any) => {
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
        console.error('创建用户资料失败:', error);
        return;
      }

      const userData: User = {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar_url: data.avatar_url
      };

      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
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
          console.error('创建管理员用户失败:', error);
        } else {
          console.log('✅ 管理员用户已创建');
        }
      } else {
        console.log('✅ 管理员用户已存在');
      }
    } catch (error) {
      console.error('确保管理员用户存在失败:', error);
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
        await createUserProfile(data.user);
        return { 
          success: true, 
          message: '注册成功！请检查您的邮箱以验证账户。' 
        };
      }

      return { success: false, message: '注册失败' };
    } catch (error) {
      return { success: false, message: `注册失败: ${error}` };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      
      // 特殊处理admin@admin.com账户
      if (email === 'admin@admin.com' && password === 'password') {
        console.log('🔑 使用管理员账户登录');
        
        const adminUser: User = {
          id: 'admin-user-id-12345',
          email: 'admin@admin.com',
          name: 'Admin User',
          avatar_url: null
        };
        
        setUser(adminUser);
        await AsyncStorage.setItem('user', JSON.stringify(adminUser));
        
        // 确保管理员用户在Supabase中存在
        await ensureAdminUserExists(adminUser);
        
        return { success: true, message: '管理员登录成功！' };
      }
      
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
        return { success: true, message: '登录成功！' };
      }

      return { success: false, message: '登录失败' };
    } catch (error) {
      return { success: false, message: `登录失败: ${error}` };
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
      console.error('登出失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        return { success: false, message: '用户未登录' };
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { success: false, message: error.message };
      }

      // 更新本地用户数据
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      return { success: true, message: '资料更新成功！' };
    } catch (error) {
      return { success: false, message: `更新失败: ${error}` };
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
