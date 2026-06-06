import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { supabase } from "../supabase";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  blood_type: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  device_token?: string;
  created_at?: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Try to get from user_profiles table
      let { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Fallback to users table if user_profiles doesn't exist
      if (error && error.code === "42P01") {
        const { data: oldData, error: oldError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (!oldError && oldData) {
          data = {
            id: oldData.id,
            email: oldData.email || `${oldData.id}@temp.com`,
            name: oldData.name,
            blood_type: oldData.blood_type,
            latitude: oldData.latitude || 0,
            longitude: oldData.longitude || 0,
            is_available: oldData.is_available || true,
            device_token: oldData.device_token,
          };
        }
      }

      if (data) {
        setProfile(data as UserProfile);
      } else {
        console.log("No profile found for user:", userId);
      }
    } catch (error) {
      console.log("Fetch profile error:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      Alert.alert("Error", "User tidak ditemukan");
      return;
    }

    try {
      // Try to update user_profiles table first
      let error;
      let tableName = "user_profiles";

      const { error: updateError } = await supabase
        .from(tableName)
        .update(updates)
        .eq("id", user.id);

      error = updateError;

      // If user_profiles doesn't exist, try users table
      if (error && error.code === "42P01") {
        const { error: oldError } = await supabase
          .from("users")
          .update(updates)
          .eq("id", user.id);
        error = oldError;
      }

      if (error) throw error;

      // Update local state
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      Alert.alert("Sukses", "Profile berhasil diupdate");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
