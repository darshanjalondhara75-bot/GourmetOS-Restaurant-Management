"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  RestaurantUser,
  getCurrentUserProfile,
  directLogin,
  registerUser,
  userLogout,
  getToken,
  getTokenRemainingSeconds,
  refreshAccessToken,
  removeToken,
  getServerSessionId,
  setStoredServerSessionId,
  connectRealtimeUpdates
} from "./api";
import { dispatchRealtimeActivity } from "./useRealtimeUpdates";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: RestaurantUser | null;
  loading: boolean;
  tokenTimer: number;
  login: (email: string, password: string) => Promise<RestaurantUser>;
  register: (name: string, email: string, password: string, role?: string) => Promise<RestaurantUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  tokenTimer: 60,
  login: async () => { throw new Error("Not implemented"); },
  register: async () => { throw new Error("Not implemented"); },
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RestaurantUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenTimer, setTokenTimer] = useState(60);
  const router = useRouter();
  const pathname = usePathname();

  const handleRoleRouting = useCallback((role: string, currentPath: string) => {
    if (!currentPath || currentPath.startsWith("/customer")) {
      return;
    }

    const isPortfolioDemo =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("portfolioDemo") === "1";
    if (
      isPortfolioDemo &&
      ["/admin", "/chef", "/cashier", "/user"].some((prefix) => currentPath.startsWith(prefix))
    ) {
      return;
    }

    // If already logged in and on the login/register page, redirect to dashboard
    if (currentPath === "/login" || currentPath === "/register") {
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else if (role === "cashier") {
        router.push("/cashier/tables");
      } else if (role === "chef") {
        router.push("/chef/kitchen");
      } else if (role === "user") {
        router.push("/user/orders");
      }
      return;
    }

    if (role === "admin" && !currentPath.startsWith("/admin")) {
      router.push("/admin/dashboard");
    } else if (role === "cashier" && !currentPath.startsWith("/cashier")) {
      router.push("/cashier/tables");
    } else if (role === "chef" && !currentPath.startsWith("/chef")) {
      router.push("/chef/kitchen");
    } else if (role === "user" && !currentPath.startsWith("/user")) {
      router.push("/user/orders");
    }
  }, [router]);

  const validateServerSession = useCallback(async () => {
    const currentSessionId = await getServerSessionId();
    if (currentSessionId) {
      setStoredServerSessionId(currentSessionId);
    }
    return true;
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Proactively try to refresh the token first if it's expired or near expiration
      // This ensures we have a fresh access token before requesting the profile
      if (getTokenRemainingSeconds() < 15) {
        await refreshAccessToken();
      }

      const profile = await getCurrentUserProfile();
      setUser(profile);
      setTokenTimer(getTokenRemainingSeconds());

      if (pathname) {
        handleRoleRouting(profile.role, pathname);
      }
    } catch (err: unknown) {
      // CRITICAL: Only remove tokens if the server explicitly says the session is unauthorized (401)
      // If the server is just offline (Network Error), we keep the tokens so the user
      // stays "logged in" until the server comes back online.
      if (err instanceof Error && err.message.includes("401")) {
        setUser(null);
        removeToken();
      } else {
        console.warn("Auth: Server unreachable or error occurred. Keeping tokens for retry.", err);
        setUser(null); // User is not active, but we don't wipe tokens
      }
    } finally {
      setLoading(false);
    }
  }, [pathname, handleRoleRouting]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const sessionIsValid = await validateServerSession();
      if (!mounted) return;

      if (sessionIsValid) {
        await refreshProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    initializeAuth();
    return () => {
      mounted = false;
    };
  }, [refreshProfile, validateServerSession]);

  const isRefreshingRef = React.useRef(false);
  const nextRefreshAttemptRef = React.useRef(0);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const remaining = getTokenRemainingSeconds();
      setTokenTimer(remaining);

      if (
        remaining <= 10 &&
        Date.now() >= nextRefreshAttemptRef.current &&
        !isRefreshingRef.current
      ) {
        isRefreshingRef.current = true;
        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            setTokenTimer(getTokenRemainingSeconds());
          } else {
            // Increase retry delay on failure to avoid hammering a struggling server
            nextRefreshAttemptRef.current = Date.now() + 15000;
          }
        } finally {
          isRefreshingRef.current = false;
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user, router, pathname]);

  useEffect(() => {
    if (!user || loading) return;
    const controller = new AbortController();
    void connectRealtimeUpdates(controller.signal, dispatchRealtimeActivity);
    return () => controller.abort();
  }, [user, loading]);

  const login = async (email: string, password: string) => {
    const data = await directLogin(email, password);
    const authenticatedUser = data.user as RestaurantUser;
    setUser(authenticatedUser);
    setTokenTimer(60);

    const liveRole = authenticatedUser.role;
    if (liveRole === "admin") {
      router.push("/admin/dashboard");
    } else if (liveRole === "cashier") {
      router.push("/cashier/tables");
    } else if (liveRole === "chef") {
      router.push("/chef/kitchen");
    } else if (liveRole === "user") {
      router.push("/user/orders");
    }

    return authenticatedUser;
  };

  const register = async (name: string, email: string, password: string, role: string = "user") => {
    const data = await registerUser(name, email, password, role);
    return data.user as RestaurantUser;
  };

  const logout = async () => {
    setLoading(true);
    try {
      await userLogout();
    } catch {
      // ignore logout errors on server
    }
    removeToken();
    setUser(null);
    setLoading(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, tokenTimer, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
