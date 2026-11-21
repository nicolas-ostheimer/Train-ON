import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Modal } from './Modal'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const Ctx = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useConfirm muss innerhalb von ConfirmProvider genutzt werden.')
  return ctx
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    opts: ConfirmOptions
    resolve: (v: boolean) => void
  } | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      setState({ opts, resolve })
    })
  }, [])

  const close = (value: boolean) => {
    state?.resolve(value)
    setState(null)
  }

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        title={state?.opts.title ?? 'Bestätigen'}
        onClose={() => close(false)}
        footer={
          <>
            <button className="btn-secondary flex-1" onClick={() => close(false)}>
              {state?.opts.cancelLabel ?? 'Abbrechen'}
            </button>
            <button
              className={(state?.opts.danger ? 'btn-danger' : 'btn-primary') + ' flex-1'}
              onClick={() => close(true)}
            >
              {state?.opts.confirmLabel ?? 'OK'}
            </button>
          </>
        }
      >
        <p className="text-text-secondary leading-relaxed">{state?.opts.message}</p>
      </Modal>
    </Ctx.Provider>
  )
}
