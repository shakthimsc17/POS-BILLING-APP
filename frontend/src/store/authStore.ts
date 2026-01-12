import { create } from 'zustand';
import apiClient from '../lib/apiClient';
import { Customer } from '../types';

interface AuthStore {
  customer: Customer | null;
  loading: boolean;
  initialized: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any; needsEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

// Store customer and token in localStorage for persistence
const CUSTOMER_STORAGE_KEY = 'pos_customer';
const TOKEN_STORAGE_KEY = 'pos_token';

export const useAuthStore = create<AuthStore>((set, get) => ({
  customer: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      set({ loading: true });
      
      // Try to restore customer and token from localStorage
      const storedCustomer = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      
      if (storedCustomer && storedToken) {
        try {
          const customer = JSON.parse(storedCustomer);
          
          // Verify token is still valid by calling /api/auth/me
          try {
            const response = await apiClient.get<{ customer: Customer }>('/auth/me');
            
            if (response.customer) {
              set({
                customer: response.customer,
                initialized: true,
                loading: false,
              });
              // Update stored customer data
              localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(response.customer));
              return;
            }
          } catch (error) {
            // Token invalid, clear storage
            console.error('Token validation failed:', error);
            localStorage.removeItem(CUSTOMER_STORAGE_KEY);
            localStorage.removeItem(TOKEN_STORAGE_KEY);
          }
        } catch (e) {
          console.error('Error restoring customer session:', e);
          localStorage.removeItem(CUSTOMER_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      }
      
      set({
        customer: null,
        initialized: true,
        loading: false,
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ initialized: true, loading: false });
    }
  },

  signUp: async (email: string, password: string, name?: string) => {
    try {
      set({ loading: true });
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        set({ loading: false });
        return { error: { message: 'Please enter a valid email address' } };
      }

      // Validate password
      if (password.length < 6) {
        set({ loading: false });
        return { error: { message: 'Password must be at least 6 characters' } };
      }

      const cleanEmail = email.trim().toLowerCase();
      const customerName = name || cleanEmail.split('@')[0] || 'Customer';
      
      console.log('Creating customer account:', { name: customerName, email: cleanEmail });
      
      // Call API to create customer
      const response = await apiClient.post<{ customer: Customer; token: string }>('/auth/signup', {
        email: cleanEmail,
        password,
        name: customerName,
      });

      const { customer, token } = response;

      // Store customer and token
      set({
        customer: customer,
        loading: false,
      });
      
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      
      console.log('✅ Customer account created successfully:', customer);

      return { error: null, needsEmailConfirmation: false };
    } catch (error: any) {
      console.error('SignUp exception:', error);
      set({ loading: false });
      
      let errorMessage = error.message || 'An unexpected error occurred';
      
      if (errorMessage.includes('already registered') || errorMessage.includes('duplicate')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      }
      
      return { error: { message: errorMessage } };
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true });
      
      const cleanEmail = email.trim().toLowerCase();
      
      console.log('Authenticating customer:', { email: cleanEmail });
      
      // Call API to authenticate
      const response = await apiClient.post<{ customer: Customer; token: string }>('/auth/signin', {
        email: cleanEmail,
        password,
      });

      const { customer, token } = response;
      
      // Store customer and token
      set({
        customer: customer,
        loading: false,
      });
      
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      
      console.log('✅ Customer authenticated successfully:', customer);

      return { error: null };
    } catch (error: any) {
      console.error('SignIn exception:', error);
      set({ loading: false });
      
      let errorMessage = error.message || 'An unexpected error occurred';
      
      if (errorMessage.includes('Invalid email or password')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      }
      
      return { error: { message: errorMessage } };
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      
      // Clear customer and token from localStorage
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      
      set({
        customer: null,
        loading: false,
      });
      
      console.log('✅ Customer signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      set({ loading: false });
    }
  },
}));
