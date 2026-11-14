import { createRateLimiter } from '../services/rateLimit'

export const loginLimit = createRateLimiter(10, 15 * 60_000)
export const registerLimit = createRateLimiter(10, 60 * 60_000)
export const clientIp = (event: Parameters<typeof getRequestIP>[0]) => getRequestIP(event) ?? 'unknown'
