import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { PageHeader } from '../components/PageHeader'
import { type CategoryKey } from '../db/types'
import { useCategories, labelFor } from '../lib/categories'
import { createTrainingType, updateTrainingType, deleteTrainingType } from '../db/api'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import { IconPlus, IconTrash, IconEdit, IconCheck, IconX } from '../components/icons'

/** Verwaltung der benutzerdefinierten Trainingsarten (Feature 1). */
export default function TrainingTypes() {
  const toast = useToast()
  const confirm = useConfirm()
  const categories = useCategories()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<CategoryKey | ''>('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const types = useLiveQuery(() => db.trainingTypes.orderBy('name').toArray(), [])

  const add = async () => {
    if (!name.trim()) {
      toast.show('Bitte einen Namen eingeben.', 'error')
      return
    }
    await createTrainingType(name, category || undefined)
    setName('')
    toast.show('Trainingsart angelegt.', 'success')
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    await updateTrainingType(id, { name: editName.trim() })
    setEditId(null)
    toast.show('Gespeichert.', 'success')
  }

  const remove = async (id: string, label: string) => {
    const ok = await confirm({
      title: 'Trainingsart löschen',
      message: `"${label}" löschen? Trainings behalten ihre übrigen Daten, verlieren aber diese Zuordnung.`,
      danger: true,
      confirmLabel: 'Löschen',
    })
    if (!ok) return
    await deleteTrainingType(id)
    toast.show('Gelöscht.', 'success')
  }

  return (
    <div>
      <PageHeader title="Trainingsarten" back subtitle="Fokus/Art, z.B. Power, Technik, Kraft" />

      {/* Neu anlegen */}
      <div className="card mb-4">
        <h2 className="font-bold mb-3">Neue Trainingsart</h2>
        <div className="flex flex-col gap-3">
          <div className="field">
            <label>Name</label>
            <input
              placeholder="z.B. Power"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') add() }}
            />
          </div>
          <div className="field">
            <label>Kategorie (optional)</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">— alle —</option>
              {(categories ?? []).map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary w-full" onClick={add}>
            <IconPlus width={20} height={20} /> Hinzufügen
          </button>
        </div>
      </div>

      {/* Liste */}
      {types === undefined ? (
        <p className="text-text-muted">Lädt…</p>
      ) : types.length === 0 ? (
        <div className="card text-center text-text-muted py-8">
          <p>Noch keine Trainingsarten.</p>
          <p className="text-sm mt-1">Du kannst sie auch direkt beim Erstellen eines Trainings anlegen.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {types.map((t) => (
            <div key={t.id} className="card flex items-center gap-2">
              {editId === t.id ? (
                <>
                  <input
                    autoFocus
                    className="grow py-2"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(t.id); if (e.key === 'Escape') setEditId(null) }}
                  />
                  <button className="btn-icon text-success hover:bg-surface-2" onClick={() => saveEdit(t.id)} aria-label="Speichern">
                    <IconCheck width={18} height={18} />
                  </button>
                  <button className="btn-icon text-text-muted hover:bg-surface-2" onClick={() => setEditId(null)} aria-label="Abbrechen">
                    <IconX width={18} height={18} />
                  </button>
                </>
              ) : (
                <>
                  <div className="grow min-w-0">
                    <div className="font-semibold truncate">{t.name}</div>
                    {t.category && (
                      <div className="text-xs text-text-muted">{labelFor(categories, t.category)}</div>
                    )}
                  </div>
                  <button
                    className="btn-icon text-text-secondary hover:bg-surface-2"
                    onClick={() => { setEditId(t.id); setEditName(t.name) }}
                    aria-label="Bearbeiten"
                  >
                    <IconEdit width={18} height={18} />
                  </button>
                  <button className="btn-icon text-danger hover:bg-surface-2" onClick={() => remove(t.id, t.name)} aria-label="Löschen">
                    <IconTrash width={18} height={18} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
