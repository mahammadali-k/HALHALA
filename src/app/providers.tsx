'use client'
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { CatalogProvider } from '@/context/CatalogContext'
import { I18nProvider, type Lang } from '@/i18n'
import type { Config, LiveCatalog, StoreSettings, User } from '@/types/api'

/** All client-side state, in one place. Initial values are produced on the server in app/layout.tsx. */
export function Providers({ lang, user, live, store, config, children }: { lang: Lang; user: User | null; live: LiveCatalog; store: StoreSettings; config: Config; children: ReactNode }) {
  return (
    <I18nProvider initialLang={lang}>
      <CatalogProvider initial={live} initialStore={store} config={config}>
        <AuthProvider initialUser={user}>
          <CartProvider>
            {/* reducedMotion="user": every animation respects prefers-reduced-motion; LazyMotion loads only the features we use */}
            <MotionConfig reducedMotion="user"><LazyMotion features={domAnimation} strict>{children}</LazyMotion></MotionConfig>
          </CartProvider>
        </AuthProvider>
      </CatalogProvider>
    </I18nProvider>
  )
}
