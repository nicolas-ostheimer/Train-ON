import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { CATEGORIES, type CategoryKey } from '../db/types'
import { deleteExercise, deleteTemplate, duplicateTemplate } from '../db/api'
import { PageHeader } from '../components/PageHeader'
import { CategoryBadge } from '../components/CategoryBadge'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import { IconPlus, IconSearch, IconEdit, IconTrash, IconCopy, IconDumbbell } from '../components/icons'

type Tab = 'vorlagen' | 'uebungen'

export default function Training() {
  const nav = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [tab, setTab] = useState<Tab>('vorlagen')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<CategoryKey | 'alle'>('alle')

  const exercises = useLiveQuery(() => db.exercises.orderBy('name').toArray(), [])
  const templates = useLiveQuery(() => db.templates.orderBy('title').toArray(), [])

  const filteredExercises = useMemo(() => {
    const list = exercises ?? []
    const q = search.trim().toLowerCase()
    return list.filter(
      (e) =>
        (filter === 'alle' || e.category === filter) &&
        (!q || e.name.toLowerCase().includes(q) || (e.description ?? '').toLowerCase().includes(q)),
    )
  }, [exercises, search, filter])

  const filteredTemplates = useMemo(() => {
    const list = templates ?? []
    const q = search.trim().toLowerCase()
    return list.filter(
      (t) =>
        (filter === 'alle' || t.category === filter) &&
        (!q || t.title.toLowerCase().includes(q)),
    )
  }, [templates, search, filter])

  const removeExercise = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Übung löschen',
      message: `"${name}" wirklich löschen? Bereits erstellte Trainingseinheiten bleiben erhalten.`,
      danger: true,
      confirmLabel: 'Löschen',
    })
    if (!ok) return
    await deleteExercise(id)
    toast.show('Übung gelöscht.', 'success')
  }

  const removeTemplate = async (id: string, title: string) => {
    const ok = await confirm({
      title: 'Vorlage löschen',
      message: `Trainingsvorlage "${title}" wirklich löschen? Bereits geplante Einheiten bleiben erhalten.`,
      danger: true,
      confirmLabel: 'Löschen',
    })
    if (!ok) return
    await deleteTemplate(id)
    toast.show('Vorlage gelöscht.', 'success')
  }

  const copyTemplate = async (id: string) => {
    await duplicateTemplate(id)
    toast.show('Vorlage kopiert.', 'success')
  }

  return (
    <div>
      <PageHeader title="Training" />

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-surface border border-border rounded-xl p-1">
        <button
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'vorlagen' ? 'bg-accent text-black' : 'text-text-secondary'
          }`}
          onClick={() => setTab('vorlagen')}
        >
          Trainingseinheiten
        </button>
        <button
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'uebungen' ? 'bg-accent text-black' : 'text-text-secondary'
          }`}
          onClick={() => setTab('uebungen')}
        >
          Übungen
        </button>
      </div>

      {/* Suche */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          <IconSearch width={20} height={20} />
        </span>
        <input
          className="pl-11"
          placeholder="Suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Kategorie-Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
        <button
          className={`chip shrink-0 ${filter === 'alle' ? 'bg-accent text-black' : 'bg-surface-2 text-text-secondary'}`}
          onClick={() => setFilter('alle')}
        >
          Alle
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`chip shrink-0 ${filter === c.key ? 'bg-accent text-black' : 'bg-surface-2 text-text-secondary'}`}
            onClick={() => setFilter(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {tab === 'vorlagen' && (
        <div className="flex flex-col gap-3">
          <button className="btn-primary w-full" onClick={() => nav('/vorlage/neu')}>
            <IconPlus width={20} height={20} /> Neue Trainingseinheit
          </button>

          {templates === undefined ? (
            <p className="text-text-muted">Lädt…</p>
          ) : filteredTemplates.length === 0 ? (
            <div className="card text-center text-text-muted py-8">
              <IconDumbbell width={32} height={32} className="mx-auto mb-2 opacity-50" />
              <p>Noch keine Trainingseinheiten.</p>
            </div>
          ) : (
            filteredTemplates.map((t) => (
              <div key={t.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <button className="text-left grow min-w-0" onClick={() => nav(`/vorlage/${t.id}`)}>
                    <h3 className="font-bold truncate">{t.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={t.category} />
                      <span className="text-sm text-text-muted">
                        {t.exercises.length} Übung{t.exercises.length === 1 ? '' : 'en'}
                      </span>
                    </div>
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="btn-secondary flex-1 py-2" onClick={() => nav(`/vorlage/${t.id}`)}>
                    <IconEdit width={18} height={18} /> Bearbeiten
                  </button>
                  <button className="btn-icon bg-surface-2 border border-border text-text-secondary" onClick={() => copyTemplate(t.id)} aria-label="Kopieren">
                    <IconCopy width={18} height={18} />
                  </button>
                  <button className="btn-icon bg-surface-2 border border-border text-danger" onClick={() => removeTemplate(t.id, t.title)} aria-label="Löschen">
                    <IconTrash width={18} height={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'uebungen' && (
        <div className="flex flex-col gap-3">
          <button className="btn-primary w-full" onClick={() => nav('/uebung/neu')}>
            <IconPlus width={20} height={20} /> Neue Übung
          </button>

          {exercises === undefined ? (
            <p className="text-text-muted">Lädt…</p>
          ) : filteredExercises.length === 0 ? (
            <div className="card text-center text-text-muted py-8">
              <p>Noch keine Übungen.</p>
            </div>
          ) : (
            filteredExercises.map((e) => (
              <div key={e.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <button className="text-left grow min-w-0" onClick={() => nav(`/uebung/${e.id}`)}>
                    <h3 className="font-bold truncate">{e.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <CategoryBadge category={e.category} />
                      {e.parameters.length > 0 && (
                        <span className="text-sm text-text-muted">
                          {e.parameters.length} Parameter
                        </span>
                      )}
                    </div>
                    {e.description && (
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">{e.description}</p>
                    )}
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="btn-secondary flex-1 py-2" onClick={() => nav(`/uebung/${e.id}`)}>
                    <IconEdit width={18} height={18} /> Bearbeiten
                  </button>
                  <button className="btn-icon bg-surface-2 border border-border text-danger" onClick={() => removeExercise(e.id, e.name)} aria-label="Löschen">
                    <IconTrash width={18} height={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
