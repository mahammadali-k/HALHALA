import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Lightweight 3D tilt (CSS perspective + one rAF-throttled pointer listener, no 3D library).
 * Fine-pointer devices only; a slow idle sway runs via CSS and is disabled for reduced motion.
 */
export function Tilt({ children, max = 8, sway = false, className = '' }: { children: ReactNode; max?: number; sway?: boolean; className?: string }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = outer.current, tgt = inner.current
    if (!el || !tgt || !window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
    let raf = 0
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        tgt.style.transition = 'transform 80ms linear'
        tgt.style.transform = `rotateY(${x * max * 2}deg) rotateX(${-y * max * 2}deg)`
      })
    }
    const leave = () => {
      cancelAnimationFrame(raf)
      tgt.style.transition = 'transform 600ms cubic-bezier(.22,1,.36,1)'
      tgt.style.transform = ''
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { cancelAnimationFrame(raf); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [max])

  return (
    <div ref={outer} className={`[perspective:900px] ${className}`}>
      <div ref={inner} className={`will-change-transform [transform-style:preserve-3d] ${sway ? 'sway' : ''}`}>{children}</div>
    </div>
  )
}
