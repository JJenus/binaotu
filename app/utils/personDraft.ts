import type { PersonInput } from '#shared/schemas'
import type { Sex } from '#shared/types'

/** What a person form holds while being edited: strings and nulls, never undefined. */
export interface PersonDraft { givenName: string, familyName: string, sex: Sex, birthYear: number | null, deathYear: number | null }

export const emptyDraft = (familyName = ''): PersonDraft => ({ givenName: '', familyName, sex: 'unknown', birthYear: null, deathYear: null })

export const draftToInput = (d: PersonDraft): PersonInput => ({ ...d, familyName: d.familyName.trim() || null })
