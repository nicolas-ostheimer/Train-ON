import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { ParameterValueEditor } from '../components/ParameterValueEditor'
import { ExercisePicker } from '../components/ExercisePicker'
import { CATEGORIES, type CategoryKey, type WorkoutExercise, type ParameterValue } from '../db/types'
import { createTemplate, getTemplate, updateTemplate, exerciseToWorkoutExercise } from '../db/api'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import { IconPlus, IconTrash, IconArrowUp, IconArrowDown } from '../components/icons'

export default function TemplateEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryKey>('trial')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    getTemplate(id).then((t) => {
      if (!active) return
      if (t) {
        setTitle(t.title)
        setCategory(t.category)
        setDescription(t.description ?? '')
        setNotes(t.notes ?? '')
        setExercises(t.exercises)
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [id])

  const setValues = (weId: string, values: ParameterValue[]) => {
    setExercises((list) => list.map((e) => (e.id === weId ? { ...e, values } : e)))
  }

  const removeExercise = async (weId: string, name: string) => {
    const ok = await confirm({ message: `"${name}" aus der Einheit entfernen?`, danger: true, confirmLabel: 'Entfernen' })
    if (!ok) return
    setExercises((list) => list.filter((e) => e.id !== weId))
  }

  const move = (index: number, dir: -1 | 1) => {
    setExercises((list) => {
      const next = [...list]
      const t = index + dir
      if (t < 0 || t >= next.length) return list
      ;[next[index], next[t]] = [next[t], next[index]]
      return next
    })
  }

  const save = async () => {
    if (!title.trim()) {
      toast.show('Bitte einen Titel eingeben.', 'error')
      return
    }
    setSaving(true)
    try {
      const data = {
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        exercises,
      }
      if (isEdit && id) {
        await updateTemplate(id, data)
        toast.show('Trainingseinheit gespeichert.', 'success')
      } else {
        await createTemplate(data)
        toast.show('Trainingseinheit erstellt.', 'success')
      }
      nav(-1)
    } catch (e) {
      toast.show('Speichern fehlgeschlagen.', 'error')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-text-muted">Lädt…</p>

  return (
    <div>
      <PageHeader title={isEdit ? 'Einheit bearbeiten' : 'Neue Trainingseinheit'} back />

      <div className="flex flex-col gap-4">
        <div className="field">
          <label>Titel *</label>
          <input placeholder="z.B. Mein Trainingsplan" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="field">
          <label>Kategorie</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as CategoryKey)}>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Beschreibung (optional)</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold">Übungen ({exercises.length})</h3>
          </div>

          <div className="flex flex-col gap-3">
            {exercises.length === 0 && (
              <p className="text-sm text-text-muted">Noch keine Übungen. Füge unten welche hinzu.</p>
            )}

            {exercises.map((we, i) => (
              <div key={we.id} className="bg-surface-2 border border-border rounded-xl p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{i + 1}. {we.name}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="btn-icon text-text-muted hover:bg-border" onClick={() => move(i, -1)} aria-label="Nach oben">
                      <IconArrowUp width={18} height={18} />
                    </button>
                    <button className="btn-icon text-text-muted hover:bg-border" onClick={() => move(i, 1)} aria-label="Nach unten">
                      <IconArrowDown width={18} height={18} />
                    </button>
                    <button className="btn-icon text-danger hover:bg-border" onClick={() => removeExercise(we.id, we.name)} aria-label="Entfernen">
                      <IconTrash width={18} height={18} />
                    </button>
                  </div>
                </div>
                <ParameterValueEditor values={we.values} onChange={(v) => setValues(we.id, v)} />
              </div>
            ))}
          </div>

          <button className="btn-secondary w-full mt-3" onClick={() => setPickerOpen(true)}>
            <IconPlus width={20} height={20} /> Übung hinzufügen
          </button>
        </div>

        <div className="field">
          <label>Notizen (optional)</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button className="btn-primary w-full" onClick={save} disabled={saving}>
          {saving ? 'Speichert…' : 'Speichern'}
        </button>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(ex) => setExercises((list) => [...list, exerciseToWorkoutExercise(ex)])}
      />
    </div>
  )
}
