// Order notifications to the shop owner. Telegram Bot API (documented: POST /bot<token>/sendMessage).
// Configure TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID. Without them this only logs to the console.
export async function notifyOwner(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) { console.log('[order]', text.replace(/\n/g, ' | ')); return }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) console.error('[notify] telegram', r.status)
  } catch (e) { console.error('[notify] telegram failed', e instanceof Error ? e.message : e) }
}
