import { describe, expect, it } from 'vitest'
import type { PersonDTO } from '#shared/types'
import { toRoman } from './format'
import { birthBounds, dimmedIds } from './yearRange'

const person = (id: string, birthYear: number | null) => ({ id, birthYear } as PersonDTO)
const people = [person('a', 1936), person('b', 1990), person('c', null), person('d', 2021)]

describe('year range', () => {
  it('finds the bounds, ignoring people without a birth year', () => {
    expect(birthBounds(people)).toEqual([1936, 2021])
    expect(birthBounds([person('x', null)])).toBeNull()
  })
  it('dims only people born outside the span', () => {
    expect([...dimmedIds(people, [1980, 2000])].sort()).toEqual(['a', 'd'])
    expect(dimmedIds(people, [1936, 2021]).size).toBe(0)
  })
})

describe('toRoman', () => {
  it.each([[1, 'I'], [2, 'II'], [4, 'IV'], [5, 'V'], [9, 'IX'], [12, 'XII']])('%i is %s', (n, r) => expect(toRoman(n)).toBe(r))
})
