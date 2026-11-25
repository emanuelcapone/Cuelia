import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: 'apps/web', plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./apps/web/src', import.meta.url)) } },
  build: { outDir: '../../dist/web', emptyOutDir: true },
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: {
    '/api': 'http://127.0.0.1:3000', '/health': 'http://127.0.0.1:3000',
    '/socket.io': { target: 'http://127.0.0.1:3000', ws: true }
  } }
});
