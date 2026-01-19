"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, database } from "@/lib/firebase";
import { DEFAULT_APP_ROLE, ROLE_LANDING_PAGES } from "@/lib/constants";
import { UserProfile } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  getLandingPage: () => string;
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

      const baseProfile: UserProfile = {
        email: currentUser.email ?? "",
        fullName: currentUser.displayName ?? "",
        role: DEFAULT_APP_ROLE,
        landingPage: ROLE_LANDING_PAGES[DEFAULT_APP_ROLE],
        createdAt: new Date().toISOString(),
      };

      if (snapshot.exists()) {
        const data = snapshot.val();
        setProfile({
          ...baseProfile,
          ...data,
          role: data?.role ?? DEFAULT_APP_ROLE,
          landingPage: data?.landingPage ?? ROLE_LANDING_PAGES[data?.role as keyof typeof ROLE_LANDING_PAGES] ?? ROLE_LANDING_PAGES[DEFAULT_APP_ROLE],
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

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, { displayName: fullName });

      // Save user profile to Realtime Database
      const userProfileRef = ref(database, `users/${user.uid}`);
      await set(userProfileRef, {
        email: user.email,
        fullName: fullName,
        role: DEFAULT_APP_ROLE,
        landingPage: ROLE_LANDING_PAGES[DEFAULT_APP_ROLE],
        createdAt: new Date().toISOString(),
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const getLandingPage = useCallback(() => {
    if (!profile) return ROLE_LANDING_PAGES[DEFAULT_APP_ROLE];
    return profile.landingPage || ROLE_LANDING_PAGES[profile.role] || ROLE_LANDING_PAGES[DEFAULT_APP_ROLE];
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        getLandingPage,
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
