import { site } from '@/data/site'
import { makeT, prodKey, type Lang } from '@/i18n'
import { dmChannels } from '@/lib/contact'
import { isSoldOut, stockFor } from '@/lib/catalog'
import { formatPrice } from '@/lib/format'
import type { Product, Size } from '@/types'

/**
 * Built-in assistant engine (offline fallback). Fully client-side: answers from the real catalogue/cart/site data
 * and says so when something isn't published. Rule-based, not an LLM — the live AI chat in ChatPanel talks to
 * the server (server/index.mjs) and falls back to this when that server isn't reachable.
 */
export interface BotAction { label: string; href?: string; handoff?: boolean }
export interface BotReply { text: string; actions?: BotAction[] }
/** `products` must be the LIVE catalogue (useCatalog().products) so stock and prices are current. */
export interface Ctx { count: number; total: number; payments: string[]; products: Product[] }

// Lowercase, map Azerbaijani letters to Latin base letters, keep Latin + Cyrillic.
const fold = (s: string) =>
  s.toLowerCase().replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .replace(/ё/g, 'е').replace(/[^a-z0-9\sа-я]/g, ' ').replace(/\s+/g, ' ').trim()
const any = (t: string, words: string[]) => words.some((w) => t.includes(w))
const L = (lang: Lang, en: string, az: string, ru: string) => (lang === 'az' ? az : lang === 'ru' ? ru : en)

const STOP = new Set(['halhala', 'tee', 'tshirt', 'shirt', 'the', 'and'])
const matchProduct = (t: string, products: Product[]): Product | undefined => {
  let best: { p: Product; score: number } | undefined
  for (const p of products) {
    const words = fold(p.name).split(' ').filter((w) => w.length > 2 && !STOP.has(w))
    const score = words.filter((w) => t.includes(w)).length
    if (score > 0 && (!best || score > best.score)) best = { p, score }
  }
  return best?.p
}
const sizeOf = (t: string): Size | undefined =>
  (['XXL', 'XL', 'L', 'M', 'S'] as const).find((s) => new RegExp(`(^|\\s)${s.toLowerCase()}(\\s|$)`).test(t))

const sizesLine = (p: Product, lang: Lang) => {
  const sizes = Object.keys(p.stock) as Size[]
  const ok = sizes.filter((s) => stockFor(p, s) > 0)
  const out = sizes.filter((s) => stockFor(p, s) === 0)
  if (!ok.length) return L(lang, 'All sizes are currently sold out.', 'Hazırda bütün ölçülər bitib.', 'Сейчас все размеры распроданы.')
  const a = L(lang, `Available sizes: ${ok.join(', ')}.`, `Mövcud ölçülər: ${ok.join(', ')}.`, `Доступные размеры: ${ok.join(', ')}.`)
  const b = out.length ? L(lang, ` Sold out: ${out.join(', ')}.`, ` Bitib: ${out.join(', ')}.`, ` Нет в наличии: ${out.join(', ')}.`) : ''
  return a + b
}
const openProduct = (p: Product, lang: Lang): BotAction[] => [{ label: L(lang, `Open ${p.name}`, `${p.name} səhifəsi`, `Открыть: ${p.name}`), href: `/product/${p.slug}` }]
const list = (items: Product[]): BotAction[] => items.map((x) => ({ label: `${x.name} · ${formatPrice(x.price)}`, href: `/product/${x.slug}` }))

export const quickReplies = (lang: Lang) => {
  const t = makeT(lang)
  return [t('chat.quick.best'), t('chat.quick.order'), t('chat.quick.delivery'), t('chat.quick.person')]
}

export function reply(input: string, ctx: Ctx, lang: Lang): BotReply {
  const t = fold(input)
  const tt = makeT(lang)
  const { products } = ctx
  const handoff: BotAction = { label: L(lang, 'Message the team', 'Komandaya yaz', 'Написать команде'), handoff: true }
  const infoPage: BotAction = { label: tt('nav.delivery'), href: '/info' }
  const channels = dmChannels.map((c) => c.label).join(L(lang, ' and ', ' və ', ' и '))

  if (!t) return { text: L(lang, 'Type a question and I will help.', 'Sualınızı yazın, kömək edim.', 'Напишите вопрос — я помогу.') }

  if (any(t, ['operator', 'human', 'person', 'insan', 'canli', 'agent', 'admin', 'komanda', 'team', 'оператор', 'человек', 'менеджер', 'команд', 'живой']))
    return { text: L(lang, 'I will hand you to the team. Choose a channel — your message is pre-written and copied for you.', 'Sizi komandaya yönləndirirəm. Kanalı seçin — mesaj hazırdır və avtomatik kopyalanır.', 'Передаю вас команде. Выберите канал — сообщение уже готово и копируется автоматически.'), actions: [handoff] }

  if (/^(hi|hello|hey|salam|merhaba|привет|здравствуйте|здраствуйте|добрый)\b/.test(t) && t.split(' ').length < 4)
    return { text: L(lang, 'Hi! I can show products, check sizes, explain ordering or connect you with the team.', 'Salam! Məhsulları göstərə, ölçüləri yoxlaya, sifarişi izah edə və ya sizi komandaya qoşa bilərəm.', 'Здравствуйте! Могу показать товары, проверить размеры, объяснить порядок заказа или связать вас с командой.') }

  if (any(t, ['sebet', 'cart', 'checkout', 'basket', 'корзин', 'оформ']))
    return ctx.count
      ? { text: L(lang, `You have ${ctx.count} item(s) in your cart — ${formatPrice(ctx.total)}.`, `Səbətinizdə ${ctx.count} məhsul var — ${formatPrice(ctx.total)}.`, `В корзине товаров: ${ctx.count} — ${formatPrice(ctx.total)}.`), actions: [{ label: tt('cart.view'), href: '/cart' }, { label: tt('cart.checkout'), href: '/checkout' }] }
      : { text: tt('cart.empty'), actions: [{ label: tt('cart.continue'), href: '/shop' }] }

  if (any(t, ['odenis', 'payment', 'pay ', 'card', 'оплат', 'карт']))
    return { text: ctx.payments.includes('card')
      ? L(lang, 'You can pay online by card on the bank’s secure page, or pay on delivery. Choose at checkout.', 'Bankın təhlükəsiz səhifəsində kartla onlayn ödəyə və ya çatdırılma zamanı ödəyə bilərsiniz. Sifariş zamanı seçin.', 'Можно оплатить картой онлайн на защищённой странице банка или при получении. Выберите при оформлении.')
      : L(lang, 'You can pay on delivery. Online card payment is not enabled yet.', 'Çatdırılma zamanı ödəyə bilərsiniz. Kartla onlayn ödəniş hələ aktiv deyil.', 'Можно оплатить при получении. Онлайн-оплата картой пока не включена.'),
      actions: [{ label: tt('cart.checkout'), href: '/checkout' }] }

  if (any(t, ['catdirilma', 'catdirma', 'delivery', 'shipping', 'cargo', 'достав']))
    return { text: site.deliveryPolicy ?? L(lang, 'Delivery terms are not published on the site yet — the brand confirms them when you order. I can send your question to the team.', 'Çatdırılma şərtləri hələ saytda dərc olunmayıb — brend sifariş zamanı təsdiq edir. Sualınızı komandaya göndərə bilərəm.', 'Условия доставки пока не опубликованы — бренд подтверждает их при заказе. Могу отправить ваш вопрос команде.'), actions: [infoPage, handoff] }

  if (any(t, ['qaytarma', 'return', 'refund', 'exchange', 'deyis', 'возврат', 'обмен', 'вернуть']))
    return { text: site.returnsPolicy ?? L(lang, 'Return terms are not published on the site yet — the brand confirms them when you order. I can send your question to the team.', 'Qaytarma şərtləri hələ saytda dərc olunmayıb — brend sifariş zamanı təsdiq edir. Sualınızı komandaya göndərə bilərəm.', 'Условия возврата пока не опубликованы — бренд подтверждает их при заказе. Могу отправить ваш вопрос команде.'), actions: [{ ...infoPage, href: '/info#returns' }, handoff] }

  if (any(t, ['sifaris', 'order', 'buy', 'nece al', 'how do i', 'как зак', 'как куп', 'заказ']))
    return { text: L(lang, '1) Pick a size and add to cart. 2) Open checkout, enter your delivery details and choose how to pay. 3) Place the order — you get an order number and the brand contacts you to confirm delivery.', '1) Ölçünü seçib səbətə əlavə edin. 2) Sifariş səhifəsində çatdırılma məlumatlarını yazıb ödəniş üsulunu seçin. 3) Sifarişi verin — sizə sifariş nömrəsi verilir və brend çatdırılmanı təsdiqləmək üçün əlaqə saxlayır.', '1) Выберите размер и добавьте в корзину. 2) На странице оформления укажите данные и выберите способ оплаты. 3) Оформите заказ — вы получите номер заказа, а бренд свяжется с вами для подтверждения доставки.'), actions: [{ label: tt('hero.cta'), href: '/shop' }, { label: tt('cart.checkout'), href: '/checkout' }] }

  if (any(t, ['elaqe', 'contact', 'instagram', 'tiktok', 'telefon', 'phone', 'email', 'unvan', 'address', 'контакт', 'связ', 'телефон', 'адрес']))
    return { text: L(lang, `You can reach HALHALA on ${channels}${site.email ? `, or by email at ${site.email}` : ''}.`, `HALHALA ilə ${channels} üzərindən${site.email ? `, və ya ${site.email} ünvanı ilə` : ''} əlaqə saxlaya bilərsiniz.`, `Связаться с HALHALA можно в ${channels}${site.email ? `, или по e-mail ${site.email}` : ''}.`), actions: [handoff, { label: tt('nav.contact'), href: '/contact' }] }

  if (any(t, ['endirim', 'discount', 'sale', 'promo', 'kampaniya', 'скидк', 'акци']))
    return { text: L(lang, 'No promotions are listed on the site right now. Ask the team about current offers.', 'Hazırda saytda kampaniya yoxdur. Aktual təkliflər üçün komandadan soruşun.', 'Сейчас на сайте нет акций. О текущих предложениях спросите команду.'), actions: [handoff] }

  const p = matchProduct(t, products)
  if (p) {
    const desc = tt(prodKey(p.id))
    const wanted = sizeOf(t)
    const stockWord = any(t, ['olcu', 'size', 'stok', 'stock', 'var', 'available', 'mevcud', 'размер', 'налич', 'есть'])
    if (wanted && Object.keys(p.stock).includes(wanted)) {
      return { text: stockFor(p, wanted) > 0
        ? L(lang, `Yes — ${p.name} in ${wanted} is in stock.`, `Bəli — ${p.name} ${wanted} ölçüsündə mövcuddur.`, `Да — ${p.name} размера ${wanted} есть в наличии.`)
        : `${L(lang, `${p.name} in ${wanted} is sold out.`, `${p.name} ${wanted} ölçüsündə bitib.`, `${p.name} размера ${wanted} нет в наличии.`)} ${sizesLine(p, lang)}`, actions: openProduct(p, lang) }
    }
    if (stockWord || isSoldOut(p)) return { text: `${p.name} — ${formatPrice(p.price)}. ${sizesLine(p, lang)}`, actions: openProduct(p, lang) }
    return { text: `${p.name} — ${formatPrice(p.price)}. ${desc} ${sizesLine(p, lang)}`, actions: openProduct(p, lang) }
  }

  if (any(t, ['best', 'popular', 'coxsatan', 'cox satilan', 'en cox', 'хит', 'популяр', 'лучш']))
    return { text: tt('home.best.title') + ':', actions: list(products.filter((x) => x.bestSeller).slice(0, 4)) }

  if (any(t, ['new', 'yeni', 'latest', 'нов']))
    return { text: tt('home.new.title') + ':', actions: list([...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4)) }

  if (any(t, ['qiymet', 'price', 'how much', 'ne qeder', 'cost', 'tee', 'tshirt', 'koynek', 'shirt', 'mehsul', 'product', 'shop', 'catalog', 'цен', 'сколько', 'футбол', 'товар', 'магазин', 'каталог'])) {
    const prices = products.map((x) => x.price)
    return { text: L(lang, `Prices range from ${formatPrice(Math.min(...prices))} to ${formatPrice(Math.max(...prices))}. Pick one:`, `Qiymətlər ${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))} arasındadır. Seçin:`, `Цены — от ${formatPrice(Math.min(...prices))} до ${formatPrice(Math.max(...prices))}. Выберите:`), actions: list(products.slice(0, 4)) }
  }

  if (any(t, ['olcu', 'size', 'beden', 'размер']))
    return { text: L(lang, 'Cuts are oversized. Each product page shows which sizes are in stock. Tell me a product name and I will check.', 'Kəsimlər oversized-dır. Hər məhsul səhifəsində mövcud ölçülər göstərilir. Məhsulun adını yazın, yoxlayım.', 'Крой оверсайз. На странице каждого товара видно, какие размеры есть в наличии. Назовите товар — проверю.'), actions: [{ label: tt('nav.shop'), href: '/shop' }] }

  if (any(t, ['thanks', 'thank', 'sagol', 'tesekkur', 'eyvallah', 'спасибо', 'благодар']))
    return { text: L(lang, 'Anytime! 🐐', 'Buyurun! 🐐', 'Всегда пожалуйста! 🐐') }

  return { text: L(lang, 'I am not sure I got that. Try a product name, “sizes”, “delivery”, “how to order” — or talk to the team.', 'Tam anlamadım. Məhsul adı, “ölçü”, “çatdırılma”, “necə sifariş verim” yazın — və ya komanda ilə danışın.', 'Не совсем понял. Напишите название товара, «размеры», «доставка», «как заказать» — или свяжитесь с командой.'), actions: [handoff] }
}

/** Builds the pre-written message sent to the team from what the visitor asked in the chat. */
export const handoffMessage = (userLines: string[], lang: Lang) => {
  const t = makeT(lang)
  return userLines.length ? `${t('msg.handoff')}\n${userLines.slice(-4).map((l) => `• ${l}`).join('\n')}` : t('msg.handoff.empty')
}
