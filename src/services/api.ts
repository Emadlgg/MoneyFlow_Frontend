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
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ✅ ACTUALIZAR: Usar token de Supabase en lugar de localStorage
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // ✅ Obtener token de Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error obteniendo sesión de Supabase:', error);
        return config;
      }

      if (session?.access_token && config.headers) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
        console.log('🔑 Token de Supabase agregado al request');
      } else {
        console.warn('⚠️ No hay sesión activa en Supabase');
      }
    } catch (error) {
      console.error('❌ Error en interceptor de request:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.debug('📥 Response:', response.config.url, response.data);
    return response;
  },
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
      });
      if (error.response.status === 401) {
        supabase.auth.signOut();
        window.location.href = '/login';
        return Promise.reject({ message: 'No autorizado', status: 401 });
      }
      const apiError: ApiError = {
        ...error.response.data,
        message: error.response.data?.message || 'Error en el servidor',
        status: error.response.status,
      };
      return Promise.reject(apiError);
    }
    return Promise.reject({ message: error.message || 'Error de conexión', code: 'NETWORK_ERROR' });
  }
);

export default api;