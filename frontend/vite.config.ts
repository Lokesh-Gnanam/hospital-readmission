import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.startsWith('/api/v1') ? path : `/api/v1${path}`
      },
      '/model/metrics': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: () => '/api/v1/dashboard/model-performance'
      },
      '/patients': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => {
          // Convert ?page=X&page_size=Y to ?skip=(X-1)*Y&limit=Y
          const url = new URL(path, 'http://localhost:8000');
          const page = parseInt(url.searchParams.get('page') || '1');
          const pageSize = parseInt(url.searchParams.get('page_size') || '15');
          const skip = (page - 1) * pageSize;
          return `/api/v1/patients?skip=${skip}&limit=${pageSize}`;
        }
      },
      '/sample-patients': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: () => '/api/v1/patients?skip=0&limit=5'
      },
      '/predict': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: () => '/api/v1/predict'
      },
      '/predict_batch': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: () => '/api/v1/predict'
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
