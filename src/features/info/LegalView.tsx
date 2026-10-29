'use client'
import { Heading } from '@/components/ui/Heading'
import { useCatalog } from '@/context/CatalogContext'
import { useI18n } from '@/i18n'
import { policyText } from '@/lib/store'
import { Policy } from './InfoView'

/** Privacy policy / terms: the text is written by the brand in the admin panel; until then a "not published" notice is shown. */
export function LegalView({ kind }: { kind: 'privacy' | 'terms' }) {
  const { t, lang } = useI18n()
  const { store } = useCatalog()
  const title = t(`footer.${kind}`)
  return (
    <div className="container-x max-w-3xl pt-14">
      <Heading as="h1" size="lg" title={title} reveal={false} />
      <Policy id={kind} title={title} text={policyText(store, kind, lang)} topic={title} />
    </div>
  )
}
