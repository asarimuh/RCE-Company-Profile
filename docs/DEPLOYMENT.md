# Deployment

## Development Workflow
- Install dependencies with `npm install`.
- Run local dev server with `npm run dev`.
- Build production files with `npm run build`.
- Preview production output with `npm run preview`.

## Running Locally
1. Navigate to project root.
2. Install dependencies: `npm install`
3. Start Vite: `npm run dev`
4. Open `http://localhost:3000` or the address shown by Vite.

## Environment Variables
The project expects environment variables in the repository root, loaded by Vite via `envDir: '../'` in `vite.config.js`.

Required variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These are used by:
- `src/js/supabase-client.js`
- `src/admin/js/admin-supabase.js`

There is no sample `.env` file in the repository.

## Vite
- `vite.config.js` sets `root: 'src'` and outputs build artifacts to `../dist`.
- Multi-page input configuration includes public pages, admin pages, blog pages, and service pages.
- Server defaults to port `3000` and opens browser automatically.

## GitHub
- No GitHub Actions workflow or CI configuration is present in the repository.
- The repo includes a standard `package.json` and `package-lock.json`.

## Vercel Deployment
- `vercel.json` rewrites `/admin` and `/admin/` to `/admin/login.html`.
- The app is production-ready as a static site with client-side Supabase integration.
- Vercel will serve the built `dist/` folder.

## Hostinger Domain
- There is no Hostinger-specific configuration in the repository.
- Domain configuration must be handled through the hosting provider separately.

## Supabase Configuration
- Supabase is used for auth and PostgreSQL.
- Database schema is not stored in repo migrations.
- Admin auth relies on Supabase session state in browser.
- External admin users and auth should be managed in Supabase Auth dashboard.

## Production Deployment
1. Set environment variables in Vercel or hosting environment.
2. Run `npm run build`.
3. Deploy the `dist/` directory.
4. Ensure `/admin` routes properly to `/admin/login.html`.

## Common Deployment Issues
- Missing environment variables will break Supabase init.
- If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are empty, both public and admin functionality fail.
- Admin pages require Supabase auth; an invalid session or wrong key will redirect to login.
- No migration files means database schema must be recreated manually if moved to a new Supabase project.
- The admin panel is client-side only; unauthorized access depends on Supabase auth and RLS configured in Supabase.
