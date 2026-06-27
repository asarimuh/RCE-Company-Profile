# Current Limitations

## Functionality Limitations
- The admin dashboard is mostly read-only.
- Editing registrations is not implemented.
- Approval/rejection workflow is not implemented.
- Notes, comments, and review metadata are absent.
- There is no user role management beyond Supabase auth for admin.
- Delete confirmation UI is present, but the delete function in `src/admin/js/kol-database.js` does not actually remove data from Supabase.
- The analytics page computes charts in the browser, not with dedicated backend aggregations.

## Scalability
- All admin analytics and exports rely on fetching `talent_registrations` rows into the browser.
- Large data volumes may slow down admin pages and export operations.
- Pagination is implemented, but search and export queries may still fetch large result sets.

## Performance
- The static site uses multiple page-level CSS files and JavaScript that can be optimized further.
- There is no service worker or caching strategy configured.
- `src/admin/js/analytics.js` fetches all rows and computes aggregates client-side, which is not efficient for large datasets.

## Security
- Supabase anonymous key is used on the public website, which is expected for normal public read/write flows but requires appropriate backend security rules.
- The repository contains no RLS policy definitions or database policy configuration.
- The admin portal relies on Supabase auth guard client-side; server-side enforcement and strong RLS are not visible in repo.
- `additional_platforms` is stored as a JSON string and may be harder to validate securely.

## Accessibility
- The site uses semantic HTML, but there are some missing accessibility details:
  - link text in the admin UI may rely on icons without full alternate descriptions.
  - there is no high-contrast theme or explicit keyboard navigation guidance.
- The registration form uses error text and labels, but live region announcements for validation errors are not present.

## Maintainability
- The codebase is largely static HTML with duplicated markup across many blog pages.
- No templating system or shared layout abstractions exist.
- The admin and public code are separate but not extracted into reusable modules beyond basic helpers.
- There is no formal documentation of database schema or environment file conventions.

## Technical Debt
- No SQL migration or schema versioning present.
- Inconsistent use of `not_provided` fallback values may hide true missing data.
- The admin detail view references a `status` field that may not exist in the database.
- `src/admin/js/kol-database.js` includes delete logic scaffolding without actual Supabase delete request.
- The `src/admin/js/admin-supabase.js` and `src/js/supabase-client.js` clients are duplicated with similar options.

## Recommended Improvements
- Implement actual delete API or remove delete action completely until supported.
- Add server-side/RLS policies in Supabase to protect admin data access.
- Add schema migrations or Supabase project dumps in repo.
- Move repeated HTML fragments into templates or a component system if converting to a JS framework.
- Add explicit support for environment variable examples, e.g. `.env.example`.
- Improve analytics performance by using server-side aggregation or database views.
