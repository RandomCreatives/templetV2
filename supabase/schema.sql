create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  cover_image_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.photographs (
  id uuid primary key default gen_random_uuid(),
  image_code text not null unique,
  image_url text not null,
  aspect_ratio numeric not null check (aspect_ratio > 0),
  title text not null,
  location text not null,
  category text not null,
  is_print_available boolean not null default true,
  price_tier_id text,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tx_ref text not null unique,
  provider text not null,
  image_code text not null references public.photographs(image_code) on update cascade,
  size_id text not null,
  customer_email text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  payment_status text not null default 'paid',
  fulfillment_state text not null default 'pending_print_shipment',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists photographs_created_at_idx on public.photographs(created_at desc);
create index if not exists photographs_project_id_idx on public.photographs(project_id);
create index if not exists photographs_image_code_idx on public.photographs(image_code);
create index if not exists orders_tx_ref_idx on public.orders(tx_ref);
create index if not exists orders_image_code_idx on public.orders(image_code);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

alter table public.projects enable row level security;
alter table public.photographs enable row level security;
alter table public.orders enable row level security;

create policy "Public projects are readable" on public.projects for select using (true);
create policy "Public photographs are readable" on public.photographs for select using (true);

-- Orders and writes are intentionally service-role only. Do not create public insert/select policies.

insert into storage.buckets (id, name, public)
values ('archive', 'archive', true)
on conflict (id) do nothing;

create policy "Public archive objects are readable"
on storage.objects for select
using (bucket_id = 'archive');
