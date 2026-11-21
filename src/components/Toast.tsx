import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastKind = 'info' | 'success' | 'error'
interface Toast {
  id: number
  message: string
  kind: ToastKind
}

interface ToastCtx {
  show: (message: string, kind?: ToastKind) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast muss innerhalb von ToastProvider genutzt werden.')
  return ctx
}

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++counter
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3200)
  }, [])

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none"
        style={{ bottom: 'calc(80px + var(--safe-bottom))' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              'pointer-events-auto max-w-sm w-full rounded-xl px-4 py-3 text-sm font-medium shadow-lg border ' +
              (t.kind === 'success'
                ? 'bg-surface-2 border-success text-text-primary'
                : t.kind === 'error'
                  ? 'bg-surface-2 border-danger text-text-primary'
                  : 'bg-surface-2 border-border text-text-primary')
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
