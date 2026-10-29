import 'server-only'

/**
 * Owner notifications via the Telegram Bot API (POST /bot<token>/sendMessage).
 * Needs TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID; without them it only logs to the server console.
 */
export async function notifyOwner(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) { console.log('[notify]', text.replace(/\n/g, ' | ')); return }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }), signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) console.error('[notify] telegram', r.status)
  } catch (e) { console.error('[notify] telegram failed', e instanceof Error ? e.message : e) }
}
