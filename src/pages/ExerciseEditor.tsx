import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { ParameterDefEditor } from '../components/ParameterDefEditor'
import { type CategoryKey, type Exercise, type ExerciseParameter } from '../db/types'
import { createExercise, getExercise, updateExercise } from '../db/api'
import { useCategories } from '../lib/categories'
import { useToast } from '../components/Toast'

export default function ExerciseEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const isEdit = !!id

  const categories = useCategories()
  const [loading, setLoading] = useState(isEdit)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<CategoryKey>('')
  const [description, setDescription] = useState('')
  const [equipment, setEquipment] = useState('')
  const [notes, setNotes] = useState('')
  const [parameters, setParameters] = useState<ExerciseParameter[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    getExercise(id).then((ex) => {
      if (!active) return
      if (ex) {
        setName(ex.name)
        setCategory(ex.category)
        setDescription(ex.description ?? '')
        setEquipment(ex.equipment ?? '')
        setNotes(ex.notes ?? '')
        setParameters(ex.parameters ?? [])
      }
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [id])

  // Beim Neuanlegen: erste verfügbare Kategorie vorbelegen, sobald geladen.
  useEffect(() => {
    if (!isEdit && !category && categories && categories.length > 0) {
      setCategory(categories[0].key)
    }
  }, [isEdit, category, categories])

  const save = async () => {
    if (!name.trim()) {
      toast.show('Bitte einen Namen eingeben.', 'error')
      return
    }
    setSaving(true)
    try {
      const data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        equipment: equipment.trim() || undefined,
        notes: notes.trim() || undefined,
        parameters: parameters
          .filter((p) => p.name.trim())
          .map((p) => ({ ...p, name: p.name.trim() })),
      }
      if (isEdit && id) {
        await updateExercise(id, data)
        toast.show('Übung gespeichert.', 'success')
      } else {
        await createExercise(data)
        toast.show('Übung erstellt.', 'success')
      }
      nav(-1)
    } catch (e) {
      toast.show('Speichern fehlgeschlagen.', 'error')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-text-muted">Lädt…</p>
  }

  return (
    <div>
      <PageHeader title={isEdit ? 'Übung bearbeiten' : 'Neue Übung'} back />

      <div className="flex flex-col gap-4">
        <div className="field">
          <label>Name *</label>
          <input
            placeholder="Name der Übung"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Kategorie</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {/* Falls die gespeicherte Kategorie nicht mehr existiert, bleibt sie wählbar. */}
            {category && !(categories ?? []).some((c) => c.key === category) && (
              <option value={category}>{category}</option>
            )}
            {(categories ?? []).map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Beschreibung</label>
          <textarea
            rows={3}
            placeholder="Beschreibung der Übung"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Equipment (optional)</label>
          <input
            placeholder="z.B. Bike, Hantel, Matte"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          />
        </div>

        <div>
          <h3 className="text-base font-bold mb-2">Trainingsparameter</h3>
          <p className="text-sm text-text-muted mb-3">
            Bestimme selbst, welche Werte zu dieser Übung gehören.
          </p>
          <ParameterDefEditor value={parameters} onChange={setParameters} />
        </div>

        <div className="field">
          <label>Zusätzliche Notizen (optional)</label>
          <textarea
            rows={2}
            placeholder="Weitere Hinweise"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button className="btn-primary w-full" onClick={save} disabled={saving}>
          {saving ? 'Speichert…' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
