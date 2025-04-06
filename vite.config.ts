import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Solución para react-icons
      'react-icons/fi': 'react-icons/fi/index.esm.js',
      // Aliases adicionales recomendados (opcional)
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages'
    }
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Configuración adicional para WebSockets si es necesario
        ws: true
      }
    },
    // Configuración adicional para HMR (Hot Module Replacement)
    hmr: {
      overlay: false // Desactiva el overlay de errores en pantalla
    }
  },
  preview: {
    port: 3000,
    host: true
  },
  // Optimización para build
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Recomendado para desarrollo
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa react-icons en su propio chunk
          'react-icons': ['react-icons/fi']
        }
      }
    }
  },
  // Configuración para TypeScript
  esbuild: {
    jsxInject: `import React from 'react'` // Auto-inyecta React en los archivos JSX
  }
});