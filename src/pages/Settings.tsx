import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { PageHeader } from '../components/PageHeader'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import { IconDownload, IconUpload, IconChevronRight, IconHistory } from '../components/icons'
import { exportToFile, readFileAsText, validateBackup, importBackup, importDemoData, type ValidationResult } from '../db/backup'

export default function Settings() {
  const toast = useToast()
  const confirm = useConfirm()
  const nav = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<ValidationResult | null>(null)
  const [busy, setBusy] = useState(false)

  const counts = useLiveQuery(async () => {
    const [ex, tp, sc, lg] = await Promise.all([
      db.exercises.count(),
      db.templates.count(),
      db.scheduled.count(),
      db.logs.count(),
    ])
    return { ex, tp, sc, lg }
  }, [])

  const loadDemo = async () => {
    const ok = await confirm({
      title: 'Musterdaten laden?',
      message: 'Der mitgelieferte Beispiel-Trainingsplan ersetzt ALLE vorhandenen Daten vollständig. Dieser Schritt kann nicht rückgängig gemacht werden. Exportiere vorher ein Backup, falls du eigene Daten behalten willst.',
      danger: true,
      confirmLabel: 'Musterdaten laden',
    })
    if (!ok) return
    setBusy(true)
    try {
      await importDemoData()
      toast.show('Musterdaten geladen.', 'success')
    } catch (e) {
      console.error(e)
      toast.show('Musterdaten konnten nicht geladen werden.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const doExport = async () => {
    try {
      await exportToFile()
      toast.show('Backup heruntergeladen.', 'success')
    } catch (e) {
      console.error(e)
      toast.show('Export fehlgeschlagen.', 'error')
    }
  }

  const onFile = async (file: File) => {
    try {
      const text = await readFileAsText(file)
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        toast.show('Die Datei ist kein gültiges JSON.', 'error')
        return
      }
      const result = validateBackup(parsed)
      if (!result.ok) {
        toast.show(result.error ?? 'Ungültige Datei.', 'error')
        return
      }
      setPending(result)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const runImport = async (mode: 'replace' | 'merge') => {
    if (!pending?.data) return
    if (mode === 'replace') {
      const ok = await confirm({
        title: 'Daten überschreiben?',
        message: 'Alle vorhandenen Daten werden vollständig durch das Backup ersetzt. Dieser Schritt kann nicht rückgängig gemacht werden.',
        danger: true,
        confirmLabel: 'Überschreiben',
      })
      if (!ok) return
    }
    setBusy(true)
    try {
      await importBackup(pending.data, mode)
      toast.show('Import erfolgreich.', 'success')
      setPending(null)
    } catch (e) {
      console.error(e)
      toast.show('Import fehlgeschlagen.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Einstellungen" back />

      <div className="card mb-4">
        <h2 className="font-bold mb-2">Gespeicherte Daten</h2>
        {counts === undefined ? (
          <p className="text-text-muted text-sm">Lädt…</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-surface-2 rounded-lg px-3 py-2">
              <div className="text-text-muted">Übungen</div>
              <div className="text-xl font-bold">{counts.ex}</div>
            </div>
            <div className="bg-surface-2 rounded-lg px-3 py-2">
              <div className="text-text-muted">Einheiten</div>
              <div className="text-xl font-bold">{counts.tp}</div>
            </div>
            <div className="bg-surface-2 rounded-lg px-3 py-2">
              <div className="text-text-muted">Geplant</div>
              <div className="text-xl font-bold">{counts.sc}</div>
            </div>
            <div className="bg-surface-2 rounded-lg px-3 py-2">
              <div className="text-text-muted">Protokolle</div>
              <div className="text-xl font-bold">{counts.lg}</div>
            </div>
          </div>
        )}
      </div>

      <div className="card mb-4">
        <h2 className="font-bold mb-3">Verwaltung</h2>
        <div className="flex flex-col gap-2">
          <button
            className="btn-secondary w-full justify-between"
            onClick={() => nav('/historie')}
          >
            <span className="flex items-center gap-2">
              <IconHistory width={18} height={18} /> Trainingshistorie
            </span>
            <IconChevronRight width={18} height={18} />
          </button>
          <button
            className="btn-secondary w-full justify-between"
            onClick={() => nav('/kategorien')}
          >
            <span>Kategorien verwalten</span>
            <IconChevronRight width={18} height={18} />
          </button>
          <button
            className="btn-secondary w-full justify-between"
            onClick={() => nav('/trainingsarten')}
          >
            <span>Trainingsarten verwalten</span>
            <IconChevronRight width={18} height={18} />
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <h2 className="font-bold mb-1">Datensicherung</h2>
        <p className="text-sm text-text-muted mb-4">
          Deine Daten liegen nur auf diesem Gerät. Exportiere regelmäßig ein Backup.
        </p>
        <div className="flex flex-col gap-3">
          <button className="btn-primary w-full" onClick={doExport}>
            <IconDownload width={20} height={20} /> Daten exportieren (JSON)
          </button>
          <button className="btn-secondary w-full" onClick={() => fileRef.current?.click()}>
            <IconUpload width={20} height={20} /> Daten importieren
          </button>
          <button className="btn-secondary w-full" disabled={busy} onClick={loadDemo}>
            <IconDownload width={20} height={20} /> Musterdaten laden (Demo)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
            }}
          />
        </div>
      </div>

      <p className="text-xs text-text-muted text-center">
        Trial Training Planner · Version 1.4 · Alle Daten lokal (IndexedDB)
      </p>

      {/* Import-Bestätigung */}
      <Modal
        open={!!pending}
        title="Import bestätigen"
        onClose={() => setPending(null)}
        footer={
          <>
            <button className="btn-secondary flex-1" disabled={busy} onClick={() => runImport('merge')}>
              Zusammenführen
            </button>
            <button className="btn-danger flex-1" disabled={busy} onClick={() => runImport('replace')}>
              Ersetzen
            </button>
          </>
        }
      >
        {pending?.counts && (
          <div>
            <p className="text-text-secondary mb-3">Die Datei ist gültig und enthält:</p>
            <ul className="text-sm text-text-secondary space-y-1 mb-4">
              <li>• {pending.counts.exercises} Übungen</li>
              <li>• {pending.counts.templates} Trainingseinheiten</li>
              <li>• {pending.counts.scheduled} geplante Einheiten</li>
              <li>• {pending.counts.logs} Protokolle</li>
            </ul>
            <p className="text-sm text-text-muted">
              <strong className="text-text-secondary">Zusammenführen:</strong> Daten werden ergänzt bzw. bei gleicher ID aktualisiert.
              <br />
              <strong className="text-text-secondary">Ersetzen:</strong> Alle vorhandenen Daten werden gelöscht und durch das Backup ersetzt.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
