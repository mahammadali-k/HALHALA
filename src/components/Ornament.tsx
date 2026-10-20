/** Small carpet-inspired divider (inline SVG, no request). Decorative only. */
export function Ornament({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center gap-4 text-gold/70 ${className}`}>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold/50 sm:w-32" />
      <svg width="46" height="14" viewBox="0 0 46 14" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M2 7 7 2l5 5-5 5-5-5Z" /><path d="M17 7l6-6 6 6-6 6-6-6Z" fill="currentColor" fillOpacity=".25" /><path d="M34 7l5-5 5 5-5 5-5-5Z" />
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold/50 sm:w-32" />
    </div>
  )
}
