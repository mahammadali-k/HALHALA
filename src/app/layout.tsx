import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Montserrat, Pirata_One } from 'next/font/google'
import { AddedToast } from '@/features/cart/AddedToast'
import { CartDrawer } from '@/features/cart/CartDrawer'
import { ChatLauncher } from '@/components/chat/ChatLauncher'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { getSessionUser } from '@/server/auth'
import { liveCatalog, publicConfig } from '@/server/catalog'
import { getLang, getT } from '@/i18n/server'
import { Providers } from './providers'
import './globals.css'

// Self-hosted fonts (downloaded at build time → no render-blocking request to Google at runtime).
const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-inter', display: 'swap' })
const montserrat = Montserrat({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['700', '800', '900'], variable: '--font-montserrat', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500'], variable: '--font-jetbrains', display: 'swap' })
const pirata = Pirata_One({ subsets: ['latin', 'latin-ext'], weight: '400', variable: '--font-pirata', display: 'swap' })

const siteUrl = process.env.PUBLIC_URL || 'http://localhost:3000'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t('meta.title'), template: '%s — HALHALA' },
    description: t('meta.description'),
    openGraph: { type: 'website', siteName: 'HALHALA', title: t('meta.title'), description: t('meta.description'), images: [{ url: '/images/laundry-side-1200.webp' }] },
    twitter: { card: 'summary_large_image' },
    icons: { icon: '/favicon.svg' },
  }
}
export const viewport: Viewport = { themeColor: '#09070d', width: 'device-width', initialScale: 1 }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Everything the client needs to render correctly on the very first paint.
  const [lang, user] = await Promise.all([getLang(), getSessionUser()])
  return (
    <html lang={lang} className={`${inter.variable} ${montserrat.variable} ${jetbrains.variable} ${pirata.variable}`}>
      <body>
        <Providers lang={lang} user={user} live={liveCatalog()} config={publicConfig()}>
          <Header />
          <main id="main" tabIndex={-1} className="outline-none">{children}</main>
          <Footer />
          <CartDrawer />
          <AddedToast />
          <ChatLauncher />
        </Providers>
      </body>
    </html>
  )
}
