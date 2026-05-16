import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src', // Set the source folder as root
  build: {
    outDir: '../dist', // Output the build to the root's dist folder
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        blog: resolve(__dirname, 'src/blog/index.html'),
        // Add more pages here as you create them
      },
    },
  },
  server: {
    port: 3000,
    open: true, // Automatically opens the browser
  },
});