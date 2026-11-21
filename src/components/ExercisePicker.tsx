import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Exercise } from '../db/types'
import { Modal } from './Modal'
import { CategoryBadge } from './CategoryBadge'
import { IconSearch, IconPlus } from './icons'
import { useNavigate } from 'react-router-dom'

interface Props {
  open: boolean
  onClose: () => void
  onPick: (exercise: Exercise) => void
}

export function ExercisePicker({ open, onClose, onPick }: Props) {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const exercises = useLiveQuery(() => db.exercises.orderBy('name').toArray(), [])

  const filtered = useMemo(() => {
    const list = exercises ?? []
    const q = search.trim().toLowerCase()
    return q ? list.filter((e) => e.name.toLowerCase().includes(q)) : list
  }, [exercises, search])

  return (
    <Modal open={open} title="Übung hinzufügen" onClose={onClose}>
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          <IconSearch width={20} height={20} />
        </span>
        <input className="pl-11" placeholder="Übung suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {exercises === undefined ? (
        <p className="text-text-muted">Lädt…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center text-text-muted py-6">
          <p className="mb-3">Keine Übung gefunden.</p>
          <button className="btn-secondary" onClick={() => { onClose(); nav('/uebung/neu') }}>
            <IconPlus width={18} height={18} /> Neue Übung anlegen
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((e) => (
            <button
              key={e.id}
              className="text-left bg-surface-2 border border-border rounded-xl p-3 hover:border-accent transition-colors"
              onClick={() => { onPick(e); onClose() }}
            >
              <div className="font-semibold truncate">{e.name}</div>
              <div className="mt-1">
                <CategoryBadge category={e.category} />
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
