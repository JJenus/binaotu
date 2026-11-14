import type { AddRelativeInput, CreateFamilyInput, PersonInput } from '#shared/schemas'
import type { AddRelativeResultDTO, FamilySummaryDTO, RelationshipDTO, TreeDTO } from '#shared/types'
import { request } from './http'

const family = (slug: string) => `/families/${encodeURIComponent(slug)}`

/** Every family endpoint, one typed function each. Components never call these directly; composables do. */
export const familiesApi = {
  search: (q: string) => request<FamilySummaryDTO[]>('/families', { query: { q } }),
  create: (input: CreateFamilyInput) => request<TreeDTO>('/families', { method: 'POST', body: input }),
  getTree: (slug: string) => request<TreeDTO>(family(slug)),
  addRelative: (slug: string, personId: string, input: AddRelativeInput) =>
    request<AddRelativeResultDTO>(`${family(slug)}/persons/${personId}/relatives`, { method: 'POST', body: input }),
  updatePerson: (slug: string, personId: string, input: PersonInput) =>
    request<TreeDTO>(`${family(slug)}/persons/${personId}`, { method: 'PUT', body: input }),
  removePerson: (slug: string, personId: string) => request<TreeDTO>(`${family(slug)}/persons/${personId}`, { method: 'DELETE' }),
  relationship: (slug: string, a: string, b: string) => request<RelationshipDTO>(`${family(slug)}/relationship`, { query: { a, b } })
}
