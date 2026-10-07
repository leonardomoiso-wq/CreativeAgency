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
drop policy if exists "media brand moodboard insert" on storage.objects;
create policy "media brand moodboard insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'moodboard'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ---------- bacheca: location, agenzie, volti, crew ----------

create table if not exists public.board_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'location'
    check (kind in ('location', 'agenzia', 'volto', 'crew', 'backstage')),
  title text not null,
  subtitle text not null default '',
  city text not null default '',
  description text not null default '',
  image_url text,
  link text,
  available boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- candidature dei brand ----------

-- Un gruppo è l'abbinamento creativo: i brand che scattano insieme,
-- in una location, con una moodboard comune.
create table if not exists public.brand_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  concept text not null default '',
  location_id uuid references public.board_items (id) on delete set null,
  date_label text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null check (char_length(email) between 3 and 320),
  kind text not null default 'brand'
    check (kind in ('brand', 'negozio', 'atelier', 'designer')),
  brand_name text not null check (char_length(brand_name) between 1 and 200),
  city text not null default '' check (char_length(city) <= 200),
  website text not null default '' check (char_length(website) <= 500),
  category text not null default '' check (char_length(category) <= 200),
  pieces text not null default '' check (char_length(pieces) <= 200),
  keywords text not null default '' check (char_length(keywords) <= 500),
  location_ids uuid[] not null default '{}',
  message text not null default '' check (char_length(message) <= 4000),
  status text not null default 'ricevuta'
    check (status in ('ricevuta', 'valutazione', 'abbinamento', 'moodboard',
                      'confermata', 'scattata', 'consegnata', 'non_selezionata')),
  group_id uuid references public.brand_groups (id) on delete set null,
  team_note text not null default ''
);

create index if not exists applications_email_idx on public.applications (lower(email));
create index if not exists applications_group_idx on public.applications (group_id);

create table if not exists public.moodboard_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.brand_groups (id) on delete cascade,
  application_id uuid references public.applications (id) on delete cascade,
  image_url text not null,
  caption text not null default '' check (char_length(caption) <= 300),
  created_at timestamptz not null default now()
);

-- Email di chi ha fatto login (minuscola), per collegare le candidature.
create or replace function public.my_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.in_group(g uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.applications
    where group_id = g and lower(email) = public.my_email()
  );
$$;

create or replace function public.owns_application(a uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.applications
    where id = a and lower(email) = public.my_email()
  );
$$;

-- I brand dello stesso gruppo: solo nome, tipo, categoria e sito.
create or replace function public.group_brands(g uuid)
returns table (brand_name text, kind text, category text, website text, city text)
language sql
stable
security definer
set search_path = public
as $$
  select a.brand_name, a.kind, a.category, a.website, a.city
  from public.applications a
  where a.group_id = g
    and a.status <> 'non_selezionata'
    and (public.in_group(g) or public.is_admin())
  order by a.created_at;
$$;

grant select on public.board_items to anon, authenticated;
grant insert on public.applications to anon, authenticated;
grant all on public.board_items, public.brand_groups, public.applications, public.moodboard_items to authenticated;
grant execute on function public.group_brands(uuid) to authenticated;

alter table public.board_items enable row level security;
alter table public.brand_groups enable row level security;
alter table public.applications enable row level security;
alter table public.moodboard_items enable row level security;

drop policy if exists "board public read" on public.board_items;
create policy "board public read" on public.board_items for select using (true);
drop policy if exists "board admin write" on public.board_items;
create policy "board admin write" on public.board_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- candidature: chiunque ne invia una, il brand legge le proprie, il team tutto
drop policy if exists "applications anyone insert" on public.applications;
create policy "applications anyone insert" on public.applications
  for insert to anon, authenticated
  with check (status = 'ricevuta' and group_id is null and team_note = '');
drop policy if exists "applications read own" on public.applications;
create policy "applications read own" on public.applications
  for select to authenticated using (lower(email) = public.my_email());
drop policy if exists "applications admin all" on public.applications;
create policy "applications admin all" on public.applications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "groups read members" on public.brand_groups;
create policy "groups read members" on public.brand_groups
  for select to authenticated using (public.in_group(id) or public.is_admin());
drop policy if exists "groups admin write" on public.brand_groups;
create policy "groups admin write" on public.brand_groups
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- moodboard: i brand del gruppo la vedono e aggiungono i propri riferimenti
drop policy if exists "moodboard read members" on public.moodboard_items;
create policy "moodboard read members" on public.moodboard_items
  for select to authenticated using (public.in_group(group_id) or public.is_admin());
drop policy if exists "moodboard brand insert" on public.moodboard_items;
create policy "moodboard brand insert" on public.moodboard_items
  for insert to authenticated
  with check (
    application_id is not null
    and public.owns_application(application_id)
    and public.in_group(group_id)
  );
drop policy if exists "moodboard brand delete" on public.moodboard_items;
create policy "moodboard brand delete" on public.moodboard_items
  for delete to authenticated
  using (application_id is not null and public.owns_application(application_id));
drop policy if exists "moodboard admin all" on public.moodboard_items;
create policy "moodboard admin all" on public.moodboard_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- testi del sito e ordinamento ----------

-- Ogni blocco di testo ha tre livelli di lettura: occhiello, titolo, testo.
-- Un campo vuoto lascia sul sito il testo predefinito.
create table if not exists public.site_texts (
  key text primary key check (char_length(key) <= 80),
  kicker text not null default '' check (char_length(kicker) <= 300),
  title text not null default '' check (char_length(title) <= 500),
  body text not null default '' check (char_length(body) <= 4000),
  updated_at timestamptz not null default now()
);

alter table public.projects add column if not exists position int not null default 0;

grant select on public.site_texts to anon, authenticated;
grant all on public.site_texts to authenticated;
alter table public.site_texts enable row level security;

drop policy if exists "texts public read" on public.site_texts;
create policy "texts public read" on public.site_texts for select using (true);
drop policy if exists "texts admin write" on public.site_texts;
create policy "texts admin write" on public.site_texts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

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
