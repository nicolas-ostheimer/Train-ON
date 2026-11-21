import type { WorkoutExercise } from '../db/types'
import {
  getSetCount,
  getPerSetIds,
  setSetCount,
  togglePerSet,
  setCommonValue,
  setPerSetValue,
  normalizeSets,
} from '../lib/sets'
import { IconPlus } from './icons'

interface Props {
  we: WorkoutExercise
  onChange: (next: WorkoutExercise) => void
}

/**
 * Editor für das flexible Satzsystem einer Übung (Feature 5).
 * - Satzanzahl einstellbar
 * - pro Parameter wählbar: gleich für alle Sätze oder individuell pro Satz
 * - bei "gleich" nur ein Eingabefeld, bei "individuell" ein Feld je Satz
 */
export function SetEditor({ we, onChange }: Props) {
  const params = we.values ?? []
  const count = getSetCount(we)
  const perSet = new Set(getPerSetIds(we))

  if (params.length === 0) {
    return <p className="text-sm text-text-muted">Diese Übung hat keine Parameter.</p>
  }

  const norm = normalizeSets(we)

  const inputType = (type: string) => (type === 'number' ? 'number' : 'text')
  const inputMode = (type: string) => (type === 'number' ? 'decimal' : 'text')

  return (
    <div className="flex flex-col gap-3">
      {/* Satzanzahl */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm text-text-secondary font-medium">Sätze</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-icon bg-surface border border-border text-text-primary w-9 h-9"
            onClick={() => onChange(setSetCount(we, count - 1))}
            aria-label="Weniger Sätze"
          >
            –
          </button>
          <span className="w-8 text-center font-bold text-lg">{count}</span>
          <button
            type="button"
            className="btn-icon bg-surface border border-border text-text-primary w-9 h-9"
            onClick={() => onChange(setSetCount(we, count + 1))}
            aria-label="Mehr Sätze"
          >
            <IconPlus width={16} height={16} />
          </button>
        </div>
      </div>

      {/* Pro Parameter: Modus + Eingabe */}
      <div className="flex flex-col gap-3">
        {params.map((p) => {
          const isPerSet = perSet.has(p.paramId)
          return (
            <div key={p.paramId} className="bg-surface border border-border rounded-lg p-2.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium truncate">
                  {p.name}
                  {p.unit ? ` (${p.unit})` : ''}
                </span>
                {count > 1 && (
                  <label className="flex items-center gap-1.5 text-xs text-text-muted shrink-0 select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-accent"
                      style={{ width: 16, height: 16 }}
                      checked={isPerSet}
                      onChange={(e) => onChange(togglePerSet(we, p.paramId, e.target.checked))}
                    />
                    pro Satz
                  </label>
                )}
              </div>

              {!isPerSet || count <= 1 ? (
                // Ein gemeinsames Feld für alle Sätze
                <input
                  type={inputType(p.type)}
                  inputMode={inputMode(p.type) as 'decimal' | 'text'}
                  placeholder="Wert"
                  value={p.value}
                  onChange={(e) => onChange(setCommonValue(we, p.paramId, e.target.value))}
                />
              ) : (
                // Ein Feld pro Satz
                <div className="flex flex-col gap-1.5">
                  {norm.sets!.map((s, i) => {
                    const v = s.values.find((x) => x.paramId === p.paramId)
                    return (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className="text-xs text-text-muted w-12 shrink-0">Satz {i + 1}</span>
                        <input
                          type={inputType(p.type)}
                          inputMode={inputMode(p.type) as 'decimal' | 'text'}
                          placeholder="Wert"
                          value={v?.value ?? ''}
                          onChange={(e) => onChange(setPerSetValue(we, i, p.paramId, e.target.value))}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
