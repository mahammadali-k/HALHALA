import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AddedToast } from './AddedToast'
import { ChatLauncher } from './ChatLauncher'
import { CartDrawer } from './CartDrawer'
import { Footer } from './Footer'
import { Header } from './Header'

export function Layout() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none"><Outlet /></main>
      <Footer />
      <CartDrawer />
      <AddedToast />
      <ChatLauncher />
    </>
  )
}
