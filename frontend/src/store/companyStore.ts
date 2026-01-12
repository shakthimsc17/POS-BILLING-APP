import { create } from 'zustand';

interface CompanyDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstin?: string;
  website?: string;
  logo?: string;
}

interface CompanyStore {
  company: CompanyDetails;
  setCompany: (company: Partial<CompanyDetails>) => void;
  getCompany: () => CompanyDetails;
  loadCompany: () => void;
}

const STORAGE_KEY = 'company_details';

const defaultCompany: CompanyDetails = {
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
};

const loadFromStorage = (): CompanyDetails => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultCompany, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading company details:', e);
  }
  return defaultCompany;
};

export const useCompanyStore = create<CompanyStore>((set, get) => ({
  company: loadFromStorage(),
  setCompany: (updates) => {
    const updated = { ...get().company, ...updates };
    set({ company: updated });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving company details:', e);
    }
  },
  getCompany: () => get().company,
  loadCompany: () => {
    set({ company: loadFromStorage() });
  },
}));

