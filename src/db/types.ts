// Zentrale Typdefinitionen für das Datenmodell der App.
// Saubere Trennung: Übungsvorlagen, Trainingsvorlagen, geplante Trainings, Protokolle.

export type ID = string

/** Fest vorgegebene Kategorien (erweiterbar). */
export type CategoryKey = 'trial' | 'gym' | 'ausdauer' | 'sonstiges'

export interface ExerciseCategory {
  key: CategoryKey
  label: string
}

export const CATEGORIES: ExerciseCategory[] = [
  { key: 'trial', label: 'Trial' },
  { key: 'gym', label: 'Gym' },
  { key: 'ausdauer', label: 'Ausdauer' },
  { key: 'sonstiges', label: 'Sonstiges' },
]

export function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? 'Sonstiges'
}

/** Eingabetyp eines frei definierbaren Trainingsparameters. */
export type ParameterType = 'number' | 'text' | 'select'

/**
 * Flexibler, benutzerdefinierter Trainingsparameter einer Übung.
 * Der Benutzer bestimmt Name, Typ und ggf. Einheit/Optionen selbst.
 */
export interface ExerciseParameter {
  id: ID
  name: string // z.B. "Sätze", "Höhe", frei wählbar
  type: ParameterType
  unit?: string // optionale Einheit, z.B. "kg", "cm", "min"
  options?: string[] // nur bei type === 'select'
  defaultValue?: string // optionaler Vorgabewert
}

/** Übungsvorlage in der Übungsdatenbank. */
export interface Exercise {
  id: ID
  name: string
  category: CategoryKey
  description?: string
  equipment?: string
  notes?: string
  parameters: ExerciseParameter[] // Definition der flexiblen Parameter
  createdAt: number
  updatedAt: number
}

/**
 * Konkreter Wert eines Parameters innerhalb einer Trainingseinheit.
 * Verweist per paramId auf die Parameterdefinition, speichert aber Name/Typ
 * als Kopie, damit das Protokoll unabhängig von späteren Vorlagenänderungen bleibt.
 */
export interface ParameterValue {
  paramId: ID
  name: string
  type: ParameterType
  unit?: string
  value: string
}

/**
 * Eine Übung als Teil einer Trainingseinheit. Enthält eine KOPIE der
 * relevanten Übungsdaten, damit die Einheit unabhängig von der Übungsvorlage bleibt.
 */
export interface WorkoutExercise {
  id: ID // eindeutige Position-ID innerhalb der Einheit
  exerciseId: ID // Referenz auf Ursprungsübung (nur informativ)
  name: string
  category: CategoryKey
  description?: string
  equipment?: string
  notes?: string
  values: ParameterValue[] // konkrete Zielwerte für diese Einheit
}

/** Trainingseinheit-Vorlage (wiederverwendbar, beliebig oft planbar). */
export interface WorkoutTemplate {
  id: ID
  title: string
  category: CategoryKey
  description?: string
  notes?: string
  exercises: WorkoutExercise[]
  createdAt: number
  updatedAt: number
}

/**
 * Geplante Trainingseinheit im Wochenplan.
 * Besitzt eine EIGENE Kopie der Übungen/Werte. Änderungen hier verändern
 * NICHT die Vorlage und umgekehrt.
 */
export interface ScheduledWorkout {
  id: ID
  templateId?: ID // Herkunft (nur informativ, optional)
  title: string
  category: CategoryKey
  description?: string
  notes?: string
  exercises: WorkoutExercise[] // eigene Kopie der Zielwerte
  date: string // ISO-Datum "YYYY-MM-DD"
  time?: string // "HH:MM" optional
  durationMin?: number // optionale Dauer in Minuten
  status: 'offen' | 'erledigt' | 'nicht_absolviert'
  logId?: ID // verknüpftes Protokoll, falls abgeschlossen
  createdAt: number
  updatedAt: number
}

/**
 * Trainingsprotokoll einer abgeschlossenen Einheit.
 * Enthält geplante UND tatsächliche Werte als eigenständige Kopie.
 * Spätere Vorlagenänderungen beeinflussen dieses Protokoll nicht.
 */
export interface WorkoutLog {
  id: ID
  scheduledId: ID
  title: string
  category: CategoryKey
  date: string
  completedAt: number
  outcome: 'erledigt' | 'nicht_absolviert'
  note?: string
  // Snapshot der geplanten Werte + optionale tatsächliche Werte
  exercises: {
    name: string
    planned: ParameterValue[]
    actual: ParameterValue[]
  }[]
}
