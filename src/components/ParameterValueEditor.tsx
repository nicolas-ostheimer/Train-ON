import type { ParameterValue } from '../db/types'

interface Props {
  values: ParameterValue[]
  onChange: (next: ParameterValue[]) => void
  compact?: boolean
}

/** Eingabe konkreter Werte für die Parameter einer Übung (Zielwerte oder Ist-Werte). */
export function ParameterValueEditor({ values, onChange }: Props) {
  if (values.length === 0) {
    return <p className="text-sm text-text-muted">Diese Übung hat keine Parameter.</p>
  }

  const update = (paramId: string, value: string) => {
    onChange(values.map((v) => (v.paramId === paramId ? { ...v, value } : v)))
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {values.map((v) => (
        <div key={v.paramId} className="field">
          <label className="truncate">
            {v.name}
            {v.unit ? ` (${v.unit})` : ''}
          </label>
          {v.type === 'select' ? (
            (() => {
              const opts = v.options ?? []
              const extra = v.value && !opts.includes(v.value) ? [v.value] : []
              return (
                <select value={v.value} onChange={(e) => update(v.paramId, e.target.value)}>
                  <option value="">— bitte wählen —</option>
                  {[...extra, ...opts].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )
            })()
          ) : (
            <input
              type={v.type === 'number' ? 'number' : 'text'}
              inputMode={v.type === 'number' ? 'decimal' : 'text'}
              value={v.value}
              onChange={(e) => update(v.paramId, e.target.value)}
              placeholder="Wert"
            />
          )}
        </div>
      ))}
    </div>
  )
}
