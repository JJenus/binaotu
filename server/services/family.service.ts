import type { Db } from '../db/client'
import * as familyRepo from '../repositories/family.repo'
import * as personRepo from '../repositories/person.repo'
import { KinshipError, graphFromTree, planAddRelative, relate, wouldDisconnect } from '../../shared/kinship'
import type { AddRelativeInput, CreateFamilyInput, PersonInput } from '../../shared/schemas'
import type { AddRelativeResultDTO, FamilyDTO, FamilySummaryDTO, RelationshipDTO, TreeDTO } from '../../shared/types'
import { AppError } from './errors'

const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'family'

async function uniqueSlug(db: Db, name: string) {
  const base = slugify(name)
  const taken = new Set(await familyRepo.slugsStartingWith(db, base))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

async function requireFamily(db: Db, slug: string): Promise<FamilyDTO> {
  const family = await familyRepo.findBySlug(db, slug)
  if (!family) throw new AppError(404, 'We couldn’t find that family')
  return family
}

export const searchFamilies = (db: Db, q: string): Promise<FamilySummaryDTO[]> => familyRepo.searchPublic(db, q.trim())

export async function createFamily(db: Db, input: CreateFamilyInput): Promise<TreeDTO> {
  const family = await db.transaction(async (tx) => {
    const created = await familyRepo.insertFamily(tx as Db, {
      slug: await uniqueSlug(tx as Db, input.name), name: input.name, description: input.description, visibility: input.visibility ?? 'public'
    })
    await personRepo.insertPlan(tx as Db, created.id, { persons: [{ ...input.founder, id: crypto.randomUUID(), isPlaceholder: false }], parentLinks: [], unions: [], focusId: '' })
    return created
  })
  return personRepo.loadTree(db, family)
}

export async function getTree(db: Db, slug: string): Promise<TreeDTO> {
  return personRepo.loadTree(db, await requireFamily(db, slug))
}

export async function addRelative(db: Db, slug: string, anchorId: string, input: AddRelativeInput): Promise<AddRelativeResultDTO> {
  const family = await requireFamily(db, slug)
  const plan = planAddRelative(graphFromTree(await personRepo.loadTree(db, family)), anchorId, input)
  await db.transaction(tx => personRepo.insertPlan(tx as Db, family.id, plan))
  return { focusId: plan.focusId, tree: await personRepo.loadTree(db, family) }
}

export async function relationship(db: Db, slug: string, a: string, b: string): Promise<RelationshipDTO> {
  const graph = graphFromTree(await personRepo.loadTree(db, await requireFamily(db, slug)))
  graph.person(a); graph.person(b)
  const rel = relate(graph, a, b)
  if (!rel) throw new KinshipError('NOT_RELATED', 'These two people are not connected in this tree')
  return { label: rel.label, role: rel.role.kind, inLaw: rel.inLaw }
}

export async function updatePerson(db: Db, slug: string, personId: string, input: PersonInput): Promise<TreeDTO> {
  const family = await requireFamily(db, slug)
  graphFromTree(await personRepo.loadTree(db, family)).person(personId)
  await personRepo.updatePerson(db, family.id, personId, input)
  return personRepo.loadTree(db, family)
}

/**
 * Removes one person and their links. Refuses when it would strand part of the
 * family or empty the tree, and tidies up placeholder parents left with nobody.
 */
export async function removePerson(db: Db, slug: string, personId: string): Promise<TreeDTO> {
  const family = await requireFamily(db, slug)
  const tree = await personRepo.loadTree(db, family)
  const graph = graphFromTree(tree)
  graph.person(personId)
  if (tree.persons.length === 1) throw new AppError(409, 'A family needs at least one person')
  const stranded = wouldDisconnect(graph, personId)
  if (stranded.length) {
    const target = tree.persons.find(p => p.id === personId)!
    const who = target.isPlaceholder ? 'this unknown relative' : target.givenName
    throw new AppError(409, `Removing ${who} would leave ${stranded.length} ${stranded.length === 1 ? 'person' : 'people'} disconnected from the rest of the family. Remove or reconnect them first.`)
  }
  await db.transaction(async (tx) => {
    await personRepo.deletePersons(tx as Db, family.id, [personId])
    const next = await personRepo.loadTree(tx as Db, family)
    const g = graphFromTree(next)
    const orphans = next.persons.filter(p => p.isPlaceholder && !g.parents(p.id).length && !g.children(p.id).length && !g.partners(p.id).length)
    if (next.persons.length > orphans.length) await personRepo.deletePersons(tx as Db, family.id, orphans.map(p => p.id))
  })
  return personRepo.loadTree(db, family)
}
