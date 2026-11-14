import { describe, expect, it } from 'vitest'
import { isPresumedLiving, redactLiving } from './privacy'
import type { PersonDTO } from './types'

const p = (over: Partial<PersonDTO>) => ({ id: 'x', familyId: 'f', givenName: 'Ada', familyName: 'Ebi', sex: 'female', birthYear: 1990, deathYear: null, birthPlace: 'Yenagoa', notes: 'Hi', isPlaceholder: false, redacted: false, ...over }) as PersonDTO

describe('living-person privacy', () => {
  it.each([
    [{ birthYear: 1990 }, true], [{ birthYear: 1920 }, false], [{ birthYear: 1930 }, true], [{ birthYear: null }, true],
    [{ birthYear: 1990, deathYear: 2020 }, false], [{ birthYear: null, deathYear: 1950 }, false], [{ isPlaceholder: true, birthYear: null }, false]
  ])('%o living=%s', (over, living) => expect(isPresumedLiving(p(over), 2026)).toBe(living))

  it('keeps ids, sex and shape but strips identity from the living', () => {
    const [out] = redactLiving([p({})], 2026)
    expect(out).toMatchObject({ id: 'x', sex: 'female', givenName: 'Living', familyName: null, birthYear: null, birthPlace: null, notes: null, redacted: true })
  })
  it('leaves the deceased untouched', () => {
    const dead = p({ birthYear: 1900, deathYear: 1970 })
    expect(redactLiving([dead], 2026)[0]).toEqual(dead)
  })
})
