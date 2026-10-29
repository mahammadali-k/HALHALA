import { images } from '@/data/images'
import { catKey, type Key } from '@/i18n/core'
import type { ImageAsset } from '@/types'

export interface NavLinkItem { label: Key; to: string; hint?: Key }
export interface NavItem { label: Key; to: string; children?: NavLinkItem[]; match?: string[]; /** photo + link shown beside the dropdown */ feature?: { image: ImageAsset; href: string; label: Key } }

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
    label: 'nav.collection', to: '/collection', feature: { image: images.hero, href: '/shop', label: 'nav.all' }, match: ['/collection', '/shop', '/product'],
    children: [
      ...shopLinks,
      { label: catKey('T-Shirts'), to: '/shop?category=T-Shirts' },
      { label: catKey('Hoodies'), to: '/shop?category=Hoodies' },
    ],
  },
  {
    label: 'nav.about', to: '/about', feature: { image: images.about[0], href: '/about', label: 'nav.story' },
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
