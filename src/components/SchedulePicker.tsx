import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { WorkoutTemplate } from '../db/types'
import { Modal } from './Modal'
import { CategoryBadge } from './CategoryBadge'
import { IconSearch } from './icons'
import { scheduleFromTemplate } from '../db/api'
import { useToast } from './Toast'
import { useNavigate } from 'react-router-dom'

interface Props {
  open: boolean
  date: string // Vorbelegtes Datum
  onClose: () => void
  onScheduled?: () => void
  /** Optional direkt eine Vorlage vorauswählen (überspringt die Auswahlliste). */
  preselect?: WorkoutTemplate
}

/** Wählt eine Vorlage und plant sie (als eigene Kopie) für ein Datum ein. */
export function SchedulePicker({ open, date, onClose, onScheduled, preselect }: Props) {
  const toast = useToast()
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<WorkoutTemplate | null>(preselect ?? null)
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('')

  // Vorauswahl übernehmen, wenn sich preselect ändert.
  useEffect(() => {
    if (preselect) setSelected(preselect)
  }, [preselect])

  const templates = useLiveQuery(() => db.templates.orderBy('title').toArray(), [])

  const filtered = useMemo(() => {
    const list = templates ?? []
    const q = search.trim().toLowerCase()
    return q ? list.filter((t) => t.title.toLowerCase().includes(q)) : list
  }, [templates, search])

  const reset = () => {
    setSelected(null)
    setTime('')
    setDuration('')
    setSearch('')
  }

  const close = () => {
    reset()
    onClose()
  }

  const confirm = async () => {
    if (!selected) return
    await scheduleFromTemplate(selected, date, {
      time: time || undefined,
      durationMin: duration ? Number(duration) : undefined,
    })
    toast.show('Trainingseinheit eingeplant.', 'success')
    reset()
    onScheduled?.()
    onClose()
  }

  return (
    <Modal
      open={open}
      title={selected ? 'Einheit einplanen' : 'Einheit auswählen'}
      onClose={close}
      footer={
        selected ? (
          <>
            <button className="btn-secondary flex-1" onClick={() => setSelected(null)}>
              Zurück
            </button>
            <button className="btn-primary flex-1" onClick={confirm}>
              Einplanen
            </button>
          </>
        ) : undefined
      }
    >
      {!selected ? (
        <>
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <IconSearch width={20} height={20} />
            </span>
            <input className="pl-11" placeholder="Vorlage suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {templates === undefined ? (
            <p className="text-text-muted">Lädt…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center text-text-muted py-6">
              <p className="mb-3">Keine Trainingseinheit vorhanden.</p>
              <button className="btn-secondary" onClick={() => { close(); nav('/vorlage/neu') }}>
                Neue Einheit erstellen
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  className="text-left bg-surface-2 border border-border rounded-xl p-3 hover:border-accent transition-colors"
                  onClick={() => setSelected(t)}
                >
                  <div className="font-semibold truncate">{t.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryBadge category={t.category} />
                    <span className="text-sm text-text-muted">
                      {t.exercises.length} Übung{t.exercises.length === 1 ? '' : 'en'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-surface-2 border border-border rounded-xl p-3">
            <div className="font-semibold">{selected.title}</div>
            <div className="mt-1"><CategoryBadge category={selected.category} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label>Uhrzeit (optional)</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="field">
              <label>Dauer in Min. (optional)</label>
              <input type="number" inputMode="numeric" placeholder="z.B. 60" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
          <p className="text-sm text-text-muted">
            Es wird eine eigene Kopie geplant. Spätere Änderungen an der Vorlage wirken sich nicht auf diese Planung aus.
          </p>
        </div>
      )}
    </Modal>
  )
}
