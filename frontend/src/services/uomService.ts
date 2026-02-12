import apiClient from '../lib/apiClient';
import { UomMaster, UomConversion } from '../types';

export const uomService = {
  getUoms: async (): Promise<UomMaster[]> => {
    return apiClient.get<UomMaster[]>('/uom');
  },
  
  createUom: async (uom: Omit<UomMaster, 'id' | 'created_at' | 'customer_id'>): Promise<UomMaster> => {
    return apiClient.post<UomMaster>('/uom', uom);
  },
  
  updateUom: async (id: string, updates: Partial<UomMaster>): Promise<UomMaster> => {
    return apiClient.put<UomMaster>(`/uom/${id}`, updates);
  },
  
  deleteUom: async (id: string): Promise<void> => {
    await apiClient.delete(`/uom/${id}`);
  },

  getConversions: async (): Promise<UomConversion[]> => {
    return apiClient.get<UomConversion[]>('/uom/conversions');
  },
  
  createConversion: async (conversion: Omit<UomConversion, 'id' | 'created_at' | 'customer_id'>): Promise<UomConversion> => {
    return apiClient.post<UomConversion>('/uom/conversions', conversion);
  }
};
