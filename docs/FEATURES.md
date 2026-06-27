# Features

## Public Website
- Multi-page static website built with HTML, CSS, and JavaScript.
- Landing page with hero, about, services, talent sections, gallery, FAQ, and contact information.
- Service detail pages under `src/pages/services/`.
- Blog list and detail pages under `src/pages/blogs/`.
- Responsive layout using CSS modules in `src/css/*`.
- Entry scripts and section animation in `src/js/main.js`.

## Navigation
- Navbar on public pages with anchor links to sections and mobile toggle.
- Admin sidebar navigation between dashboard, KOL database, analytics, and upcoming features.
- `vercel.json` rewrites `/admin` to `/admin/login.html`.

## Hero
- Public hero section in `src/index.html` with responsive images, action button, and animated CTA.
- Styled by `src/css/layouts/hero.css` and `src/css/main.css`.

## About
- `src/index.html` includes a company overview section describing RCE's business pillars.

## Services
- Multiple service pages with custom layouts:
  - `src/pages/services/digital-entertainment.html`
  - `src/pages/services/corporate-solutions.html`
  - `src/pages/services/e-commerce.html`
- Service CSS in `src/css/pages/*.css` and `src/css/layouts/services.css`.

## Contact
- Public contact section appears on the main page, though contact handling is purely informational and does not include form submission backend.

## Registration Form
- Multi-step registration form in `src/pages/register.html`.
- Uses progressive step transitions and a visual progress bar.
- Validates user details, contact info, social handles, platform selection, category selection, optional portfolio, and terms acceptance.
- Includes honeypot anti-spam field and localStorage cooldown.
- Success redirect to `src/pages/register-success.html`.

## Validation
- Client-side validation in `src/js/registration-form.js`.
- Step 1: full name, date of birth, city, province.
- Step 2: email format, WhatsApp normalization, social handle requirement, optional handle validation.
- Step 3: platform and category selection, optional custom platform/category validation, agreement checkbox, portfolio URL format.

## Supabase Integration
- `src/js/supabase-client.js` creates Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Registration form inserts submissions into `talent_registrations`.
- Admin pages use `src/admin/js/admin-supabase.js` for auth and database access.

## Authentication
- Admin login page uses Supabase Auth email/password flow.
- Auth guard in `src/admin/js/admin-auth.js` protects admin pages.
- `redirectIfAuthenticated()` keeps logged-in users away from login page.

## Admin Dashboard
- `src/admin/dashboard.html` provides high-level stats and recent registration list.
- `src/admin/js/dashboard.js` loads counts from Supabase and renders summary and recent items.
- Recent registrations link to detail view in KOL database via URL param.

## Data Table
- Admin data table page at `src/admin/kol-database.html`.
- `src/admin/js/kol-database.js` supports:
  - search across names, email, handles, and WhatsApp
  - platform filter, category filter
  - sorting by name, followers, date
  - pagination
  - detail drawer view
  - Excel export with `exceljs`
  - delete UI via confirmation dialog (but actual deletion logic is incomplete / not implemented)

## Detail View
- The admin detail panel renders a full registration record.
- Supports contact links and platform badge display.
- Shows status, registration date, and updated date if available.

## Analytics
- `src/admin/analytics.html` offers visual insights.
- `src/admin/js/analytics.js` computes counts and renders:
  - platform distribution chart
  - monthly trend chart
  - category counts list
  - top talent by follower counts

## Responsive Layout
- Public and admin pages use responsive styles.
- CSS is split into modular page and layout files.
- Mobile navigation support and card layouts are present.

## Implementation Notes
- The admin portal is effectively read-only for review and export.
- There is no implemented approval or editing workflow in the current codebase.
- The registration form is the only write path into Supabase.
