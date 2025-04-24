import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';


// Tipo ApiError mejorado
interface ApiError {
  message: string;
  code?: string;
  status?: number;
  stack?: string;
  [key: string]: unknown; // Para propiedades adicionales
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Interceptor de request con tipos correctos
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('authToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response mejorado
api.interceptors.response.use(
  (response) => {
    console.debug('📥 Response:', response.config.url, response.data);
    return response.data; // Devuelve solo los datos por defecto
  },
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data
      });

      // Manejo de errores 401
      if (error.response.status === 401) {
        window.location.href = '/login';
        return Promise.reject({
          message: 'No autorizado',
          status: 401
        });
      }

      // Construcción del error de API
      const apiError: ApiError = {
        ...error.response.data, // Copia todas las propiedades del error
        message: error.response.data?.message || 'Error en el servidor',
        status: error.response.status
      };

      return Promise.reject(apiError);
    }

    // Error de red
    const networkError: ApiError = {
      message: error.message || 'Error de conexión',
      code: 'NETWORK_ERROR'
    };

    return Promise.reject(networkError);
  }
);

export default api;