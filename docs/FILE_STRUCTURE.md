# File Structure

## Project Tree

```
company-profile/
├── package.json
├── package-lock.json
├── vite.config.js
├── vercel.json
├── readme.md
├── .gitignore
├── dist/ (build output)
├── docs/ (generated documentation)
├── public/ (static public assets for root deploy)
│   ├── favicon.ico
│   ├── favicon-32x32.png
│   └── favicon-16x16.png
└── src/
    ├── index.html
    ├── blog/index.html
    ├── pages/
    │   ├── blogs.html
    │   ├── register.html
    │   ├── register-success.html
    │   ├── services/
    │   │   ├── digital-entertainment.html
    │   │   ├── corporate-solutions.html
    │   │   └── e-commerce.html
    │   └── blogs/
    │       ├── apa-itu-mcn-agency.html
    │       ├── ... other blog details ...
    ├── css/
    │   ├── main.css
    │   ├── reset.css
    │   ├── skeleton-loading.css
    │   ├── pages/
    │   │   ├── register.css
    │   │   ├── register-navbar.css
    │   │   ├── corporate-solutions.css
    │   │   ├── digital-entertainment.css
    │   │   └── e-commerce.css
    │   ├── components/
    │   │   ├── footer.css
    │   │   └── navbar.css
    │   └── layouts/
    │       ├── hero.css
    │       ├── services.css
    │       ├── ... other page layouts ...
    ├── js/
    │   ├── main.js
    │   ├── registration-form.js
    │   ├── supabase-client.js
    │   ├── cssbootstrap.js
    │   ├── loading-screen.js
    │   └── skeleton-loader.js
    ├── admin/
    │   ├── index.html
    │   ├── login.html
    │   ├── dashboard.html
    │   ├── kol-database.html
    │   ├── analytics.html
    │   ├── css/
    │   │   ├── admin-base.css
    │   │   ├── admin-layout.css
    │   │   ├── admin-components.css
    │   │   ├── admin-login.css
    │   │   └── analytics.css
    │   └── js/
    │       ├── admin-auth.js
    │       ├── admin-supabase.js
    │       ├── admin-utils.js
    │       ├── dashboard.js
    │       ├── kol-database.js
    │       ├── analytics.js
    │       └── login.js
    └── public/
        ├── sitemap.xml
        └── assets/
            ├── rce-brand-logo.svg
            ├── hero-image-1.png
            ├── ... images and icons ...
```

## Important Folders
- `src/`: application source code and multi-page HTML.
- `src/pages/`: public site subpages such as registration, services, and blog content.
- `src/css/`: styling for the public site.
- `src/js/`: frontend scripts, including registration and page interactions.
- `src/admin/`: admin portal, including pages and admin-specific assets.
- `src/admin/js/`: admin logic: auth, dashboard, data table, analytics.
- `src/public/assets/`: static image and icon assets consumed by pages.

## Important Files
- `package.json`: package dependencies and scripts.
- `vite.config.js`: Vite multi-page app configuration and build output settings.
- `vercel.json`: Vercel routing rewrite for `/admin`.
- `src/index.html`: public website landing page.
- `src/pages/register.html`: talent registration form page.
- `src/js/registration-form.js`: multi-step form logic and Supabase submission.
- `src/js/supabase-client.js`: Supabase client initialization for public flows.
- `src/admin/login.html`: admin login page.
- `src/admin/js/login.js`: admin auth logic.
- `src/admin/dashboard.html`: admin dashboard overview.
- `src/admin/js/dashboard.js`: dashboard stats and recent registration data.
- `src/admin/kol-database.html`: admin registration table page.
- `src/admin/js/kol-database.js`: search, filter, export, detail panel, and delete UI.
- `src/admin/analytics.html`: admin analytics overview.
- `src/admin/js/analytics.js`: charting and summary rendering.

## Entry Points
- `src/index.html`: main public landing page.
- `src/pages/register.html`: registration form.
- `src/admin/login.html`: admin entry/login page.
- `src/admin/dashboard.html`: admin landing metrics page.
- `src/admin/kol-database.html`: admin data table.
- `src/admin/analytics.html`: admin analytics.

## Reusable Modules
- `src/js/main.js`: common public UI interactions and animations.
- `src/js/supabase-client.js`: Supabase client for public submission.
- `src/admin/js/admin-supabase.js`: Supabase client for admin flows.
- `src/admin/js/admin-auth.js`: auth guard and session management.
- `src/admin/js/admin-utils.js`: shared helpers for formatting, badges, toast, dialog, debounce.

## Shared Utilities
- `src/admin/js/admin-utils.js`: date/number formatters, badges, confirmation dialogs, debounce, sidebar user rendering.
- `src/js/supabase-client.js` and `src/admin/js/admin-supabase.js`: isolated Supabase setup.

## Dashboard Files
- `src/admin/dashboard.html`
- `src/admin/js/dashboard.js`
- `src/admin/analytics.html`
- `src/admin/js/analytics.js`
- `src/admin/kol-database.html`
- `src/admin/js/kol-database.js`
- `src/admin/js/login.js`
- `src/admin/js/admin-auth.js`
- `src/admin/js/admin-supabase.js`
- `src/admin/js/admin-utils.js`

## Registration Files
- `src/pages/register.html`
- `src/js/registration-form.js`
- `src/js/supabase-client.js`
- `src/pages/register-success.html`

## Supabase Integration
- `src/js/supabase-client.js`: Supabase client for public form submission
- `src/admin/js/admin-supabase.js`: Supabase client for admin auth and queries
- `src/js/registration-form.js`: inserts into `talent_registrations`
- `src/admin/dashboard.js`, `src/admin/kol-database.js`, `src/admin/analytics.js`: query `talent_registrations`
- `vite.config.js`: loads environment variables from repo root using `envDir: '../'`
