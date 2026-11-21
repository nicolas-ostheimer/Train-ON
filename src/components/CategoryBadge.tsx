import { categoryLabel, type CategoryKey } from '../db/types'

const colors: Record<string, string> = {
  trial: 'bg-accent-soft text-accent',
  gym: 'bg-[#1e2b3a] text-[#6fb3ff]',
  ausdauer: 'bg-[#1e3326] text-[#5fd089]',
  sonstiges: 'bg-surface-2 text-text-secondary',
}

export function CategoryBadge({ category }: { category: CategoryKey | string }) {
  const cls = colors[category] ?? colors.sonstiges
  return <span className={`chip ${cls}`}>{categoryLabel(category)}</span>
}
