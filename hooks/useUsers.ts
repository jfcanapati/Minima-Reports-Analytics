"use client";

import { useState, useEffect } from "react";
import { ref, get, set, remove, update } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { UserProfile, AppRole } from "@/types/auth";
import { createUserWithEmailAndPassword, getAuth, updateProfile } from "firebase/auth";
import { logAuditAction } from "./useAuditLog";
import { initializeApp, getApps } from "firebase/app";

export interface UserWithId extends UserProfile {
  id: string;
}

export function useUsers() {
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersList: UserWithId[] = Object.entries(data).map(([id, userData]) => ({
          id,
          ...(userData as UserProfile),
        }));
        setUsers(usersList);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setError("Failed to fetch users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async (email: string, password: string, name: string, role: AppRole, phone?: string) => {
    try {
      // Store current user before creating new one
      const currentUser = auth.currentUser;
      
      // Create a secondary auth instance to avoid logging out the current admin
      const secondaryApp = getApps().length > 1 ? getApps()[1] : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }, "Secondary");
      
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const userId = userCredential.user.uid;
      
      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      const now = new Date().toISOString();
      const userProfile: UserProfile = {
        email,
        name,
        phone,
        role,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };

      const userRef = ref(database, `users/${userId}`);
      await set(userRef, userProfile);
      
      // Sign out the newly created user from secondary auth
      await secondaryAuth.signOut();
      
      // Log audit action with the original admin user
      if (currentUser) {
        await logAuditAction(
          "User Created",
          "auth",
          `Created new user account for ${name} (${email}) with role ${role}`,
          {
            id: currentUser.uid,
            name: currentUser.displayName || "Unknown",
            email: currentUser.email || "Unknown",
          },
          { userId, email, name, role }
        );
      }
      
      await fetchUsers();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to add user" };
    }
  };

  const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      
      // Log audit action
      const currentUser = auth.currentUser;
      if (currentUser) {
        await logAuditAction(
          "User Updated",
          "auth",
          `Updated user information for ${updates.name || "user"}`,
          {
            id: currentUser.uid,
            name: currentUser.displayName || "Unknown",
            email: currentUser.email || "Unknown",
          },
          { userId, updates }
        );
      }
      
      await fetchUsers();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update user" };
    }
  };

  const deleteUserById = async (userId: string) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      await remove(userRef);
      
      await fetchUsers();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to delete user" };
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const userRef = ref(database, `users/${userId}`);
      
      // Get user details for logging
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val();
      
      await update(userRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      
      // Log audit action
      const currentUser = auth.currentUser;
      if (currentUser) {
        await logAuditAction(
          newStatus === "active" ? "User Activated" : "User Deactivated",
          "auth",
          `${newStatus === "active" ? "Activated" : "Deactivated"} user account for ${userData?.name || userData?.email}`,
          {
            id: currentUser.uid,
            name: currentUser.displayName || "Unknown",
            email: currentUser.email || "Unknown",
          },
          { userId, previousStatus: currentStatus, newStatus }
        );
      }
      
      await fetchUsers();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update user status" };
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser: deleteUserById,
    toggleUserStatus,
  };
}
