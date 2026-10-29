import type { ReactNode } from 'react'

interface Props {
  id: string
  label: string
  /** e.g. " (optional)" */
  optional?: string
  hint?: string
  error?: string
  children: ReactNode
}

/** Label + control + hint/error — the single form-field wrapper used by checkout, auth, account, contact and admin. */
export function Field({ id, label, optional, hint, error, children }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
        {label}{optional && <span className="normal-case tracking-normal">{optional}</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  )
}
