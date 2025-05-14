import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

interface ApiError {
  message: string;
  code?: string;
  status?: number;
  stack?: string;
  [key: string]: unknown;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('authToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.debug('📥 Response:', response.config.url, response.data);
    return response;      // <--- devolvemos TODO el AxiosResponse
  },
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data
      });
      if (error.response.status === 401) {
        window.location.href = '/login';
        return Promise.reject({ message: 'No autorizado', status: 401 });
      }
      const apiError: ApiError = {
        ...error.response.data,
        message: error.response.data?.message || 'Error en el servidor',
        status: error.response.status
      };
      return Promise.reject(apiError);
    }
    return Promise.reject({ message: error.message || 'Error de conexión', code: 'NETWORK_ERROR' });
  }
);

export default api;
