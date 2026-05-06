import { Platform } from 'react-native';
import { API } from '@/constants/api';

const TOKEN_KEY = 'aivo_access_token';
const MUST_CHANGE_PASSWORD_KEY = 'aivo_must_change_password';

let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
  return SecureStore!.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
    return;
  }
  await SecureStore!.setItemAsync(TOKEN_KEY, token);
}

export async function clearTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
    } catch {}
    return;
  }
  await SecureStore!.deleteItemAsync(TOKEN_KEY);
  await SecureStore!.deleteItemAsync(MUST_CHANGE_PASSWORD_KEY);
}

/**
 * Persist the `mustChangePassword` flag returned by the identity-svc
 * login flows alongside the access token. Stored separately (rather than
 * derived from the JWT) because the JWT does not carry this claim.
 */
export async function setMustChangePassword(value: boolean): Promise<void> {
  const v = value ? '1' : '0';
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(MUST_CHANGE_PASSWORD_KEY, v);
    } catch {}
    return;
  }
  await SecureStore!.setItemAsync(MUST_CHANGE_PASSWORD_KEY, v);
}

export async function getMustChangePassword(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === '1';
    } catch {
      return false;
    }
  }
  const v = await SecureStore!.getItemAsync(MUST_CHANGE_PASSWORD_KEY);
  return v === '1';
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch(
  baseUrl: string,
  path: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;
  const callerHeaders = (fetchOptions.headers as Record<string, string>) || {};
  const headers: Record<string, string> = { ...callerHeaders };

  // Only default to JSON when the request actually carries a body and the
  // caller hasn't already specified a content type. This avoids tagging
  // GETs with a misleading Content-Type and, more importantly, avoids
  // breaking multipart/form-data uploads (the boundary header would be
  // overwritten by `application/json`).
  const hasBody = fetchOptions.body != null;
  const hasContentTypeHeader = Object.keys(callerHeaders).some(
    (k) => k.toLowerCase() === 'content-type'
  );
  const isFormData =
    typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
  if (hasBody && !hasContentTypeHeader && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${baseUrl}${path}`;
  return fetch(url, { ...fetchOptions, headers });
}

export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
