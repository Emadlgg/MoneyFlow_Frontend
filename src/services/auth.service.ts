import api from './api';
import type { User } from '@supabase/supabase-js';

export interface LoginResponse {
  user: User;
  token: string;
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
  return {
    user: data.user,
    token: data.token
  };
}

export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

export const registerUser = (email: string, password: string) =>
  api.post('/auth/register', { email, password });
