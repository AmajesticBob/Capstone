import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  verifyOTP: (email: string, token: string) => Promise<any>;
  resendOTP: (email: string, type?: 'signup' | 'recovery') => Promise<any>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  checkEmailAvailability: (email: string) => Promise<boolean>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  verifyOTPForPasswordReset: (email: string, token: string, newPassword: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile FULL OBJECT:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Profile doesn't exist yet, try to create it
        console.log('Profile not found, attempting to create...');
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
          throw userError;
        }
        
        if (userData.user) {
          const username = userData.user.user_metadata?.username;
          const email = userData.user.email;
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userData.user.id,
                username,
                email,
              },
            ])
            .select()
            .single();

          if (createError) {
            // If profile already exists (duplicate key error), fetch it instead
            if (createError.code === '23505') {
              console.log('Profile already exists, fetching it...');
              const { data: existingProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userData.user.id)
                .single();
              
              if (fetchError) {
                console.error('Error fetching existing profile:', fetchError);
                throw fetchError;
              }
              
              setProfile(existingProfile);
            } else {
              console.error('Error creating profile:', createError);
              throw createError;
            }
          } else {
            setProfile(newProfile);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch/create profile:', error);
      // Set profile to null on error so app can still function
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // First check if username is available
      const isUsernameAvailable = await checkUsernameAvailability(username);
      if (!isUsernameAvailable) {
        throw new Error('Username is already taken');
      }

      // Check if email is available
      const isEmailAvailable = await checkEmailAvailability(email);
      if (!isEmailAvailable) {
        throw new Error('Email is already in use');
      }

      // Sign up with Supabase Auth (this will send an OTP)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: undefined, // We're using OTP, not email links
        },
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return { data: null, error: new Error(message) };
    }
  };

  const verifyOTP = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) throw error;

      // After successful OTP verification, create the profile if it doesn't exist
      if (data.user) {
        const username = data.user.user_metadata?.username;
        
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                username,
                email: data.user.email,
              },
            ]);

          if (profileError) {
            // Ignore duplicate key errors (23505) - profile already exists
            if (profileError.code !== '23505') {
              console.error('Error creating profile during OTP verification:', profileError);
            }
            // Don't throw here - the profile will be created on first login via fetchProfile if needed
          }
        }
      }

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      return { data: null, error: new Error(message) };
    }
  };

  const resendOTP = async (email: string, type: 'signup' | 'recovery' = 'signup') => {
    try {
      if (type === 'recovery') {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: undefined,
        });
        if (error) throw error;
        return { data, error: null };
      }

      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend OTP';
      return { data: null, error: new Error(message) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      return { data: null, error: new Error(message) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data === null; // Username is available if no data is returned
    } catch (error: any) {
      if(error.code === 'PGRST116') {
        return true;
      }
      
      console.error('Error checking username:', error);
      return false;
    }
  };

  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data === null; // Email is available if no data is returned
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
    await refreshProfile();
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('No user logged in');

    try {
      // Call the database function to delete both profile and auth user
      // This function must be created in Supabase (see SUPABASE_SETUP.md)
      const { error: rpcError } = await supabase.rpc('delete_user_account');

      if (rpcError) {
        // Check if the function doesn't exist
        if (rpcError.code === 'PGRST202') {
          throw new Error(
            'Database function not set up. Please run the SQL commands in SUPABASE_SETUP.md to enable complete account deletion.'
          );
        }
        console.error('Error calling delete function:', rpcError);
        throw rpcError;
      }

      // Sign out the user
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset code';
      return { data: null, error: new Error(message) };
    }
  };

  const verifyOTPForPasswordReset = async (email: string, token: string, newPassword: string) => {
    try {
      // First verify the OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });

      if (error) throw error;

      // After OTP verification, update the password
      if (data.session) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) throw updateError;
      }

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify code or update password';
      return { data: null, error: new Error(message) };
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    verifyOTP,
    resendOTP,
    checkUsernameAvailability,
    checkEmailAvailability,
    updateProfile,
    changePassword,
    deleteAccount,
    refreshProfile,
    resetPassword,
    verifyOTPForPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};