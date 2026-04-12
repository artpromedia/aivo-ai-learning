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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  pinLogin: (parentId: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        const meRes = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
        if (meRes.ok) setUser(await meRes.json());
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
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
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
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, pinLogin, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}
