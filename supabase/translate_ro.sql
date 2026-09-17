-- One-time translation of the shared library's names to Romanian. Run once in the SQL Editor
-- against your live project — safe to re-run (each WHERE only matches the original English name,
-- so a second run is a no-op once the names have changed).

-- Ingredients
update ingredients set name = 'Piept de pui' where name = 'Chicken breast (raw)';
update ingredients set name = 'Cartofi prăjiți' where name = 'Cartofi prăjiți (fried)';
update ingredients set name = 'Cartofi congelați (la cuptor)' where name = 'Frozen fries (baked)';
update ingredients set name = 'Salată verde mix' where name = 'Salată / mixed lettuce';
update ingredients set name = 'Sos de șaorma (usturoi)' where name = 'Sos șaorma (garlic sauce)';
update ingredients set name = 'Ketchup' where name = 'Ketchup';
update ingredients set name = 'Lipie' where name = 'Lipie (pita/flatbread)';
update ingredients set name = 'Carne tocată de vită slabă, 5% grăsime (crudă)' where name = 'Lean ground beef, 5% fat (raw)';
update ingredients set name = 'Orez alb (greutate uscată)' where name = 'White rice (dry weight)';
update ingredients set name = 'Brânză cottage' where name = 'Cottage cheese';
update ingredients set name = 'Ardei iute jalapeño' where name = 'Jalapeño';
update ingredients set name = 'Tăiței de orez (uscați)' where name = 'Rice noodles (dry)';
update ingredients set name = 'Unt de arahide' where name = 'Peanut butter';
update ingredients set name = 'Sos de soia' where name = 'Soy sauce';
update ingredients set name = 'Castravete' where name = 'Cucumber';
update ingredients set name = 'Tortilla' where name = 'Wrap (tortilla)';
update ingredients set name = 'Iaurt grecesc (2%)' where name = 'Greek yogurt (2%)';
update ingredients set name = 'Salată iceberg' where name = 'Iceberg lettuce';
update ingredients set name = 'Roșie' where name = 'Tomato';
update ingredients set name = 'Ceapă roșie' where name = 'Red onion';
update ingredients set name = 'Paste (uscate)' where name = 'Pasta (dry)';
update ingredients set name = 'Burrata' where name = 'Burrata';
update ingredients set name = 'Pesto' where name = 'Pesto';
update ingredients set name = 'Cartof' where name = 'Potato (raw)';
update ingredients set name = 'Fasole roșie (fiartă/conservă)' where name = 'Kidney beans (cooked/canned)';
update ingredients set name = 'Passata de roșii' where name = 'Tomato passata';
update ingredients set name = 'Lapte integral' where name = 'Milk, whole';
update ingredients set name = 'Avocado' where name = 'Avocado';
update ingredients set name = 'Porumb (fiert/conservă)' where name = 'Corn (cooked/canned)';
update ingredients set name = 'Ton la conservă în apă (scurs)' where name = 'Tuna, canned in water (drained)';
update ingredients set name = 'Semințe de susan' where name = 'Sesame seeds';
update ingredients set name = 'Cremă de brânză Philadelphia' where name = 'Philadelphia cream cheese';

-- Drinks
update drinks set name = 'Pepsi Twist' where name = 'Pepsi Twist';
update drinks set name = 'Pepsi Max' where name = 'Pepsi Max';
update drinks set name = 'Cola Zero' where name = 'Cola 0';
update drinks set name = 'Cola' where name = 'Cola';
update drinks set name = 'Espresso tonic' where name = 'Espresso tonic';
update drinks set name = 'Bere' where name = 'Beer';
update drinks set name = 'Pahar de vin' where name = 'Wine glass';
update drinks set name = 'Flat white' where name = 'Flat white';
update drinks set name = 'Espresso' where name = 'Espresso';
update drinks set name = 'Espresso (dublu)' where name = 'Espresso (double)';
update drinks set name = 'Cortado' where name = 'Cortado';
update drinks set name = 'Gin Tonic' where name = 'Gin & Tonic';

-- Meals
update meals set name = 'Șaorma' where name = 'Shaorma';
update meals set name = 'Vită cu orez' where name = 'Beef & Rice';
update meals set name = 'Tăiței cu pui și sos de soia' where name = 'Chicken Soy Noodles';
update meals set name = 'Wrap cu pui shaorma' where name = 'Chicken Shawarma Wrap';
update meals set name = 'Pui cu cartofi prăjiți și salată de roșii' where name = 'Chicken, Fries & Tomato Salad';
update meals set name = 'Paste cu pesto și burrata' where name = 'Pesto Pasta & Burrata';
update meals set name = 'Vită cu cartofi la air fryer' where name = 'Beef & Air-Fried Potatoes';
update meals set name = 'Chili con carne cu orez' where name = 'Chili con Carne & Rice';
update meals set name = 'Piure de cartofi cu pui' where name = 'Mashed Potatoes & Chicken';
update meals set name = 'Bol burger' where name = 'Burger Bowl';
update meals set name = 'Salată de castraveți cu ton' where name = 'Cucumber Tuna Salad';
update meals set name = 'Salată de castraveți cu Philadelphia' where name = 'Cucumber Philadelphia Salad';
