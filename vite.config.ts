import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Para que coincida con el mapeo 3001:3000 en docker-compose.yml
    host: true, // Permite conexiones desde fuera del contenedor
    strictPort: true, // Evita que Vite cambie el puerto si está ocupado
    proxy: {
      '/api': {
        target: 'http://backend:3000', // Usa el nombre del servicio de Docker
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  preview: {
    port: 3000 // Puerto para el comando 'preview' (producción)
  }
});