import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabaseClient';

interface ApiError {
  message: string;
  code?: string;
  status?: number;
  stack?: string;
  [key: string]: unknown;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // ✅ 30 segundos timeout
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error obteniendo sesión:', error);
        return config;
      }

      if (session?.access_token && config.headers) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
        console.log('🔑 Token agregado');
      } else {
        console.warn('⚠️ No hay sesión activa');
      }
    } catch (error) {
      console.error('❌ Error en interceptor:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.debug('📥 Response:', response.config.url, response.status);
    return response;
  },
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
      });
      
      // ✅ NO redirigir automáticamente en 401
      // Solo loggear y dejar que el componente maneje el error
      if (error.response.status === 401) {
        console.error('🚫 No autorizado');
        // NO hacer window.location.href = '/login';
      }
      
      const apiError: ApiError = {
        ...error.response.data,
        message: error.response.data?.message || 'Error en el servidor',
        status: error.response.status,
      };
      return Promise.reject(apiError);
    }
    
    console.error('❌ Network Error:', error.message);
    return Promise.reject({ 
      message: error.message || 'Error de conexión', 
      code: 'NETWORK_ERROR' 
    });
  }
);

export default api;