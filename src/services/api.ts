import axios, { AxiosError } from 'axios';
import { ApiError } from '../../types/models';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      message: error.message || 'Unknown error'
    } as ApiError);
  }
);

export default api;