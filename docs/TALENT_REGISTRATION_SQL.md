# Talent Registration SQL Setup

## 1) Create table

```sql
create table if not exists public.data_talent (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  verification_status text not null default 'pending',
  full_name text not null,
  stage_name text,
  date_of_birth text,
  gender text,
  city text not null,
  province text,
  languages_spoken text,
  email text not null,
  whatsapp_number text not null,
  primary_talent text not null,
  secondary_talents text[],
  skills text[],
  tiktok_username text,
  instagram_username text,
  youtube_username text,
  facebook_username text,
  available_days text[],
  available_time text[],
  profile_photo_filename text,
  profile_photo_url text,
  resume_filename text,
  resume_url text,
  user_agent text,
  referrer_url text,
  constraint talent_registrations_email_check check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')
);
```

## 2) Add missing columns to an existing table (if you already created it)

If the table already exists from an earlier run, add the username columns with this SQL:

```sql
alter table public.data_talent
add column if not exists tiktok_username text,
add column if not exists instagram_username text,
add column if not exists youtube_username text,
add column if not exists facebook_username text;
```

## 3) Add verification status columns to existing tables

If your existing KOL/KOC table was created before the verification workflow, add the missing verification column with this SQL:

```sql
alter table public.data_kol_koc
add column if not exists verification_status text default 'pending';

create index if not exists idx_data_kol_koc_verification_status on public.data_kol_koc (verification_status);
```

If your Talent table is missing the verification status column, run:

```sql
alter table public.data_talent
add column if not exists verification_status text default 'pending';

create index if not exists idx_data_talent_verification_status on public.data_talent (verification_status);
```

## 4) Create indexes

```sql
create index if not exists idx_data_talent_created_at on public.data_talent (created_at desc);
create index if not exists idx_data_talent_verification_status on public.data_talent (verification_status);
create index if not exists idx_data_talent_primary_talent on public.data_talent (primary_talent);
create index if not exists idx_data_talent_city on public.data_talent (city);
create index if not exists idx_data_talent_email on public.data_talent (email);
```

## 3) Enable Row Level Security

```sql
alter table public.data_talent enable row level security;
```

## 4) RLS policies

```sql
drop policy if exists "Allow public insert for talent registrations" on public.data_talent;
create policy "Allow public insert for talent registrations"
  on public.data_talent
  for insert
  to anon
  with check (true);

drop policy if exists "Allow authenticated insert access" on public.data_talent;
create policy "Allow authenticated insert access"
  on public.data_talent
  for insert
  to authenticated
  with check (true);

drop policy if exists "Allow authenticated read access" on public.data_talent;
create policy "Allow authenticated read access"
  on public.data_talent
  for select
  to authenticated
  using (true);

drop policy if exists "Allow authenticated update access" on public.data_talent;
create policy "Allow authenticated update access"
  on public.data_talent
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Allow authenticated delete access" on public.data_talent;
create policy "Allow authenticated delete access"
  on public.data_talent
  for delete
  to authenticated
  using (true);
```

## 5) Storage bucket

Create a storage bucket named `talent-uploads` with:
- public access: true
- file size limit: 5 MB
- allowed MIME types: `image/png`, `image/jpeg`, `image/jpg`, `image/webp`, `application/pdf`

If the form still fails with a row-level security error, the bucket exists but the Storage policies are still blocking uploads. In that case, add the policies in Supabase Storage:

1. Open Storage in Supabase.
2. Click the `talent-uploads` bucket.
3. Open Policies.
4. Add a policy for `SELECT` and another for `INSERT`.
5. Use the policy expression:
   `bucket_id = 'talent-uploads'`
6. Allow the role `anon` (and optionally `authenticated`).

SQL version:

```sql
insert into storage.buckets (id, name, public)
values ('talent-uploads', 'talent-uploads', true)
on conflict (id) do nothing;
```

```sql
drop policy if exists "Public read access for talent uploads" on storage.objects;
create policy "Public read access for talent uploads"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'talent-uploads');

drop policy if exists "Allow public upload for talent uploads" on storage.objects;
create policy "Allow public upload for talent uploads"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'talent-uploads');
```
