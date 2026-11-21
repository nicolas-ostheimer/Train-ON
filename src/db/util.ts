import type { ID } from './types'

/** Erzeugt eine eindeutige ID (bevorzugt crypto.randomUUID). */
export function newId(): ID {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

/** Aktueller Zeitstempel in Millisekunden. */
export function now(): number {
  return Date.now()
}

/** Tiefe Kopie (für unabhängige Snapshots). */
export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}
