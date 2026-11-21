import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Token storage. Phones use the OS keychain / keystore via expo-secure-store; the browser build
 * (used only for development here) falls back to localStorage because SecureStore has no web support.
 */
export const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {}
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
