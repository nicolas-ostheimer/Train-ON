import { useCategories, labelFor, colorFor } from '../lib/categories'

/**
 * Zeigt eine Trainingskategorie als Chip. Label und Farbe stammen aus der
 * zentralen Kategorien-Tabelle (benutzerdefiniert). Existiert der Key nicht
 * mehr (z.B. nach Löschung), wird der Key selbst dezent angezeigt.
 */
export function CategoryBadge({ category }: { category: string }) {
  const cats = useCategories()
  const label = labelFor(cats, category)
  const color = colorFor(cats, category)

  if (color) {
    // Farbige Variante: getönter Hintergrund + farbiger Text, passend zum Dark-Design.
    return (
      <span
        className="chip"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {label}
      </span>
    )
  }
  return <span className="chip bg-surface-2 text-text-secondary">{label}</span>
}
