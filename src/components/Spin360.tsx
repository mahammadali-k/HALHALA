import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import type { ImageAsset } from '../types'
import { Img } from './Img'

interface Props {
  front: ImageAsset
  back?: ImageAsset
  /** Turntable frames for a true 360° (one full revolution, in order). Without them a two-face front/back spin is used. */
  frames?: string[]
  /** Seconds per full revolution — slow by design. */
  periodSec?: number
}

const AUTO_RESUME_MS = 1600

/**
 * Slow 360° viewer. Auto-rotates, can be dragged / arrow-keyed, pauses off-screen, and stays still for
 * prefers-reduced-motion users (they can still rotate it manually). The angle lives in a ref and is painted
 * straight to the DOM in requestAnimationFrame, so there are no React re-renders while it spins.
 */
export function Spin360({ front, back, frames, periodSec = 30 }: Props) {
  const { t } = useI18n()
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [playing, setPlaying] = useState(!reduced)
  const root = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const frameImg = useRef<HTMLImageElement>(null)
  const angle = useRef(0)
  const painted = useRef(NaN)
  const drag = useRef<{ x: number; a: number } | null>(null)
  const resumeAt = useRef(0)
  const onScreen = useRef(true)

  const paint = useCallback(() => {
    const a = ((angle.current % 360) + 360) % 360
    if (a === painted.current) return
    painted.current = a
    if (frames?.length) {
      const i = Math.floor((a / 360) * frames.length) % frames.length
      const el = frameImg.current
      if (el && el.dataset.i !== String(i)) { el.src = frames[i]; el.dataset.i = String(i) }
    } else if (stage.current) {
      stage.current.style.transform = `rotateY(${a.toFixed(2)}deg)`
      // darken the faces as they turn edge-on: reads as lighting on a solid object
      stage.current.style.setProperty('--shade', (0.5 + 0.5 * Math.abs(Math.cos((a * Math.PI) / 180))).toFixed(3))
    }
  }, [frames])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64) / 1000
      last = now
      if (playing && !drag.current && now >= resumeAt.current && onScreen.current) angle.current += (360 / periodSec) * dt
      paint()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, paint, periodSec])

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { onScreen.current = e.isIntersecting })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => { frames?.forEach((src) => { const i = new Image(); i.src = src }) }, [frames])

  const nudge = (deg: number) => { angle.current += deg; resumeAt.current = performance.now() + AUTO_RESUME_MS }
  const onDown = (e: React.PointerEvent) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, a: angle.current } }
  const onMove = (e: React.PointerEvent) => { if (drag.current) angle.current = drag.current.a + (e.clientX - drag.current.x) * 0.6 }
  const onUp = () => { drag.current = null; resumeAt.current = performance.now() + AUTO_RESUME_MS }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-15) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nudge(15) }
    else if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p) }
  }

  const btn = 'flex h-9 w-9 items-center justify-center border border-line text-muted transition-colors hover:border-accent-deep hover:text-fg'
  return (
    <div ref={root} className="relative">
      <div className="glow pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <div
        role="group" aria-roledescription="360° viewer" aria-label={`${t('p.spin')}: ${front.alt}`} tabIndex={0}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}
        className="relative mx-auto aspect-[4/5] w-full max-w-[34rem] cursor-grab touch-pan-y select-none [perspective:1400px] active:cursor-grabbing"
      >
        {frames?.length ? (
          <img ref={frameImg} src={frames[0]} alt={front.alt} draggable={false} className="absolute inset-0 h-full w-full object-contain" />
        ) : (
          <div ref={stage} className="absolute inset-0 [transform-style:preserve-3d]" style={{ willChange: 'transform' }}>
            {[{ img: front, flip: false }, { img: back ?? front, flip: true }].map(({ img, flip }) => (
              <div key={flip ? 'b' : 'f'} aria-hidden={flip} className="absolute inset-0 [backface-visibility:hidden]"
                style={{ transform: flip ? 'rotateY(180deg)' : undefined, filter: 'brightness(var(--shade, 1))' }}>
                <Img image={img} ratio="h-full" eager sizes="(min-width:1024px) 40vw, 90vw" />
              </div>
            ))}
          </div>
        )}
        <div aria-hidden className="absolute -bottom-3 left-1/2 h-4 w-3/5 -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl" />
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" className={btn} onClick={() => nudge(-30)} aria-label={t('p.spin.left')}>‹</button>
        <button type="button" className={`${btn} w-auto px-4 font-mono text-[0.65rem] uppercase tracking-[0.2em]`} onClick={() => setPlaying((p) => !p)} aria-pressed={playing} aria-label={t(playing ? 'p.spin.pause' : 'p.spin.play')}>
          {playing ? '❚❚' : '▶'} <span className="ml-2">360°</span>
        </button>
        <button type="button" className={btn} onClick={() => nudge(30)} aria-label={t('p.spin.right')}>›</button>
      </div>
      <p className="tag mt-3 text-center">[ {t('p.spin.hint')} ]</p>
    </div>
  )
}
