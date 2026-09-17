/**
 * Meal icons are plain emoji rather than a bundled icon library: the app already uses emoji as
 * its entire icon language (nav tabs, profile avatars, the drink button), Unicode's food/drink
 * coverage genuinely is "a wild variety" on its own, and it costs zero bundle size or CDN/font
 * loading — consistent with this app's offline-first, no-external-asset stance since Stage 1.
 */
export const DEFAULT_MEAL_ICON = '🍽️';

/** Curated, grouped-by-theme option set for the icon picker. Not exhaustive — easy to extend. */
export const MEAL_ICON_OPTIONS: string[] = [
  // Meat & protein
  '🥩', '🍗', '🍖', '🥓', '🍤', '🥚', '🍳', '🌭',
  // Carbs & grains
  '🍚', '🍞', '🥖', '🥯', '🥞', '🧇', '🍝', '🥐',
  // Soups & one-pot
  '🍲', '🍜', '🥘',
  // Veggies & salads
  '🥗', '🥦', '🥕', '🌽', '🥑', '🍅',
  // Fast food
  '🍔', '🍕', '🌮', '🌯', '🥙', '🧆', '🍟', '🥪',
  // Asian
  '🍣', '🍱', '🍙', '🥟', '🍥',
  // Dairy & breakfast
  '🧀', '🥛', '🍯',
  // Desserts & sweets
  '🍰', '🎂', '🍩', '🍪', '🍫', '🍦', '🍨', '🍮', '🍭',
  // Fruits
  '🍎', '🍌', '🍇', '🍓', '🍉', '🍑',
  // Coffee & hot drinks
  '☕', '🍵', '🧋',
  // Cold & soft drinks
  '🥤', '🧃',
  // Alcohol & cocktails
  '🍺', '🍻', '🍷', '🥂', '🍸', '🍹', '🥃', '🍾', '🧉',
];
