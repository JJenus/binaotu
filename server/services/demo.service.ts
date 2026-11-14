import type { Db } from '../db/client'
import * as familyRepo from '../repositories/family.repo'
import * as memberRepo from '../repositories/member.repo'
import * as personRepo from '../repositories/person.repo'
import { sampleFamily, sampleNames } from '../../shared/kinship/fixture'
import type { Plan } from '../../shared/kinship'

/** Inserts the four-generation Ebi sample family. Used for local demos, never in production. */
export async function seedDemoFamily(db: Db, ownerId?: string): Promise<void> {
  const input = sampleFamily().toInput()
  const ids = new Map(input.persons.map(p => [p.id, crypto.randomUUID()]))
  const plan: Plan = {
    focusId: '',
    persons: input.persons.map((p) => {
      const [givenName, ...rest] = sampleNames[p.id]!.split(' ')
      return { id: ids.get(p.id)!, givenName: givenName!, familyName: rest.join(' ') || null, sex: p.sex, birthYear: p.birthYear, deathYear: p.id === 'a1' ? 2011 : p.id === 'b1' ? 2018 : null, isPlaceholder: false }
    }),
    parentLinks: input.parentLinks.map(l => ({ childId: ids.get(l.childId)!, parentId: ids.get(l.parentId)!, kind: 'biological' as const })),
    unions: input.unions.map(u => ({ id: crypto.randomUUID(), partnerAId: ids.get(u.partnerAId)!, partnerBId: ids.get(u.partnerBId)!, kind: 'marriage' as const }))
  }
  await db.transaction(async (tx) => {
    const family = await familyRepo.insertFamily(tx as Db, { slug: 'ebi', name: 'Ebi family', description: 'A four-generation sample family.', visibility: 'public' })
    await personRepo.insertPlan(tx as Db, family.id, plan)
    if (ownerId) await memberRepo.setMember(tx as Db, family.id, ownerId, 'owner')
  })
}
