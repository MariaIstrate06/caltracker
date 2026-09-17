-- One-time cleanup for rows duplicated by an accidental double-run of seed.sql.
-- For each of ingredients/drinks/meals: keep the oldest row per name, repoint anything
-- that references a duplicate over to the kept row, then delete the duplicates.
begin;

-- Ingredients: repoint meal_items before deleting.
with ranked as (
  select id, name, updated_at, row_number() over (partition by name order by updated_at asc, id asc) as rn
  from ingredients
),
canonical as (
  select name, id as keep_id from ranked where rn = 1
),
dupes as (
  select r.id as dupe_id, c.keep_id
  from ranked r join canonical c on c.name = r.name
  where r.rn > 1
)
update meal_items mi
set ingredient_id = d.keep_id
from dupes d
where mi.ingredient_id = d.dupe_id;

with ranked as (
  select id, name, row_number() over (partition by name order by updated_at asc, id asc) as rn
  from ingredients
)
delete from ingredients where id in (select id from ranked where rn > 1);

-- Drinks: repoint log_entries before deleting.
with ranked as (
  select id, name, updated_at, row_number() over (partition by name order by updated_at asc, id asc) as rn
  from drinks
),
canonical as (
  select name, id as keep_id from ranked where rn = 1
),
dupes as (
  select r.id as dupe_id, c.keep_id
  from ranked r join canonical c on c.name = r.name
  where r.rn > 1
)
update log_entries le
set ref_id = d.keep_id
from dupes d
where le.type = 'drink' and le.ref_id = d.dupe_id;

with ranked as (
  select id, name, row_number() over (partition by name order by updated_at asc, id asc) as rn
  from drinks
)
delete from drinks where id in (select id from ranked where rn > 1);

-- Meals: repoint log_entries before deleting (meal_items of the deleted duplicate meals
-- cascade-delete automatically, which is correct — those are duplicate item sets).
with ranked as (
  select id, name, updated_at, row_number() over (partition by name order by updated_at asc, id asc) as rn
  from meals
),
canonical as (
  select name, id as keep_id from ranked where rn = 1
),
dupes as (
  select r.id as dupe_id, c.keep_id
  from ranked r join canonical c on c.name = r.name
  where r.rn > 1
)
update log_entries le
set ref_id = d.keep_id
from dupes d
where le.type = 'meal' and le.ref_id = d.dupe_id;

with ranked as (
  select id, name, row_number() over (partition by name order by updated_at asc, id asc) as rn
  from meals
)
delete from meals where id in (select id from ranked where rn > 1);

commit;
