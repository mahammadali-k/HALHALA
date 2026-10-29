import { AboutView } from '@/features/about/AboutView'
import { titleFor } from '@/i18n/server'

export const generateMetadata = titleFor('nav.about')
export default function AboutPage() { return <AboutView /> }
