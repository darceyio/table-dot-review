-- Create enums for the platform
create type user_role as enum ('admin','owner','manager','server','customer');
create type tip_source as enum ('stripe','cash','crypto');
create type tip_status as enum ('pending','succeeded','failed','refunded');
create type review_sentiment as enum ('positive','neutral','negative');

-- app_user: Global user record linked 1:1 with auth.users
create table app_user (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table app_user enable row level security;

-- org: Organisation (restaurant/café brand)
create table org (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country text,
  currency text default 'EUR',
  owner_user_id uuid references app_user(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table org enable row level security;

-- location: Physical location of an org
create table location (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references org(id) on delete cascade,
  name text not null,
  address text,
  timezone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table location enable row level security;

-- server_profile: Global portable staff identity
create table server_profile (
  server_id uuid primary key references app_user(id) on delete cascade,
  bio text,
  global_wallet_address text,
  created_at timestamptz default now()
);

alter table server_profile enable row level security;

-- server_assignment: Server ↔ org relationship (time-bound)
create table server_assignment (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references server_profile(server_id) on delete cascade,
  org_id uuid not null references org(id) on delete cascade,
  location_id uuid references location(id) on delete set null,
  display_name_override text,
  payout_wallet_address text,
  stripe_connect_id text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  is_active boolean default true
);

create index server_assignment_org_idx on server_assignment(org_id);

alter table server_assignment enable row level security;

-- qr_code: Entry point for guests
create table qr_code (
  id uuid primary key default gen_random_uuid(),
  server_assignment_id uuid not null references server_assignment(id) on delete cascade,
  code text not null unique,
  deep_link_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table qr_code enable row level security;

-- customer_session: Lightweight anon sessions
create table customer_session (
  id uuid primary key default gen_random_uuid(),
  fingerprint_hash text,
  last_seen_at timestamptz default now()
);

alter table customer_session enable row level security;

-- tip: Monetary events
create table tip (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references org(id) on delete cascade,
  location_id uuid references location(id) on delete set null,
  server_id uuid not null references server_profile(server_id) on delete cascade,
  server_assignment_id uuid not null references server_assignment(id) on delete cascade,
  customer_session_id uuid references customer_session(id) on delete set null,
  source tip_source not null,
  amount_cents int not null,
  currency text not null default 'EUR',
  status tip_status not null default 'pending',
  stripe_payment_intent_id text,
  platform_fee_cents int default 0,
  received_at timestamptz,
  created_at timestamptz default now()
);

create index tip_org_created_idx on tip(org_id, created_at desc);
create index tip_server_idx on tip(server_id);

alter table tip enable row level security;

-- review: Contextual feedback linked to server & assignment
create table review (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references org(id) on delete cascade,
  location_id uuid references location(id) on delete set null,
  server_id uuid not null references server_profile(server_id) on delete cascade,
  server_assignment_id uuid not null references server_assignment(id) on delete cascade,
  customer_session_id uuid references customer_session(id) on delete set null,
  sentiment review_sentiment not null,
  text text,
  photo_urls jsonb default '[]',
  is_anonymous boolean default true,
  contact_email text,
  contact_phone text,
  linked_tip_id uuid references tip(id) on delete set null,
  created_at timestamptz default now()
);

create index review_org_created_idx on review(org_id, created_at desc);
create index review_server_idx on review(server_id);

alter table review enable row level security;

-- owner_setting: Org-level config
create table owner_setting (
  id uuid primary key default gen_random_uuid(),
  org_id uuid unique not null references org(id) on delete cascade,
  email_alerts boolean default true,
  neg_review_threshold int default 1,
  digest_time time default '09:00'
);

alter table owner_setting enable row level security;

-- Security definer function to check user role (prevents RLS recursion)
create or replace function public.get_user_role(_user_id uuid)
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.app_user where id = _user_id;
$$;

-- Security definer function to check if user owns org
create or replace function public.user_owns_org(_user_id uuid, _org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org 
    where id = _org_id and owner_user_id = _user_id
  );
$$;

-- RLS Policies for app_user
create policy "Users can view their own profile"
  on app_user for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on app_user for select
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Admins can update all profiles"
  on app_user for update
  using (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for org
create policy "Admins can view all orgs"
  on org for select
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Owners can view their orgs"
  on org for select
  using (owner_user_id = auth.uid());

create policy "Admins can insert orgs"
  on org for insert
  with check (public.get_user_role(auth.uid()) = 'admin');

create policy "Admins can update orgs"
  on org for update
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Owners can update their orgs"
  on org for update
  using (owner_user_id = auth.uid());

-- RLS Policies for location
create policy "Admins can view all locations"
  on location for select
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Owners can view their locations"
  on location for select
  using (public.user_owns_org(auth.uid(), org_id));

create policy "Admins can manage locations"
  on location for all
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Owners can manage their locations"
  on location for all
  using (public.user_owns_org(auth.uid(), org_id));

-- RLS Policies for server_profile
create policy "Users can view their own server profile"
  on server_profile for select
  using (server_id = auth.uid());

create policy "Admins can view all server profiles"
  on server_profile for select
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Servers can insert their own profile"
  on server_profile for insert
  with check (server_id = auth.uid());

create policy "Servers can update their own profile"
  on server_profile for update
  using (server_id = auth.uid());

-- RLS Policies for server_assignment
create policy "Admins can view all assignments"
  on server_assignment for select
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Owners can view assignments for their orgs"
  on server_assignment for select
  using (public.user_owns_org(auth.uid(), org_id));

create policy "Servers can view their own assignments"
  on server_assignment for select
  using (server_id = auth.uid());

create policy "Admins can manage all assignments"
  on server_assignment for all
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Owners can manage assignments for their orgs"
  on server_assignment for all
  using (public.user_owns_org(auth.uid(), org_id));

-- RLS Policies for qr_code
create policy "Admins can view all QR codes"
  on qr_code for select
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Owners can view QR codes for their orgs"
  on qr_code for select
  using (
    exists (
      select 1 from server_assignment sa
      where sa.id = server_assignment_id
      and public.user_owns_org(auth.uid(), sa.org_id)
    )
  );

-- RLS Policies for tip
create policy "Admins can view all tips"
  on tip for select
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Owners can view tips for their orgs"
  on tip for select
  using (public.user_owns_org(auth.uid(), org_id));

create policy "Servers can view their own tips"
  on tip for select
  using (server_id = auth.uid());

-- TODO: Public insert via Edge Function (service role)

-- RLS Policies for review
create policy "Admins can view all reviews"
  on review for select
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Owners can view reviews for their orgs"
  on review for select
  using (public.user_owns_org(auth.uid(), org_id));

create policy "Servers can view their own reviews"
  on review for select
  using (server_id = auth.uid());

-- TODO: Public insert via Edge Function (service role)

-- RLS Policies for owner_setting
create policy "Owners can view their org settings"
  on owner_setting for select
  using (public.user_owns_org(auth.uid(), org_id));

create policy "Owners can update their org settings"
  on owner_setting for update
  using (public.user_owns_org(auth.uid(), org_id));

create policy "Admins can manage all settings"
  on owner_setting for all
  using (public.get_user_role(auth.uid()) = 'admin');

-- Trigger to auto-create app_user on auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_user (id, role, display_name)
  values (
    new.id,
    'customer', -- default role, admin must promote users
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at triggers
create trigger update_org_updated_at
  before update on org
  for each row execute procedure public.update_updated_at_column();

create trigger update_location_updated_at
  before update on location
  for each row execute procedure public.update_updated_at_column();