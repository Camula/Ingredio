import axios from 'axios';
import { api } from './api';

const API_URL = '/api/auth';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export const authService = {
  login: async (data: LoginData) => {
    const response = await axios.post(`${API_URL}/login`, data);
    if (response.data.token) {
      localStorage.setItem('ingredio_token', response.data.token);
    }
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await axios.post(`${API_URL}/register`, data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('ingredio_token');
  },

  getToken: () => {
    return localStorage.getItem('ingredio_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('ingredio_token');
  },

  getMe: async () => {
    const response = await api.get(`${API_URL}/me`);
    return response.data;
  },

  updateMe: async (data: { name?: string, settings?: any }) => {
    const response = await api.patch(`${API_URL}/me`, data);
    return response.data;
  },

  changePassword: async (data: any) => {
    const response = await api.post(`${API_URL}/change-password`, data);
    return response.data;
  }
};
