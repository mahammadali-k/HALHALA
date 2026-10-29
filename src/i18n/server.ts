import 'server-only'
import { cookies, headers } from 'next/headers'
import { isLang, LANG_COOKIE, makeT, type Key, type Lang } from './core'

/** Language for this request: the `lang` cookie, else the browser's Accept-Language (az / ru / en), else English. */
export async function getLang(): Promise<Lang> {
  const saved = (await cookies()).get(LANG_COOKIE)?.value
  if (isLang(saved)) return saved
  for (const part of ((await headers()).get('accept-language') ?? '').split(',')) {
    const l = part.trim().slice(0, 2).toLowerCase()
    if (isLang(l)) return l
  }
  return 'en'
}
export const getT = async () => makeT(await getLang())

/** `export const generateMetadata = titleFor('cart.title')` — a translated <title> for simple pages. */
export const titleFor = (key: Key) => async (): Promise<{ title: string }> => ({ title: (await getT())(key) })
