import { api } from './api';

export interface FridgeItem {
  _id: string;
  name: string;
  amount?: number;
  unit?: string;
  createdAt: string;
}

const API_URL = '/api/fridge';

export const fridgeService = {
  getFridgeItems: async (): Promise<FridgeItem[]> => {
    const response = await api.get(API_URL);
    return response.data;
  },

  addFridgeItem: async (name: string, amount?: number, unit?: string): Promise<FridgeItem> => {
    const response = await api.post(API_URL, { name, amount, unit });
    return response.data;
  },

  addFridgeItemsBatch: async (ingredients: Array<{ name: string, amount?: number, unit?: string }>): Promise<FridgeItem[]> => {
    const response = await api.post(`${API_URL}/batch`, { ingredients });
    return response.data;
  },

  updateFridgeItem: async (id: string, data: Partial<Pick<FridgeItem, 'name' | 'amount' | 'unit'>>): Promise<FridgeItem> => {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  removeFridgeItem: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
  },

  searchIngredients: async (query: string): Promise<string[]> => {
    if (!query.trim()) return [];
    const response = await api.get(`${API_URL}/search`, {
      params: { q: query },
    });
    // Backend może zwracać obiekty typu { name: "pomidor" } zamiast ciągów znaków
    return response.data.map((item: { name: string } | string) => typeof item === 'string' ? item : item.name);
  },
};
