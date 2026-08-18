import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.startsWith('/api/v1') ? path : `/api/v1${path}`
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.startsWith('/api/v1') ? path : `/api/v1${path}`
      },
      '/predictions': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.startsWith('/api/v1') ? path : `/api/v1${path}`
      },
      '/dashboard': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.startsWith('/api/v1') ? path : `/api/v1${path}`
      },
      '/dataset': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.startsWith('/api/v1') ? path : `/api/v1${path}`
      },
      '/model': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.startsWith('/api/v1') ? path : `/api/v1${path}`
      },
      '/model/metrics': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: () => '/api/v1/dashboard/model-performance'
      },
      '/patients': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, 'http://127.0.0.1:8000');
          const skipParam = url.searchParams.get('skip');
          const limitParam = url.searchParams.get('limit');
          if (skipParam !== null && limitParam !== null) {
            return `/api/v1/patients?skip=${skipParam}&limit=${limitParam}`;
          }
          const page = parseInt(url.searchParams.get('page') || '1');
          const pageSize = parseInt(url.searchParams.get('page_size') || '15');
          const skip = (page - 1) * pageSize;
          return `/api/v1/patients?skip=${skip}&limit=${pageSize}`;
        }
      },
      '/sample-patients': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: () => '/api/v1/patients?skip=0&limit=5'
      },
      '/predict': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: () => '/api/v1/predict'
      },
      '/predict_batch': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: () => '/api/v1/predict'
      },
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
});
