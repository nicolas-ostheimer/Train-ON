import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { CategoryBadge } from '../components/CategoryBadge'
import { Modal } from '../components/Modal'
import { SchedulePicker } from '../components/SchedulePicker'
import { IconPlus, IconCalendar, IconCheck, IconSettings, IconDumbbell, IconHistory } from '../components/icons'
import { todayISO, formatLongDate } from '../lib/date'

export default function Dashboard() {
  const nav = useNavigate()
  const today = todayISO()
  const [chooseOpen, setChooseOpen] = useState(false)
  const [schedulerOpen, setSchedulerOpen] = useState(false)

  const todaysWorkouts = useLiveQuery(
    () => db.scheduled.where('date').equals(today).toArray(),
    [today],
  )

  const sorted = (todaysWorkouts ?? []).slice().sort(
    (a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'),
  )
  const doneCount = sorted.filter((s) => s.status === 'erledigt').length

  const chooseExisting = () => {
    setChooseOpen(false)
    setSchedulerOpen(true)
  }
  const chooseNew = () => {
    setChooseOpen(false)
    // Neues Training anlegen und danach direkt für heute einplanen (planen=1).
    nav('/vorlage/neu?planen=1')
  }

  return (
    <div>
      <header className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-3xl font-bold">Hi Nico!</h1>
          <p className="text-text-secondary mt-1 capitalize">{formatLongDate(new Date())}</p>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <button className="btn-icon text-text-secondary hover:bg-surface-2" onClick={() => nav('/historie')} aria-label="Trainingshistorie">
            <IconHistory />
          </button>
          <button className="btn-icon text-text-secondary hover:bg-surface-2" onClick={() => nav('/einstellungen')} aria-label="Einstellungen">
            <IconSettings />
          </button>
        </div>
      </header>

      {/* Zentraler Schnellzugriff (Feature 3) */}
      <div className="mb-6">
        <button className="btn-primary w-full py-4 text-lg" onClick={() => setChooseOpen(true)}>
          <IconPlus width={22} height={22} /> Training hinzufügen
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
          <p className="text-sm text-text-muted mb-4">Füge oben ein Training hinzu.</p>
          <button className="btn-secondary" onClick={() => setChooseOpen(true)}>
            <IconPlus width={18} height={18} /> Training hinzufügen
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

      {/* Auswahl: bestehendes Training oder neues erstellen */}
      <Modal open={chooseOpen} title="Training hinzufügen" onClose={() => setChooseOpen(false)}>
        <div className="flex flex-col gap-3">
          <button className="btn-secondary w-full py-4 justify-start" onClick={chooseExisting}>
            <IconDumbbell width={20} height={20} />
            <span className="text-left">
              <span className="block font-semibold">Bestehendes Training verwenden</span>
              <span className="block text-sm text-text-muted">Aus deinen Vorlagen für heute einplanen</span>
            </span>
          </button>
          <button className="btn-secondary w-full py-4 justify-start" onClick={chooseNew}>
            <IconPlus width={20} height={20} />
            <span className="text-left">
              <span className="block font-semibold">Neues Training erstellen</span>
              <span className="block text-sm text-text-muted">Danach direkt für heute einplanen</span>
            </span>
          </button>
        </div>
      </Modal>

      {/* Bestehende Vorlage für heute einplanen */}
      {schedulerOpen && (
        <SchedulePicker
          open={schedulerOpen}
          date={today}
          onClose={() => setSchedulerOpen(false)}
          onScheduled={() => setSchedulerOpen(false)}
        />
      )}
    </div>
  )
}
