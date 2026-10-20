import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

export const goldLink = 'border-b border-gold pb-0.5 text-xs uppercase tracking-[0.2em] text-gold transition-colors hover:border-gold-deep hover:text-gold-deep'
export const mutedLink = 'text-sm text-muted transition-colors hover:text-fg'
export const underlineBtn = 'text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-fg hover:underline'

interface HeadingProps {
  eyebrow?: string
  title: ReactNode
  as?: 'h1' | 'h2'
  size?: 'md' | 'lg'
  id?: string
  action?: ReactNode
  reveal?: boolean
  className?: string
}

/** Eyebrow + display heading (+ optional right-hand action). Used by every page and section. */
export function Heading({ eyebrow, title, as: Tag = 'h2', size = 'md', id, action, reveal = true, className = '' }: HeadingProps) {
  const body = (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Tag id={id} className={`display mt-3 ${size === 'lg' ? 'text-5xl md:text-7xl' : 'text-5xl md:text-6xl'}`}>{title}</Tag>
      </div>
      {action}
    </div>
  )
  return reveal ? <Reveal>{body}</Reveal> : body
}
