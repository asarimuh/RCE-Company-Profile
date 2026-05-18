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

        // Blogs
        allBlogs: resolve(__dirname, 'src/pages/blogs.html'),
        teknikVokal: resolve(__dirname, 'src/pages/blogs/teknik-vokal.html'),
        koreografiPemula: resolve(__dirname, 'src/pages/blogs/koreografi-dasar.html'),
        liveStreamingMenarik: resolve(__dirname, 'src/pages/blogs/tips-live-streaming.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true, 
  },
});