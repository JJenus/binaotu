import { describe, expect, it } from 'vitest'
import { createRateLimiter } from './rateLimit'

describe('rate limiter', () => {
  it('allows up to the limit, then blocks, then recovers after the window', () => {
    let t = 0
    const hit = createRateLimiter(3, 1000, () => t)
    for (let i = 0; i < 3; i++) hit('a')
    expect(() => hit('a')).toThrowError(/Too many attempts/)
    expect(() => hit('b')).not.toThrow() // other keys are independent
    t = 1001
    expect(() => hit('a')).not.toThrow()
  })
})
