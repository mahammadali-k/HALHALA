'use client'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/i18n'

/** Catches render errors inside a page; the header/footer stay usable. */
export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n()
  return (
    <div className="container-x py-32 text-center">
      <h1 className="display text-h2">{t('err.boundary.t')}</h1>
      <Button className="mt-8" onClick={reset}>{t('err.boundary.retry')}</Button>
    </div>
  )
}
