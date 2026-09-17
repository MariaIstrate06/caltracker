-- One-time seed for the shared ingredients/meals/drinks library. Run once against a fresh
-- project (Supabase Dashboard -> SQL Editor), after 0001_init.sql and 0002_ux_batch.sql.
begin;

-- Hard guard: abort if this has already been run, instead of silently inserting duplicates.
do $$
begin
  if exists (select 1 from ingredients) or exists (select 1 from drinks) or exists (select 1 from meals) then
    raise exception 'seed.sql already applied — ingredients/drinks/meals is non-empty. Aborting to avoid duplicating rows.';
  end if;
end $$;

create temporary table _seed_ingredients (
  slug text primary key,
  id uuid not null default gen_random_uuid(),
  name text not null,
  calories_per_100g numeric not null,
  protein_per_100g numeric not null,
  carbs_per_100g numeric not null,
  fibre_per_100g numeric not null
) on commit drop;

insert into _seed_ingredients (slug, name, calories_per_100g, protein_per_100g, carbs_per_100g, fibre_per_100g) values
  ('chicken-breast-raw', 'Piept de pui', 165, 31, 0, 0),
  ('cartofi-prajiti', 'Cartofi prăjiți', 292, 3.4, 35, 3.5),
  ('frozen-fries-baked', 'Cartofi congelați (la cuptor)', 120, 2, 20, 2),
  ('salata-mix', 'Salată verde mix', 15, 1.4, 2.9, 1.3),
  ('sos-saorma', 'Sos de șaorma (usturoi)', 550, 1, 3, 0),
  ('ketchup', 'Ketchup', 100, 1.2, 26, 0.3),
  ('lipie', 'Lipie', 275, 9, 55, 2.5),
  ('ground-beef-lean-5', 'Carne tocată de vită slabă, 5% grăsime (crudă)', 137, 21, 0, 0),
  ('white-rice-dry', 'Orez alb (greutate uscată)', 365, 7.1, 80, 1.3),
  ('cottage-cheese', 'Brânză cottage', 98, 11, 3.4, 0),
  ('jalapeno', 'Ardei iute jalapeño', 29, 0.9, 6.5, 2.8),
  ('rice-noodles-dry', 'Tăiței de orez (uscați)', 364, 6, 83, 1.5),
  ('peanut-butter', 'Unt de arahide', 588, 25, 20, 6),
  ('soy-sauce', 'Sos de soia', 60, 6, 5.6, 0.8),
  ('cucumber', 'Castravete', 15, 0.7, 3.6, 0.5),
  ('wrap', 'Tortilla', 275, 8, 50, 3),
  ('greek-yogurt-2pct', 'Iaurt grecesc (2%)', 73, 9, 3.6, 0),
  ('lettuce-iceberg', 'Salată iceberg', 14, 0.9, 3, 1.2),
  ('tomato', 'Roșie', 18, 0.9, 3.9, 1.2),
  ('red-onion', 'Ceapă roșie', 40, 1.1, 9.3, 1.7),
  ('pasta-dry', 'Paste (uscate)', 371, 13, 75, 3),
  ('burrata', 'Burrata', 260, 15, 1, 0),
  ('pesto', 'Pesto', 450, 4, 4, 1.5),
  ('potato-raw', 'Cartof', 77, 2, 17, 2.2),
  ('kidney-beans-cooked', 'Fasole roșie (fiartă/conservă)', 127, 8.7, 22.8, 6.4),
  ('tomato-passata', 'Passata de roșii', 32, 1.6, 5, 1.3),
  ('milk-whole', 'Lapte integral', 61, 3.2, 4.8, 0),
  ('avocado', 'Avocado', 160, 2, 8.5, 6.7),
  ('corn-cooked', 'Porumb (fiert/conservă)', 86, 3.2, 19, 2.2),
  ('tuna-canned-water', 'Ton la conservă în apă (scurs)', 116, 26, 0, 0),
  ('sesame-seeds', 'Semințe de susan', 573, 18, 23.4, 11.8),
  ('philadelphia-cream-cheese', 'Cremă de brânză Philadelphia', 342, 5.9, 4, 0);

insert into ingredients (id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fibre_per_100g)
select id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fibre_per_100g from _seed_ingredients;

insert into drinks (name, calories, protein) values
  ('Pepsi Twist', 139, 0),
  ('Pepsi Max', 1, 0),
  ('Cola Zero', 1, 0),
  ('Cola', 139, 0),
  ('Espresso tonic', 65, 0.3),
  ('Bere', 215, 1.8),
  ('Pahar de vin', 125, 0.1),
  ('Flat white', 140, 6),
  ('Espresso', 2, 0.1),
  ('Espresso (dublu)', 4, 0.2),
  ('Cortado', 48, 2.5),
  ('Gin Tonic', 220, 0);

create temporary table _seed_meals (
  slug text primary key,
  id uuid not null default gen_random_uuid(),
  name text not null,
  category text not null,
  icon text not null
) on commit drop;

insert into _seed_meals (slug, name, category, icon) values
  ('shaorma', 'Șaorma', 'lunch', '🌯'),
  ('beef-rice', 'Vită cu orez', 'lunch', '🥘'),
  ('chicken-soy-noodles', 'Tăiței cu pui și sos de soia', 'dinner', '🍜'),
  ('chicken-shawarma-wrap', 'Wrap cu pui shaorma', 'lunch', '🌯'),
  ('chicken-fries-tomato-salad', 'Pui cu cartofi prăjiți și salată de roșii', 'dinner', '🍗'),
  ('pesto-pasta-burrata', 'Paste cu pesto și burrata', 'dinner', '🍝'),
  ('beef-airfried-potatoes', 'Vită cu cartofi la air fryer', 'dinner', '🥩'),
  ('chili-con-carne-rice', 'Chili con carne cu orez', 'dinner', '🍲'),
  ('mashed-potatoes-chicken', 'Piure de cartofi cu pui', 'dinner', '🍗'),
  ('burger-bowl', 'Bol burger', 'lunch', '🍔'),
  ('cucumber-tuna-salad', 'Salată de castraveți cu ton', 'lunch', '🥗'),
  ('cucumber-philadelphia-salad', 'Salată de castraveți cu Philadelphia', 'snack', '🥗');

insert into meals (id, name, category, icon)
select id, name, category, icon from _seed_meals;

insert into meal_items (meal_id, ingredient_id, amount_grams)
select m.id, i.id, x.amount_grams
from (values
  ('shaorma', 'chicken-breast-raw', 110),
  ('shaorma', 'cartofi-prajiti', 100),
  ('shaorma', 'salata-mix', 100),
  ('shaorma', 'sos-saorma', 50),
  ('shaorma', 'ketchup', 50),
  ('shaorma', 'lipie', 60),

  ('beef-rice', 'ground-beef-lean-5', 120),
  ('beef-rice', 'white-rice-dry', 40),
  ('beef-rice', 'cottage-cheese', 100),
  ('beef-rice', 'jalapeno', 20),

  ('chicken-soy-noodles', 'chicken-breast-raw', 150),
  ('chicken-soy-noodles', 'rice-noodles-dry', 45),
  ('chicken-soy-noodles', 'peanut-butter', 15),
  ('chicken-soy-noodles', 'soy-sauce', 15),
  ('chicken-soy-noodles', 'cucumber', 150),

  ('chicken-shawarma-wrap', 'chicken-breast-raw', 150),
  ('chicken-shawarma-wrap', 'wrap', 60),
  ('chicken-shawarma-wrap', 'greek-yogurt-2pct', 100),
  ('chicken-shawarma-wrap', 'lettuce-iceberg', 80),
  ('chicken-shawarma-wrap', 'tomato', 80),
  ('chicken-shawarma-wrap', 'red-onion', 30),

  ('chicken-fries-tomato-salad', 'chicken-breast-raw', 170),
  ('chicken-fries-tomato-salad', 'frozen-fries-baked', 150),
  ('chicken-fries-tomato-salad', 'tomato', 200),

  ('pesto-pasta-burrata', 'pasta-dry', 70),
  ('pesto-pasta-burrata', 'burrata', 75),
  ('pesto-pasta-burrata', 'pesto', 15),

  ('beef-airfried-potatoes', 'ground-beef-lean-5', 150),
  ('beef-airfried-potatoes', 'potato-raw', 220),

  ('chili-con-carne-rice', 'ground-beef-lean-5', 130),
  ('chili-con-carne-rice', 'kidney-beans-cooked', 100),
  ('chili-con-carne-rice', 'white-rice-dry', 40),
  ('chili-con-carne-rice', 'tomato-passata', 100),

  ('mashed-potatoes-chicken', 'chicken-breast-raw', 170),
  ('mashed-potatoes-chicken', 'potato-raw', 250),
  ('mashed-potatoes-chicken', 'milk-whole', 30),

  ('burger-bowl', 'ground-beef-lean-5', 120),
  ('burger-bowl', 'avocado', 70),
  ('burger-bowl', 'lettuce-iceberg', 100),
  ('burger-bowl', 'corn-cooked', 50),
  ('burger-bowl', 'red-onion', 30),
  ('burger-bowl', 'greek-yogurt-2pct', 80),

  ('cucumber-tuna-salad', 'tuna-canned-water', 120),
  ('cucumber-tuna-salad', 'cucumber', 250),
  ('cucumber-tuna-salad', 'greek-yogurt-2pct', 120),
  ('cucumber-tuna-salad', 'sesame-seeds', 10),
  ('cucumber-tuna-salad', 'soy-sauce', 15),

  ('cucumber-philadelphia-salad', 'cucumber', 250),
  ('cucumber-philadelphia-salad', 'philadelphia-cream-cheese', 120),
  ('cucumber-philadelphia-salad', 'soy-sauce', 15),
  ('cucumber-philadelphia-salad', 'sesame-seeds', 10)
) as x(meal_slug, ingredient_slug, amount_grams)
join _seed_meals m on m.slug = x.meal_slug
join _seed_ingredients i on i.slug = x.ingredient_slug;

commit;
