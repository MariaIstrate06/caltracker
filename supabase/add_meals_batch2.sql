-- Adds 7 new meals. Safe to re-run (each insert is guarded against duplicates by name).
-- Note: Supă cremă de ciuperci/roșii/dovleac and their ingredient breakdowns were not
-- specified — these are reasonable recipes built from ingredients already in the library,
-- adjust amounts/ingredients in Manage if you had something more specific in mind.
begin;

-- New ingredients (researched per-100g values), only inserted if not already present.
insert into ingredients (name, calories_per_100g, protein_per_100g, carbs_per_100g, fibre_per_100g)
select v.name, v.calories_per_100g, v.protein_per_100g, v.carbs_per_100g, v.fibre_per_100g
from (
  values
    ('Chiftelute de pui', 200, 18, 5, 0.3),      -- cooked chicken meatballs
    ('Ciuperci', 22, 3.1, 3.3, 1),                -- raw button mushrooms
    ('Dovleac', 26, 1, 6.5, 0.5),                 -- raw pumpkin
    ('Carne tocată de pui', 143, 17, 0, 0)        -- raw ground chicken (mixed meat)
) as v(name, calories_per_100g, protein_per_100g, carbs_per_100g, fibre_per_100g)
where not exists (select 1 from ingredients i where i.name = v.name);

-- New meals, only inserted if not already present.
insert into meals (name, category, icon)
select v.name, v.category, v.icon
from (
  values
    ('Orez cu pui', 'lunch', '🍚'),
    ('Orez cu ton', 'lunch', '🍚'),
    ('Paste cu chiftelute de pui', 'dinner', '🍝'),
    ('Supă cremă de ciuperci', 'lunch', '🍲'),
    ('Supă cremă de roșii', 'lunch', '🍲'),
    ('Supă cremă de dovleac', 'lunch', '🍲'),
    ('Chili con carne cu pui', 'dinner', '🍲')
) as v(name, category, icon)
where not exists (select 1 from meals m where m.name = v.name);

-- Ingredient lists for each new meal, matched by name; skips a pairing if it already exists.
insert into meal_items (meal_id, ingredient_id, amount_grams)
select m.id, i.id, x.amount_grams
from (
  values
    ('Orez cu pui', 'Piept de pui', 150),
    ('Orez cu pui', 'Orez alb (greutate uscată)', 60),

    ('Orez cu ton', 'Orez alb (greutate uscată)', 60),
    ('Orez cu ton', 'Ton la conservă în apă (scurs)', 120),

    ('Paste cu chiftelute de pui', 'Paste (uscate)', 80),
    ('Paste cu chiftelute de pui', 'Chiftelute de pui', 150),

    ('Supă cremă de ciuperci', 'Ciuperci', 200),
    ('Supă cremă de ciuperci', 'Ceapă roșie', 30),
    ('Supă cremă de ciuperci', 'Cartof', 100),
    ('Supă cremă de ciuperci', 'Lapte integral', 100),

    ('Supă cremă de roșii', 'Passata de roșii', 300),
    ('Supă cremă de roșii', 'Ceapă roșie', 30),
    ('Supă cremă de roșii', 'Lapte integral', 80),

    ('Supă cremă de dovleac', 'Dovleac', 250),
    ('Supă cremă de dovleac', 'Ceapă roșie', 30),
    ('Supă cremă de dovleac', 'Cartof', 100),
    ('Supă cremă de dovleac', 'Lapte integral', 100),

    ('Chili con carne cu pui', 'Carne tocată de pui', 150),
    ('Chili con carne cu pui', 'Fasole roșie (fiartă/conservă)', 120),
    ('Chili con carne cu pui', 'Passata de roșii', 100),
    ('Chili con carne cu pui', 'Ceapă roșie', 40),
    ('Chili con carne cu pui', 'Porumb (fiert/conservă)', 60)
) as x(meal_name, ingredient_name, amount_grams)
join meals m on m.name = x.meal_name
join ingredients i on i.name = x.ingredient_name
where not exists (
  select 1 from meal_items mi where mi.meal_id = m.id and mi.ingredient_id = i.id
);

commit;
