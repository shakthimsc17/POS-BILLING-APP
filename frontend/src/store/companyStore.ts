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
  nameTamil: '',
  address: '',
  addressTamil: '',
  city: '',
  cityTamil: '',
  state: '',
  stateTamil: '',
  pincode: '',
  phone: '',
  email: '',
  gstin: '',
  website: '',
  logo: '',
  business_type: null,
  default_language: 'en',
  receipt_language: 'en',
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
      const companyData = await storageService.getCompany();
      // Always update with data from API (even if it's default values)
      // The API returns default values if no company exists in DB
      console.log('Company data loaded from database:', {
        id: companyData.id,
        customer_id: companyData.customer_id,
        name: companyData.name,
        nameTamil: companyData.nameTamil,
        address: companyData.address,
        addressTamil: companyData.addressTamil,
        city: companyData.city,
        cityTamil: companyData.cityTamil,
        state: companyData.state,
        stateTamil: companyData.stateTamil,
        phone: companyData.phone,
        email: companyData.email,
        hasLogo: !!companyData.logo,
      });
      // Create a new object to ensure Zustand detects the change
      set({ 
        company: { ...companyData }, 
        loading: false 
      });
    } catch (error) {
      console.error('Error loading company:', error);
      set({ 
        error: (error as Error).message, 
        loading: false,
        company: { ...defaultCompany }
      });
    }
  },

  saveCompany: async (updates) => {
    try {
      set({ loading: true, error: null });
      console.log('Saving company updates:', updates);
      const updated = await storageService.saveCompany(updates);
      console.log('Company saved, received:', {
        id: updated.id,
        customer_id: updated.customer_id,
        name: updated.name,
        address: updated.address,
        phone: updated.phone,
        email: updated.email,
        hasLogo: !!updated.logo,
        logoLength: updated.logo ? updated.logo.length : 0,
      });
      // Create a new object to ensure Zustand detects the change
      set({ 
        company: { ...updated }, 
        loading: false 
      });
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

