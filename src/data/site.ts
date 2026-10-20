/**
 * Brand/contact facts. Only values seen on the brand's Instagram profile are filled in.
 * Anything `null` is unknown — the UI hides it rather than inventing it. Fill these in when confirmed.
 */
export const site = {
  name: 'HALHALA',
  tagline: 'The mountain goat is up high',
  instagramHandle: 'halhala.az',
  instagramUrl: 'https://www.instagram.com/halhala.az/',
  /** Orders are currently taken via Instagram DM ("Shop via DM" in the bio). */
  dmUrl: 'https://ig.me/m/halhala.az',
  /** Brand TikTok profile (provided by the owner). Set to null to hide every TikTok button. */
  tiktokUrl: 'https://www.tiktok.com/@halhala.az' as string | null,
  // TODO(owner): confirm and fill in. Left null on purpose — not invented.
  email: null as string | null,
  phone: null as string | null,
  address: null as string | null,
  // TODO(owner): official policy text. The Instagram profile has a "Delivery" highlight; no terms are published here.
  deliveryPolicy: null as string | null,
  returnsPolicy: null as string | null,
  currency: 'AZN',
}
