-- Schema additions for: ingredient carbs/fibre, Snacks (parallel to Drinks), snack log entries,
-- and per-account theme. 0001_init.sql is already applied live, so this ships as a new migration.

alter table ingredients
  add column carbs_per_100g numeric not null default 0,
  add column fibre_per_100g numeric not null default 0;

create table snacks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  calories numeric not null,
  protein numeric not null,
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table snacks enable row level security;
create policy "snacks_all_authenticated" on snacks for all using (auth.uid() is not null) with check (auth.uid() is not null);
create trigger set_updated_at before update on snacks for each row execute function set_updated_at();

alter table log_entries drop constraint log_entries_type_check;
alter table log_entries add constraint log_entries_type_check check (type in ('meal', 'drink', 'snack'));

alter table profiles
  add column theme text not null default 'green' check (theme in ('green', 'pink'));
