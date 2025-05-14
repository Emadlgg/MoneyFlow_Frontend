import api from './api';
import type { User } from '../../types/models';

interface LoginResponse {
  token: string;
  user: User;
}

export const loginUser = async (email: string, password: string): Promise<User> => {
  const response = await api.post<LoginResponse>('/auth/login', { email, password });
  // Ahora response es un AxiosResponse<LoginResponse>
  const { token, user } = response.data;   // <— extraemos .data
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

export const registerUser = (email: string, password: string) =>
  api.post('/auth/register', { email, password });
