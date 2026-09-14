"use client";

/**
 * AuthProvider — mounts Firebase auth state on the client and transparently
 * attaches the Firebase ID token to every outgoing fetch() as
 * `Authorization: Bearer <token>`. This keeps all existing API call sites
 * unchanged while replacing the old httpOnly-cookie sessions.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as fbSignOut } from "firebase/auth";
import { getFirebaseAuth, isFirebaseClientConfigured } from "@/lib/firebase-client";

interface AuthContextType {
  firebaseUser: User | null;
  authReady: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  authReady: false,
  logout: async () => {},
});

export function useFirebaseAuth() {
  return useContext(AuthContext);
}

/* ------------------------------------------------------------------ */
/* fetch() patch: attach Authorization header whenever a user is       */
/* signed in. Installed once per browser session.                      */
/* ------------------------------------------------------------------ */
if (typeof window !== "undefined") {
  const w = window as unknown as { __firebaseFetchPatched?: boolean };
  if (!w.__firebaseFetchPatched) {
    w.__firebaseFetchPatched = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        if (isFirebaseClientConfigured()) {
          const { getFirebaseAuth } = await import("@/lib/firebase-client");
          const current = getFirebaseAuth().currentUser;
          if (current) {
            const token = await current.getIdToken(); // auto-refreshes near expiry
            const headers = new Headers(init?.headers || undefined);
            if (!headers.has("Authorization")) {
              headers.set("Authorization", `Bearer ${token}`);
            }
            init = { ...(init || {}), headers };
          }
        }
      } catch {
        /* no user / not configured — proceed without header */
      }
      return originalFetch(input as RequestInfo, init);
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!isFirebaseClientConfigured());

  useEffect(() => {
    if (!isFirebaseClientConfigured()) return;
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      // Lightweight flag cookie for middleware-based UX routing (not auth!)
      if (user) {
        document.cookie = "biztriach_session=1; path=/; max-age=2592000; samesite=lax";
      } else {
        document.cookie = "biztriach_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    });
    return unsub;
  }, []);

  const logout = async () => {
    if (isFirebaseClientConfigured()) {
      await fbSignOut(getFirebaseAuth());
    }
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, authReady, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
