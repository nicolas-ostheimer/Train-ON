import type { ExerciseParameter, ParameterType } from '../db/types'
import { newId } from '../db/util'
import { IconPlus, IconTrash, IconArrowUp, IconArrowDown } from './icons'

interface Props {
  value: ExerciseParameter[]
  onChange: (next: ExerciseParameter[]) => void
}

const TYPE_LABELS: Record<ParameterType, string> = {
  number: 'Zahl',
  text: 'Text',
  select: 'Auswahl',
}

/**
 * Editor für die flexiblen, benutzerdefinierten Parameter einer Übung.
 * Der Benutzer legt Name, Typ, Einheit und (bei Auswahl) Optionen selbst fest.
 */
export function ParameterDefEditor({ value, onChange }: Props) {
  const update = (id: string, patch: Partial<ExerciseParameter>) => {
    onChange(value.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }
  const remove = (id: string) => onChange(value.filter((p) => p.id !== id))
  const add = () =>
    onChange([...value, { id: newId(), name: '', type: 'number', unit: '' }])
  const move = (index: number, dir: -1 | 1) => {
    const next = [...value]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 && (
        <p className="text-sm text-text-muted">
          Noch keine Parameter. Lege selbst fest, was du bei dieser Übung erfassen willst
          (z.B. Sätze, Höhe, Dauer, Versuche).
        </p>
      )}

      {value.map((p, i) => (
        <div key={p.id} className="bg-surface-2 border border-border rounded-xl p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              className="grow"
              placeholder="Parametername (z.B. Sätze)"
              value={p.name}
              onChange={(e) => update(p.id, { name: e.target.value })}
            />
            <button className="btn-icon text-text-muted hover:bg-border" onClick={() => move(i, -1)} aria-label="Nach oben">
              <IconArrowUp width={18} height={18} />
            </button>
            <button className="btn-icon text-text-muted hover:bg-border" onClick={() => move(i, 1)} aria-label="Nach unten">
              <IconArrowDown width={18} height={18} />
            </button>
            <button className="btn-icon text-danger hover:bg-border" onClick={() => remove(p.id)} aria-label="Entfernen">
              <IconTrash width={18} height={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="field">
              <label>Typ</label>
              <select
                value={p.type}
                onChange={(e) =>
                  update(p.id, {
                    type: e.target.value as ParameterType,
                    options: e.target.value === 'select' ? p.options ?? [] : undefined,
                  })
                }
              >
                {(Object.keys(TYPE_LABELS) as ParameterType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Einheit (optional)</label>
              <input
                placeholder="z.B. kg, cm, min"
                value={p.unit ?? ''}
                onChange={(e) => update(p.id, { unit: e.target.value })}
              />
            </div>
          </div>

          {p.type === 'select' && (
            <div className="field">
              <label>Auswahloptionen (durch Komma getrennt)</label>
              <input
                placeholder="z.B. leicht, mittel, schwer"
                value={(p.options ?? []).join(', ')}
                onChange={(e) =>
                  update(p.id, {
                    options: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          )}

          <div className="field">
            <label>Vorgabewert (optional)</label>
            <input
              placeholder="Standardwert"
              value={p.defaultValue ?? ''}
              onChange={(e) => update(p.id, { defaultValue: e.target.value })}
            />
          </div>
        </div>
      ))}

      <button className="btn-secondary w-full" onClick={add}>
        <IconPlus width={18} height={18} /> Parameter hinzufügen
      </button>
    </div>
  )
}
