/** Inline success / error message (announced to screen readers). */
export function Notice({ kind, children }: { kind: 'ok' | 'error'; children: React.ReactNode }) {
  return kind === 'error'
    ? <p role="alert" className="border border-danger/50 p-3 text-sm text-danger">{children}</p>
    : <p role="status" className="text-sm text-emerald-300">{children}</p>
}
