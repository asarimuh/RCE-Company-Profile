# Database

## Supabase Database

The repository does not include explicit SQL schema or migration files. The code references a single primary table:

- `talent_registrations`

## Table: `talent_registrations`

### Columns referenced in code
- `id` (assumed primary key)
- `full_name`
- `date_of_birth`
- `gender`
- `city`
- `province`
- `country`
- `email`
- `whatsapp_number`
- `tiktok_handle`
- `instagram_handle`
- `youtube_handle`
- `primary_platform`
- `other_platform`
- `content_category` (array of categories)
- `follower_count_tt`
- `follower_count_ig`
- `follower_count_yt`
- `content_description`
- `portfolio_url`
- `additional_platforms` (JSON string)
- `user_agent`
- `referrer_url`
- `status` (optional status field used in admin detail view)
- `created_at`
- `updated_at`

### Implied schema notes
- `created_at` and `updated_at` are expected to be timestamp fields.
- `status` may be a text field with values like `pending`, `reviewing`, `approved`, `rejected`, or `on_hold`.
- `content_category` is read as an array and stored as array values in Supabase/PostgreSQL.
- `additional_platforms` is stored as a JSON string rather than JSONB in the current code.

## Relationships
- No explicit relationships or foreign keys are present in the repository.
- The application is currently single-table and does not reference user, team, or related tables.

## Authentication
- Supabase Auth is used for admin login.
- There is no code to link auth users to registration rows.
- The public registration flow is unauthenticated.

## Storage Buckets
- No storage bucket usage is present in code.
- The dependency on `@supabase/supabase-js` supports Storage, but no bucket references exist.

## Row Level Security (RLS)
- RLS policies are not visible in repository files.
- Supabase access relies on the client-side anonymous key and authenticated session.
- Admin pages depend on Supabase auth session enforcement rather than explicit RLS logic in code.

## SQL Migrations
- No `.sql` or migration files are included in the repository.
- The database schema must be managed outside the repo or in Supabase dashboard.

## How the registration form writes data
- `src/js/registration-form.js` collects form input values.
- Normalizes WhatsApp number to `+62` format.
- Converts empty optional values to `not_provided` for specific fields.
- Stores selected category values as `content_category` array.
- Serializes custom additional platform entries into `additional_platforms` JSON.
- Inserts the object into Supabase with `supabase.from('talent_registrations').insert([data])`.

## How the dashboard reads data
- `src/admin/dashboard.js` reads `talent_registrations` counts and recent records.
- `src/admin/kol-database.js` reads all columns for table listing, filtering, sorting, and export.
- `src/admin/analytics.js` reads all rows and computes platform distribution, monthly trends, category counts, and top talent.

## Recommendations for future schema evolution
1. Add explicit SQL migration tracking or `supabase` schema files to version database structure.
2. Model `additional_platforms` as JSONB rather than a JSON string for better querying.
3. Add a `status` enum or text field with default `pending` and indexing for workflow states.
4. Add `created_by` or `admin_id` if admin actions and approvals need to be logged.
5. Introduce tables for `users`, `roles`, `notes`, and `activity_logs` when role management and audit trails are added.
6. Add indexes on `created_at`, `primary_platform`, `content_category`, and `email` for query performance.
7. Add a `source` or `campaign` field if marketing attribution is required.
