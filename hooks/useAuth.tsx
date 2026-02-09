"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, database } from "@/lib/firebase";
import { APP_ROLES } from "@/lib/constants";
import { UserProfile } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        loadProfile(currentUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadProfile = async (currentUser: User) => {
    setLoading(true);

    try {
      const userProfileRef = ref(database, `users/${currentUser.uid}`);
      const snapshot = await get(userProfileRef);

      const now = new Date().toISOString();
      const baseProfile: UserProfile = {
        email: currentUser.email ?? "",
        name: currentUser.displayName ?? "",
        role: APP_ROLES.ADMIN, // Admin-only system
        status: "active",
        createdAt: now,
        updatedAt: now,
      };

      if (snapshot.exists()) {
        const data = snapshot.val();
        setProfile({
          ...baseProfile,
          ...data,
          role: data?.role ?? APP_ROLES.ADMIN,
          status: data?.status ?? "active",
        });
      } else {
        await set(userProfileRef, baseProfile);
        setProfile(baseProfile);
      }
    } catch (error) {
      console.error("Failed to load user profile", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, { displayName: name });

      // Save user profile to Realtime Database with admin role
      const now = new Date().toISOString();
      const userProfileRef = ref(database, `users/${user.uid}`);
      await set(userProfileRef, {
        email: user.email,
        name: name,
        role: APP_ROLES.ADMIN, // Admin-only system
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
