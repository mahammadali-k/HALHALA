'use client'
import { m } from 'motion/react'
import Link from 'next/link'
import type { ButtonHTMLAttributes, ComponentProps } from 'react'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-[colors,transform,box-shadow] disabled:cursor-not-allowed disabled:opacity-40'
const variants = {
  primary: 'bg-violet text-on-violet shadow-[0_10px_34px_-10px_rgb(109_63_224/0.9)] hover:bg-violet-hi',
  outline: 'border border-white/20 text-fg hover:bg-white/10',
  accent: 'border border-white/40 text-fg hover:bg-violet hover:border-violet',
}
type Variant = keyof typeof variants

/** Two components, one look: <Button> for actions, <ButtonLink> for navigation. */
export function Button({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <m.button whileTap={p.disabled ? undefined : { scale: 0.97 }} className={`${base} ${variants[variant]} ${className}`} {...(p as object)} />
}

export function ButtonLink({ variant = 'primary', className = '', ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} active:scale-[0.97] ${variants[variant]} ${className}`} {...p} />
}
