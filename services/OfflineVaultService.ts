import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PendingItem {
  id: string;
  type: 'furo_humanizado' | 'maternal_consultations';
  clientId: string;
  data: any;
  createdAt: string;
}

const VAULT_KEY = '@mommys_offline_vault';

export const OfflineVaultService = {
  async getPendingItems(): Promise<PendingItem[]> {
    try {
      const json = await AsyncStorage.getItem(VAULT_KEY);
      if (json) {
        return JSON.parse(json);
      }
      return [];
    } catch (e) {
      console.error('Error reading vault', e);
      return [];
    }
  },

  async saveItem(item: Omit<PendingItem, 'id' | 'createdAt'>): Promise<void> {
    try {
      const items = await this.getPendingItems();
      const newItem: PendingItem = {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        createdAt: new Date().toISOString()
      };
      items.push(newItem);
      await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving to vault', e);
    }
  },

  async removeItem(id: string): Promise<void> {
    try {
      const items = await this.getPendingItems();
      const filtered = items.filter(i => i.id !== id);
      await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error removing from vault', e);
    }
  },
  
  async clearVault(): Promise<void> {
    try {
      await AsyncStorage.removeItem(VAULT_KEY);
    } catch (e) {
      console.error('Error clearing vault', e);
    }
  }
};
