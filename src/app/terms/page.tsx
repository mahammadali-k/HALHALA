import { LegalView } from '@/features/info/LegalView'
import { titleFor } from '@/i18n/server'

export const generateMetadata = titleFor('footer.terms')
export default function Page() { return <LegalView kind="terms" /> }
