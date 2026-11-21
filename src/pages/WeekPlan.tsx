import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { ScheduledWorkout } from '../db/types'
import { deleteScheduled, moveScheduled } from '../db/api'
import { PageHeader } from '../components/PageHeader'
import { CategoryBadge } from '../components/CategoryBadge'
import { SchedulePicker } from '../components/SchedulePicker'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconTrash,
  IconMove,
  IconCheck,
} from '../components/icons'
import {
  WEEKDAYS_LONG,
  startOfWeek,
  weekDays,
  addWeeks,
  toISODate,
  todayISO,
  isoWeekNumber,
  formatShortDate,
} from '../lib/date'

export default function WeekPlan() {
  const nav = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [monday, setMonday] = useState(() => startOfWeek(new Date()))
  const [pickerDate, setPickerDate] = useState<string | null>(null)
  const [moveItem, setMoveItem] = useState<ScheduledWorkout | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const days = useMemo(() => weekDays(monday), [monday])
  const weekStart = toISODate(days[0])
  const weekEnd = toISODate(days[6])

  const scheduled = useLiveQuery(
    () => db.scheduled.where('date').between(weekStart, weekEnd, true, true).toArray(),
    [weekStart, weekEnd],
  )

  const byDate = useMemo(() => {
    const map: Record<string, ScheduledWorkout[]> = {}
    for (const s of scheduled ?? []) {
      ;(map[s.date] ??= []).push(s)
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
    }
    return map
  }, [scheduled])

  const remove = async (s: ScheduledWorkout) => {
    const ok = await confirm({
      message: `"${s.title}" aus dem Plan entfernen?`,
      danger: true,
      confirmLabel: 'Entfernen',
    })
    if (!ok) return
    await deleteScheduled(s.id)
    toast.show('Aus dem Plan entfernt.', 'success')
  }

  const doMove = async (targetDate: string) => {
    if (!moveItem) return
    await moveScheduled(moveItem.id, targetDate, moveItem.time)
    toast.show('Verschoben.', 'success')
    setMoveItem(null)
  }

  const onDrop = async (targetDate: string) => {
    if (!dragId) return
    const item = (scheduled ?? []).find((s) => s.id === dragId)
    setDragId(null)
    if (!item || item.date === targetDate) return
    await moveScheduled(item.id, targetDate, item.time)
    toast.show('Verschoben.', 'success')
  }

  const kw = isoWeekNumber(days[0])

  return (
    <div>
      <PageHeader title="Wochenplan" subtitle={`KW ${kw}`} />

      <div className="flex items-center justify-between gap-2 mb-4">
        <button className="btn-icon bg-surface border border-border text-text-secondary" onClick={() => setMonday((m) => addWeeks(m, -1))} aria-label="Vorherige Woche">
          <IconChevronLeft />
        </button>
        <div className="text-center">
          <div className="font-semibold">
            {formatShortDate(days[0])} – {formatShortDate(days[6])}
          </div>
          <button className="text-sm text-accent" onClick={() => setMonday(startOfWeek(new Date()))}>
            Zur aktuellen Woche
          </button>
        </div>
        <button className="btn-icon bg-surface border border-border text-text-secondary" onClick={() => setMonday((m) => addWeeks(m, 1))} aria-label="Nächste Woche">
          <IconChevronRight />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {days.map((d, i) => {
          const iso = toISODate(d)
          const items = byDate[iso] ?? []
          const today = iso === todayISO()
          return (
            <div
              key={iso}
              className={`card ${today ? 'border-accent' : ''}`}
              onDragOver={(e) => { if (dragId) e.preventDefault() }}
              onDrop={() => onDrop(iso)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${today ? 'text-accent' : ''}`}>{WEEKDAYS_LONG[i]}</span>
                  <span className="text-sm text-text-muted">{formatShortDate(d)}</span>
                  {today && <span className="chip bg-accent-soft text-accent text-xs">Heute</span>}
                </div>
                <button className="btn-icon text-accent hover:bg-surface-2" onClick={() => setPickerDate(iso)} aria-label="Einheit hinzufügen">
                  <IconPlus />
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-text-muted">Kein Training geplant.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={() => setDragId(s.id)}
                      onDragEnd={() => setDragId(null)}
                      className={`bg-surface-2 border rounded-xl p-3 ${
                        s.status === 'erledigt'
                          ? 'border-success/40'
                          : s.status === 'nicht_absolviert'
                            ? 'border-danger/40'
                            : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button className="text-left grow min-w-0" onClick={() => nav(`/geplant/${s.id}`)}>
                          <div className="flex items-center gap-2">
                            {s.status === 'erledigt' && <IconCheck width={16} height={16} className="text-success shrink-0" />}
                            <span className={`font-semibold truncate ${s.status === 'erledigt' ? 'line-through text-text-secondary' : ''}`}>
                              {s.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <CategoryBadge category={s.category} />
                            {s.time && <span className="text-sm text-text-muted">{s.time} Uhr</span>}
                            {s.durationMin && <span className="text-sm text-text-muted">{s.durationMin} min</span>}
                          </div>
                        </button>
                        <div className="flex gap-1 shrink-0">
                          <button className="btn-icon text-text-muted hover:bg-border" onClick={() => setMoveItem(s)} aria-label="Verschieben">
                            <IconMove width={18} height={18} />
                          </button>
                          <button className="btn-icon text-danger hover:bg-border" onClick={() => remove(s)} aria-label="Entfernen">
                            <IconTrash width={18} height={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-text-muted mt-4 text-center">
        Tipp: Einheiten per Drag &amp; Drop zwischen den Tagen ziehen oder das Verschieben-Symbol nutzen.
      </p>

      {pickerDate && (
        <SchedulePicker open={!!pickerDate} date={pickerDate} onClose={() => setPickerDate(null)} />
      )}

      <Modal
        open={!!moveItem}
        title="Verschieben"
        onClose={() => setMoveItem(null)}
      >
        <p className="text-text-secondary mb-3">Zieltag für „{moveItem?.title}" wählen:</p>
        <div className="grid grid-cols-1 gap-2">
          {days.map((d, i) => {
            const iso = toISODate(d)
            return (
              <button
                key={iso}
                className={`btn-secondary justify-between ${moveItem?.date === iso ? 'border-accent' : ''}`}
                onClick={() => doMove(iso)}
              >
                <span>{WEEKDAYS_LONG[i]}, {formatShortDate(d)}</span>
                {moveItem?.date === iso && <span className="text-sm text-text-muted">aktuell</span>}
              </button>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
