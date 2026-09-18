import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'fin_auth_token';
const USER_KEY = 'fin_auth_user';

// In-memory fallback for non-native environments (e.g. web/ssr testing)
const memoryStorage = new Map<string, string>();

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : memoryStorage.get(key) ?? null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        } else {
          memoryStorage.set(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        } else {
          memoryStorage.delete(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      memoryStorage.delete(key);
    }
  },

  // Auth specific helpers
  async getAuthToken(): Promise<string | null> {
    return this.getItem(TOKEN_KEY);
  },

  async setAuthToken(token: string): Promise<void> {
    return this.setItem(TOKEN_KEY, token);
  },

  async removeAuthToken(): Promise<void> {
    return this.removeItem(TOKEN_KEY);
  },

  async getUserData<T>(): Promise<T | null> {
    const raw = await this.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setUserData<T>(data: T): Promise<void> {
    await this.setItem(USER_KEY, JSON.stringify(data));
  },

  async removeUserData(): Promise<void> {
    return this.removeItem(USER_KEY);
  },

  async getUserProfile(): Promise<any | null> {
    return this.getUserData();
  },

  async saveUserProfile(profile: any): Promise<void> {
    return this.setUserData(profile);
  },

  async clearAuth(): Promise<void> {
    await Promise.all([this.removeAuthToken(), this.removeUserData()]);
  },
};
