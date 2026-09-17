-- Per-account picks for Home's "Drinks & snacks available" card, replacing the old
-- hardcoded featured-drinks list. Empty by default — the card just stays hidden until
-- the user picks something in Settings.
alter table profiles
  add column featured_drink_ids uuid[] not null default '{}',
  add column featured_snack_ids uuid[] not null default '{}';
