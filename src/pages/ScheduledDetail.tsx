import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { CategoryBadge } from '../components/CategoryBadge'
import { ParameterValueEditor } from '../components/ParameterValueEditor'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import type { ScheduledWorkout, ParameterValue } from '../db/types'
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

  // Formularzustand für den Abschluss
  const [note, setNote] = useState('')
  const [actual, setActual] = useState<Record<string, ParameterValue[]>>({})

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
    // Ist-Werte mit geplanten Werten vorbelegen
    const init: Record<string, ParameterValue[]> = {}
    for (const e of sw.exercises) init[e.id] = deepClone(e.values)
    setActual(init)
    setCompleteOpen(true)
  }

  const finish = async (outcome: 'erledigt' | 'nicht_absolviert') => {
    if (!sw) return
    await completeWorkout(sw.id, outcome, note.trim() || undefined, actual)
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

  const savePlannedValues = async (weId: string, values: ParameterValue[]) => {
    if (!sw) return
    const next = sw.exercises.map((e) => (e.id === weId ? { ...e, values } : e))
    setSw({ ...sw, exercises: next })
    await updateScheduled(sw.id, { exercises: next })
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

  return (
    <div>
      <PageHeader title={sw.title} back subtitle={formatLongDate(fromISODate(sw.date))} />

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <CategoryBadge category={sw.category} />
        <span className={`chip ${sw.status === 'erledigt' ? 'bg-[#1e3326] text-success' : sw.status === 'nicht_absolviert' ? 'bg-[#3a1e1e] text-danger' : 'bg-surface-2 text-text-secondary'}`}>
          {statusLabel}
        </span>
        {sw.time && <span className="text-sm text-text-muted">{sw.time} Uhr</span>}
        {sw.durationMin && <span className="text-sm text-text-muted">{sw.durationMin} min</span>}
      </div>

      {sw.description && <p className="text-text-secondary mb-4">{sw.description}</p>}

      <h2 className="text-lg font-bold mb-2">Übungen</h2>
      <div className="flex flex-col gap-3 mb-6">
        {sw.exercises.length === 0 && <p className="text-text-muted">Keine Übungen.</p>}
        {sw.exercises.map((e, i) => (
          <div key={e.id} className="card">
            <div className="font-semibold mb-2">{i + 1}. {e.name}</div>
            {sw.status === 'offen' ? (
              <ParameterValueEditor values={e.values} onChange={(v) => savePlannedValues(e.id, v)} />
            ) : e.values.length === 0 ? (
              <p className="text-sm text-text-muted">Keine Parameter.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {e.values.map((v) => (
                  <div key={v.paramId} className="bg-surface-2 rounded-lg px-3 py-2">
                    <div className="text-xs text-text-muted truncate">{v.name}{v.unit ? ` (${v.unit})` : ''}</div>
                    <div className="font-medium">{v.value || '–'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
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
                <ParameterValueEditor
                  values={actual[e.id] ?? e.values}
                  onChange={(v) => setActual((prev) => ({ ...prev, [e.id]: v }))}
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
