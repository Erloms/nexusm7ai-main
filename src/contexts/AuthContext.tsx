import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types'; // Import Supabase types

// Define a type for the user profile from Supabase
interface UserProfile extends Tables<'profiles'> {}

interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  userProfile: UserProfile | null; // Add userProfile to context
  checkPaymentStatus: () => boolean;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // New state for user profile
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile from Supabase
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  };

  // Function to create/update user profile in Supabase
  const upsertUserProfile = async (userId: string, email: string, username: string, role: 'admin' | 'user' = 'user') => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        username: username,
        role: role,
        membership_type: 'free', // Default to free
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' }) // Upsert based on id
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      return null;
    }
    return data;
  };

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    const handleAuthStateChange = async (session: any) => {
      console.log('AuthContext: onAuthStateChange event. User:', session?.user ? 'User found' : 'No user');
      setUser(session?.user ?? null);
      if (session?.user) {
        let profile = await fetchUserProfile(session.user.id);
        if (!profile) {
          // If profile doesn't exist, create a basic one
          console.warn('AuthContext: User profile missing, creating a new one.');
          profile = await upsertUserProfile(
            session.user.id, 
            session.user.email || '', 
            session.user.user_metadata.username || session.user.email?.split('@')[0] || '新用户'
          );
        }
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
      console.log('AuthContext: Loading set to false after auth state change.');
    };

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await handleAuthStateChange(session);
    }).catch(err => {
      console.error('AuthContext: Error getting session:', err);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(session);
    });

    return () => {
      console.log('AuthContext: Unsubscribing from auth state changes.');
      subscription.unsubscribe();
    };
  }, []);

  const checkPaymentStatus = () => {
    if (!userProfile) return false;

    // Admin users always have full access
    if (userProfile.role === 'admin') {
      return true;
    }

    // Check membership type and expiry
    if (userProfile.membership_type === 'lifetime') {
      return true;
    }
    if (userProfile.membership_type === 'annual' && userProfile.membership_expires_at) {
      const expiryDate = new Date(userProfile.membership_expires_at);
      return expiryDate > new Date();
    }

    return false;
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('Login error:', error.message);
        return { success: false, message: error.message };
      }
      if (data.user) {
        // After successful login, ensure a profile exists or create one
        let profile = await fetchUserProfile(data.user.id);
        if (!profile) {
          console.warn('AuthContext: User profile missing after login, creating a new one.');
          profile = await upsertUserProfile(
            data.user.id, 
            data.user.email || '', 
            data.user.user_metadata.username || data.user.email?.split('@')[0] || '新用户'
          );
        }
        setUserProfile(profile);
        return { success: true, message: "登录成功！" };
      }
      console.warn('Login completed but no user data returned:', data);
      return { success: false, message: "登录失败，请检查您的邮箱和密码。" };
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      return { success: false, message: err.message || "发生未知错误，请重试。" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: name, // Store the name in user_metadata
          },
        },
      });
      if (error) {
        console.error('Registration error:', error.message);
        return { success: false, message: error.message };
      }
      if (data.user) {
        // Create a profile entry for the new user
        const profile = await upsertUserProfile(data.user.id, email, name);
        setUserProfile(profile);
        console.log('Registration successful, user:', data.user);
        
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length > 0 && !data.user.email_confirmed_at) {
          return { success: true, message: "注册成功！请检查您的邮箱以验证账号并完成登录。" };
        } else {
          return { success: true, message: "注册成功！" };
        }
      }
      console.warn('Registration completed but no user data returned:', data);
      return { success: false, message: "注册失败，请重试。" };
    } catch (err: any) {
      console.error('Unexpected registration error:', err);
      return { success: false, message: err.message || "发生未知错误，请重试。" };
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (feature: string) => {
    if (!userProfile) return false;

    // Admin users always have full access
    if (userProfile.role === 'admin') {
      return true;
    }

    // Check membership type for features
    if (userProfile.membership_type === 'lifetime') {
      return true;
    }
    if (userProfile.membership_type === 'annual' && userProfile.membership_expires_at) {
      const expiryDate = new Date(userProfile.membership_expires_at);
      return expiryDate > new Date();
    }

    // Free users might have limited access to some features,
    // but for now, if not paid, no permission.
    return false;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    userProfile, // Provide userProfile in context
    checkPaymentStatus,
    signOut,
    login,
    register,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};