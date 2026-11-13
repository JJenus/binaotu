import { eq } from 'drizzle-orm'
import type { Db } from '../db/client'
import { families, parentLinks, persons, unions } from '../db/schema'
import type { FamilyDTO, PersonDTO, TreeDTO } from '../../shared/types'
import type { Plan } from '../../shared/kinship'

const personColumns = {
  id: persons.id, familyId: persons.familyId, givenName: persons.givenName, familyName: persons.familyName,
  sex: persons.sex, birthYear: persons.birthYear, deathYear: persons.deathYear, birthPlace: persons.birthPlace,
  notes: persons.notes, isPlaceholder: persons.isPlaceholder
}

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
    await db.insert(persons).values(plan.persons.map(p => ({
      id: p.id, familyId, givenName: p.givenName, familyName: p.familyName ?? null, sex: p.sex ?? 'unknown',
      birthYear: p.birthYear ?? null, deathYear: p.deathYear ?? null, birthPlace: p.birthPlace ?? null,
      notes: p.notes ?? null, isPlaceholder: p.isPlaceholder
    })))
  }
  if (plan.parentLinks.length) await db.insert(parentLinks).values(plan.parentLinks)
  if (plan.unions.length) await db.insert(unions).values(plan.unions.map(u => ({ ...u, familyId })))
}

export { families }
