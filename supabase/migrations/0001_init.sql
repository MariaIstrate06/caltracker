-- Cal-Track schema: shared ingredients/meals/drinks library, private per-user logs and goals.
create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  emoji text not null default '🙂',
  daily_calorie_goal integer not null default 2000,
  daily_protein_goal integer not null default 120,
  updated_at timestamptz not null default now()
);

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  calories_per_100g numeric not null,
  protein_per_100g numeric not null,
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table drinks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  calories numeric not null,
  protein numeric not null,
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table meals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('breakfast', 'lunch', 'dinner', 'snack')),
  icon text,
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals(id) on delete cascade,
  -- nullable: deleting an ingredient must not block/cascade, matches the "(deleted ingredient)" fallback UX
  ingredient_id uuid references ingredients(id) on delete set null,
  amount_grams numeric not null
);
create index meal_items_meal_id_idx on meal_items(meal_id);

create table log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('meal', 'drink')),
  -- polymorphic reference to meals.id or drinks.id; deliberately no FK since it must
  -- tolerate a dangling reference after the underlying meal/drink is deleted
  ref_id uuid,
  name text,
  items_override jsonb,
  quantity integer,
  timestamp timestamptz not null default now(),
  computed_calories numeric not null,
  computed_protein numeric not null,
  updated_at timestamptz not null default now()
);
create index log_entries_user_date_idx on log_entries(user_id, date);

-- Auto-create the profile row when an account is provisioned (invite-only signup),
-- so a freshly invited user has a working profile with no client-side setup step.
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name) values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on profiles for each row execute function set_updated_at();
create trigger set_updated_at before update on ingredients for each row execute function set_updated_at();
create trigger set_updated_at before update on drinks for each row execute function set_updated_at();
create trigger set_updated_at before update on meals for each row execute function set_updated_at();
create trigger set_updated_at before update on log_entries for each row execute function set_updated_at();

alter table profiles enable row level security;
alter table ingredients enable row level security;
alter table drinks enable row level security;
alter table meals enable row level security;
alter table meal_items enable row level security;
alter table log_entries enable row level security;

-- profiles: strictly private to the owning account, no delete (the row is tied 1:1 to the auth user)
create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_insert_own" on profiles for insert with check (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- shared library: any authenticated user (you + your invited friends) can read/write the whole table.
-- Not restricted to created_by — this matches the app's current no-ownership-check behavior.
-- Tightening to `created_by = auth.uid()` later is a one-line policy change, not a schema change.
create policy "ingredients_all_authenticated" on ingredients for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "drinks_all_authenticated" on drinks for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "meals_all_authenticated" on meals for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "meal_items_all_authenticated" on meal_items for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- log_entries: strictly private to the logging account
create policy "log_entries_select_own" on log_entries for select using (user_id = auth.uid());
create policy "log_entries_insert_own" on log_entries for insert with check (user_id = auth.uid());
create policy "log_entries_update_own" on log_entries for update using (user_id = auth.uid());
create policy "log_entries_delete_own" on log_entries for delete using (user_id = auth.uid());
