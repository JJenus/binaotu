import type { PersonInput } from '#shared/schemas'
import type { PersonDTO, Sex } from '#shared/types'

/** What a person form holds while being edited: strings and nulls, never undefined. */
export interface PersonDraft { givenName: string, familyName: string, sex: Sex, birthYear: number | null, deathYear: number | null, birthPlace: string, notes: string }

export const emptyDraft = (familyName = ''): PersonDraft => ({ givenName: '', familyName, sex: 'unknown', birthYear: null, deathYear: null, birthPlace: '', notes: '' })

/** A placeholder starts with an empty first name so filling it in is the obvious next step. */
export const draftFromPerson = (p: PersonDTO): PersonDraft => ({
  givenName: p.isPlaceholder ? '' : p.givenName, familyName: p.familyName ?? '', sex: p.sex,
  birthYear: p.birthYear, deathYear: p.deathYear, birthPlace: p.birthPlace ?? '', notes: p.notes ?? ''
})

export const draftToInput = (d: PersonDraft): PersonInput => ({
  ...d, familyName: d.familyName.trim() || null, birthPlace: d.birthPlace.trim() || null, notes: d.notes.trim() || null
})
