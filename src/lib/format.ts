import { site } from '@/data/site'

export const formatPrice = (n: number) =>
  `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)} ${site.currency}`
