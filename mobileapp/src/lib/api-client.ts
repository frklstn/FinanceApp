import Constants from 'expo-constants';
import { storage } from './storage';

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://fin.llvy.space/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  token?: string;
  skipAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, token, skipAuth = false, headers = {}, ...rest } = options;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  // Automatic Bearer token injection
  if (!skipAuth) {
    const activeToken = token || (await storage.getAuthToken());
    if (activeToken) {
      requestHeaders['Authorization'] = `Bearer ${activeToken}`;
    }
  }

  try {
    const res = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = (await res.json()) as ApiResponse<T>;

    // Token expired or invalid handling
    if (res.status === 401 && !skipAuth) {
      await storage.clearAuth();
    }

    return json;
  } catch (err: any) {
    return {
      success: false,
      data: null,
      message: err?.message || 'Network request failed or unable to connect to server',
    };
  }
}

// Convenience REST methods
export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
