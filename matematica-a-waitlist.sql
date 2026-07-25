-- Lista de espera das Explicações de Matemática A (individuais com o Alin).
-- Correr uma vez no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

create table if not exists matematica_a_waitlist (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text not null unique,
  phone text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matematica_a_waitlist_created_idx on matematica_a_waitlist (created_at desc);
