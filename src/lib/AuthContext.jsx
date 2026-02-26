"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signUp = useCallback(async ({ email, password, fullName }) => {
    if (!auth) {
      throw new Error("Firebase auth is not initialized");
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (fullName) {
      await updateProfile(result.user, { displayName: fullName });
    }
    return result.user;
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    if (!auth) {
      throw new Error("Firebase auth is not initialized");
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!auth) {
      throw new Error("Firebase auth is not initialized");
    }
    if (!email) {
      throw new Error("Email is required");
    }
    const trimmedEmail = email.trim();
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
    const origin =
      baseUrl ||
      (typeof window !== "undefined" && window.location ? window.location.origin : "");
    const redirectBase = origin ? origin.replace(/\/$/, "") : "";
    const actionCodeSettings = redirectBase
      ? { url: `${redirectBase}/sign-in`, handleCodeInApp: false }
      : undefined;
    if (actionCodeSettings) {
      await sendPasswordResetEmail(auth, trimmedEmail, actionCodeSettings);
    } else {
      await sendPasswordResetEmail(auth, trimmedEmail);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
      throw new Error("Firebase auth is not initialized");
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  }, []);

  const updateProfileName = useCallback(async (fullName) => {
    if (!user) return;
    await updateProfile(user, { displayName: fullName });
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      signInWithGoogle,
      updateProfileName,
    }),
    [
      user,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      signInWithGoogle,
      updateProfileName,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
