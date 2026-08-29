import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 5273 dipilih agar tidak bentrok dengan dev server lain di mesin ini (5173/5174).
    port: 5273,
    strictPort: true,
    proxy: {
      // Proksi ke backend saat development agar request /api same-origin (tanpa CORS).
      // Backend dev berjalan di port 3100 (lihat backend/.env.example).
      '/api': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
});
