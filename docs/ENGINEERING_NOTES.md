# Engineering Notes

## Coding Conventions
- Public pages use plain HTML with CSS modules per page.
- JavaScript uses ES module imports and `type="module"` in pages.
- Admin scripts use top-level await and modular imports.
- CSS is organized by component, layout, and page.

## Folder Conventions
- `src/pages/`: static public pages and content.
- `src/css/pages/`: page-specific CSS.
- `src/css/components/`: shared public components such as navbar and footer.
- `src/css/layouts/`: section-level styling for the public site.
- `src/admin/`: full admin portal separate from public site.
- `src/admin/css/`: admin-specific stylesheet files.
- `src/admin/js/`: admin logic and utilities.
- `src/public/assets/`: static images and icons.

## Naming Conventions
- JavaScript modules are kebab-case: `registration-form.js`, `admin-auth.js`.
- CSS modules are also kebab-case and grouped by page or function.
- HTML files are named by route and content: `register.html` and `kol-database.html`.
- Supabase table naming is `talent_registrations`.

## Reusable Utilities
- `src/admin/js/admin-utils.js`: contains formatting, badges, toast, confirm dialog, debounce, and UI helpers.
- `src/js/supabase-client.js`: public Supabase client instantiation.
- `src/admin/js/admin-supabase.js`: admin Supabase client instantiation.

## Reusable Components
- There are no reusable HTML components in the repo.
- Reuse is handled through CSS class naming and shared JS utility modules.

## Shared Styles
- `src/css/main.css` contains core styles, variables, and global typography.
- `src/css/reset.css` resets browser defaults.
- `src/admin/css/admin-base.css` defines admin color themes, typography, and layout foundations.
- `src/admin/css/admin-layout.css` and `src/admin/css/admin-components.css` structure admin pages.

## Common Patterns
- Multi-step form logic in `src/js/registration-form.js`.
- Supabase `createClient()` usage in two client modules.
- Admin auth guard pattern in `src/admin/js/admin-auth.js`.
- Query state object in `src/admin/js/kol-database.js` for pagination/filter/sort.
- Client-side charting in `src/admin/js/analytics.js` using DOM and SVG.

## Anti-patterns
- Duplicate Supabase client initialization in public and admin code.
- Hardcoded fallback text values like `not_provided`.
- Multiple large static HTML pages with duplicated global markup.
- Inline admin delete confirmation UI without actual deletion request.
- Analytics computations entirely in the browser, which is inefficient at scale.

## Files to Read First
1. `src/js/registration-form.js` - registration workflow and Supabase submission.
2. `src/admin/js/admin-auth.js` - admin authentication flow.
3. `src/admin/js/dashboard.js` - admin overview and auth guard.
4. `src/admin/js/kol-database.js` - data table, detail view, export.
5. `vite.config.js` - build routing and environment loading.

## Areas to Avoid Modifying Initially
- `src/pages/blogs/*.html` and service pages unless content updates are required; they are largely static.
- `src/css/*` and `src/admin/css/*` unless UI changes are part of the task.
- `src/admin/js/kol-database.js` delete logic until the backend delete flow is validated.

## Recommended Refactors
- Consolidate Supabase client initialization into one shared module for both public and admin.
- Introduce a schema definition or migration folder for Supabase/PostgreSQL.
- Centralize repeated page headers/footers into templates or adopt a lightweight static site generator.
- Convert admin UI to a single-page module or framework for better maintainability.
- Move chart logic from DOM string concatenation into reusable helper functions.

## Maintainability Assessment
- The current codebase is readable for a small static site and admin portal.
- It is maintainable for the current MVP, but there is moderate duplication and missing schema documentation.
- Adding a templating or component system would significantly improve maintainability if the site continues to grow.

## Scalability Assessment
- The architecture is sufficient for a small audience and early-stage registration use.
- Growth risks appear in admin analytics and export performance as registration volume increases.
- Proper Supabase RLS and database indexing should be added before onboarding a larger user base.
