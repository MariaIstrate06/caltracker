export type DeletedEntityKind = 'ingredient' | 'meal' | 'drink' | 'snack';

/** Consistent fallback label for a reference (ingredient/meal/drink/snack id) that no longer resolves. */
export function deletedEntityLabel(kind: DeletedEntityKind): string {
  return `(deleted ${kind})`;
}
