import { db } from './db'
import { newId, now, deepClone } from './util'
import type {
  Exercise,
  WorkoutTemplate,
  WorkoutExercise,
  ScheduledWorkout,
  WorkoutLog,
  ParameterValue,
} from './types'

// ---------- Übungen ----------

export async function createExercise(
  data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Exercise> {
  const ex: Exercise = { ...data, id: newId(), createdAt: now(), updatedAt: now() }
  await db.exercises.add(ex)
  return ex
}

export async function updateExercise(
  id: string,
  patch: Partial<Omit<Exercise, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.exercises.update(id, { ...patch, updatedAt: now() })
}

export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id)
}

export function getExercise(id: string) {
  return db.exercises.get(id)
}

// ---------- Hilfen: Übung -> WorkoutExercise ----------

/** Erzeugt aus einer Übungsvorlage eine Trainings-Übung mit leeren Zielwerten. */
export function exerciseToWorkoutExercise(ex: Exercise): WorkoutExercise {
  const values: ParameterValue[] = ex.parameters.map((p) => ({
    paramId: p.id,
    name: p.name,
    type: p.type,
    unit: p.unit,
    value: p.defaultValue ?? '',
  }))
  return {
    id: newId(),
    exerciseId: ex.id,
    name: ex.name,
    category: ex.category,
    description: ex.description,
    equipment: ex.equipment,
    notes: ex.notes,
    values,
  }
}

// ---------- Trainingsvorlagen ----------

export async function createTemplate(
  data: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<WorkoutTemplate> {
  const t: WorkoutTemplate = { ...data, id: newId(), createdAt: now(), updatedAt: now() }
  await db.templates.add(t)
  return t
}

export async function updateTemplate(
  id: string,
  patch: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.templates.update(id, { ...patch, updatedAt: now() })
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.templates.delete(id)
}

export function getTemplate(id: string) {
  return db.templates.get(id)
}

/** Dupliziert eine Vorlage als neue Vorlage ("Kopieren"). */
export async function duplicateTemplate(id: string): Promise<WorkoutTemplate | undefined> {
  const t = await db.templates.get(id)
  if (!t) return undefined
  const copy = deepClone(t)
  copy.id = newId()
  copy.title = t.title + ' (Kopie)'
  copy.exercises = copy.exercises.map((e) => ({ ...e, id: newId() }))
  copy.createdAt = now()
  copy.updatedAt = now()
  await db.templates.add(copy)
  return copy
}

// ---------- Geplante Trainings ----------

/**
 * Plant eine Vorlage in den Wochenplan ein. Erzeugt eine EIGENE Kopie der
 * Übungen/Werte, damit spätere Änderungen Vorlage und Planung nicht vermischen.
 */
export async function scheduleFromTemplate(
  template: WorkoutTemplate,
  date: string,
  opts?: { time?: string; durationMin?: number },
): Promise<ScheduledWorkout> {
  const sw: ScheduledWorkout = {
    id: newId(),
    templateId: template.id,
    title: template.title,
    category: template.category,
    description: template.description,
    notes: template.notes,
    exercises: deepClone(template.exercises).map((e) => ({ ...e, id: newId() })),
    date,
    time: opts?.time,
    durationMin: opts?.durationMin,
    status: 'offen',
    createdAt: now(),
    updatedAt: now(),
  }
  await db.scheduled.add(sw)
  return sw
}

export async function createScheduled(
  data: Omit<ScheduledWorkout, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<ScheduledWorkout> {
  const sw: ScheduledWorkout = { ...data, id: newId(), createdAt: now(), updatedAt: now() }
  await db.scheduled.add(sw)
  return sw
}

export async function updateScheduled(
  id: string,
  patch: Partial<Omit<ScheduledWorkout, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.scheduled.update(id, { ...patch, updatedAt: now() })
}

export async function deleteScheduled(id: string): Promise<void> {
  const sw = await db.scheduled.get(id)
  if (sw?.logId) {
    await db.logs.delete(sw.logId)
  }
  await db.scheduled.delete(id)
}

export function getScheduled(id: string) {
  return db.scheduled.get(id)
}

/** Verschiebt eine geplante Einheit auf ein anderes Datum (und optional Uhrzeit). */
export async function moveScheduled(id: string, date: string, time?: string): Promise<void> {
  await db.scheduled.update(id, { date, time, updatedAt: now() })
}

// ---------- Training abschließen / Protokoll ----------

/**
 * Schließt eine geplante Einheit ab. Legt ein unabhängiges Protokoll an,
 * das geplante und tatsächliche Werte als Snapshot speichert.
 */
export async function completeWorkout(
  scheduledId: string,
  outcome: 'erledigt' | 'nicht_absolviert',
  note: string | undefined,
  actualByExercise: Record<string, ParameterValue[]>,
): Promise<WorkoutLog> {
  const sw = await db.scheduled.get(scheduledId)
  if (!sw) throw new Error('Geplante Einheit nicht gefunden.')

  const log: WorkoutLog = {
    id: newId(),
    scheduledId,
    title: sw.title,
    category: sw.category,
    date: sw.date,
    completedAt: now(),
    outcome,
    note,
    exercises: sw.exercises.map((e) => ({
      name: e.name,
      planned: deepClone(e.values),
      actual: deepClone(actualByExercise[e.id] ?? e.values),
    })),
  }

  await db.transaction('rw', db.scheduled, db.logs, async () => {
    // Vorhandenes Protokoll ersetzen, falls erneut abgeschlossen wird
    if (sw.logId) await db.logs.delete(sw.logId)
    await db.logs.add(log)
    await db.scheduled.update(scheduledId, {
      status: outcome,
      logId: log.id,
      updatedAt: now(),
    })
  })

  return log
}

/** Setzt eine Einheit zurück auf "offen" und entfernt das Protokoll. */
export async function reopenWorkout(scheduledId: string): Promise<void> {
  const sw = await db.scheduled.get(scheduledId)
  if (!sw) return
  await db.transaction('rw', db.scheduled, db.logs, async () => {
    if (sw.logId) await db.logs.delete(sw.logId)
    await db.scheduled.update(scheduledId, {
      status: 'offen',
      logId: undefined,
      updatedAt: now(),
    })
  })
}

export function getLog(id: string) {
  return db.logs.get(id)
}
