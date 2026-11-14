export const SEXES = ['male', 'female', 'unknown'] as const
export const PARENT_KINDS = ['biological', 'adoptive', 'step'] as const
export const UNION_KINDS = ['marriage', 'partnership', 'other'] as const
export const VISIBILITIES = ['public', 'private'] as const
export const ROLES = ['owner', 'editor', 'viewer'] as const

export type Sex = typeof SEXES[number]
export type ParentKind = typeof PARENT_KINDS[number]
export type UnionKind = typeof UNION_KINDS[number]
export type Visibility = typeof VISIBILITIES[number]
export type Role = typeof ROLES[number]

export interface PersonDTO {
  id: string
  familyId: string
  givenName: string
  familyName: string | null
  sex: Sex
  birthYear: number | null
  deathYear: number | null
  birthPlace: string | null
  notes: string | null
  isPlaceholder: boolean
  /** True when the viewer is not allowed to see this living person’s details. */
  redacted: boolean
}

export interface ParentLinkDTO { childId: string, parentId: string, kind: ParentKind }

export interface UnionDTO {
  id: string
  partnerAId: string
  partnerBId: string
  kind: UnionKind
  startYear: number | null
  endYear: number | null
}

export interface FamilyDTO {
  id: string
  slug: string
  name: string
  description: string | null
  visibility: Visibility
}

export interface FamilySummaryDTO extends FamilyDTO {
  /** Set only on “my families” lists. */
  role?: Role
  personCount: number
  minYear: number | null
  maxYear: number | null
}

export interface TreeDTO {
  family: FamilyDTO
  access: AccessDTO
  persons: PersonDTO[]
  parentLinks: ParentLinkDTO[]
  unions: UnionDTO[]
}

export interface AddRelativeResultDTO {
  focusId: string
  tree: TreeDTO
}

export interface RelationshipDTO { label: string, role: string, inLaw: string | null }

export interface UserDTO { id: string, name: string, email: string }

/** What the current viewer may do in a family. `role` is null for anyone who is not a member. */
export interface AccessDTO { role: Role | null, canEdit: boolean, canManage: boolean }

export interface MemberDTO { userId: string, name: string, email: string, role: Role }
export interface InviteDTO { token: string, role: Role, expiresAt: string }
export interface InvitePreviewDTO { familyName: string, familySlug: string, role: Role, expiresAt: string }
export interface MembersDTO { members: MemberDTO[], invites: InviteDTO[] }
