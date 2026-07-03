-- SetuOne Phase 1 backend schema
-- Run this in Supabase SQL Editor after creating your Supabase project.

create table if not exists public.tickets (
  id text primary key,
  tenant text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists tickets_tenant_idx on public.tickets (tenant);
create index if not exists tickets_updated_at_idx on public.tickets (updated_at desc);

alter table public.tickets enable row level security;

-- Prototype policy: authenticated users can read/write tickets.
-- For production, replace this with tenant-based policies using a user_profiles table.
do $$ begin
  create policy "Authenticated users can read tickets"
    on public.tickets for select
    to authenticated
    using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users can insert tickets"
    on public.tickets for insert
    to authenticated
    with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users can update tickets"
    on public.tickets for update
    to authenticated
    using (true)
    with check (true);
exception when duplicate_object then null;
end $$;
