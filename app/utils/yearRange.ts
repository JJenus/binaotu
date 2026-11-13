import type { PersonDTO } from '#shared/types'

export type YearSpan = [from: number, to: number]

/** Earliest and latest recorded birth year, or null when nobody has one. */
export function birthBounds(persons: PersonDTO[]): YearSpan | null {
  const years = persons.map(p => p.birthYear).filter((y): y is number => y != null)
  return years.length ? [Math.min(...years), Math.max(...years)] : null
}

/** People born outside the span. Anyone without a birth year is never dimmed. */
export function dimmedIds(persons: PersonDTO[], [from, to]: YearSpan): Set<string> {
  return new Set(persons.filter(p => p.birthYear != null && (p.birthYear < from || p.birthYear > to)).map(p => p.id))
}
