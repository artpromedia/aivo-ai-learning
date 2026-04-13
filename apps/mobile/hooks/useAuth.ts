import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getToken, setToken, clearTokens, decodeJWT, apiFetch } from '@/lib/api';
import { API } from '@/constants/api';
import type { UserRole } from '@aivo/brand';

interface User {
  id: string;
  email?: string;
  name: string;
  role: UserRole;
  tenantId: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPin: (pin: string, parentId: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthState(): AuthContextValue {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const extractUser = (token: string): User | null => {
    const payload = decodeJWT(token);
    if (!payload) return null;
    return {
      id: payload.sub as string,
      email: payload.email as string | undefined,
      name: payload.name as string || '',
      role: payload.role as UserRole,
      tenantId: payload.tenantId as string || '',
    };
  };

  const checkAuth = useCallback(async () => {
    const token = await getToken();
    if (token) {
      const payload = decodeJWT(token);
      if (payload && payload.exp) {
        const expiresAt = (payload.exp as number) * 1000;
        if (Date.now() < expiresAt) {
          const user = extractUser(token);
          if (user) {
            setState({ user, isLoading: false, isAuthenticated: true });
            return;
          }
        }
      }
    }
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkAuth();
      }
    });
    return () => sub.remove();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiFetch(API.IDENTITY, '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });

      if (response.ok) {
        const data = await response.json();
        await setToken(data.accessToken);
        const user = extractUser(data.accessToken);
        if (user) {
          setState({ user, isLoading: false, isAuthenticated: true });
          return { success: true };
        }
      }
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || error.message || 'Login failed' };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const loginWithPin = useCallback(async (pin: string, parentId: string) => {
    try {
      const response = await apiFetch(API.IDENTITY, '/api/auth/pin-login', {
        method: 'POST',
        body: JSON.stringify({ parentId, pin }),
        skipAuth: true,
      });

      if (response.ok) {
        const data = await response.json();
        await setToken(data.accessToken);
        const user = extractUser(data.accessToken);
        if (user) {
          setState({ user, isLoading: false, isAuthenticated: true });
          return { success: true };
        }
      }
      return { success: false, error: 'Incorrect PIN' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    try {
      const response = await apiFetch(API.IDENTITY, '/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: data.email, password: data.password, name: data.name, role: 'PARENT' }),
        skipAuth: true,
      });

      if (response.ok) {
        const result = await response.json();
        await setToken(result.accessToken);
        const user = extractUser(result.accessToken);
        if (user) {
          setState({ user, isLoading: false, isAuthenticated: true });
          return { success: true };
        }
      }
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || error.message || 'Registration failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch(API.IDENTITY, '/api/auth/logout', { method: 'POST' });
    } catch {}
    await clearTokens();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return {
    ...state,
    login,
    loginWithPin,
    signup,
    logout,
  };
}
