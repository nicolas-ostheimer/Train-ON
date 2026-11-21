// Datums-Hilfen. Wochenstart Montag. Lokale Zeit, ISO-Datum "YYYY-MM-DD".

export const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
export const WEEKDAYS_LONG = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
]

/** Formatiert ein Date als lokales ISO-Datum "YYYY-MM-DD" (ohne Zeitzonen-Verschiebung). */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Heutiges Datum als ISO-String. */
export function todayISO(): string {
  return toISODate(new Date())
}

/** Parst "YYYY-MM-DD" zu einem lokalen Date (Mitternacht). */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Montag der Woche, in der das Datum liegt. */
export function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // Mo=0 ... So=6
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

/** Array der 7 Tage (Mo–So) ab Wochenstart. */
export function weekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export function addWeeks(d: Date, weeks: number): Date {
  return addDays(d, weeks * 7)
}

/** ISO-Kalenderwoche (1–53). */
export function isoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3)
  const diff = date.getTime() - firstThursday.getTime()
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000))
}

/** Langes deutsches Datum, z.B. "Freitag, 20. November 2026". */
export function formatLongDate(d: Date): string {
  return d.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Kurzes Datum, z.B. "20.11." */
export function formatShortDate(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

/** Prüft, ob ein ISO-Datum heute ist. */
export function isToday(iso: string): boolean {
  return iso === todayISO()
}
