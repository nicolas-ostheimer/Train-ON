import Dexie, { type Table } from 'dexie'
import type {
  Exercise,
  WorkoutTemplate,
  ScheduledWorkout,
  WorkoutLog,
  TrainingType,
  Category,
} from './types'
import { DEFAULT_CATEGORIES } from './types'

/**
 * Lokale IndexedDB-Datenbank über Dexie.
 * Version 1: vier Tabellen (Übungen, Vorlagen, geplante Trainings, Protokolle).
 * Version 2: zusätzliche Tabelle für benutzerdefinierte Trainingsarten (V1.1).
 *
 * Wichtig: Neue optionale Felder an bestehenden Objekten (z.B. sets, sections,
 * trainingTypeId) brauchen KEINE Schema-Migration – Dexie/IndexedDB speichert
 * beliebige Felder. Es werden nur neue Tabellen/Indizes deklariert. Bestehende
 * Daten bleiben dabei vollständig erhalten.
 */
export class TrialDB extends Dexie {
  exercises!: Table<Exercise, string>
  templates!: Table<WorkoutTemplate, string>
  scheduled!: Table<ScheduledWorkout, string>
  logs!: Table<WorkoutLog, string>
  trainingTypes!: Table<TrainingType, string>
  categories!: Table<Category, string>

  constructor() {
    super('TrialTrainingPlanner')
    this.version(1).stores({
      // Indizierte Felder für schnelle Abfragen/Filter
      exercises: 'id, name, category, updatedAt',
      templates: 'id, title, category, updatedAt',
      scheduled: 'id, date, status, templateId',
      logs: 'id, scheduledId, date',
    })
    // V1.1: neue Tabelle für Trainingsarten. Die bestehenden Stores werden
    // unverändert übernommen; vorhandene Datensätze bleiben erhalten.
    this.version(2).stores({
      exercises: 'id, name, category, updatedAt',
      templates: 'id, title, category, updatedAt',
      scheduled: 'id, date, status, templateId',
      logs: 'id, scheduledId, date',
      trainingTypes: 'id, name, category',
    })
    // V1.3: neue Tabelle für benutzerdefinierte Trainingskategorien.
    // `key` ist der Primärschlüssel und entspricht den bisherigen, in den
    // Daten verwendeten Kategorie-Keys. Bestehende Stores bleiben unverändert.
    this.version(3)
      .stores({
        exercises: 'id, name, category, updatedAt',
        templates: 'id, title, category, updatedAt',
        scheduled: 'id, date, status, templateId',
        logs: 'id, scheduledId, date',
        trainingTypes: 'id, name, category',
        categories: 'key, order',
      })
      .upgrade(async (tx) => {
        // Einmaliger Seed der Standardkategorien beim Upgrade einer
        // bestehenden Installation, falls noch keine vorhanden sind.
        const table = tx.table('categories')
        const count = await table.count()
        if (count === 0) {
          await table.bulkAdd(DEFAULT_CATEGORIES)
        }
      })
  }
}

export const db = new TrialDB()

/**
 * Stellt sicher, dass immer mindestens die Standardkategorien existieren.
 * Greift bei Neuinstallationen (frische DB ohne upgrade-Hook) und ist
 * ansonsten ein No-Op. Wird beim App-Start aufgerufen.
 */
export async function ensureCategoriesSeeded(): Promise<void> {
  const count = await db.categories.count()
  if (count === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES)
  }
}
