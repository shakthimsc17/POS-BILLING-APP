import { create } from 'zustand';
import { Category, Item } from '../types';
import { storageService } from '../services/storage';

interface InventoryStore {
  categories: Category[];
  items: Item[];
  loading: boolean;
  error: string | null;
  loadCategories: () => Promise<void>;
  loadItems: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'customer_id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addItem: (item: Omit<Item, 'id' | 'created_at' | 'customer_id'>) => Promise<void>;
  updateItem: (id: string, item: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  searchItems: (query: string) => Promise<Item[]>;
  getItemByBarcode: (barcode: string) => Promise<Item | null>;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  categories: [],
  items: [],
  loading: false,
  error: null,

  loadCategories: async () => {
    set({ loading: true, error: null });
    try {
      const categories = await storageService.getCategories();
      set({ categories, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  loadItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await storageService.getItems();
      set({ items, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addCategory: async (category) => {
    try {
      const newCategory = await storageService.addCategory(category);
      // Reload categories to ensure we have the latest from database
      await get().loadCategories();
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('Store error adding category:', errorMessage);
      set({ error: errorMessage });
      throw error;
    }
  },

  updateCategory: async (id, category) => {
    try {
      await storageService.updateCategory(id, category);
      set({
        categories: get().categories.map((c) =>
          c.id === id ? { ...c, ...category } : c
        ),
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      await storageService.deleteCategory(id);
      set({ categories: get().categories.filter((c) => c.id !== id) });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addItem: async (item) => {
    try {
      const newItem = await storageService.addItem(item);
      // Reload items to ensure we have the latest from database
      await get().loadItems();
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('Store error adding item:', errorMessage);
      set({ error: errorMessage });
      throw error;
    }
  },

  updateItem: async (id, item) => {
    try {
      await storageService.updateItem(id, item);
      set({
        items: get().items.map((i) => (i.id === id ? { ...i, ...item } : i)),
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteItem: async (id) => {
    try {
      await storageService.deleteItem(id);
      set({ items: get().items.filter((i) => i.id !== id) });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  searchItems: async (query: string) => {
    try {
      return await storageService.searchItems(query);
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    }
  },

  getItemByBarcode: async (barcode: string) => {
    try {
      return await storageService.getItemByBarcode(barcode);
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },
}));

