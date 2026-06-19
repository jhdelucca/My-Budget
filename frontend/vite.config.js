import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Durante o desenvolvimento, todas as chamadas para /api são
// encaminhadas (proxy) para o backend Express na porta 3001.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
