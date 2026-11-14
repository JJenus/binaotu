import { z } from 'zod'
import { PARENT_KINDS, SEXES, UNION_KINDS, VISIBILITIES } from '../types'

const id = z.string().uuid()
const year = z.number().int().min(1000).max(2200)

const personFields = z.object({
  givenName: z.string().trim().min(1, 'Enter a first name').max(80),
  familyName: z.string().trim().max(80).nullish(),
  sex: z.enum(SEXES).default('unknown'),
  birthYear: year.nullish(),
  deathYear: year.nullish(),
  birthPlace: z.string().trim().max(120).nullish(),
  notes: z.string().trim().max(2000).nullish()
})

/** Used for adding a person and for editing one (the whole person is sent on edit). */
export const personInputSchema = personFields.refine(p => p.birthYear == null || p.deathYear == null || p.deathYear >= p.birthYear, {
  message: 'Death year cannot be before birth year',
  path: ['deathYear']
})

export const createFamilySchema = z.object({
  name: z.string().trim().min(2, 'Enter a family name').max(80),
  description: z.string().trim().max(500).nullish(),
  visibility: z.enum(VISIBILITIES).default('public'),
  founder: personInputSchema
})

export const searchFamiliesSchema = z.object({ q: z.string().trim().max(80).default('') })

const relative = <R extends string, S extends z.ZodRawShape>(relation: R, shape: S) =>
  z.object({ relation: z.literal(relation), person: personInputSchema, ...shape })

export const addRelativeSchema = z.discriminatedUnion('relation', [
  relative('child', { otherParentId: id.nullish() }),
  relative('parent', {}),
  relative('partner', { kind: z.enum(UNION_KINDS).default('partnership') }),
  relative('sibling', { kind: z.enum(['full', 'half']).default('full'), sharedParentId: id.nullish() }),
  relative('auncle', { viaParentId: id }),
  relative('nibling', { viaSiblingId: id }),
  relative('cousin', { viaAuncleId: id }),
  relative('grandparent', { viaParentId: id }),
  relative('grandchild', { viaChildId: id })
])

export const relationshipQuerySchema = z.object({ a: id, b: id })

export type PersonInput = z.input<typeof personInputSchema>
export type CreateFamilyInput = z.input<typeof createFamilySchema>
export type AddRelativeInput = z.input<typeof addRelativeSchema>
export type RelationKind = AddRelativeInput['relation']
export { PARENT_KINDS }
