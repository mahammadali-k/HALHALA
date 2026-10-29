import { ButtonLink } from '@/components/ui/Button'
import { getT } from '@/i18n/server'

export default async function NotFound() {
  const t = await getT()
  return (
    <div className="container-x py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-4 text-h1">{t('nf.page')}</h1>
      <p className="mt-4 text-muted">{t('nf.d')}</p>
      <ButtonLink href="/shop" className="mt-8">{t('nf.back')}</ButtonLink>
    </div>
  )
}
