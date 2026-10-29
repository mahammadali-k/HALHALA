import { ContactView } from '@/features/contact/ContactView'
import { titleFor } from '@/i18n/server'

export const generateMetadata = titleFor('nav.contact')
export default function ContactPage() { return <ContactView /> }
