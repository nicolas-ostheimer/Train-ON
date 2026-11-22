import { db } from './db'
import type {
  Exercise,
  WorkoutTemplate,
  ScheduledWorkout,
  WorkoutLog,
  TrainingType,
  Category,
} from './types'
import { DEFAULT_CATEGORIES } from './types'

const EXPORT_VERSION = 3

export interface BackupData {
  app: 'trial-training-planner'
  version: number
  exportedAt: string
  exercises: Exercise[]
  templates: WorkoutTemplate[]
  scheduled: ScheduledWorkout[]
  logs: WorkoutLog[]
  /** Seit V1.1 (version 2). Bei älteren Backups fehlend -> leeres Array. */
  trainingTypes?: TrainingType[]
  /** Seit V1.3 (version 3). Bei älteren Backups fehlend -> Standard-Seed greift. */
  categories?: Category[]
}

/** Sammelt alle Daten und erzeugt ein Backup-Objekt. */
export async function buildBackup(): Promise<BackupData> {
  const [exercises, templates, scheduled, logs, trainingTypes, categories] = await Promise.all([
    db.exercises.toArray(),
    db.templates.toArray(),
    db.scheduled.toArray(),
    db.logs.toArray(),
    db.trainingTypes.toArray(),
    db.categories.toArray(),
  ])
  return {
    app: 'trial-training-planner',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    exercises,
    templates,
    scheduled,
    logs,
    trainingTypes,
    categories,
  }
}

/** Exportiert alle Daten als JSON-Datei (Download). */
export async function exportToFile(): Promise<void> {
  const data = await buildBackup()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `trial-planner-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface ValidationResult {
  ok: boolean
  error?: string
  data?: BackupData
  counts?: { exercises: number; templates: number; scheduled: number; logs: number }
}

/** Prüft importierte Daten auf grundlegende Gültigkeit. */
export function validateBackup(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'Datei enthält kein gültiges JSON-Objekt.' }
  }
  const obj = raw as Record<string, unknown>

  if (obj.app !== 'trial-training-planner') {
    return { ok: false, error: 'Diese Datei stammt nicht aus dem Trial Training Planner.' }
  }

  const arrays = ['exercises', 'templates', 'scheduled', 'logs'] as const
  for (const key of arrays) {
    if (!Array.isArray(obj[key])) {
      return { ok: false, error: `Feld "${key}" fehlt oder ist ungültig.` }
    }
  }

  const exercises = obj.exercises as Exercise[]
  const templates = obj.templates as WorkoutTemplate[]
  const scheduled = obj.scheduled as ScheduledWorkout[]
  const logs = obj.logs as WorkoutLog[]

  // Stichproben-Prüfung auf Pflichtfelder
  for (const e of exercises) {
    if (!e.id || typeof e.name !== 'string' || !Array.isArray(e.parameters)) {
      return { ok: false, error: 'Mindestens eine Übung ist ungültig aufgebaut.' }
    }
  }
  for (const t of templates) {
    if (!t.id || typeof t.title !== 'string' || !Array.isArray(t.exercises)) {
      return { ok: false, error: 'Mindestens eine Trainingsvorlage ist ungültig aufgebaut.' }
    }
  }
  for (const s of scheduled) {
    if (!s.id || typeof s.date !== 'string' || !Array.isArray(s.exercises)) {
      return { ok: false, error: 'Mindestens ein geplantes Training ist ungültig aufgebaut.' }
    }
  }

  return {
    ok: true,
    data: { ...(obj as unknown as BackupData) },
    counts: {
      exercises: exercises.length,
      templates: templates.length,
      scheduled: scheduled.length,
      logs: logs.length,
    },
  }
}

/**
 * Importiert ein Backup. mode 'replace' löscht vorhandene Daten vollständig,
 * mode 'merge' fügt die Datensätze hinzu bzw. überschreibt gleiche IDs.
 */
export async function importBackup(
  data: BackupData,
  mode: 'replace' | 'merge',
): Promise<void> {
  await db.transaction('rw', [db.exercises, db.templates, db.scheduled, db.logs, db.trainingTypes, db.categories], async () => {
    if (mode === 'replace') {
      await Promise.all([
        db.exercises.clear(),
        db.templates.clear(),
        db.scheduled.clear(),
        db.logs.clear(),
        db.trainingTypes.clear(),
        db.categories.clear(),
      ])
    }
    await db.exercises.bulkPut(data.exercises)
    await db.templates.bulkPut(data.templates)
    await db.scheduled.bulkPut(data.scheduled)
    await db.logs.bulkPut(data.logs)
    // Trainingsarten sind optional (ältere Backups haben das Feld nicht).
    if (Array.isArray(data.trainingTypes)) {
      await db.trainingTypes.bulkPut(data.trainingTypes)
    }
    // Kategorien optional (Backups < version 3). Fehlen sie, bleibt der
    // vorhandene bzw. geseedete Bestand erhalten.
    if (Array.isArray(data.categories) && data.categories.length > 0) {
      await db.categories.bulkPut(data.categories)
    }
    // Nach einem Replace ohne Kategorien die Standardkategorien wiederherstellen,
    // damit nie ein leerer Kategorienbestand entsteht.
    if ((await db.categories.count()) === 0) {
      await db.categories.bulkAdd(DEFAULT_CATEGORIES)
    }
  })
}

/**
 * Lädt den eingefrorenen Musterdatensatz (Nicos echter Export) und ersetzt
 * damit den vorhandenen Bestand. Wird vom "Musterdaten laden"-Button genutzt.
 */
export async function importDemoData(): Promise<void> {
  const { demoData } = await import('../data/demoData')
  const result = validateBackup(demoData)
  if (!result.ok || !result.data) {
    throw new Error(result.error ?? 'Musterdaten sind ungültig.')
  }
  await importBackup(result.data, 'replace')
}

/** Liest eine Datei als Text (für den Import-Dialog). */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'))
    reader.readAsText(file)
  })
}
