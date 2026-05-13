-- Million Pixels DB schema (Supabase / Postgres)
-- Run this in Supabase SQL editor before deploy.

create extension if not exists pgcrypto;

create table if not exists pixels (
  id          bigserial primary key,
  x           int not null,
  y           int not null,
  color       text not null default '#000000',
  link        text,
  owner_email text,
  owner_name  text,
  price_cents int not null,
  stripe_session_id text unique,
  paid        boolean not null default false,
  paid_at     timestamptz,
  referrer_code text,
  created_at  timestamptz not null default now(),
  unique (x, y)
);

create index if not exists pixels_paid_idx on pixels (paid) where paid = true;
create index if not exists pixels_owner_idx on pixels (owner_email);

create table if not exists buyers (
  email        text primary key,
  display_name text,
  pixel_count  int not null default 0,
  total_cents  bigint not null default 0,
  referral_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at   timestamptz not null default now()
);

create table if not exists referrals (
  code            text primary key,
  owner_email     text references buyers(email),
  click_count     int not null default 0,
  conversion_count int not null default 0,
  earned_cents    bigint not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists events (
  id         bigserial primary key,
  type       text not null,   -- 'pixel_view', 'checkout_start', 'purchase', 'referral_click'
  metadata   jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_type_time_idx on events (type, created_at desc);

-- Realtime publication so clients get live updates
alter publication supabase_realtime add table pixels;

-- Row level security: public read of paid pixels only
alter table pixels enable row level security;
create policy "public read paid pixels" on pixels
  for select using (paid = true);

alter table buyers enable row level security;
create policy "public read leaderboard" on buyers
  for select using (true);
