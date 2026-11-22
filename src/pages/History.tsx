import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { type CategoryKey } from '../db/types'
import { useCategories } from '../lib/categories'
import { PageHeader } from '../components/PageHeader'
import { CategoryBadge } from '../components/CategoryBadge'
import { TrainingTypeBadge } from '../components/TrainingTypeBadge'
import { SetCompare } from '../components/SetCompare'
import { IconCheck, IconX, IconHistory } from '../components/icons'
import { fromISODate, formatLongDate } from '../lib/date'

export default function History() {
  const categories = useCategories()
  const [filter, setFilter] = useState<CategoryKey | 'alle'>('alle')
  const [openId, setOpenId] = useState<string | null>(null)

  // Protokolle live, neueste zuerst.
  const logs = useLiveQuery(async () => {
    const all = await db.logs.toArray()
    return all.sort((a, b) => b.completedAt - a.completedAt)
  }, [])

  const filtered = useMemo(() => {
    const list = logs ?? []
    return list.filter((l) => filter === 'alle' || l.category === filter)
  }, [logs, filter])

  return (
    <div>
      <PageHeader title="Trainingshistorie" back />

      {/* Kategorie-Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
        <button
          className={`chip shrink-0 ${filter === 'alle' ? 'bg-accent text-black' : 'bg-surface-2 text-text-secondary'}`}
          onClick={() => setFilter('alle')}
        >
          Alle
        </button>
        {(categories ?? []).map((c) => (
          <button
            key={c.key}
            className={`chip shrink-0 ${filter === c.key ? 'bg-accent text-black' : 'bg-surface-2 text-text-secondary'}`}
            onClick={() => setFilter(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {logs === undefined ? (
        <p className="text-text-muted">Lädt…</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-text-muted py-10">
          <IconHistory width={36} height={36} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium text-text-secondary mb-1">Noch keine abgeschlossenen Trainings.</p>
          <p className="text-sm">Schließe ein Training ab, dann erscheint es hier.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((log) => {
            const open = openId === log.id
            const done = log.outcome === 'erledigt'
            return (
              <div key={log.id} className="card">
                <button
                  className="w-full text-left"
                  onClick={() => setOpenId(open ? null : log.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {done ? (
                          <IconCheck width={18} height={18} className="text-success shrink-0" />
                        ) : (
                          <IconX width={18} height={18} className="text-danger shrink-0" />
                        )}
                        <span className="font-bold truncate">{log.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <CategoryBadge category={log.category} />
                        <TrainingTypeBadge id={log.trainingTypeId} />
                        <span className="text-sm text-text-muted">
                          {formatLongDate(fromISODate(log.date))}
                        </span>
                      </div>
                      {!done && (
                        <p className="text-sm text-danger mt-1">Nicht absolviert</p>
                      )}
                    </div>
                  </div>
                </button>

                {open && (
                  <div className="mt-3 pt-3 border-t border-border flex flex-col gap-3">
                    {log.exercises.length === 0 ? (
                      <p className="text-sm text-text-muted">Keine Übungen protokolliert.</p>
                    ) : (
                      log.exercises.map((ex, i) => (
                        <div key={i} className="bg-surface-2 rounded-xl p-3">
                          <div className="font-semibold mb-2">{i + 1}. {ex.name}</div>
                          <SetCompare ex={ex} />
                        </div>
                      ))
                    )}
                    {log.note && (
                      <div>
                        <div className="text-xs text-text-muted mb-1">Notiz</div>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{log.note}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
