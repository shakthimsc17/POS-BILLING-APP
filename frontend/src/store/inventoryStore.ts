import { create } from 'zustand';
import { Category, Item } from '../types';
import { storageService } from '../services/storage';

interface InventoryStore {
  categories: Category[];
  items: Item[];
  loading: boolean;
  error: string | null;
  loadCategories: () => Promise<void>;
  loadItems: (all?: boolean) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'customer_id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  deleteAllCategories: () => Promise<{ message: string; count: number }>;
  addItem: (item: Omit<Item, 'id' | 'created_at' | 'customer_id'>) => Promise<void>;
  updateItem: (id: string, item: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  deleteAllItems: () => Promise<{ message: string; count: number }>;
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

  loadItems: async (all = true) => {
    set({ loading: true, error: null });
    try {
      const items = await storageService.getItems({ all });
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
      // Reload categories to ensure we have the latest from database
      await get().loadCategories();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteAllCategories: async () => {
    try {
      const result = await storageService.deleteAllCategories();
      // Reload categories to ensure we have the latest from database
      await get().loadCategories();
      return result;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addItem: async (item) => {
    try {
      console.log('Adding item to store:', { ...item, category_id: item.category_id || 'undefined' });
      const newItem = await storageService.addItem(item);
      console.log('Item added successfully:', { id: newItem.id, category_id: newItem.category_id || 'undefined' });
      // Reload items to ensure we have the latest from database
      await get().loadItems();
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('Store error adding item:', errorMessage, item);
      set({ error: errorMessage });
      throw error;
    }
  },

  updateItem: async (id, item) => {
    try {
      await storageService.updateItem(id, item);
      const currentItems = get().items;
      // Ensure items is an array before mapping
      if (Array.isArray(currentItems)) {
        set({
          items: currentItems.map((i) => (i.id === id ? { ...i, ...item } : i)),
        });
      } else {
        // If items is not an array, reload from server
        await get().loadItems();
      }
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

  deleteAllItems: async () => {
    try {
      const result = await storageService.deleteAllItems();
      set({ items: [] });
      return result;
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

