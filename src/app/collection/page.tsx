import { CollectionsView } from '@/features/shop/CollectionsView'
import { titleFor } from '@/i18n/server'

export const generateMetadata = titleFor('cp.title')
export default function CollectionPage() { return <CollectionsView /> }
