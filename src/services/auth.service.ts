import api from './api';

export const registerUser = async (email: string, password: string) => {
  return api.post('/auth/register', { email, password });
};