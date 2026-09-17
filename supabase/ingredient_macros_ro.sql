-- One-time backfill of carbs/fibre (per 100g, same basis as the existing calories/protein
-- figures — raw/dry weight where applicable) for the existing seeded ingredients, using
-- standard nutrition-reference values. Run once, after 0002_ux_batch.sql.
-- Matches current names post-translation (see translate_ro.sql).

update ingredients set carbs_per_100g = 0,    fibre_per_100g = 0    where name = 'Piept de pui';
update ingredients set carbs_per_100g = 35,   fibre_per_100g = 3.5  where name = 'Cartofi prăjiți';
update ingredients set carbs_per_100g = 20,   fibre_per_100g = 2    where name = 'Cartofi congelați (la cuptor)';
update ingredients set carbs_per_100g = 2.9,  fibre_per_100g = 1.3  where name = 'Salată verde mix';
update ingredients set carbs_per_100g = 3,    fibre_per_100g = 0    where name = 'Sos de șaorma (usturoi)';
update ingredients set carbs_per_100g = 26,   fibre_per_100g = 0.3  where name = 'Ketchup';
update ingredients set carbs_per_100g = 55,   fibre_per_100g = 2.5  where name = 'Lipie';
update ingredients set carbs_per_100g = 0,    fibre_per_100g = 0    where name = 'Carne tocată de vită slabă, 5% grăsime (crudă)';
update ingredients set carbs_per_100g = 80,   fibre_per_100g = 1.3  where name = 'Orez alb (greutate uscată)';
update ingredients set carbs_per_100g = 3.4,  fibre_per_100g = 0    where name = 'Brânză cottage';
update ingredients set carbs_per_100g = 6.5,  fibre_per_100g = 2.8  where name = 'Ardei iute jalapeño';
update ingredients set carbs_per_100g = 83,   fibre_per_100g = 1.5  where name = 'Tăiței de orez (uscați)';
update ingredients set carbs_per_100g = 20,   fibre_per_100g = 6    where name = 'Unt de arahide';
update ingredients set carbs_per_100g = 5.6,  fibre_per_100g = 0.8  where name = 'Sos de soia';
update ingredients set carbs_per_100g = 3.6,  fibre_per_100g = 0.5  where name = 'Castravete';
update ingredients set carbs_per_100g = 50,   fibre_per_100g = 3    where name = 'Tortilla';
update ingredients set carbs_per_100g = 3.6,  fibre_per_100g = 0    where name = 'Iaurt grecesc (2%)';
update ingredients set carbs_per_100g = 3,    fibre_per_100g = 1.2  where name = 'Salată iceberg';
update ingredients set carbs_per_100g = 3.9,  fibre_per_100g = 1.2  where name = 'Roșie';
update ingredients set carbs_per_100g = 9.3,  fibre_per_100g = 1.7  where name = 'Ceapă roșie';
update ingredients set carbs_per_100g = 75,   fibre_per_100g = 3    where name = 'Paste (uscate)';
update ingredients set carbs_per_100g = 1,    fibre_per_100g = 0    where name = 'Burrata';
update ingredients set carbs_per_100g = 4,    fibre_per_100g = 1.5  where name = 'Pesto';
update ingredients set carbs_per_100g = 17,   fibre_per_100g = 2.2  where name = 'Cartof';
update ingredients set carbs_per_100g = 22.8, fibre_per_100g = 6.4  where name = 'Fasole roșie (fiartă/conservă)';
update ingredients set carbs_per_100g = 5,    fibre_per_100g = 1.3  where name = 'Passata de roșii';
update ingredients set carbs_per_100g = 4.8,  fibre_per_100g = 0    where name = 'Lapte integral';
update ingredients set carbs_per_100g = 8.5,  fibre_per_100g = 6.7  where name = 'Avocado';
update ingredients set carbs_per_100g = 19,   fibre_per_100g = 2.2  where name = 'Porumb (fiert/conservă)';
update ingredients set carbs_per_100g = 0,    fibre_per_100g = 0    where name = 'Ton la conservă în apă (scurs)';
update ingredients set carbs_per_100g = 23.4, fibre_per_100g = 11.8 where name = 'Semințe de susan';
update ingredients set carbs_per_100g = 4,    fibre_per_100g = 0    where name = 'Cremă de brânză Philadelphia';
