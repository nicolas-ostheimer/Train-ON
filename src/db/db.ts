import Dexie, { type Table } from 'dexie'
import type {
  Exercise,
  WorkoutTemplate,
  ScheduledWorkout,
  WorkoutLog,
  TrainingType,
} from './types'

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
  }
}

export const db = new TrialDB()
