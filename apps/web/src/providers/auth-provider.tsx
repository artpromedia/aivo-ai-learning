"use client";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  isImpersonating: boolean;
  originalAdmin: User | null;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  pinLogin: (parentId: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  impersonate: (userId: string) => Promise<void>;
  exitImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

const IMPERSONATION_FLAG_KEY = "aivo_impersonating";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalAdmin, setOriginalAdmin] = useState<User | null>(null);

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        const meRes = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData);

          const flag = sessionStorage.getItem(IMPERSONATION_FLAG_KEY);
          if (flag) {
            setIsImpersonating(false);
            setOriginalAdmin(null);
            sessionStorage.removeItem(IMPERSONATION_FLAG_KEY);
          }
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { refreshToken(); }, [refreshToken]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    if (data.mfaPending) {
      return { mfaPending: true, mfaToken: data.mfaToken, mfaMethod: data.mfaMethod };
    }
    setUser(data.user);
    setAccessToken(data.accessToken);
    setIsImpersonating(false);
    setOriginalAdmin(null);
    sessionStorage.removeItem(IMPERSONATION_FLAG_KEY);
    return data;
  };

  const register = async (email: string, password: string, name: string, role: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role }),
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
  };

  const pinLogin = async (parentId: string, pin: string) => {
    const res = await fetch("/api/auth/pin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, pin }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setAccessToken(null);
    setIsImpersonating(false);
    setOriginalAdmin(null);
    sessionStorage.removeItem(IMPERSONATION_FLAG_KEY);
  };

  const impersonate = async (userId: string) => {
    if (!accessToken || !user) throw new Error("Not authenticated");
    if (user.role !== "PLATFORM_ADMIN") throw new Error("Not authorized");

    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Impersonation failed");
    }
    const data = await res.json();

    setOriginalAdmin({ ...user });
    sessionStorage.setItem(IMPERSONATION_FLAG_KEY, "true");
    setIsImpersonating(true);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const exitImpersonation = async () => {
    sessionStorage.removeItem(IMPERSONATION_FLAG_KEY);
    setIsImpersonating(false);
    setOriginalAdmin(null);
    await refreshToken();
  };

  return (
    <AuthContext.Provider value={{
      user, accessToken, loading,
      isImpersonating, originalAdmin,
      login, register, pinLogin, logout, refreshToken,
      impersonate, exitImpersonation,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
