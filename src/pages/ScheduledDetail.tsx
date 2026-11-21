import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { CategoryBadge } from '../components/CategoryBadge'
import { TrainingTypeBadge } from '../components/TrainingTypeBadge'
import { SetEditor } from '../components/SetEditor'
import { SetSummary } from '../components/SetSummary'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import type { ScheduledWorkout, WorkoutExercise, ParameterValue } from '../db/types'
import { getScheduled, updateScheduled, deleteScheduled, completeWorkout, reopenWorkout } from '../db/api'
import { deepClone } from '../db/util'
import { IconCheck, IconX, IconTrash, IconEdit } from '../components/icons'
import { fromISODate, formatLongDate } from '../lib/date'

export default function ScheduledDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [sw, setSw] = useState<ScheduledWorkout | null>(null)
  const [loading, setLoading] = useState(true)
  const [completeOpen, setCompleteOpen] = useState(false)

  // Formularzustand für den Abschluss: Ist-Werte je Übung als eigene WorkoutExercise-Kopie.
  const [note, setNote] = useState('')
  const [actual, setActual] = useState<Record<string, WorkoutExercise>>({})

  const load = async () => {
    if (!id) return
    const data = await getScheduled(id)
    setSw(data ?? null)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const openComplete = () => {
    if (!sw) return
    setNote(sw.notes ?? '')
    const init: Record<string, WorkoutExercise> = {}
    for (const e of sw.exercises) init[e.id] = deepClone(e)
    setActual(init)
    setCompleteOpen(true)
  }

  const finish = async (outcome: 'erledigt' | 'nicht_absolviert') => {
    if (!sw) return
    // Ist-Werte als flache ParameterValue-Liste je Übung übergeben (Kompatibilität
    // mit der bestehenden Protokoll-API). Satzwerte werden dabei zusammengefasst.
    const actualByExercise: Record<string, ParameterValue[]> = {}
    for (const e of sw.exercises) {
      const a = actual[e.id]
      actualByExercise[e.id] = a ? a.values : e.values
    }
    await completeWorkout(sw.id, outcome, note.trim() || undefined, actualByExercise)
    toast.show(outcome === 'erledigt' ? 'Training abgeschlossen.' : 'Als nicht absolviert markiert.', 'success')
    setCompleteOpen(false)
    await load()
  }

  const reopen = async () => {
    if (!sw) return
    await reopenWorkout(sw.id)
    toast.show('Zurückgesetzt auf offen.', 'success')
    await load()
  }

  const remove = async () => {
    if (!sw) return
    const ok = await confirm({ message: `"${sw.title}" löschen?`, danger: true, confirmLabel: 'Löschen' })
    if (!ok) return
    await deleteScheduled(sw.id)
    toast.show('Gelöscht.', 'success')
    nav(-1)
  }

  const savePlannedExercise = async (weId: string, next: WorkoutExercise) => {
    if (!sw) return
    const nextList = sw.exercises.map((e) => (e.id === weId ? next : e))
    setSw({ ...sw, exercises: nextList })
    await updateScheduled(sw.id, { exercises: nextList })
  }

  if (loading) return <p className="text-text-muted">Lädt…</p>
  if (!sw) return (
    <div>
      <PageHeader title="Nicht gefunden" back />
      <p className="text-text-muted">Diese Einheit existiert nicht mehr.</p>
    </div>
  )

  const statusLabel =
    sw.status === 'erledigt' ? 'Erledigt' : sw.status === 'nicht_absolviert' ? 'Nicht absolviert' : 'Offen'

  const sections = sw.sections ?? []

  // Übung + Index-Nummerierung
  const renderExercise = (e: WorkoutExercise, index: number) => (
    <div key={e.id} className="card">
      <div className="font-semibold mb-2">{index + 1}. {e.name}</div>
      {sw.status === 'offen' ? (
        <SetEditor we={e} onChange={(next) => savePlannedExercise(e.id, next)} />
      ) : (
        <SetSummary we={e} />
      )}
    </div>
  )

  const renderExerciseList = () => {
    if (sections.length === 0) {
      return sw.exercises.map((e, i) => renderExercise(e, i))
    }
    return (
      <>
        {sections.map((s) => {
          const items = sw.exercises.filter((e) => e.sectionId === s.id)
          if (items.length === 0) return null
          return (
            <div key={s.id}>
              <div className="text-accent font-bold mb-2">{s.name}</div>
              <div className="flex flex-col gap-3">
                {items.map((e) => renderExercise(e, sw.exercises.indexOf(e)))}
              </div>
            </div>
          )
        })}
        {(() => {
          const rest = sw.exercises.filter((e) => !e.sectionId || !sections.some((s) => s.id === e.sectionId))
          if (rest.length === 0) return null
          return (
            <div>
              <div className="text-text-muted font-medium mb-2">Ohne Abschnitt</div>
              <div className="flex flex-col gap-3">
                {rest.map((e) => renderExercise(e, sw.exercises.indexOf(e)))}
              </div>
            </div>
          )
        })()}
      </>
    )
  }

  return (
    <div>
      <PageHeader title={sw.title} back subtitle={formatLongDate(fromISODate(sw.date))} />

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <CategoryBadge category={sw.category} />
        <TrainingTypeBadge id={sw.trainingTypeId} />
        <span className={`chip ${sw.status === 'erledigt' ? 'bg-[#1e3326] text-success' : sw.status === 'nicht_absolviert' ? 'bg-[#3a1e1e] text-danger' : 'bg-surface-2 text-text-secondary'}`}>
          {statusLabel}
        </span>
        {sw.time && <span className="text-sm text-text-muted">{sw.time} Uhr</span>}
        {sw.durationMin && <span className="text-sm text-text-muted">{sw.durationMin} min</span>}
      </div>

      {sw.description && <p className="text-text-secondary mb-4">{sw.description}</p>}

      <h2 className="text-lg font-bold mb-2">Übungen</h2>
      <div className="flex flex-col gap-4 mb-6">
        {sw.exercises.length === 0 && <p className="text-text-muted">Keine Übungen.</p>}
        {renderExerciseList()}
      </div>

      {sw.notes && (
        <div className="card mb-6">
          <div className="text-sm text-text-muted mb-1">Notiz</div>
          <p className="text-text-secondary whitespace-pre-wrap">{sw.notes}</p>
        </div>
      )}

      {/* Aktionen */}
      <div className="flex flex-col gap-3">
        {sw.status === 'offen' ? (
          <button className="btn-primary w-full" onClick={openComplete}>
            <IconCheck width={20} height={20} /> Training abschließen
          </button>
        ) : (
          <button className="btn-secondary w-full" onClick={reopen}>
            <IconEdit width={18} height={18} /> Wieder öffnen
          </button>
        )}
        <button className="btn-ghost w-full text-danger" onClick={remove}>
          <IconTrash width={18} height={18} /> Aus Plan löschen
        </button>
      </div>

      {/* Abschluss-Dialog */}
      <Modal
        open={completeOpen}
        title="Training abschließen"
        onClose={() => setCompleteOpen(false)}
        footer={
          <>
            <button className="btn-secondary flex-1" onClick={() => finish('nicht_absolviert')}>
              <IconX width={18} height={18} /> Nicht absolviert
            </button>
            <button className="btn-primary flex-1" onClick={() => finish('erledigt')}>
              <IconCheck width={18} height={18} /> Erledigt
            </button>
          </>
        }
      >
        <p className="text-sm text-text-muted mb-4">
          Trage optional die tatsächlich absolvierten Werte ein. Die geplanten Werte bleiben erhalten.
        </p>

        <div className="flex flex-col gap-3 mb-4">
          {sw.exercises.map((e) => (
            <div key={e.id} className="bg-surface-2 border border-border rounded-xl p-3">
              <div className="font-semibold mb-2">{e.name}</div>
              {e.values.length === 0 ? (
                <p className="text-sm text-text-muted">Keine Parameter.</p>
              ) : (
                <SetEditor
                  we={actual[e.id] ?? e}
                  onChange={(next) => setActual((prev) => ({ ...prev, [e.id]: next }))}
                />
              )}
            </div>
          ))}
        </div>

        <div className="field">
          <label>Trainingsnotiz (optional)</label>
          <textarea rows={3} placeholder="Wie lief das Training?" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
