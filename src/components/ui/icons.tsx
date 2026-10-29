import type { SVGProps } from 'react'
const I = (p: SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p} />
)
export const SearchIcon = () => <I><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></I>
export const BagIcon = () => <I><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></I>
export const MenuIcon = () => <I><path d="M4 7h16M4 12h16M4 17h16" /></I>
export const CloseIcon = () => <I><path d="M6 6l12 12M18 6 6 18" /></I>
export const FilterIcon = () => <I><path d="M4 6h16M7 12h10M10 18h4" /></I>
export const CheckIcon = () => <I><path d="m5 12 5 5 9-10" /></I>
export const SunIcon = () => <I><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></I>
export const MoonIcon = () => <I><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></I>
export const UserIcon = () => <I><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></I>
