import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  define: { 'import.meta.env.KUDI_REDESIGN': JSON.stringify(process.env.KUDI_REDESIGN ?? '') },
  server: {
    port: Number(process.env.KUDI_WEB_PORT ?? 5173),
    proxy: { '/api': `http://localhost:${process.env.KUDI_API_PORT ?? 8787}` },
  },
});
