import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { CategoryKey } from '../db/types'
import { createTrainingType } from '../db/api'
import { IconPlus } from './icons'
import { useToast } from './Toast'

interface Props {
  category: CategoryKey
  value?: string // trainingTypeId
  onChange: (id: string | undefined) => void
}

/**
 * Auswahl der Trainingsart (Feature 1), optional.
 * Zeigt bevorzugt zur Kategorie passende Arten, erlaubt aber alle.
 * Neue Arten können direkt hier angelegt werden (einfache Bedienung).
 */
export function TrainingTypeSelect({ category, value, onChange }: Props) {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const types = useLiveQuery(() => db.trainingTypes.orderBy('name').toArray(), [])

  const sorted = useMemo(() => {
    const list = types ?? []
    // Passende Kategorie zuerst, dann der Rest (Arten ohne/andere Kategorie).
    return [...list].sort((a, b) => {
      const am = a.category === category ? 0 : 1
      const bm = b.category === category ? 0 : 1
      if (am !== bm) return am - bm
      return a.name.localeCompare(b.name)
    })
  }, [types, category])

  const add = async () => {
    const name = newName.trim()
    if (!name) {
      toast.show('Bitte einen Namen eingeben.', 'error')
      return
    }
    const tt = await createTrainingType(name, category)
    onChange(tt.id)
    setNewName('')
    setAdding(false)
    toast.show('Trainingsart angelegt.', 'success')
  }

  return (
    <div className="field">
      <label>Trainingsart (optional)</label>
      {!adding ? (
        <div className="flex gap-2">
          <select
            className="grow"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || undefined)}
          >
            <option value="">— keine —</option>
            {sorted.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.category && t.category !== category ? ` (${t.category})` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-icon bg-surface-2 border border-border text-accent shrink-0"
            onClick={() => setAdding(true)}
            aria-label="Neue Trainingsart"
          >
            <IconPlus width={20} height={20} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            autoFocus
            className="grow"
            placeholder="z.B. Power, Technik, Kraft"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
              if (e.key === 'Escape') { setAdding(false); setNewName('') }
            }}
          />
          <button type="button" className="btn-primary shrink-0 px-4" onClick={add}>
            OK
          </button>
          <button
            type="button"
            className="btn-secondary shrink-0 px-3"
            onClick={() => { setAdding(false); setNewName('') }}
          >
            Abbr.
          </button>
        </div>
      )}
    </div>
  )
}
