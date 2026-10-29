'use client'
import { useI18n } from '@/i18n'
import { MoonIcon, SunIcon } from '@/components/ui/icons'
import { iconBtn } from '@/components/ui/styles'

/**
 * Night / morning switch. The choice lives in a cookie so the server renders the right theme on the first paint;
 * the icon is picked by CSS from <html data-theme>, so server and client markup always match.
 */
export function ThemeToggle() {
  const { t } = useI18n()
  const toggle = () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`
  }
  return (
    <button type="button" className={iconBtn} onClick={toggle} aria-label={t('theme.toggle')} title={t('theme.toggle')}>
      <span className="theme-icon-dark"><SunIcon /></span>
      <span className="theme-icon-light"><MoonIcon /></span>
    </button>
  )
}
