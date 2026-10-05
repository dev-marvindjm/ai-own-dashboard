import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/quant': {
        target: 'http://192.168.0.100:8000',
        rewrite: (path) => path.replace(/^\/api\/quant/, '/api/v1'),
        changeOrigin: true,
      },
      '/api/msg': {
        target: 'http://192.168.0.100:8001',
        rewrite: (path) => path.replace(/^\/api\/msg/, '/api/v1'),
        changeOrigin: true,
      },
      '/api/tokenizer': {
        target: 'http://192.168.0.100:8002',
        rewrite: (path) => path.replace(/^\/api\/tokenizer/, '/api/v1'),
        changeOrigin: true,
      },
      '/api': {
        target: 'http://192.168.0.100:8000',
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
        changeOrigin: true,
      },
      '/events': {
        target: 'http://192.168.0.100:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
});
