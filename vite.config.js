import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src', 
  envDir: '../',
  build: {
    target: 'esnext',
    outDir: '../dist', 
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // ── Public site ──────────────────────────────
        main: resolve(__dirname, 'src/index.html'),
        blog: resolve(__dirname, 'src/blog/index.html'),
        digitalEntertainment: resolve(__dirname, 'src/pages/services/digital-entertainment.html'),
        corporateSolutions: resolve(__dirname, 'src/pages/services/corporate-solutions.html'),
        eCommerce: resolve(__dirname, 'src/pages/services/e-commerce.html'),
        register:               resolve(__dirname, 'src/pages/register.html'),
        registerSuccess:        resolve(__dirname, 'src/pages/register-success.html'),

        // ── Admin dashboard ──────────────────────────
        adminIndex:           resolve(__dirname, 'src/admin/index.html'),
        adminLogin:           resolve(__dirname, 'src/admin/login.html'),
        adminDashboard:       resolve(__dirname, 'src/admin/dashboard.html'),
        adminKol:             resolve(__dirname, 'src/admin/kol-database.html'),

        // Blogs
        allBlogs: resolve(__dirname, 'src/pages/blogs.html'),
        teknikVokal: resolve(__dirname, 'src/pages/blogs/teknik-vokal.html'),
        koreografiPemula: resolve(__dirname, 'src/pages/blogs/koreografi-dasar.html'),
        liveStreamingMenarik: resolve(__dirname, 'src/pages/blogs/tips-live-streaming.html'),
        menghadapiHateComment: resolve(__dirname, 'src/pages/blogs/menghadapi-hate-comment.html'),
        setupLightning: resolve(__dirname, 'src/pages/blogs/setup-lightning-murah.html'),
        trenTiktokDance2026: resolve(__dirname, 'src/pages/blogs/tren-tiktok-dance-2026.html'),
        talentIncubation: resolve(__dirname, 'src/pages/blogs/talent-incubation.html'),
        brandingDigital: resolve(__dirname, 'src/pages/blogs/branding-digital.html'),
        penghasilanLiveHost: resolve(__dirname, 'src/pages/blogs/penghasilan-live-host.html'),
        apaItuMCN: resolve(__dirname, 'src/pages/blogs/apa-itu-mcn-agency.html'),
        CaraMenjadiLiveHost: resolve(__dirname, 'src/pages/blogs/cara-menjadi-live-host-tiktok.html'),
        BodyLanguageLiveHost: resolve(__dirname, 'src/pages/blogs/body-language-depan-kamera.html'),
        strategiLiveStreamingPertama: resolve(__dirname, 'src/pages/blogs/strategi-live-streaming-pertama.html'),
        storytellingLiveStreaming: resolve(__dirname, 'src/pages/blogs/storytelling-untuk-live-host.html'),
        apaYangDilakukanHostProfesionalSaatSepiPenonton: resolve(__dirname, 'src/pages/blogs/apa-yang-dilakukan-host-profesional-saat-sepi-penonton.html'),
        expandingBusinesssToIndonesia: resolve(__dirname, 'src/pages/blogs/expanding-business-to-indonesia.html'),
        whyGlobalBrandsFailInIndonesia: resolve(__dirname, 'src/pages/blogs/why-global-brands-fail-in-indonesia.html'),
        taxObligationsForForeignCompaniesInIndonesia: resolve(__dirname, 'src/pages/blogs/tax-obligations-for-foreign-companies-in-indonesia.html'),
        peraturanLiveTiktokAntiBanned: resolve(__dirname, 'src/pages/blogs/peraturan-live-tiktok-anti-banned.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true, 
  },
});