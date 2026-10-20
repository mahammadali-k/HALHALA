import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CatalogProvider } from './context/CatalogContext'
import { I18nProvider } from './i18n'
const About = lazy(() => import('./pages/About'))
const CartPage = lazy(() => import('./pages/CartPage'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Collections = lazy(() => import('./pages/Collections'))
const Home = lazy(() => import('./pages/Home'))
const InfoPage = lazy(() => import('./pages/Info').then((m) => ({ default: m.InfoPage })))
const ContactPage = lazy(() => import('./pages/Info').then((m) => ({ default: m.ContactPage })))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const OrderPage = lazy(() => import('./pages/OrderPage'))
const NotFound = lazy(() => import('./pages/NotFound'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const Shop = lazy(() => import('./pages/Shop'))

export default function App() {
  return (
    // reducedMotion="user" makes every motion component respect prefers-reduced-motion
    <MotionConfig reducedMotion="user"><LazyMotion features={domAnimation} strict>
      <BrowserRouter>
        <I18nProvider>
        <CatalogProvider><AuthProvider><CartProvider>
          <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="collection" element={<Collections />} />
              <Route path="product/:slug" element={<ProductPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="about" element={<About />} />
              <Route path="info" element={<InfoPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="login" element={<AuthPage mode="login" />} />
              <Route path="register" element={<AuthPage mode="register" />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="order/:number" element={<OrderPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </Suspense>
        </CartProvider></AuthProvider></CatalogProvider>
        </I18nProvider>
      </BrowserRouter>
    </LazyMotion></MotionConfig>
  )
}
