import { AppError } from './errors'

/** Fixed-window counter per key. In memory, so it resets on restart and is per server instance. */
export function createRateLimiter(max: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, { count: number, resetAt: number }>()
  return (key: string) => {
    const t = now()
    for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k)
    const entry = hits.get(key) ?? { count: 0, resetAt: t + windowMs }
    entry.count++
    hits.set(key, entry)
    if (entry.count > max) throw new AppError(429, 'Too many attempts. Please wait a few minutes and try again.')
  }
}
