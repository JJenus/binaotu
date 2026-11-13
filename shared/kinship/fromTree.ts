import type { TreeDTO } from '../types'
import { FamilyGraph } from './graph'

/** Builds the graph from an API tree payload. Used identically on server and client. */
export const graphFromTree = (t: Pick<TreeDTO, 'persons' | 'parentLinks' | 'unions'>) =>
  new FamilyGraph({ persons: t.persons, parentLinks: t.parentLinks, unions: t.unions })
