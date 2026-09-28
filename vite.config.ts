import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// base './' so the built site works from any folder: GitHub Pages, Netlify,
// or just opening dist/ from a pen drive
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5180, strictPort: true },
  build: { chunkSizeWarningLimit: 700 },
});
