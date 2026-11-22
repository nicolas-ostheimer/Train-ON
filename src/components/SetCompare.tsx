import type { WorkoutExercise, ParameterValue } from '../db/types'
import { getSetCount, getPerSetIds, normalizeSets } from '../lib/sets'

/**
 * Baut eine kompakte Textdarstellung der Werte einer Übung, Satz für Satz.
 * Nutzt das Satzsystem (plannedExercise/actualExercise), fällt bei
 * Altprotokollen auf die flache Werteliste zurück.
 */
function describeSets(we: WorkoutExercise | undefined, fallback: ParameterValue[]): string[] {
  if (!we) {
    // Altprotokoll ohne Satz-Snapshot: flache Werte als eine Zeile.
    const parts = (fallback ?? [])
      .filter((v) => (v.value ?? '').trim() !== '')
      .map((v) => `${v.name}: ${v.value}${v.unit ? ' ' + v.unit : ''}`)
    return parts.length ? [parts.join(' · ')] : ['–']
  }

  const params = we.values ?? []
  if (params.length === 0) return ['–']

  const count = getSetCount(we)
  const perSet = new Set(getPerSetIds(we))
  const hasPerSet = perSet.size > 0 && count > 1

  const fmt = (v: ParameterValue | undefined) =>
    v && (v.value ?? '').trim() !== '' ? `${v.value}${v.unit ? ' ' + v.unit : ''}` : '–'

  if (!hasPerSet) {
    // Alle Sätze gleich: eine Zeile mit allen Parametern, plus Satzanzahl.
    const parts = params
      .filter((v) => (v.value ?? '').trim() !== '')
      .map((v) => `${v.name}: ${fmt(v)}`)
    const line = parts.length ? parts.join(' · ') : '–'
    return [count > 1 ? `${count}× ${line}` : line]
  }

  // Pro-Satz-Modus: gemeinsame Parameter zuerst, dann je Satz die variablen.
  const commonParams = params.filter((p) => !perSet.has(p.paramId))
  const perSetParams = params.filter((p) => perSet.has(p.paramId))
  const norm = normalizeSets(we)

  const lines: string[] = []
  const commonParts = commonParams
    .filter((v) => (v.value ?? '').trim() !== '')
    .map((v) => `${v.name}: ${fmt(v)}`)
  if (commonParts.length) lines.push(commonParts.join(' · '))

  norm.sets!.forEach((s, i) => {
    const parts = perSetParams.map((p) => {
      const v = s.values.find((x) => x.paramId === p.paramId)
      return `${p.name}: ${fmt(v)}`
    })
    lines.push(`Satz ${i + 1}: ${parts.join(' · ')}`)
  })
  return lines
}

interface LogExercise {
  name: string
  planned: ParameterValue[]
  actual: ParameterValue[]
  plannedExercise?: WorkoutExercise
  actualExercise?: WorkoutExercise
}

/**
 * Zeigt für eine protokollierte Übung Plan und Ist nebeneinander, Satz für Satz.
 * Robust gegenüber Altprotokollen (Fallback auf flache Werte).
 */
export function SetCompare({ ex }: { ex: LogExercise }) {
  const plannedLines = describeSets(ex.plannedExercise, ex.planned)
  const actualLines = describeSets(ex.actualExercise, ex.actual)

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <div className="text-xs font-semibold text-text-muted mb-1">Geplant</div>
        <div className="flex flex-col gap-1">
          {plannedLines.map((l, i) => (
            <div key={i} className="text-sm text-text-secondary">{l}</div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-accent mb-1">Tatsächlich</div>
        <div className="flex flex-col gap-1">
          {actualLines.map((l, i) => (
            <div key={i} className="text-sm">{l}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
