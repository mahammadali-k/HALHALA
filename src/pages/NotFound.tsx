import { ButtonLink } from '../components/Button'
import { useI18n } from '../i18n'

export default function NotFound({ what = 'page' }: { what?: 'page' | 'product' }) {
  const { t } = useI18n()
  return (
    <div className="container-x py-40 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-4 text-6xl">{t(what === 'product' ? 'nf.product' : 'nf.page')}</h1>
      <p className="mt-4 text-muted">{t('nf.d')}</p>
      <ButtonLink to="/shop" className="mt-8">{t('nf.back')}</ButtonLink>
    </div>
  )
}
