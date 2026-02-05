"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseClient";

const AuthContext = createContext(null);

async function ensureUserDoc(user, extra = {}) {
  if (!user || !db) return null;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email || null,
      createdAt: serverTimestamp(),
      fullName: user.displayName || null,
      hideOnboardingTour: false,
      ...extra,
    });
  } else if (extra && Object.keys(extra).length > 0) {
    await updateDoc(ref, extra);
  }
  return ref;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser || null);
      try {
        if (firebaseUser) {
          await ensureUserDoc(firebaseUser);
          const ref = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(ref);
          setUserDoc(snap.exists() ? snap.data() : null);
        } else {
          setUserDoc(null);
        }
      } catch (error) {
        console.error("Auth sync error:", error);
        setUserDoc(null);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const refreshUserDoc = useCallback(async () => {
    if (!user || !db) return null;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : null;
    setUserDoc(data);
    return data;
  }, [user]);

  const signUp = useCallback(async ({ email, password, fullName }) => {
    if (!auth) {
      throw new Error("Firebase auth is not initialized");
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (fullName) {
      await updateProfile(result.user, { displayName: fullName });
    }
    await ensureUserDoc(result.user, { fullName: fullName || null });
    return result.user;
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    if (!auth) {
      throw new Error("Firebase auth is not initialized");
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDoc(result.user);
    return result.user;
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
  }, []);

  const updateProfileName = useCallback(
    async (fullName) => {
      if (!user) return;
      await updateProfile(user, { displayName: fullName });
      await ensureUserDoc(user, { fullName });
      await refreshUserDoc();
    },
    [user, refreshUserDoc]
  );

  const value = useMemo(
    () => ({
      user,
      userDoc,
      loading,
      signUp,
      signIn,
      signOut,
      refreshUserDoc,
      updateProfileName,
    }),
    [user, userDoc, loading, signUp, signIn, signOut, refreshUserDoc, updateProfileName]
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
