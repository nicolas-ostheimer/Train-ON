// Hilfsfunktionen für das flexible Satzsystem (Feature 5).
// Kapselt die Logik, damit Editor/Anzeige einfach bleiben und bestehende
// Übungen ohne Satzsystem weiter funktionieren.

import type { WorkoutExercise, ParameterValue, ExerciseSet } from '../db/types'
import { newId, deepClone } from '../db/util'

/** Anzahl Sätze einer Übung (mind. 1), robust gegen fehlende Felder. */
export function getSetCount(we: WorkoutExercise): number {
  const n = we.setCount ?? 1
  return n < 1 ? 1 : n
}

/** Parameter-IDs, die pro Satz variieren (robust gegen fehlendes Feld). */
export function getPerSetIds(we: WorkoutExercise): string[] {
  return we.perSetParamIds ?? []
}

/** Legt einen leeren Satz aus den gemeinsamen Werten an (nur perSet-Parameter zählen). */
function makeSetFromValues(values: ParameterValue[]): ExerciseSet {
  return { id: newId(), values: deepClone(values) }
}

/**
 * Stellt sicher, dass `sets` genau `setCount` Einträge hat und jeder Satz
 * alle Parameter aus `values` enthält. Vorhandene Werte bleiben erhalten.
 * Gibt eine NEUE WorkoutExercise zurück (immutable).
 */
export function normalizeSets(we: WorkoutExercise): WorkoutExercise {
  const count = getSetCount(we)
  const base = we.values ?? []
  const existing = we.sets ?? []

  const sets: ExerciseSet[] = []
  for (let i = 0; i < count; i++) {
    const prev = existing[i]
    if (prev) {
      // Werte an aktuelle Parameterliste angleichen (neue Parameter ergänzen,
      // entfernte verwerfen), vorhandene Eingaben behalten.
      const merged: ParameterValue[] = base.map((bv) => {
        const old = prev.values.find((v) => v.paramId === bv.paramId)
        return old ? { ...bv, value: old.value } : { ...bv, value: bv.value }
      })
      sets.push({ id: prev.id, values: merged })
    } else {
      sets.push(makeSetFromValues(base))
    }
  }
  return { ...we, setCount: count, sets, perSetParamIds: getPerSetIds(we) }
}

/** Ändert die Satzanzahl und erhält vorhandene Werte so weit möglich. */
export function setSetCount(we: WorkoutExercise, count: number): WorkoutExercise {
  const safe = count < 1 ? 1 : Math.floor(count)
  return normalizeSets({ ...we, setCount: safe })
}

/** Schaltet für einen Parameter um zwischen "gleich für alle" und "pro Satz". */
export function togglePerSet(we: WorkoutExercise, paramId: string, perSet: boolean): WorkoutExercise {
  const current = new Set(getPerSetIds(we))
  if (perSet) current.add(paramId)
  else current.delete(paramId)
  const next = { ...we, perSetParamIds: Array.from(current) }
  return normalizeSets(next)
}

/** Setzt den gemeinsamen Wert eines (nicht pro Satz variierenden) Parameters. */
export function setCommonValue(
  we: WorkoutExercise,
  paramId: string,
  value: string,
): WorkoutExercise {
  const values = (we.values ?? []).map((v) => (v.paramId === paramId ? { ...v, value } : v))
  // Für nicht-perSet-Parameter die Satzwerte mitziehen, damit Anzeige konsistent ist.
  const perSet = new Set(getPerSetIds(we))
  const sets = (we.sets ?? []).map((s) => ({
    ...s,
    values: s.values.map((v) => (v.paramId === paramId && !perSet.has(paramId) ? { ...v, value } : v)),
  }))
  return { ...we, values, sets }
}

/** Setzt den Wert eines Parameters in genau einem Satz (pro-Satz-Modus). */
export function setPerSetValue(
  we: WorkoutExercise,
  setIndex: number,
  paramId: string,
  value: string,
): WorkoutExercise {
  const norm = normalizeSets(we)
  const sets = norm.sets!.map((s, i) =>
    i === setIndex
      ? { ...s, values: s.values.map((v) => (v.paramId === paramId ? { ...v, value } : v)) }
      : s,
  )
  return { ...norm, sets }
}

/**
 * Baut eine kompakte Zusammenfassung der Sätze für die Anzeige, z.B.
 * "3 Sätze · 5 Wdh · 100 kg" oder bei pro-Satz "Satz 1: … / Satz 2: …".
 * Gibt Zeilen zurück, die die Anzeige frei rendern kann.
 */
export function summarizeSets(we: WorkoutExercise): { setCount: number; perSet: boolean } {
  return { setCount: getSetCount(we), perSet: getPerSetIds(we).length > 0 }
}
