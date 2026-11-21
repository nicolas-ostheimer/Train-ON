import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

/** Zeigt den Namen einer Trainingsart als dezentes Chip, falls vorhanden. */
export function TrainingTypeBadge({ id }: { id?: string }) {
  const type = useLiveQuery(() => (id ? db.trainingTypes.get(id) : undefined), [id])
  if (!id || !type) return null
  return <span className="chip bg-surface-2 text-text-secondary">{type.name}</span>
}
