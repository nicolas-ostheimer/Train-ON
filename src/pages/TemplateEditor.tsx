import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { SetEditor } from '../components/SetEditor'
import { ExercisePicker } from '../components/ExercisePicker'
import { TrainingTypeSelect } from '../components/TrainingTypeSelect'
import { SchedulePicker } from '../components/SchedulePicker'
import {
  CATEGORIES,
  type CategoryKey,
  type WorkoutExercise,
  type WorkoutSection,
  type WorkoutTemplate,
} from '../db/types'
import { createTemplate, getTemplate, updateTemplate, exerciseToWorkoutExercise } from '../db/api'
import { newId } from '../db/util'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import { IconPlus, IconTrash, IconArrowUp, IconArrowDown } from '../components/icons'

// Standard-Abschnittsvorschläge je Kategorie (Feature 4). Nur Vorschläge,
// jederzeit frei anpassbar. Keine erfundenen Trial-Techniken.
const SECTION_SUGGESTIONS: Record<CategoryKey, string[]> = {
  trial: ['Warm-up', 'Technik', 'Hauptteil', 'Cooldown'],
  gym: ['Warm-up', 'Hauptteil', 'Cooldown'],
  ausdauer: ['Warm-up', 'Hauptteil', 'Cooldown'],
  sonstiges: ['Warm-up', 'Hauptteil', 'Cooldown'],
}

export default function TemplateEditor() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const nav = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryKey>('trial')
  const [trainingTypeId, setTrainingTypeId] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [sections, setSections] = useState<WorkoutSection[]>([])
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSectionId, setPickerSectionId] = useState<string | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  // Nach dem Speichern eines NEUEN Trainings: direkt für heute einplanen (Feature 3).
  const [savedForSchedule, setSavedForSchedule] = useState<WorkoutTemplate | null>(null)
  const wantSchedule = searchParams.get('planen') === '1'

  useEffect(() => {
    if (!id) return
    let active = true
    getTemplate(id).then((t) => {
      if (!active) return
      if (t) {
        setTitle(t.title)
        setCategory(t.category)
        setTrainingTypeId(t.trainingTypeId)
        setDescription(t.description ?? '')
        setNotes(t.notes ?? '')
        setSections(t.sections ?? [])
        setExercises(t.exercises)
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [id])

  const setWorkoutExercise = (weId: string, next: WorkoutExercise) => {
    setExercises((list) => list.map((e) => (e.id === weId ? next : e)))
  }

  const removeExercise = async (weId: string, name: string) => {
    const ok = await confirm({ message: `"${name}" aus der Einheit entfernen?`, danger: true, confirmLabel: 'Entfernen' })
    if (!ok) return
    setExercises((list) => list.filter((e) => e.id !== weId))
  }

  const move = (weId: string, dir: -1 | 1) => {
    setExercises((list) => {
      const idx = list.findIndex((e) => e.id === weId)
      if (idx < 0) return list
      const next = [...list]
      const t = idx + dir
      if (t < 0 || t >= next.length) return list
      ;[next[idx], next[t]] = [next[t], next[idx]]
      return next
    })
  }

  // ----- Abschnitte (Feature 4) -----
  const addSection = (name: string) => {
    setSections((s) => [...s, { id: newId(), name: name || `Abschnitt ${s.length + 1}` }])
  }
  const renameSection = (sid: string, name: string) => {
    setSections((s) => s.map((x) => (x.id === sid ? { ...x, name } : x)))
  }
  const removeSection = (sid: string) => {
    // Übungen des Abschnitts behalten, aber Zuordnung lösen (nicht löschen).
    setExercises((list) => list.map((e) => (e.sectionId === sid ? { ...e, sectionId: undefined } : e)))
    setSections((s) => s.filter((x) => x.id !== sid))
  }
  const moveSection = (sid: string, dir: -1 | 1) => {
    setSections((s) => {
      const idx = s.findIndex((x) => x.id === sid)
      if (idx < 0) return s
      const next = [...s]
      const t = idx + dir
      if (t < 0 || t >= next.length) return s
      ;[next[idx], next[t]] = [next[t], next[idx]]
      return next
    })
  }
  const moveExerciseToSection = (weId: string, sectionId: string | undefined) => {
    setExercises((list) => list.map((e) => (e.id === weId ? { ...e, sectionId } : e)))
  }

  const save = async (): Promise<WorkoutTemplate | null> => {
    if (!title.trim()) {
      toast.show('Bitte einen Titel eingeben.', 'error')
      return null
    }
    setSaving(true)
    try {
      const data = {
        title: title.trim(),
        category,
        trainingTypeId,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        sections: sections.length ? sections : undefined,
        exercises,
      }
      if (isEdit && id) {
        await updateTemplate(id, data)
        toast.show('Trainingseinheit gespeichert.', 'success')
        return { ...(await getTemplate(id))! }
      } else {
        const created = await createTemplate(data)
        toast.show('Trainingseinheit erstellt.', 'success')
        return created
      }
    } catch (e) {
      toast.show('Speichern fehlgeschlagen.', 'error')
      console.error(e)
      return null
    } finally {
      setSaving(false)
    }
  }

  const onSaveClick = async () => {
    const result = await save()
    if (!result) return
    // Bei neuem Training mit "planen"-Absicht: Einplanen-Dialog anbieten (Feature 3).
    if (!isEdit && wantSchedule) {
      setSavedForSchedule(result)
    } else {
      nav(-1)
    }
  }

  // Übungen gruppiert nach Abschnitt für die Anzeige (Feature 4).
  const grouped = useMemo(() => {
    const unassigned = exercises.filter((e) => !e.sectionId || !sections.some((s) => s.id === e.sectionId))
    return { unassigned }
  }, [exercises, sections])

  if (loading) return <p className="text-text-muted">Lädt…</p>

  // Render-Helfer für eine Übungskarte (in Abschnitten und ohne Abschnitt gleich).
  const renderExerciseCard = (we: WorkoutExercise, index: number) => (
    <div key={we.id} className="bg-surface-2 border border-border rounded-xl p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="font-semibold truncate">{index + 1}. {we.name}</div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button className="btn-icon text-text-muted hover:bg-border" onClick={() => move(we.id, -1)} aria-label="Nach oben">
            <IconArrowUp width={18} height={18} />
          </button>
          <button className="btn-icon text-text-muted hover:bg-border" onClick={() => move(we.id, 1)} aria-label="Nach unten">
            <IconArrowDown width={18} height={18} />
          </button>
          <button className="btn-icon text-danger hover:bg-border" onClick={() => removeExercise(we.id, we.name)} aria-label="Entfernen">
            <IconTrash width={18} height={18} />
          </button>
        </div>
      </div>

      <SetEditor we={we} onChange={(next) => setWorkoutExercise(we.id, next)} />

      {/* Abschnitt-Zuordnung, nur wenn Abschnitte existieren */}
      {sections.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <label className="text-xs text-text-muted shrink-0">Abschnitt</label>
          <select
            className="text-sm py-2"
            value={we.sectionId ?? ''}
            onChange={(e) => moveExerciseToSection(we.id, e.target.value || undefined)}
          >
            <option value="">— ohne —</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )

  const openPicker = (sectionId?: string) => {
    setPickerSectionId(sectionId)
    setPickerOpen(true)
  }

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

        <TrainingTypeSelect category={category} value={trainingTypeId} onChange={setTrainingTypeId} />

        <div className="field">
          <label>Beschreibung (optional)</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {/* Abschnitte (Feature 4) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold">Abschnitte ({sections.length})</h3>
          </div>
          {sections.length === 0 ? (
            <p className="text-sm text-text-muted mb-2">
              Optional. Ohne Abschnitte werden alle Übungen in einer Liste geführt.
            </p>
          ) : (
            <div className="flex flex-col gap-2 mb-2">
              {sections.map((s) => (
                <div key={s.id} className="flex items-center gap-2 bg-surface-2 border border-border rounded-xl p-2">
                  <input
                    className="grow py-2"
                    value={s.name}
                    onChange={(e) => renameSection(s.id, e.target.value)}
                    placeholder="Abschnittsname"
                  />
                  <button className="btn-icon text-text-muted hover:bg-border" onClick={() => moveSection(s.id, -1)} aria-label="Nach oben">
                    <IconArrowUp width={18} height={18} />
                  </button>
                  <button className="btn-icon text-text-muted hover:bg-border" onClick={() => moveSection(s.id, 1)} aria-label="Nach unten">
                    <IconArrowDown width={18} height={18} />
                  </button>
                  <button className="btn-icon text-danger hover:bg-border" onClick={() => removeSection(s.id)} aria-label="Abschnitt löschen">
                    <IconTrash width={18} height={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <button className="btn-secondary py-2 text-sm" onClick={() => addSection('')}>
              <IconPlus width={16} height={16} /> Abschnitt
            </button>
            {sections.length === 0 &&
              SECTION_SUGGESTIONS[category].map((name) => (
                <button
                  key={name}
                  className="chip bg-surface-2 text-text-secondary"
                  onClick={() => addSection(name)}
                >
                  + {name}
                </button>
              ))}
          </div>
        </div>

        {/* Übungen – nach Abschnitt gruppiert, wenn vorhanden */}
        <div>
          <h3 className="text-base font-bold mb-2">Übungen ({exercises.length})</h3>

          {exercises.length === 0 && sections.length === 0 && (
            <p className="text-sm text-text-muted mb-2">Noch keine Übungen. Füge unten welche hinzu.</p>
          )}

          {sections.length > 0 ? (
            <div className="flex flex-col gap-4">
              {sections.map((s) => {
                const items = exercises.filter((e) => e.sectionId === s.id)
                return (
                  <div key={s.id} className="border border-border rounded-xl p-2">
                    <div className="flex items-center justify-between px-1 py-1 mb-2">
                      <span className="font-bold text-accent">{s.name}</span>
                      <span className="text-xs text-text-muted">{items.length}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.length === 0 && (
                        <p className="text-xs text-text-muted px-1">Keine Übungen in diesem Abschnitt.</p>
                      )}
                      {items.map((we) => renderExerciseCard(we, exercises.indexOf(we)))}
                    </div>
                    <button className="btn-secondary w-full mt-2 py-2 text-sm" onClick={() => openPicker(s.id)}>
                      <IconPlus width={16} height={16} /> Übung in „{s.name}"
                    </button>
                  </div>
                )
              })}

              {/* Übungen ohne Abschnitt */}
              {grouped.unassigned.length > 0 && (
                <div>
                  <div className="px-1 py-1 mb-2 text-sm text-text-muted font-medium">Ohne Abschnitt</div>
                  <div className="flex flex-col gap-2">
                    {grouped.unassigned.map((we) => renderExerciseCard(we, exercises.indexOf(we)))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {exercises.map((we, i) => renderExerciseCard(we, i))}
            </div>
          )}

          <button className="btn-secondary w-full mt-3" onClick={() => openPicker(undefined)}>
            <IconPlus width={20} height={20} /> Übung hinzufügen
          </button>
        </div>

        <div className="field">
          <label>Notizen (optional)</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button className="btn-primary w-full" onClick={onSaveClick} disabled={saving}>
          {saving ? 'Speichert…' : 'Speichern'}
        </button>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(ex) =>
          setExercises((list) => [
            ...list,
            { ...exerciseToWorkoutExercise(ex), sectionId: pickerSectionId },
          ])
        }
      />

      {/* Nach Speichern eines neuen Trainings: direkt für heute einplanen (Feature 3) */}
      {savedForSchedule && (
        <SchedulePicker
          open={!!savedForSchedule}
          date={new Date().toISOString().slice(0, 10)}
          preselect={savedForSchedule}
          onClose={() => { setSavedForSchedule(null); nav('/') }}
          onScheduled={() => { setSavedForSchedule(null); nav('/') }}
        />
      )}
    </div>
  )
}
