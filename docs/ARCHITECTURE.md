# Architecture

## System Architecture

The application is a static frontend with client-side Supabase integration.

Visitor
↓
Public Website
↓
Registration Form
↓
Supabase
↓
PostgreSQL
↓
Admin Dashboard

## Application Architecture

- Public site pages are static HTML served by Vite build output.
- `src/js/main.js` provides page UI interactions and animation behavior.
- `src/js/registration-form.js` manages the multi-step registration form and directly inserts submission data into Supabase.
- Admin pages are static HTML that initialize Supabase auth and database queries in the browser.
- No server-side backend code exists in this repository; Supabase is the backend.

## Routing

### Public routing
- `src/index.html`: landing page.
- `src/pages/register.html`: registration form.
- `src/pages/register-success.html`: confirmation page.
- `src/pages/services/*.html`: service detail pages.
- `src/pages/blogs.html`: top-level blog list.
- `src/pages/blogs/*.html`: individual blog detail pages.

### Admin routing
- `/admin`: rewritten to `/admin/login.html` by `vercel.json`
- `/admin/login.html`: admin login.
- `/admin/dashboard.html`: admin overview.
- `/admin/kol-database.html`: data table and detail review.
- `/admin/analytics.html`: registration insights.

## Module Interactions

- `src/js/supabase-client.js` exports `supabase` for registration form submissions.
- `src/admin/js/admin-supabase.js` exports `supabase` for admin auth and data queries.
- Admin modules share helpers from `src/admin/js/admin-utils.js`.
- `src/admin/js/admin-auth.js` is the auth guard used by all admin pages.
- `src/js/registration-form.js` submits to Supabase table `talent_registrations`.
- `src/admin/dashboard.js`, `src/admin/kol-database.js`, and `src/admin/analytics.js` read from the same table.

## Authentication Flow

1. Admin visits `/admin/login.html`.
2. `src/admin/js/login.js` calls `loginWithEmail()` from `src/admin/js/admin-auth.js`.
3. `admin-auth.js` uses `supabase.auth.signInWithPassword()`.
4. On success, admin is redirected to `/admin/dashboard.html`.
5. Admin pages call `requireAuth()` to validate session; unauthenticated users are redirected to login.
6. `logout()` calls `supabase.auth.signOut()` and redirects to login.

## Registration Flow

1. Visitor fills step 1 (personal data), step 2 (contact + socials), step 3 (creator profile).
2. Each step is validated in `src/js/registration-form.js`.
3. The form includes a hidden honeypot field and a 60-second cooldown stored in `localStorage`.
4. On submit, data is normalized and inserted into `talent_registrations` via Supabase.
5. After successful insert, visitor is redirected to `/pages/register-success.html`.

## Database Flow

- Public form inserts into Supabase table `talent_registrations`.
- Admin dashboard queries counts and recent records.
- Admin table page queries list, filter, sort, pagination, and export.
- Analytics page queries all rows and computes simple aggregates in the browser.

## Deployment Architecture

- Vite builds the static site to `dist/`.
- Vercel is configured to host the static site and rewrite `/admin` to the admin login page.
- Environment variables are loaded by Vite from the repository root (`envDir: '../'`).
- Supabase connection information is supplied via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
