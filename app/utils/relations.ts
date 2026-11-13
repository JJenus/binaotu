import type { RelationKind } from '#shared/schemas'

export type ViaField = 'viaParentId' | 'viaSiblingId' | 'viaAuncleId' | 'viaChildId'
export type ViaSource = 'parents' | 'siblings' | 'auncles' | 'children'

export interface RelationMeta { label: string, via?: { field: ViaField, source: ViaSource, prompt: string } }

export const RELATION_META: Record<RelationKind, RelationMeta> = {
  child: { label: 'Child' },
  partner: { label: 'Partner or spouse' },
  sibling: { label: 'Brother or sister' },
  parent: { label: 'Parent' },
  auncle: { label: 'Uncle or aunt', via: { field: 'viaParentId', source: 'parents', prompt: 'Which parent’s brother or sister?' } },
  nibling: { label: 'Nephew or niece', via: { field: 'viaSiblingId', source: 'siblings', prompt: 'Whose child?' } },
  cousin: { label: 'Cousin', via: { field: 'viaAuncleId', source: 'auncles', prompt: 'Child of which uncle or aunt?' } },
  grandparent: { label: 'Grandparent', via: { field: 'viaParentId', source: 'parents', prompt: 'Parent of which parent?' } },
  grandchild: { label: 'Grandchild', via: { field: 'viaChildId', source: 'children', prompt: 'Child of which child?' } }
}
