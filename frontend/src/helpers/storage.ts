/**
 * Small key-value storage abstraction. Currently in-memory ONLY (not persisted
 * across app restarts). To persist, install AsyncStorage with
 *   npx expo install @react-native-async-storage/async-storage
 * and swap the implementation below; callers do not change.
 */
export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

const memory = new Map<string, string>();

export const storage: KeyValueStorage = {
  async getItem(key) {
    return memory.get(key) ?? null;
  },
  async setItem(key, value) {
    memory.set(key, value);
  },
};
