import { and, eq, inArray } from 'drizzle-orm'
import type { Db } from '../db/client'
import { families, parentLinks, persons, unions } from '../db/schema'
import type { FamilyDTO, PersonDTO, TreeDTO } from '../../shared/types'
import type { Plan } from '../../shared/kinship'
import type { PersonInput } from '../../shared/schemas'

const personColumns = {
  id: persons.id, familyId: persons.familyId, givenName: persons.givenName, familyName: persons.familyName,
  sex: persons.sex, birthYear: persons.birthYear, deathYear: persons.deathYear, birthPlace: persons.birthPlace,
  notes: persons.notes, isPlaceholder: persons.isPlaceholder
}

/** Column values for a person form; the same mapping for inserts and edits. */
const personValues = (p: PersonInput) => ({
  givenName: p.givenName, familyName: p.familyName ?? null, sex: p.sex ?? 'unknown', birthYear: p.birthYear ?? null,
  deathYear: p.deathYear ?? null, birthPlace: p.birthPlace ?? null, notes: p.notes ?? null
})

export async function loadTree(db: Db, family: FamilyDTO): Promise<TreeDTO> {
  const [people, links, couples] = await Promise.all([
    db.select(personColumns).from(persons).where(eq(persons.familyId, family.id)).orderBy(persons.birthYear, persons.givenName),
    db.select({ childId: parentLinks.childId, parentId: parentLinks.parentId, kind: parentLinks.kind })
      .from(parentLinks).innerJoin(persons, eq(parentLinks.childId, persons.id)).where(eq(persons.familyId, family.id)),
    db.select({ id: unions.id, partnerAId: unions.partnerAId, partnerBId: unions.partnerBId, kind: unions.kind, startYear: unions.startYear, endYear: unions.endYear })
      .from(unions).where(eq(unions.familyId, family.id))
  ])
  return { family, persons: people as PersonDTO[], parentLinks: links, unions: couples }
}

/** Writes everything a plan describes. Call inside a transaction so a plan lands whole or not at all. */
export async function insertPlan(db: Db, familyId: string, plan: Plan): Promise<void> {
  if (plan.persons.length) {
    await db.insert(persons).values(plan.persons.map(p => ({ id: p.id, familyId, ...personValues(p), isPlaceholder: p.isPlaceholder })))
  }
  if (plan.parentLinks.length) await db.insert(parentLinks).values(plan.parentLinks)
  if (plan.unions.length) await db.insert(unions).values(plan.unions.map(u => ({ ...u, familyId })))
}

export { families }

/** Saving real details onto a placeholder turns it into a real person. */
export async function updatePerson(db: Db, familyId: string, personId: string, input: PersonInput): Promise<void> {
  await db.update(persons).set({ ...personValues(input), isPlaceholder: false }).where(and(eq(persons.id, personId), eq(persons.familyId, familyId)))
}

/** Parent links and unions go with the person (cascade). */
export async function deletePersons(db: Db, familyId: string, ids: string[]): Promise<void> {
  if (ids.length) await db.delete(persons).where(and(eq(persons.familyId, familyId), inArray(persons.id, ids)))
}
