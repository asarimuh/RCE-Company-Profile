import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src', 
  build: {
    outDir: '../dist', 
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        blog: resolve(__dirname, 'src/blog/index.html'),
        digitalEntertainment: resolve(__dirname, 'src/pages/services/digital-entertainment.html'),
        corporateSolutions: resolve(__dirname, 'src/pages/services/corporate-solutions.html'),
        eCommerce: resolve(__dirname, 'src/pages/services/e-commerce.html'),

        // Add more pages here as you create them
      },
    },
  },
  server: {
    port: 3000,
    open: true, 
  },
});