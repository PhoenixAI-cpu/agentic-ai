-- Antaria — initial schema
-- Run this in the Supabase SQL editor (or via the Supabase CLI).
-- Create a storage bucket named 'datasets' in the Supabase dashboard (public: false).

-- ── Datasets ────────────────────────────────────────────────────────────────
create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  name text,
  file_path text,
  file_type text,
  size_bytes bigint,
  uploaded_at timestamptz default now(),
  user_id uuid
);

-- ── Evidence Ledger (append-only) ───────────────────────────────────────────
create table if not exists public.ledger_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz default now(),
  actor text not null,
  action text not null,
  subject text,
  detail jsonb,
  reasoning text,
  confidence text,
  user_id uuid
);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.datasets enable row level security;
alter table public.ledger_events enable row level security;

create policy "datasets: authenticated read own"
  on public.datasets for select
  to authenticated
  using (user_id = auth.uid());

create policy "datasets: authenticated insert own"
  on public.datasets for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "ledger: authenticated read own"
  on public.ledger_events for select
  to authenticated
  using (user_id = auth.uid());

create policy "ledger: authenticated insert own"
  on public.ledger_events for insert
  to authenticated
  with check (user_id = auth.uid());

-- ── Demo mode (anon access) ─────────────────────────────────────────────────
-- For demos without authentication, uncomment the permissive anon policies
-- below. Do NOT enable these in production — they allow anyone with the anon
-- key to read and write all rows.
--
-- create policy "datasets: anon demo access"
--   on public.datasets for all
--   to anon
--   using (true)
--   with check (true);
--
-- create policy "ledger: anon demo access"
--   on public.ledger_events for all
--   to anon
--   using (true)
--   with check (true);
