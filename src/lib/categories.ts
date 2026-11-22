import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Category } from '../db/types'
import { UNCATEGORIZED_KEY } from '../db/types'

/**
 * Zentraler Zugriff auf die benutzerdefinierten Trainingskategorien.
 * Liefert die Kategorien live aus der DB, nach Reihenfolge sortiert.
 * `undefined` während des ersten Ladens.
 */
export function useCategories(): Category[] | undefined {
  return useLiveQuery(async () => {
    const cats = await db.categories.toArray()
    return cats.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
  }, [])
}

/**
 * Ermittelt das Anzeige-Label für einen Kategorie-Key aus einer bereits
 * geladenen Kategorienliste. Fällt auf den Key selbst zurück, falls die
 * Kategorie (z.B. nach Löschung) nicht mehr existiert – so bleibt die
 * Anzeige aussagekräftig und es geht nichts verloren.
 */
export function labelFor(cats: Category[] | undefined, key: string): string {
  if (!key) return 'Ohne Kategorie'
  const c = cats?.find((x) => x.key === key)
  return c?.label ?? key
}

/** Liefert die optionale Farbe einer Kategorie. */
export function colorFor(cats: Category[] | undefined, key: string): string | undefined {
  return cats?.find((x) => x.key === key)?.color
}

export { UNCATEGORIZED_KEY }
