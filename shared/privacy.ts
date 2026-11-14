import type { PersonDTO } from './types'

/** Anyone with no recorded death who was born (or may have been born) within this many years is treated as living. */
export const LIVING_WINDOW_YEARS = 100

export function isPresumedLiving(p: Pick<PersonDTO, 'deathYear' | 'birthYear' | 'isPlaceholder'>, thisYear: number): boolean {
  if (p.isPlaceholder || p.deathYear != null) return false
  return p.birthYear == null || thisYear - p.birthYear < LIVING_WINDOW_YEARS
}

/**
 * What the public may see of a family: the tree keeps its shape, but presumed-living
 * people lose their name, dates, place and notes.
 */
export function redactLiving(persons: PersonDTO[], thisYear = new Date().getFullYear()): PersonDTO[] {
  return persons.map(p => isPresumedLiving(p, thisYear)
    ? { ...p, givenName: 'Living', familyName: null, birthYear: null, deathYear: null, birthPlace: null, notes: null, redacted: true }
    : p)
}
