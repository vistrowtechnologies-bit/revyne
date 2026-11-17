import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5175, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        // Big libraries in their own files: cached across deploys and only
        // fetched by the screens that use them.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\/](recharts|d3-|victory-vendor|decimal\.js-light|eventemitter3|es-toolkit|immer|reselect|redux|@reduxjs)/.test(id)) return 'charts';
          if (/[\/](react-aria|react-stately|@react-aria|@react-stately|@internationalized|@react-types|@swc)/.test(id)) return 'react-aria';
          if (/[\/]@supabase[\/]/.test(id)) return 'supabase';
          if (/[\/](react|react-dom|scheduler)[\/]/.test(id)) return 'react';
        },
      },
    },
  },
});
