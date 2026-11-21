import Dexie, { type Table } from 'dexie'
import type {
  Exercise,
  WorkoutTemplate,
  ScheduledWorkout,
  WorkoutLog,
} from './types'

/**
 * Lokale IndexedDB-Datenbank über Dexie.
 * Vier Tabellen entsprechend der sauberen Trennung im Datenmodell.
 */
export class TrialDB extends Dexie {
  exercises!: Table<Exercise, string>
  templates!: Table<WorkoutTemplate, string>
  scheduled!: Table<ScheduledWorkout, string>
  logs!: Table<WorkoutLog, string>

  constructor() {
    super('TrialTrainingPlanner')
    this.version(1).stores({
      // Indizierte Felder für schnelle Abfragen/Filter
      exercises: 'id, name, category, updatedAt',
      templates: 'id, title, category, updatedAt',
      scheduled: 'id, date, status, templateId',
      logs: 'id, scheduledId, date',
    })
  }
}

export const db = new TrialDB()
