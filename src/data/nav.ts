import type { Key } from '@/i18n/core'
import { colKey } from '@/i18n/core'
import { collections } from '@/data/products'

export interface NavLinkItem { label: Key; to: string; hint?: Key }
export interface NavItem { label: Key; to: string; children?: NavLinkItem[]; match?: string[]; /** collection id whose photo is shown in the dropdown */ feature?: string }

/** Collection links shared by the header dropdown and the footer. */
export const shopLinks: NavLinkItem[] = [
  { label: 'nav.all', to: '/shop', hint: 'nav.all.hint' },
  { label: 'nav.new', to: '/shop?sort=newest', hint: 'nav.new.hint' },
  { label: 'nav.best', to: '/shop?sort=featured', hint: 'nav.best.hint' },
  { label: 'nav.instock', to: '/shop?stock=1', hint: 'nav.instock.hint' },
]

/** Single source of truth for the header, the mobile menu and the footer. `match` = path prefixes that mark the item active. */
export const nav: NavItem[] = [
  { label: 'menu.home', to: '/' },
  {
    label: 'nav.collection', to: '/collection', feature: 'mountain-goat', match: ['/collection', '/shop', '/product'],
    children: [
      ...shopLinks,
      ...collections.map((c) => ({ label: colKey(c.id, 'title'), to: `/shop?collection=${c.id}`, hint: colKey(c.id, 'blurb') })),
    ],
  },
  {
    label: 'nav.about', to: '/about', feature: 'limited',
    children: [
      { label: 'nav.story', to: '/about', hint: 'nav.story.hint' },
      { label: 'nav.lookbook', to: '/#lookbook', hint: 'nav.lookbook.hint' },
      { label: 'nav.delivery', to: '/info', hint: 'nav.delivery.hint' },
    ],
  },
  {
    label: 'nav.contact', to: '/contact',
    children: [
      { label: 'nav.message', to: '/contact', hint: 'nav.message.hint' },
      { label: 'nav.faq', to: '/contact#faq', hint: 'nav.faq.hint' },
    ],
  },
]

/** Which "[ SECTION ]" label the header shows for a path. */
export const sectionTag = (path: string): Key =>
  path === '/' ? 'tag.home'
  : path.startsWith('/shop') || path.startsWith('/collection') ? 'tag.collection'
  : path.startsWith('/product') ? 'tag.product'
  : path.startsWith('/about') ? 'tag.about'
  : path.startsWith('/contact') ? 'tag.contact'
  : path.startsWith('/info') ? 'tag.info'
  : path.startsWith('/cart') ? 'tag.cart'
  : path.startsWith('/checkout') ? 'tag.checkout'
  : path.startsWith('/order') ? 'tag.order'
  : path.startsWith('/admin') ? 'tag.admin'
  : path.startsWith('/account') || path.startsWith('/login') || path.startsWith('/register') ? 'tag.account'
  : 'tag.home'
