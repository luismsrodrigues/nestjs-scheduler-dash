import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    outDir: '../scheduler-dash/ui',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
  },
});
