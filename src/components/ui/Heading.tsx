import type { ReactNode } from 'react'
import { Reveal } from '@/components/ui/Reveal'


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
        <Tag id={id} className={`display mt-3 ${size === 'lg' ? 'text-h1' : 'text-h2'}`}>{title}</Tag>
      </div>
      {action}
    </div>
  )
  return reveal ? <Reveal>{body}</Reveal> : body
}
