import { create } from 'zustand';
import { Company } from '../types';
import { storageService } from '../services/storage';

interface CompanyStore {
  company: Company;
  loading: boolean;
  error: string | null;
  loadCompany: () => Promise<void>;
  saveCompany: (company: Partial<Company>) => Promise<void>;
  getCompany: () => Company;
}

const defaultCompany: Company = {
  id: null,
  customer_id: '',
  name: 'My Store',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  gstin: '',
  website: '',
  logo: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const useCompanyStore = create<CompanyStore>((set, get) => ({
  company: defaultCompany,
  loading: false,
  error: null,

  loadCompany: async () => {
    try {
      set({ loading: true, error: null });
      const company = await storageService.getCompany();
      set({ company, loading: false });
    } catch (error) {
      console.error('Error loading company:', error);
      set({ 
        error: (error as Error).message, 
        loading: false,
        company: defaultCompany 
      });
    }
  },

  saveCompany: async (updates) => {
    try {
      set({ loading: true, error: null });
      const updated = await storageService.saveCompany(updates);
      set({ company: updated, loading: false });
    } catch (error) {
      console.error('Error saving company:', error);
      set({ 
        error: (error as Error).message, 
        loading: false 
      });
      throw error;
    }
  },

  getCompany: () => get().company,
}));

