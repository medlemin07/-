-- الإتحادية للنقل العمومي — المخطط الأساسي (PostgreSQL / Supabase)
create extension if not exists pgcrypto;

create type agency_status  as enum ('pending','approved','rejected','suspended');
create type trip_status    as enum ('open','closed','cancelled','completed');
create type booking_status as enum ('pending','confirmed','rejected','cancelled','expired');
create type payment_method as enum ('cash_agency','online');
create type payment_status as enum ('unpaid','paid','failed','refunded');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text, phone text,
  role text not null default 'traveler' check (role in ('traveler','agency_staff','admin')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null, phone text,
  status agency_status not null default 'pending',
  commission_bp int not null default 0 check (commission_bp between 0 and 10000),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table agency_staff (
  agency_id uuid references agencies on delete cascade,
  user_id uuid references profiles on delete cascade,
  primary key (agency_id, user_id)
);
create table cities (id uuid primary key default gen_random_uuid(), name_ar text not null unique, name_fr text);
create table routes (
  id uuid primary key default gen_random_uuid(),
  from_city uuid not null references cities, to_city uuid not null references cities,
  check (from_city <> to_city), unique (from_city, to_city)
);
create table trips (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies, route_id uuid not null references routes,
  departs_at timestamptz not null, arrives_at timestamptz,
  price_mru int not null check (price_mru > 0),       -- أوقية صحيحة
  capacity int not null check (capacity between 1 and 80),
  seat_selection boolean not null default false,
  amenities text[] not null default '{}',
  status trip_status not null default 'open',
  hold_minutes int not null default 180 check (hold_minutes between 15 and 1440),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (arrives_at is null or arrives_at > departs_at)
);
create index on trips (route_id, departs_at) where status = 'open';
create table bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  trip_id uuid not null references trips, user_id uuid references auth.users,
  passenger_name text not null, phone text not null,
  seats_count int not null check (seats_count between 1 and 8),
  total_mru int not null check (total_mru >= 0),
  status booking_status not null default 'pending',
  expires_at timestamptz, reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on bookings (trip_id, status);
create table booking_seats (
  booking_id uuid not null references bookings on delete cascade,
  trip_id uuid not null references trips, seat_no int not null check (seat_no > 0),
  active boolean not null default true,
  primary key (booking_id, seat_no)
);
-- يمنع حجز المقعد نفسه مرتين حتى مع الطلبات المتزامنة
create unique index booking_seats_one_active on booking_seats (trip_id, seat_no) where active;
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings, method payment_method not null,
  status payment_status not null default 'unpaid', amount_mru int not null check (amount_mru >= 0),
  provider_ref text unique,                           -- يمنع تكرار معالجة الإشعار نفسه
  recorded_by uuid references auth.users, created_at timestamptz not null default now()
);
create table booking_events (
  id bigserial primary key, booking_id uuid references bookings, actor uuid,
  event text not null, detail jsonb, created_at timestamptz not null default now()
);
