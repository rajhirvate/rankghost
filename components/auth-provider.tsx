"use client";

import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getClientAuth, getClientDb } from "@/lib/firebase";
import { normalizePlanTier } from "@/lib/plans";
import { getEffectivePlan } from "@/lib/pro-overrides";
import { UserPlan } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  plan: UserPlan["plan"];
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureUserDoc(uid: string) {
  const db = getClientDb();
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, { plan: "free", createdAt: new Date().toISOString() });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<UserPlan["plan"]>("free");

  useEffect(() => {
    let auth: ReturnType<typeof getClientAuth>;
    let db: ReturnType<typeof getClientDb>;
    try {
      auth = getClientAuth();
      db = getClientDb();
    } catch (e) {
      console.error("[auth] failed to initialize Firebase:", e);
      setError("Unable to initialize authentication. Check the deployed Firebase configuration.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setError(null);
      try {
        if (nextUser) {
          await ensureUserDoc(nextUser.uid);
          const userDoc = await getDoc(doc(db, "users", nextUser.uid));
          const basePlan = normalizePlanTier(userDoc.data()?.plan);
          setPlan(getEffectivePlan(basePlan, nextUser.email));
        } else {
          setPlan("free");
        }
      } catch (e) {
        console.error("[auth] failed to load user doc:", e);
        setError("Signed in, but profile data could not be loaded.");
        // Still apply email-based overrides even if Firestore is unreachable
        if (nextUser) setPlan(getEffectivePlan("free", nextUser.email));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      plan,
      login: async (email, password) => {
        const auth = getClientAuth();
        await signInWithEmailAndPassword(auth, email, password);
      },
      signup: async (email, password) => {
        const auth = getClientAuth();
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserDoc(credential.user.uid);
      },
      loginWithGoogle: async () => {
        const auth = getClientAuth();
        const provider = new GoogleAuthProvider();
        const credential = await signInWithPopup(auth, provider);
        await ensureUserDoc(credential.user.uid);
      },
      logout: async () => {
        const auth = getClientAuth();
        await signOut(auth);
      },
    }),
    [error, loading, plan, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
