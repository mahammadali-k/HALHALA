'use client'
import { m } from 'motion/react'
import Link from 'next/link'
import type { ButtonHTMLAttributes, ComponentProps } from 'react'

const base =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.22em] transition-[colors,transform] disabled:cursor-not-allowed disabled:opacity-40'
const variants = {
  primary: 'bg-violet text-fg hover:bg-violet-hi border border-violet',
  outline: 'border border-line text-fg hover:border-violet hover:bg-violet/25',
  accent: 'border border-accent/70 text-accent hover:border-violet hover:bg-violet hover:text-fg',
}
type Variant = keyof typeof variants

/** Two components, one look: <Button> for actions, <ButtonLink> for navigation. */
export function Button({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <m.button whileTap={p.disabled ? undefined : { scale: 0.97 }} className={`${base} ${variants[variant]} ${className}`} {...(p as object)} />
}

export function ButtonLink({ variant = 'primary', className = '', ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} active:scale-[0.97] ${variants[variant]} ${className}`} {...p} />
}
