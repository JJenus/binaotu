import { afterAll, describe, expect, it } from 'vitest'
import { createTestDb } from '../db/testing'
import { register } from './auth.service'
import { addRelative, createFamily, getTree, myFamilies, removePerson } from './family.service'
import { acceptInvite, createInvite, listMembers, previewInvite, removeMember, revokeInvite, setMemberRole } from './sharing.service'

const person = (givenName: string, extra = {}) => ({ givenName, sex: 'unknown' as const, ...extra })

describe('access, privacy and sharing', async () => {
  const { db, close } = await createTestDb()
  afterAll(close)
  const user = (n: string) => register(db, { name: n, email: `${n}@example.com`, password: 'password123' })
  const [owner, editor, viewer, stranger] = await Promise.all(['owner', 'editor', 'viewer', 'stranger'].map(user))
  const as = (u: { id: string }) => ({ userId: u.id })
  const anon = { userId: null }

  const fam = await createFamily(db, { name: 'Access', visibility: 'public', founder: person('Elder', { familyName: 'Access', birthYear: 1900, deathYear: 1970 }) }, owner!.id)
  const slug = fam.family.slug, elder = fam.persons[0]!.id
  const { focusId: kid } = await addRelative(db, slug, elder, { relation: 'child', person: person('Kid', { familyName: 'Access', birthYear: 1995, birthPlace: 'Yenagoa', notes: 'private note' }) }, as(owner!))

  it('shows visitors the tree with living people redacted, and members everything', async () => {
    const pub = await getTree(db, slug, anon)
    expect(pub.access).toEqual({ role: null, canEdit: false, canManage: false })
    expect(pub.persons.find(p => p.id === elder)).toMatchObject({ givenName: 'Elder', redacted: false })
    expect(pub.persons.find(p => p.id === kid)).toMatchObject({ givenName: 'Living', birthYear: null, birthPlace: null, notes: null, redacted: true })
    expect(pub.parentLinks).toHaveLength(1) // the shape of the tree is kept
    expect((await getTree(db, slug, as(owner!))).persons.find(p => p.id === kid)).toMatchObject({ givenName: 'Kid', notes: 'private note', redacted: false })
  })

  it('does not let visitors or strangers edit, and says whether to sign in', async () => {
    const add = (v: { userId: string | null }) => addRelative(db, slug, elder, { relation: 'child', person: person('X') }, v)
    await expect(add(anon)).rejects.toMatchObject({ status: 401 })
    await expect(add(as(stranger!))).rejects.toMatchObject({ status: 403 })
  })

  it('hides private families from everyone but members', async () => {
    const priv = await createFamily(db, { name: 'Secret', visibility: 'private', founder: person('S') }, owner!.id)
    await expect(getTree(db, priv.family.slug, anon)).rejects.toMatchObject({ status: 404 })
    await expect(getTree(db, priv.family.slug, as(stranger!))).rejects.toMatchObject({ status: 404 })
    expect((await getTree(db, priv.family.slug, as(owner!))).family.name).toBe('Secret')
  })

  it('invites people with a role, and only owners can invite', async () => {
    await expect(createInvite(db, slug, 'editor', as(stranger!))).rejects.toMatchObject({ status: 403 })
    const ed = await createInvite(db, slug, 'editor', as(owner!)), vw = await createInvite(db, slug, 'viewer', as(owner!))
    expect(await previewInvite(db, ed.token)).toMatchObject({ familyName: 'Access', role: 'editor' })
    await acceptInvite(db, ed.token, editor!.id)
    await acceptInvite(db, vw.token, viewer!.id)
    expect((await listMembers(db, slug, as(owner!))).members.map(m => [m.name, m.role]).sort()).toEqual([['editor', 'editor'], ['owner', 'owner'], ['viewer', 'viewer']])
    expect((await myFamilies(db, editor!.id)).map(f => [f.slug, f.role])).toEqual([[slug, 'editor']])
  })

  it('lets editors edit but not manage, and viewers see everything but change nothing', async () => {
    const { tree } = await addRelative(db, slug, elder, { relation: 'child', person: person('ByEditor') }, as(editor!))
    expect(tree.access).toMatchObject({ role: 'editor', canEdit: true, canManage: false })
    await expect(listMembers(db, slug, as(editor!))).rejects.toMatchObject({ status: 403 })
    await expect(removePerson(db, slug, kid, as(viewer!))).rejects.toMatchObject({ status: 403 })
    expect((await getTree(db, slug, as(viewer!))).persons.find(p => p.id === kid)).toMatchObject({ givenName: 'Kid' })
  })

  it('never downgrades someone through an invite, and rejects bad or revoked links', async () => {
    const low = await createInvite(db, slug, 'viewer', as(owner!))
    await acceptInvite(db, low.token, editor!.id)
    expect((await listMembers(db, slug, as(owner!))).members.find(m => m.userId === editor!.id)!.role).toBe('editor')
    await revokeInvite(db, slug, low.token, as(owner!))
    await expect(previewInvite(db, low.token)).rejects.toMatchObject({ status: 404 })
    await expect(acceptInvite(db, 'nonsense', stranger!.id)).rejects.toMatchObject({ status: 404 })
  })

  it('protects the last owner and lets members leave', async () => {
    await expect(setMemberRole(db, slug, owner!.id, 'editor', as(owner!))).rejects.toMatchObject({ status: 409 })
    await expect(removeMember(db, slug, owner!.id, as(owner!))).rejects.toMatchObject({ status: 409 })
    await setMemberRole(db, slug, editor!.id, 'owner', as(owner!))
    await removeMember(db, slug, owner!.id, as(owner!)) // fine now: another owner exists
    await removeMember(db, slug, viewer!.id, as(viewer!)) // leaving yourself
    expect((await listMembers(db, slug, as(editor!))).members.map(m => m.name)).toEqual(['editor'])
  })
})
