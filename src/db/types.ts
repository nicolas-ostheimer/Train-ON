// Zentrale Typdefinitionen für das Datenmodell der App.
// Saubere Trennung: Übungsvorlagen, Trainingsvorlagen, geplante Trainings, Protokolle.

export type ID = string

/**
 * Schlüssel einer Trainingskategorie.
 * Früher ein fester Union-Typ, jetzt ein freier String: Kategorien sind
 * benutzerdefiniert und werden in der DB verwaltet (Tabelle `categories`).
 * Bestehende Daten nutzen weiterhin die alten Keys ('trial', 'gym', …),
 * daher bleibt dieser Typ string-kompatibel und erfordert keine Datenmigration.
 */
export type CategoryKey = string

/**
 * Benutzerdefinierte Trainingskategorie (in der DB gespeichert).
 * `key` ist der stabile Bezeichner, auf den Übungen/Vorlagen/Trainings
 * über ihr `category`-Feld verweisen. Für die Standardkategorien sind das
 * die historischen Keys ('trial', 'gym', 'ausdauer', 'sonstiges').
 */
export interface Category {
  key: string
  label: string
  /** Optionale Akzentfarbe (Hex), fügt sich dezent ins Dark-Design ein. */
  color?: string
  /** Sortierreihenfolge in Listen/Filtern. */
  order: number
}

/** Fallback-Key für Einträge ohne gültige Kategorie (wird nicht erzwungen). */
export const UNCATEGORIZED_KEY = 'sonstiges'

/**
 * Standardkategorien für Neuinstallationen bzw. als einmaliger Seed.
 * Behalten exakt die historischen Keys, damit bestehende Daten weiter passen.
 * Sie sind NICHT fest – der Nutzer kann sie umbenennen, färben oder löschen.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { key: 'trial', label: 'Trial', color: '#ff7a1a', order: 0 },
  { key: 'gym', label: 'Gym', color: '#6fb3ff', order: 1 },
  { key: 'ausdauer', label: 'Ausdauer', color: '#5fd089', order: 2 },
  { key: 'sonstiges', label: 'Sonstiges', order: 3 },
]

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
  /**
   * Optionale Gruppierung für zukünftige Übungsvariationen (Feature 6, Vorbereitung).
   * Übungen mit gleicher groupId gehören zusammen (z.B. "Squats" -> Full/Box/Pin).
   * Wird aktuell NICHT über die UI gesetzt; Übungen funktionieren unabhängig davon.
   */
  groupId?: ID
  groupName?: string
  createdAt: number
  updatedAt: number
}

/**
 * Benutzerdefinierte Trainingsart / Trainingsfokus (Feature 1).
 * Unabhängig von der Kategorie. Der Nutzer legt diese selbst an.
 * Eine optionale Kategorie-Bindung erlaubt gefilterte Vorschläge, ist aber nicht zwingend.
 */
export interface TrainingType {
  id: ID
  name: string
  category?: CategoryKey // optionale Zuordnung zu einer Kategorie
  createdAt: number
  updatedAt: number
}

/**
 * Ein Satz einer Übung innerhalb eines Trainings (Feature 5).
 * Enthält die konkreten Werte der Parameter für genau diesen Satz.
 */
export interface ExerciseSet {
  id: ID
  values: ParameterValue[]
}

/**
 * Abschnitt einer Trainingsvorlage/-planung (Feature 4), z.B. Warm-up, Hauptteil.
 * Übungen werden Abschnitten über WorkoutExercise.sectionId zugeordnet.
 */
export interface WorkoutSection {
  id: ID
  name: string
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
  /**
   * Auswahloptionen (nur bei type === 'select'), als Kopie aus der
   * Parameterdefinition. Dadurch kann beim Training ein echtes Dropdown
   * angezeigt werden, auch unabhängig von späteren Vorlagenänderungen.
   * Bei Altdaten fehlend -> Eingabe fällt dann auf ein Freitextfeld zurück.
   */
  options?: string[]
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
  /**
   * Zielwerte, wenn alle Sätze gleich sind bzw. kein Satzsystem genutzt wird.
   * Bleibt aus Abwärtskompatibilität erhalten: Bestandsübungen ohne `sets`
   * verwenden ausschließlich dieses Feld.
   */
  values: ParameterValue[]
  /**
   * Satzsystem (Feature 5), optional.
   * setCount: Anzahl der Sätze (Standard 1, wenn nicht gesetzt).
   * perSetParamIds: Parameter-IDs, die PRO SATZ variieren. Alle übrigen Parameter
   *   sind für alle Sätze gleich und werden aus `values` übernommen.
   * sets: konkrete Werte je Satz NUR für die perSet-Parameter.
   */
  setCount?: number
  perSetParamIds?: ID[]
  sets?: ExerciseSet[]
  /** Zuordnung zu einem Abschnitt (Feature 4), optional. */
  sectionId?: ID
}

/** Trainingseinheit-Vorlage (wiederverwendbar, beliebig oft planbar). */
export interface WorkoutTemplate {
  id: ID
  title: string
  category: CategoryKey
  /** Optionale Trainingsart/Fokus (Feature 1). Verweist auf TrainingType.id. */
  trainingTypeId?: ID
  description?: string
  notes?: string
  /** Optionale Abschnitte (Feature 4). Leer/fehlend = ohne Abschnitte trainieren. */
  sections?: WorkoutSection[]
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
  /** Optionale Trainingsart/Fokus (Feature 1), als eigene Kopie der Vorlage. */
  trainingTypeId?: ID
  description?: string
  notes?: string
  /** Optionale Abschnitte (Feature 4), eigene Kopie aus der Vorlage. */
  sections?: WorkoutSection[]
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
  /** Optionale Trainingsart/Fokus zum Zeitpunkt des Abschlusses (Snapshot). */
  trainingTypeId?: ID
  date: string
  completedAt: number
  outcome: 'erledigt' | 'nicht_absolviert'
  note?: string
  // Snapshot der geplanten Werte + optionale tatsächliche Werte
  exercises: {
    name: string
    /**
     * Flache Werte-Snapshots. Bleiben aus Abwärtskompatibilität erhalten und
     * dienen als Fallback für Altprotokolle ohne Satz-Snapshot.
     */
    planned: ParameterValue[]
    actual: ParameterValue[]
    /**
     * Vollständige Satz-Snapshots (Trainingshistorie-Feature), optional.
     * Enthalten setCount/perSetParamIds/sets und erlauben die exakte
     * Satz-für-Satz-Wiedergabe von Plan und Ist. Ältere Protokolle haben
     * diese Felder nicht -> Anzeige fällt dann auf planned/actual zurück.
     */
    plannedExercise?: WorkoutExercise
    actualExercise?: WorkoutExercise
  }[]
}
