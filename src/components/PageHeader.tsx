import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { IconChevronLeft } from './icons'

interface Props {
  title: string
  back?: boolean
  right?: ReactNode
  subtitle?: string
}

export function PageHeader({ title, back, right, subtitle }: Props) {
  const nav = useNavigate()
  return (
    <header className="flex items-center gap-2 mb-4">
      {back && (
        <button
          className="btn-icon text-text-secondary hover:bg-surface-2 -ml-2"
          onClick={() => nav(-1)}
          aria-label="Zurück"
        >
          <IconChevronLeft />
        </button>
      )}
      <div className="grow min-w-0">
        <h1 className="text-2xl font-bold truncate">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}
