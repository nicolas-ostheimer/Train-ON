import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { CategoryBadge } from '../components/CategoryBadge'
import { IconPlus, IconCalendar, IconCheck, IconSettings } from '../components/icons'
import { todayISO, formatLongDate } from '../lib/date'

export default function Dashboard() {
  const nav = useNavigate()
  const today = todayISO()

  const todaysWorkouts = useLiveQuery(
    () => db.scheduled.where('date').equals(today).toArray(),
    [today],
  )

  const sorted = (todaysWorkouts ?? []).slice().sort(
    (a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'),
  )
  const doneCount = sorted.filter((s) => s.status === 'erledigt').length

  return (
    <div>
      <header className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-3xl font-bold">Hi Nico!</h1>
          <p className="text-text-secondary mt-1 capitalize">{formatLongDate(new Date())}</p>
        </div>
        <button className="btn-icon text-text-secondary hover:bg-surface-2 mt-1" onClick={() => nav('/einstellungen')} aria-label="Einstellungen">
          <IconSettings />
        </button>
      </header>

      {/* Schnellzugriffe */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button className="btn-primary py-4" onClick={() => nav('/vorlage/neu')}>
          <IconPlus width={20} height={20} /> Einheit erstellen
        </button>
        <button className="btn-secondary py-4" onClick={() => nav('/woche')}>
          <IconCalendar width={20} height={20} /> Wochenplan
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Heute</h2>
        {sorted.length > 0 && (
          <span className="text-sm text-text-muted">
            {doneCount}/{sorted.length} erledigt
          </span>
        )}
      </div>

      {todaysWorkouts === undefined ? (
        <p className="text-text-muted">Lädt…</p>
      ) : sorted.length === 0 ? (
        <div className="card text-center py-10">
          <IconCalendar width={36} height={36} className="mx-auto mb-3 text-text-muted opacity-60" />
          <p className="text-text-secondary mb-1 font-medium">Heute kein Training geplant.</p>
          <p className="text-sm text-text-muted mb-4">Plane eine Einheit im Wochenplan ein.</p>
          <button className="btn-secondary" onClick={() => nav('/woche')}>
            Zum Wochenplan
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((s) => (
            <button
              key={s.id}
              className={`card text-left ${s.status === 'erledigt' ? 'border-success/40' : s.status === 'nicht_absolviert' ? 'border-danger/40' : ''}`}
              onClick={() => nav(`/geplant/${s.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {s.status === 'erledigt' && <IconCheck width={18} height={18} className="text-success shrink-0" />}
                    <span className={`font-bold truncate ${s.status === 'erledigt' ? 'line-through text-text-secondary' : ''}`}>
                      {s.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <CategoryBadge category={s.category} />
                    {s.time && <span className="text-sm text-text-muted">{s.time} Uhr</span>}
                    {s.durationMin && <span className="text-sm text-text-muted">{s.durationMin} min</span>}
                  </div>
                  <p className="text-sm text-text-muted mt-1">
                    {s.exercises.length} Übung{s.exercises.length === 1 ? '' : 'en'}
                    {s.status === 'nicht_absolviert' ? ' · nicht absolviert' : ''}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
