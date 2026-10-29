import { InfoView } from '@/features/info/InfoView'
import { titleFor } from '@/i18n/server'

export const generateMetadata = titleFor('info.title')
export default function InfoPage() { return <InfoView /> }
