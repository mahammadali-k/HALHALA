import { m } from 'motion/react'
import { Link, type LinkProps } from 'react-router-dom'
import type { ButtonHTMLAttributes } from 'react'

const base =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs font-medium uppercase tracking-[0.2em] transition-[colors,transform] disabled:cursor-not-allowed disabled:opacity-40'
const variants = {
  primary: 'bg-burgundy text-fg hover:bg-burgundy-hi border border-burgundy',
  outline: 'border border-line text-fg hover:border-burgundy hover:bg-burgundy/25',
  gold: 'border border-gold/70 text-gold hover:border-burgundy hover:bg-burgundy hover:text-fg',
}
type Variant = keyof typeof variants

export function Button({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <m.button whileTap={p.disabled ? undefined : { scale: 0.97 }} className={`${base} ${variants[variant]} ${className}`} {...(p as object)} />
  )
}

export function ButtonLink({ variant = 'primary', className = '', ...p }: LinkProps & { variant?: Variant }) {
  return <Link className={`${base} active:scale-[0.97] ${variants[variant]} ${className}`} {...p} />
}
