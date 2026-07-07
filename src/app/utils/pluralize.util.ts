/**
 * Lightweight English pluralizer for user-entered names (e.g. drink names on Home's
 * availability grid). Deliberately conservative: if the name doesn't end in a plain
 * letter (e.g. "Cola 0", "Espresso (double)"), it's left as-is rather than guessing
 * wrong — an unpluralized name always reads fine, a mangled one doesn't.
 */
export function pluralize(name: string): string {
  if (!/[a-zA-Z]$/.test(name)) {
    return name;
  }
  if (/(s|x|z|ch|sh)$/i.test(name)) {
    return `${name}es`;
  }
  if (/[^aeiou]y$/i.test(name)) {
    return `${name.slice(0, -1)}ies`;
  }
  return `${name}s`;
}
