import type { ReactNode } from 'react'
import { IconX } from './icons'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** Vollbild-taugliches Modal, unten andockend auf Smartphones. */
export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg bg-surface border border-border rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="btn-icon text-text-secondary hover:bg-surface-2" onClick={onClose} aria-label="Schließen">
            <IconX />
          </button>
        </div>
        <div className="p-4 overflow-y-auto grow">{children}</div>
        {footer && <div className="p-4 border-t border-border shrink-0 flex gap-3">{footer}</div>}
      </div>
    </div>
  )
}
