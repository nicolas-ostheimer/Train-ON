import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { useCategories } from '../lib/categories'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  countCategoryUsage,
  listCategories,
} from '../db/api'
import { UNCATEGORIZED_KEY } from '../db/types'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { IconPlus, IconTrash, IconEdit, IconCheck, IconX } from '../components/icons'

// Vordefinierte Farbpalette, passend zum Dark-Design. Leerer Wert = keine Farbe.
const PALETTE = ['#ff7a1a', '#6fb3ff', '#5fd089', '#e05a5a', '#c98bff', '#f2c14e', '#4fd1c5', '']

interface DeleteState {
  key: string
  label: string
  usage: { exercises: number; templates: number; scheduled: number; logs: number; total: number }
  reassignTo: string
}

/** Verwaltung der benutzerdefinierten Trainingskategorien (Feature 2). */
export default function Categories() {
  const toast = useToast()
  const categories = useCategories()

  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(PALETTE[0])

  const [editKey, setEditKey] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState<string>('')

  const [del, setDel] = useState<DeleteState | null>(null)
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!name.trim()) {
      toast.show('Bitte einen Namen eingeben.', 'error')
      return
    }
    await createCategory(name, color || undefined)
    setName('')
    setColor(PALETTE[0])
    toast.show('Kategorie angelegt.', 'success')
  }

  const startEdit = (key: string, label: string, c?: string) => {
    setEditKey(key)
    setEditName(label)
    setEditColor(c ?? '')
  }

  const saveEdit = async () => {
    if (!editKey || !editName.trim()) return
    await updateCategory(editKey, { label: editName.trim(), color: editColor || undefined })
    setEditKey(null)
    toast.show('Gespeichert.', 'success')
  }

  const askDelete = async (key: string, label: string) => {
    const usage = await countCategoryUsage(key)
    // Ersatzkategorie vorbelegen: bevorzugt "sonstiges", sonst erste andere.
    const all = await listCategories()
    const others = all.filter((c) => c.key !== key)
    const preferred =
      others.find((c) => c.key === UNCATEGORIZED_KEY)?.key ?? others[0]?.key ?? UNCATEGORIZED_KEY
    setDel({ key, label, usage, reassignTo: preferred })
  }

  const confirmDelete = async () => {
    if (!del) return
    setBusy(true)
    try {
      await deleteCategory(del.key, del.reassignTo)
      toast.show('Kategorie gelöscht.', 'success')
      setDel(null)
    } catch (e) {
      console.error(e)
      toast.show('Löschen fehlgeschlagen.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const otherCategories = (categories ?? []).filter((c) => c.key !== del?.key)
  const canDelete = (categories ?? []).length > 1

  return (
    <div>
      <PageHeader title="Kategorien" back subtitle="Eigene Trainingsbereiche verwalten" />

      {/* Neu anlegen */}
      <div className="card mb-4">
        <h2 className="font-bold mb-3">Neue Kategorie</h2>
        <div className="flex flex-col gap-3">
          <div className="field">
            <label>Name</label>
            <input
              placeholder="z.B. Laufen, Yoga, Mobility"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') add() }}
            />
          </div>
          <div className="field">
            <label>Farbe (optional)</label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c || 'none'}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${color === c ? 'border-text-primary' : 'border-border'}`}
                  style={{ backgroundColor: c || 'transparent' }}
                  onClick={() => setColor(c)}
                  aria-label={c || 'keine Farbe'}
                >
                  {!c && <IconX width={14} height={14} className="text-text-muted" />}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" onClick={add}>
            <IconPlus width={20} height={20} /> Hinzufügen
          </button>
        </div>
      </div>

      {/* Liste */}
      {categories === undefined ? (
        <p className="text-text-muted">Lädt…</p>
      ) : categories.length === 0 ? (
        <div className="card text-center text-text-muted py-8">
          <p>Noch keine Kategorien.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((c) => (
            <div key={c.key} className="card flex items-center gap-2">
              {editKey === c.key ? (
                <>
                  <input
                    autoFocus
                    className="grow py-2"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditKey(null) }}
                  />
                  <div className="flex gap-1">
                    {PALETTE.map((col) => (
                      <button
                        key={col || 'none'}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${editColor === col ? 'border-text-primary' : 'border-border'}`}
                        style={{ backgroundColor: col || 'transparent' }}
                        onClick={() => setEditColor(col)}
                        aria-label={col || 'keine Farbe'}
                      >
                        {!col && <IconX width={10} height={10} className="text-text-muted" />}
                      </button>
                    ))}
                  </div>
                  <button className="btn-icon text-success hover:bg-surface-2" onClick={saveEdit} aria-label="Speichern">
                    <IconCheck width={18} height={18} />
                  </button>
                  <button className="btn-icon text-text-muted hover:bg-surface-2" onClick={() => setEditKey(null)} aria-label="Abbrechen">
                    <IconX width={18} height={18} />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="w-4 h-4 rounded-full shrink-0 border border-border"
                    style={{ backgroundColor: c.color || 'transparent' }}
                  />
                  <div className="grow min-w-0 font-semibold truncate">{c.label}</div>
                  <button
                    className="btn-icon text-text-secondary hover:bg-surface-2"
                    onClick={() => startEdit(c.key, c.label, c.color)}
                    aria-label="Bearbeiten"
                  >
                    <IconEdit width={18} height={18} />
                  </button>
                  <button
                    className="btn-icon text-danger hover:bg-surface-2 disabled:opacity-40"
                    disabled={!canDelete}
                    title={canDelete ? 'Löschen' : 'Mindestens eine Kategorie muss bestehen bleiben.'}
                    onClick={() => askDelete(c.key, c.label)}
                    aria-label="Löschen"
                  >
                    <IconTrash width={18} height={18} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-text-muted text-center mt-4">
        Beim Löschen gehen keine Übungen, Vorlagen oder Trainings verloren – sie werden einer anderen Kategorie zugeordnet.
      </p>

      {/* Löschen bestätigen (mit Umhängen) */}
      <Modal
        open={!!del}
        title="Kategorie löschen"
        onClose={() => setDel(null)}
        footer={
          <>
            <button className="btn-secondary flex-1" disabled={busy} onClick={() => setDel(null)}>
              Abbrechen
            </button>
            <button className="btn-danger flex-1" disabled={busy} onClick={confirmDelete}>
              Löschen
            </button>
          </>
        }
      >
        {del && (
          <div>
            <p className="text-text-secondary mb-3">
              Kategorie <strong>„{del.label}"</strong> wirklich löschen?
            </p>
            {del.usage.total > 0 ? (
              <div className="bg-surface-2 border border-border rounded-xl p-3 mb-4">
                <p className="text-sm text-text-secondary mb-2">
                  Diese Kategorie wird noch verwendet:
                </p>
                <ul className="text-sm text-text-muted space-y-0.5 mb-3">
                  {del.usage.exercises > 0 && <li>• {del.usage.exercises} Übung(en)</li>}
                  {del.usage.templates > 0 && <li>• {del.usage.templates} Trainingseinheit(en)</li>}
                  {del.usage.scheduled > 0 && <li>• {del.usage.scheduled} geplante Einheit(en)</li>}
                  {del.usage.logs > 0 && <li>• {del.usage.logs} Protokoll(e)</li>}
                </ul>
                <div className="field">
                  <label>Diese Einträge verschieben nach:</label>
                  <select
                    value={del.reassignTo}
                    onChange={(e) => setDel({ ...del, reassignTo: e.target.value })}
                  >
                    {otherCategories.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted mb-4">
                Diese Kategorie wird aktuell nicht verwendet.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
