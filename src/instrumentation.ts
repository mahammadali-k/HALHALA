/** Runs once when the Next.js server starts: opens/migrates the database and starts the unpaid-card-order sweeper. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { db } = await import('@/server/db')
  const { startSweeper } = await import('@/server/orders')
  db()
  startSweeper()
}
