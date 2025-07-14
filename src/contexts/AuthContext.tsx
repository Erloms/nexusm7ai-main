import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types'; // Import Database type

// Define a type for the user profile from Supabase
type UserProfile = Database['public']['Tables']['profiles']['Row']; // Changed this line

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
  login: (identifier: string, password: string) => Promise<AuthResult>; // Change to identifier
  register: (name: string, email: string | null, password: string, registrationType: 'email' | 'username') => Promise<AuthResult>; // Add registrationType
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
    console.log(`[AuthContext] fetchUserProfile: Attempting to fetch profile for user ID: ${userId}`);
    const { data, error } = await supabase
      .from('profiles')
      .select('*') // Selects all columns, including role and membership_type
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') { // Specifically check for "0 rows" error (profile not found)
      console.warn(`[AuthContext] fetchUserProfile: Profile not found for user ${userId}. Attempting to create it via client-side fallback.`);
      // FIX: Use supabase.auth.getUser() to get the current user
      const { data: { user: currentUser } } = await supabase.auth.getUser(); 
      if (currentUser && currentUser.id === userId) { // Ensure we're only trying to create for the current user
        const defaultUsername = currentUser.email?.split('@')[0] || '新用户';
        // Determine default role and membership based on email for new profile creation
        const defaultRole = (currentUser.email === 'master@admin.com' || currentUser.email === 'morphy.realm@gmail.com') ? 'admin' : 'user';
        const defaultMembershipType = defaultRole === 'admin' ? 'lifetime' : 'free'; 

        const { data: newProfile, error: insertProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: defaultUsername,
            role: defaultRole,
            email: currentUser.email,
            membership_type: defaultMembershipType,
          })
          .select()
          .single();

        if (insertProfileError) {
          console.error('[AuthContext] fetchUserProfile: Error creating missing profile via fallback:', insertProfileError);
          return null;
        }
        console.log('[AuthContext] fetchUserProfile: Successfully created missing profile via fallback. New profile data:', newProfile); // Added log
        return newProfile; // Return the newly created profile
      }
      return null; // If not PGRST116 or not current user, or other error, return null
    } else if (error) {
      console.error('[AuthContext] fetchUserProfile: Other error fetching user profile:', error);
      return null;
    }
    console.log('[AuthContext] fetchUserProfile: Successfully fetched profile from DB. Data:', data); // Added log
    return data;
  };

  useEffect(() => {
    console.log('[AuthContext] useEffect: Initializing auth listener...');
    const handleAuthStateChange = async (session: any) => {
      console.log('[AuthContext] handleAuthStateChange: Event triggered. Session:', session ? 'exists' : 'null');
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('[AuthContext] handleAuthStateChange: User found, fetching profile...');
        const profile = await fetchUserProfile(session.user.id);
        if (!profile) {
          console.warn('[AuthContext] handleAuthStateChange: User profile missing after auth state change. This might be handled by client-side fallback or database trigger.');
        }
        setUserProfile(profile);
        console.log('[AuthContext] handleAuthStateChange: User profile state updated to:', profile); // Added log
      } else {
        console.log('[AuthContext] handleAuthStateChange: No user, clearing profile.');
        setUserProfile(null);
      }
      setLoading(false);
      console.log('[AuthContext] handleAuthStateChange: Loading set to false.');
    };

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[AuthContext] getSession: Initial session data received.');
      await handleAuthStateChange(session);
    }).catch(err => {
      console.error('[AuthContext] getSession: Error getting session:', err);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`[AuthContext] onAuthStateChange: Event: ${_event}`);
      handleAuthStateChange(session);
    });

    return () => {
      console.log('[AuthContext] useEffect cleanup: Unsubscribing from auth state changes.');
      subscription.unsubscribe();
    };
  }, []);

  const checkPaymentStatus = () => {
    console.log('[AuthContext] checkPaymentStatus called.');
    console.log('[AuthContext] checkPaymentStatus: Evaluating userProfile:', userProfile); // Added log

    if (!userProfile) {
      console.log('[AuthContext] checkPaymentStatus: userProfile is null, returning false.');
      return false;
    }

    // Admin users always have full access
    if (userProfile.role === 'admin') {
      console.log('[AuthContext] checkPaymentStatus: User is admin, returning true.');
      return true;
    }

    // Check membership type and expiry
    if (userProfile.membership_type === 'lifetime') {
      console.log('[AuthContext] checkPaymentStatus: User has lifetime membership, returning true.');
      return true;
    }
    if (userProfile.membership_type === 'annual' && userProfile.membership_expires_at) {
      const expiryDate = new Date(userProfile.membership_expires_at);
      const isExpired = expiryDate < new Date();
      console.log(`[AuthContext] checkPaymentStatus: User has annual membership. Expiry: ${expiryDate.toLocaleString()}, Is Expired: ${isExpired}.`);
      return !isExpired;
    }

    console.log('[AuthContext] checkPaymentStatus: User is free or membership type not recognized, returning false.');
    return false;
  };

  const signOut = async () => {
    setLoading(true);
    console.log('[AuthContext] signOut: Attempting to sign out.');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] signOut: Error signing out:', error);
      } else {
        console.log('[AuthContext] signOut: Successfully signed out.');
      }
    } catch (err) {
      console.error('[AuthContext] signOut: Unexpected sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    console.log(`[AuthContext] login: Attempting to log in with identifier: ${identifier}`);
    try {
      let emailToLogin = identifier;

      // If identifier is not an email, assume it's a username and try to find the associated email
      if (!identifier.includes('@')) {
        console.log('[AuthContext] login: Identifier is not an email, attempting to find email by username.');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .single();

        if (profileError || !profile) {
          console.error('[AuthContext] login error: Username not found or profile fetch failed', profileError);
          return { success: false, message: "用户名不存在或密码错误。" };
        }
        emailToLogin = profile.email!; // Use the email from the profile
        console.log(`[AuthContext] login: Found email ${emailToLogin} for username ${identifier}.`);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password,
      });
      if (error) {
        console.error('[AuthContext] login error:', error.message);
        return { success: false, message: error.message };
      }
      if (data.user) {
        console.log('[AuthContext] login: User data received, fetching profile...');
        const profile = await fetchUserProfile(data.user.id); // Fetch the profile after successful login
        setUserProfile(profile); // Set the fetched profile
        console.log('[AuthContext] login: Profile set after login:', profile); // Added log
        return { success: true, message: "登录成功！" };
      }
      console.warn('[AuthContext] login: Completed but no user data returned:', data);
      return { success: false, message: "登录失败，请检查您的账号和密码。" };
    } catch (err: any) {
      console.error('[AuthContext] login: Unexpected login error:', err);
      return { success: false, message: err.message || "发生未知错误，请重试。" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string | null, password: string, registrationType: 'email' | 'username'): Promise<AuthResult> => {
    setLoading(true);
    console.log(`[AuthContext] register: Attempting to register user: ${name}, type: ${registrationType}`);
    try {
      let finalEmail = email;
      let signUpOptions: any = {
        data: {
          username: name,
        },
      };

      if (registrationType === 'username') {
        // Generate a virtual email for Supabase
        // Ensure uniqueness and valid format for the virtual email
        // Changed domain from virtual.nexusai.top to example.com for better compatibility
        finalEmail = `${name.toLowerCase().replace(/\s/g, '')}-${Date.now()}@example.com`;
        console.log(`[AuthContext] register: Generated virtual email for username registration: ${finalEmail}`);
      } else if (!finalEmail) {
        return { success: false, message: "邮箱注册需要提供邮箱地址。" };
      }

      const { data, error } = await supabase.auth.signUp({
        email: finalEmail!,
        password,
        options: signUpOptions,
      });

      if (error) {
        console.error('[AuthContext] register error:', error.message);
        return { success: false, message: error.message };
      }
      if (data.user) {
        console.log('[AuthContext] register: User data received after signup:', data.user);
        // After successful signup, the 'handle_new_user' database trigger should create the profile.
        // We don't need to manually upsert it here, just fetch it.
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
        console.log('[AuthContext] register: Profile set after registration:', profile); // Added log
        
        // For username registration, or if email confirmation is globally disabled, no email verification message
        if (registrationType === 'email' && data.user.identities && data.user.identities.length > 0 && !data.user.email_confirmed_at) {
          return { success: true, message: "注册成功！请检查您的邮箱以验证账号并完成登录。" };
        } else {
          return { success: true, message: "注册成功！" };
        }
      }
      console.warn('[AuthContext] register: Completed but no user data returned:', data);
      return { success: false, message: "注册失败，请重试。" };
    } catch (err: any) {
      console.error('[AuthContext] register: Unexpected registration error:', err);
      return { success: false, message: err.message || "发生未知错误，请重试。" };
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (feature: string) => {
    console.log(`[AuthContext] hasPermission called for feature: ${feature}`);
    console.log('[AuthContext] hasPermission: Evaluating userProfile:', userProfile); // Added log

    if (!userProfile) {
      console.log('[AuthContext] hasPermission: userProfile is null, returning false.');
      return false;
    }

    // Admin users always have full access
    if (userProfile.role === 'admin') {
      console.log('[AuthContext] hasPermission: User is admin, returning true.');
      return true;
    }

    // Check membership type for features
    if (userProfile.membership_type === 'lifetime') {
      console.log('[AuthContext] hasPermission: User has lifetime membership, returning true.');
      return true;
    }
    if (userProfile.membership_type === 'annual' && userProfile.membership_expires_at) {
      const expiryDate = new Date(userProfile.membership_expires_at);
      const isExpired = expiryDate < new Date();
      console.log(`[AuthContext] hasPermission: User has annual membership. Expiry: ${expiryDate.toLocaleString()}, Is Expired: ${isExpired}.`);
      return !isExpired;
    }

    console.log('[AuthContext] hasPermission: User is free or membership type not recognized, returning false.');
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