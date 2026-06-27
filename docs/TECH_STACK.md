# Technical Stack

## Frontend
- HTML5: static multi-page content and SEO-friendly structure.
- CSS3: custom styling across global and page-specific stylesheets.
  - `src/css/main.css`
  - `src/css/reset.css`
  - `src/css/pages/*`
  - `src/admin/css/*`
- JavaScript (ES modules): client-side interactions, registration workflow, admin data fetching, auth guards, charts, and export.

## Build Tools
- Vite: modern bundler used for static hosting and multi-page build configuration.
  - Entry points declared in `vite.config.js`
  - `dev`, `build`, and `preview` scripts in `package.json`
- Rollup: Vite uses Rollup internally for bundling multi-page outputs.

## Backend
- Supabase: backend-as-a-service powering database, authentication, and storage.
  - `@supabase/supabase-js` used in both public and admin clients
  - No custom server-side code in repository

## Database
- Supabase PostgreSQL: data persistence for registration submissions.
- `talent_registrations` table is the primary table referenced in admin and registration code.
- The repository does not include explicit SQL migrations or schema files.

## Authentication
- Supabase Auth: email/password login for admin users.
- Admin pages guard access through `src/admin/js/admin-auth.js`.
- Public registration does not require authentication.

## Storage
- Supabase Storage appears configured through the imported library dependency, but no storage buckets are directly referenced in app code.
- Static assets are served from `src/public/assets/`.

## Deployment
- Vercel configuration is present in `vercel.json`.
  - custom rewrite from `/admin` to `/admin/login.html`
- Vite build outputs to `dist/`.
- `envDir: '../'` in `vite.config.js` indicates environment variables are expected in the repository root.

## Libraries
- `@supabase/supabase-js`: Supabase client library for authentication and database operations.
- `exceljs`: used by admin export functionality in `src/admin/js/kol-database.js`.

## Third-party Services
- Supabase: authentication, database, and likely storage.
- Google Fonts: `Poppins` and `Montserrat`.
- Facebook Pixel: embedded in `src/index.html`.
- WhatsApp: success page includes link to chat.

## Why Major Dependencies Exist
- `vite`: fast local development and multi-page production build.
- `@supabase/supabase-js`: required for Supabase interactions from browser and admin pages.
- `exceljs`: enables client-side Excel export of registration data.
