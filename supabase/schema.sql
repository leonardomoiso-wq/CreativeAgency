-- Schema del sito Open Call.
-- Da eseguire una volta in Supabase: SQL Editor > New query > incolla > Run.
-- Si può rieseguire senza danni: non cancella dati esistenti.

-- ---------- profili e ruoli ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'brand' check (role in ('admin', 'brand')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Chi si era già registrato prima di questo script.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- contenuti ----------

create table if not exists public.open_calls (
  id uuid primary key default gen_random_uuid(),
  number int not null unique,
  concept text not null default '',
  date_label text not null default '',
  location text not null default '',
  casting_label text not null default '',
  threshold int not null default 4,
  closes_label text not null default '',
  deposit_label text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  open_call_id uuid not null references public.open_calls (id) on delete cascade,
  name text not null,
  position int not null default 0,
  taken boolean not null default false
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  open_call_id uuid not null references public.open_calls (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  brand_name text not null check (char_length(brand_name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  website text check (char_length(website) <= 500),
  message text check (char_length(message) <= 4000),
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  bio text not null default '',
  instagram text,
  photo_url text,
  position int not null default 0,
  credits jsonb not null default '[]'::jsonb
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client text not null default '',
  year text not null default '',
  kind text not null default 'shared' check (kind in ('styling', 'foto', 'shared')),
  credit text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);

-- ---------- permessi ----------

grant usage on schema public to anon, authenticated;
grant select on public.open_calls, public.categories, public.team_members, public.projects to anon, authenticated;
grant insert on public.bookings to anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.open_calls, public.categories, public.bookings, public.team_members, public.projects, public.profiles to authenticated;

alter table public.profiles enable row level security;
alter table public.open_calls enable row level security;
alter table public.categories enable row level security;
alter table public.bookings enable row level security;
alter table public.team_members enable row level security;
alter table public.projects enable row level security;

-- profili: ognuno vede il proprio, il team vede e gestisce tutti
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles admin write" on public.profiles;
create policy "profiles admin write" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- open call: tutti leggono quelle pubblicate, il team gestisce
drop policy if exists "open_calls public read" on public.open_calls;
create policy "open_calls public read" on public.open_calls
  for select using (published or public.is_admin());
drop policy if exists "open_calls admin write" on public.open_calls;
create policy "open_calls admin write" on public.open_calls
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- categorie, team, portfolio: lettura pubblica, scrittura del team
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);
drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "team public read" on public.team_members;
create policy "team public read" on public.team_members for select using (true);
drop policy if exists "team admin write" on public.team_members;
create policy "team admin write" on public.team_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "projects public read" on public.projects;
create policy "projects public read" on public.projects for select using (true);
drop policy if exists "projects admin write" on public.projects;
create policy "projects admin write" on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- richieste dei brand: chiunque può inviarne una, solo il team le legge
drop policy if exists "bookings anyone insert" on public.bookings;
create policy "bookings anyone insert" on public.bookings
  for insert to anon, authenticated with check (status = 'new');
drop policy if exists "bookings admin all" on public.bookings;
create policy "bookings admin all" on public.bookings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- immagini ----------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');
drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ---------- contenuti iniziali (solo se le tabelle sono vuote) ----------

do $$
declare
  call_id uuid;
begin
  if not exists (select 1 from public.open_calls) then
    insert into public.open_calls
      (number, concept, date_label, location, casting_label, threshold, closes_label, deposit_label, published)
    values
      (1, '[CONCEPT DELLA PRODUZIONE]', '[DATA]', '[LOCATION, CITTÀ]', '[N] modelle · [N] set', 4, '[DATA]', '[IMPORTO]', true)
    returning id into call_id;

    insert into public.categories (open_call_id, name, position) values
      (call_id, 'Abbigliamento donna', 0),
      (call_id, 'Gioielli', 1),
      (call_id, 'Borse e accessori', 2),
      (call_id, 'Calzature', 3),
      (call_id, 'Occhiali', 4),
      (call_id, 'Beachwear', 5);
  end if;

  if not exists (select 1 from public.team_members) then
    insert into public.team_members (name, role, bio, position) values
      ('[NOME STYLIST]', 'Styling e direzione dei look', '[Bio della stylist.]', 0),
      ('[NOME FOTOGRAFO]', 'Fotografia', '[Bio del fotografo.]', 1),
      ('[NOME]', 'Produzione e rapporto con i brand', '[Bio di chi coordina la produzione.]', 2);
  end if;
end $$;
