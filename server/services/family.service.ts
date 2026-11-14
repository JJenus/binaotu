import type { Db } from '../db/client'
import * as familyRepo from '../repositories/family.repo'
import * as memberRepo from '../repositories/member.repo'
import * as personRepo from '../repositories/person.repo'
import { KinshipError, graphFromTree, planAddRelative, relate, wouldDisconnect } from '../../shared/kinship'
import { redactLiving } from '../../shared/privacy'
import type { AddRelativeInput, CreateFamilyInput, PersonInput } from '../../shared/schemas'
import type { AccessDTO, AddRelativeResultDTO, FamilyDTO, FamilySummaryDTO, RelationshipDTO, Role, TreeDTO } from '../../shared/types'
import { authorize, type Viewer } from './access.service'
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

/** The tree as this viewer may see it: members see everyone, the public does not see living people. */
async function treeFor(db: Db, family: FamilyDTO, access: AccessDTO): Promise<TreeDTO> {
  const tree = await personRepo.loadTree(db, family)
  return { ...tree, access, persons: access.role ? tree.persons : redactLiving(tree.persons) }
}

export const searchFamilies = (db: Db, q: string): Promise<FamilySummaryDTO[]> => familyRepo.searchPublic(db, q.trim())

export const myFamilies = (db: Db, userId: string): Promise<(FamilySummaryDTO & { role: Role })[]> => familyRepo.listForUser(db, userId)

/** The creator becomes the family’s owner. */
export async function createFamily(db: Db, input: CreateFamilyInput, userId: string): Promise<TreeDTO> {
  const family = await db.transaction(async (tx) => {
    const created = await familyRepo.insertFamily(tx as Db, {
      slug: await uniqueSlug(tx as Db, input.name), name: input.name, description: input.description, visibility: input.visibility ?? 'public'
    })
    await personRepo.insertPlan(tx as Db, created.id, { persons: [{ ...input.founder, id: crypto.randomUUID(), isPlaceholder: false }], parentLinks: [], unions: [], focusId: '' })
    await memberRepo.setMember(tx as Db, created.id, userId, 'owner')
    return created
  })
  return treeFor(db, family, { role: 'owner', canEdit: true, canManage: true })
}

export async function getTree(db: Db, slug: string, viewer: Viewer): Promise<TreeDTO> {
  const { family, access } = await authorize(db, slug, viewer, 'view')
  return treeFor(db, family, access)
}

export async function addRelative(db: Db, slug: string, anchorId: string, input: AddRelativeInput, viewer: Viewer): Promise<AddRelativeResultDTO> {
  const { family, access } = await authorize(db, slug, viewer, 'edit')
  const plan = planAddRelative(graphFromTree(await personRepo.loadTree(db, family)), anchorId, input)
  await db.transaction(tx => personRepo.insertPlan(tx as Db, family.id, plan))
  return { focusId: plan.focusId, tree: await treeFor(db, family, access) }
}

export async function relationship(db: Db, slug: string, a: string, b: string, viewer: Viewer): Promise<RelationshipDTO> {
  const { family } = await authorize(db, slug, viewer, 'view')
  const graph = graphFromTree(await personRepo.loadTree(db, family))
  graph.person(a); graph.person(b)
  const rel = relate(graph, a, b)
  if (!rel) throw new KinshipError('NOT_RELATED', 'These two people are not connected in this tree')
  return { label: rel.label, role: rel.role.kind, inLaw: rel.inLaw }
}

export async function updatePerson(db: Db, slug: string, personId: string, input: PersonInput, viewer: Viewer): Promise<TreeDTO> {
  const { family, access } = await authorize(db, slug, viewer, 'edit')
  graphFromTree(await personRepo.loadTree(db, family)).person(personId)
  await personRepo.updatePerson(db, family.id, personId, input)
  return treeFor(db, family, access)
}

/**
 * Removes one person and their links. Refuses when it would strand part of the
 * family or empty the tree, and tidies up placeholder parents left with nobody.
 */
export async function removePerson(db: Db, slug: string, personId: string, viewer: Viewer): Promise<TreeDTO> {
  const { family, access } = await authorize(db, slug, viewer, 'edit')
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
  return treeFor(db, family, access)
}
