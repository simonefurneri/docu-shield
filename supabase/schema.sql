-- ==============================================================================
-- Schema Supabase per DocuShield: Gestione Profili, Crediti e Abbonamenti Pro
-- ==============================================================================

-- 1. Tabella profiles collegata ad auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  credits integer not null default 1,
  is_pro boolean not null default false,
  stripe_customer_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Abilita Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policy RLS: l'utente può leggere solo il proprio profilo
create policy "Gli utenti possono leggere il proprio profilo"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy RLS: l'utente può aggiornare il proprio profilo (es. campi non sensibili)
create policy "Gli utenti possono aggiornare il proprio profilo"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Trigger automatico per creare il profilo con 1 credito gratuito all'iscrizione
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, credits, is_pro)
  values (
    new.id,
    new.email,
    1, -- 1 analisi gratuita iniziale
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Collega il trigger alla tabella auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Funzione helper sicura per incrementare crediti (eseguibile da backend service role)
create or replace function public.increment_credits(user_id uuid, amount int)
returns void as $$
begin
  update public.profiles
  set credits = credits + amount,
      updated_at = timezone('utc'::text, now())
  where id = user_id;
end;
$$ language plpgsql security definer;

-- Funzione helper sicura per decrementare 1 credito all'analisi
create or replace function public.decrement_credit(user_id uuid)
returns boolean as $$
declare
  user_credits int;
  user_is_pro boolean;
begin
  select credits, is_pro into user_credits, user_is_pro
  from public.profiles
  where id = user_id;

  if user_is_pro then
    return true;
  end if;

  if user_credits > 0 then
    update public.profiles
    set credits = credits - 1,
        updated_at = timezone('utc'::text, now())
    where id = user_id;
    return true;
  else
    return false;
  end if;
end;
$$ language plpgsql security definer;
