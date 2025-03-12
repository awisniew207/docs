/**
 * Abstract storage interface that defines the methods any storage implementation must provide
 */
export interface IStorage {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Memory-based storage implementation that works in any JavaScript environment
 */
export class MemoryStorage implements IStorage {
  private storage: Map<string, string>;

  constructor() {
    this.storage = new Map();
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

/**
 * Browser-based storage implementation using localStorage
 */
export class BrowserStorage implements IStorage {
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error storing data in localStorage:', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error retrieving data from localStorage:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data from localStorage:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw error;
    }
  }
}

/**
 * Main storage class that handles JWT storage across different platforms
 */
export class Storage {
  private static readonly JWT_KEY = 'vincent_jwt';
  private storage: IStorage;

  constructor(storageImplementation?: IStorage) {
    // If no storage implementation is provided, try to detect the environment
    if (!storageImplementation) {
      if (typeof window !== 'undefined' && window.localStorage) {
        this.storage = new BrowserStorage();
      } else {
        this.storage = new MemoryStorage();
      }
    } else {
      this.storage = storageImplementation;
    }
  }

  /**
   * Store a JWT token
   * @param jwt - The JWT string to store
   */
  async storeJWT(jwt: string): Promise<void> {
    await this.storage.setItem(Storage.JWT_KEY, jwt);
  }

  /**
   * Retrieve the stored JWT token
   * @returns The stored JWT string or null if not found
   */
  async getJWT(): Promise<string | null> {
    return await this.storage.getItem(Storage.JWT_KEY);
  }

  /**
   * Remove the stored JWT token (logout)
   */
  async clearJWT(): Promise<void> {
    await this.storage.removeItem(Storage.JWT_KEY);
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<void> {
    await this.storage.clear();
  }
} 