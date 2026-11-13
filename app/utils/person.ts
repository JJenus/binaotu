import type { PersonDTO } from '#shared/types'

export const displayName = (p: PersonDTO) => p.isPlaceholder ? 'Unknown' : [p.givenName, p.familyName].filter(Boolean).join(' ')

export const lifespan = (p: PersonDTO) =>
  p.deathYear ? `${p.birthYear ?? '?'}–${p.deathYear}` : p.birthYear ? `b. ${p.birthYear}` : 'Dates unknown'

export const hueOf = (name: string) => [...name].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 360

/** Children are drawn shorter so generations read at a glance. */
export function heightFactor(p: PersonDTO, thisYear = new Date().getFullYear()) {
  if (p.deathYear || p.birthYear == null) return 1
  const age = thisYear - p.birthYear
  return age < 12 ? .55 : age < 18 ? .82 : 1
}
