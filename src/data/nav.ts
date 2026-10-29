import type { Key } from '../i18n/en'
import { colKey } from '../i18n'
import { collections } from './products'

export interface NavLinkItem { label: Key; to: string; hint?: Key }
export interface NavItem { label: Key; to: string; children?: NavLinkItem[]; /** collection id whose photo is shown in the dropdown */ feature?: string }

/** Single source of truth for header, mobile menu and footer navigation (labels are dictionary keys). */
export const nav: NavItem[] = [
  { label: 'menu.home', to: '/' },
  {
    label: 'nav.shop', to: '/shop', feature: 'mountain-goat',
    children: [
      { label: 'nav.all', to: '/shop', hint: 'nav.all.hint' },
      { label: 'nav.new', to: '/shop?sort=newest', hint: 'nav.new.hint' },
      { label: 'nav.best', to: '/shop?sort=featured', hint: 'nav.best.hint' },
      { label: 'nav.instock', to: '/shop?stock=1', hint: 'nav.instock.hint' },
    ],
  },
  {
    label: 'nav.collection', to: '/collection', feature: 'essentials',
    children: [
      ...collections.map((c) => ({ label: colKey(c.id, 'title'), to: `/shop?collection=${c.id}`, hint: colKey(c.id, 'blurb') })),
      { label: 'nav.allcollections', to: '/collection' },
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
