import type { WorkoutExercise } from '../db/types'
import { getSetCount, getPerSetIds, normalizeSets } from '../lib/sets'

/**
 * Nur-Lese-Anzeige der Sätze/Werte einer Übung (für Detail- und Abschluss-Ansicht).
 * Zeigt bei "gleich für alle" eine Zeile, bei "pro Satz" je Satz eine Zeile.
 * Funktioniert auch für Bestandsübungen ohne Satzsystem (dann 1 Satz aus values).
 */
export function SetSummary({ we }: { we: WorkoutExercise }) {
  const params = we.values ?? []
  if (params.length === 0) {
    return <p className="text-sm text-text-muted">Keine Parameter.</p>
  }

  const count = getSetCount(we)
  const perSet = new Set(getPerSetIds(we))
  const hasPerSet = perSet.size > 0 && count > 1

  // Gemeinsame Parameter (gleich für alle Sätze)
  const commonParams = params.filter((p) => !perSet.has(p.paramId) || count <= 1)
  const perSetParams = params.filter((p) => perSet.has(p.paramId) && count > 1)

  const norm = hasPerSet ? normalizeSets(we) : we

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-text-muted">
        {count} Satz{count === 1 ? '' : 'ze'}
      </div>

      {commonParams.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {commonParams.map((v) => (
            <div key={v.paramId} className="bg-surface-2 rounded-lg px-3 py-2">
              <div className="text-xs text-text-muted truncate">
                {v.name}{v.unit ? ` (${v.unit})` : ''}
              </div>
              <div className="font-medium">{v.value || '–'}</div>
            </div>
          ))}
        </div>
      )}

      {hasPerSet &&
        perSetParams.length > 0 &&
        norm.sets!.map((s, i) => (
          <div key={s.id} className="bg-surface-2 rounded-lg px-3 py-2">
            <div className="text-xs text-text-muted mb-1">Satz {i + 1}</div>
            <div className="grid grid-cols-2 gap-2">
              {perSetParams.map((p) => {
                const v = s.values.find((x) => x.paramId === p.paramId)
                return (
                  <div key={p.paramId}>
                    <div className="text-xs text-text-muted truncate">
                      {p.name}{p.unit ? ` (${p.unit})` : ''}
                    </div>
                    <div className="font-medium">{v?.value || '–'}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
    </div>
  )
}
