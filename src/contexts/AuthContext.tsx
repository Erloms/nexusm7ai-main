import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  checkPaymentStatus: () => boolean;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>; // Updated signature
  register: (name: string, email: string, password: string) => Promise<boolean>;
  hasPermission: (feature: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    // 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: getSession result:', session?.user ? 'User found' : 'No user');
      setUser(session?.user ?? null);
      setLoading(false);
      console.log('AuthContext: Initial loading set to false.');
    }).catch(err => {
      console.error('AuthContext: Error getting session:', err);
      setLoading(false); // Ensure loading is false even on error
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthContext: onAuthStateChange event:', _event, 'User:', session?.user ? 'User found' : 'No user');
      setUser(session?.user ?? null);
      setLoading(false); // Ensure loading is false after any auth state change
      console.log('AuthContext: Loading set to false after auth state change.');
    });

    return () => {
      console.log('AuthContext: Unsubscribing from auth state changes.');
      subscription.unsubscribe();
    };
  }, []);

  const checkPaymentStatus = () => {
    if (!user) return false;
    
    // 检查管理员权限 - 使用完整的管理员邮箱进行检查
    // IMPORTANT: This is a temporary bypass for testing. Do NOT use hardcoded emails in production.
    const adminEmails = ['master@admin.com', 'morphy.realm@gmail.com']; // Add your admin emails here
    if (user.email && adminEmails.includes(user.email)) {
      return true;
    }
    
    // 检查VIP用户
    const vipUsers = JSON.parse(localStorage.getItem('vipUsers') || '[]');
    if (vipUsers.includes(user.id)) {
      return true;
    }
    
    return false;
  };

  const signOut = async () => {
    setLoading(true); // Set loading to true when signing out
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
    } finally {
      setLoading(false); // Always set loading to false when done
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true); // Set loading to true when logging in
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('Login error:', error.message);
        // Instead of throwing, return false to indicate failure
        return false;
      }
      // If no error, login was successful
      return true;
    } catch (err) {
      console.error('Unexpected login error:', err);
      // For unexpected errors, also return false
      return false;
    } finally {
      setLoading(false); // Always set loading to false when done
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true); // Set loading to true when starting registration
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_name: name, // Store the name in user_metadata
          },
        },
      });
      if (error) {
        console.error('Registration error:', error.message);
        // Consider showing a user-friendly error message here
        return false; // Indicate failure
      }
      if (data.user) {
        console.log('Registration successful, user:', data.user);
        setUser(data.user); // Update user state immediately
        return true; // Indicate success
      }
      // This case might happen if data.user is null but no error, e.g., email confirmation required
      console.warn('Registration completed but no user data returned:', data);
      return false;
    } catch (err) {
      console.error('Unexpected registration error:', err);
      return false;
    } finally {
      setLoading(false); // Always set loading to false when done
    }
  };

  const hasPermission = (feature: string) => {
    if (!user) return false;
    
    // 管理员权限
    // IMPORTANT: This is a temporary bypass for testing. Do NOT use hardcoded emails in production.
    const adminEmails = ['master@admin.com', 'morphy.realm@gmail.com']; // Add your admin emails here
     if (user.email && adminEmails.includes(user.email)) {
      return true;
    }
    
    // VIP用户权限
    const vipUsers = JSON.parse(localStorage.getItem('vipUsers') || '[]');
    if (vipUsers.includes(user.id)) {
      return true;
    }
    
    return false;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    checkPaymentStatus,
    signOut,
    login,
    register,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};