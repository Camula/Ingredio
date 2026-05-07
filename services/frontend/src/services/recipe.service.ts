import { api } from './api';

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit?: string;
  isOwned: boolean;
  isStaple?: boolean;
}

export interface Recipe {
  _id?: string;
  title: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTimeMinutes: number;
  difficulty: 'Łatwy' | 'Średni' | 'Trudny';
  createdAt?: string;
}

export interface RecipeFilters {
  time: string;
  difficulty: string;
  diet: string;
  cuisine: string;
  mealType: string;
}

const API_URL = '/api/recipes';

export const recipeService = {
  generateRecipe: async (
    ingredients: string[], 
    unselectedIngredients: string[], 
    smartSupplement: boolean,
    filters: RecipeFilters
  ): Promise<Recipe> => {
    const response = await api.post(`${API_URL}/generate`, {
      ingredients,
      unselectedIngredients,
      smartSupplement,
      filters,
    });
    return response.data;
  },

  getFavorites: async (): Promise<Recipe[]> => {
    const response = await api.get(`${API_URL}/favorites`);
    return response.data;
  },

  addFavorite: async (recipe: Recipe): Promise<Recipe> => {
    const response = await api.post(`${API_URL}/favorites`, recipe);
    return response.data;
  },

  removeFavorite: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/favorites/${id}`);
  },

  parseVoice: async (audioBlob: Blob): Promise<{ ingredients: any[], transcription: string }> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.webm');
    const response = await api.post(`${API_URL}/voice-parse`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
