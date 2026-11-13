import { FamilyGraph } from './graph'
import type { Sex } from '../types'

/** Four-generation sample family used by tests and the demo seed. */
const P: [id: string, name: string, sex: Sex, birth: number, parents: string[], partner?: string][] = [
  ['a1', 'Amos Ebi', 'male', 1936, [], 'a2'], ['a2', 'Grace Ebi', 'female', 1940, []],
  ['b1', 'Samuel Tari', 'male', 1938, [], 'b2'], ['b2', 'Esther Tari', 'female', 1941, []],
  ['d1', 'Daniel Ebi', 'male', 1962, ['a1', 'a2'], 'm1'], ['d2', 'Peter Ebi', 'male', 1965, ['a1', 'a2'], 's1'],
  ['d3', 'Ruth Okon', 'female', 1968, ['a1', 'a2'], 's2'], ['m1', 'Mercy Ebi', 'female', 1964, ['b1', 'b2']],
  ['m2', 'Joy Brown', 'female', 1970, ['b1', 'b2'], 's3'], ['s1', 'Folake Ebi', 'female', 1967, []],
  ['s2', 'Ekong Okon', 'male', 1964, []], ['s3', 'Kelvin Brown', 'male', 1968, []],
  ['e1', 'Ebiere Ebi', 'female', 1990, ['d1', 'm1'], 'w1'], ['e2', 'Tonye Ebi', 'male', 1993, ['d1', 'm1']],
  ['e3', 'Lola Ebi', 'female', 1996, ['d1', 'm1']], ['w1', 'Chidi Obi', 'male', 1988, []],
  ['c1', 'Wale Ebi', 'male', 1991, ['d2', 's1']], ['c2', 'Kemi Ebi', 'female', 1994, ['d2', 's1']],
  ['c3', 'Ima Okon', 'female', 1992, ['d3', 's2']], ['c4', 'Sade Brown', 'female', 1995, ['m2', 's3']],
  ['c5', 'Tobi Brown', 'male', 1998, ['m2', 's3']], ['k1', 'Amara Obi', 'female', 2016, ['e1', 'w1']],
  ['k2', 'Dede Obi', 'male', 2019, ['e1', 'w1']], ['k3', 'Ayo Ebi', 'male', 2021, ['c1']]
]

export const sampleFamily = () => new FamilyGraph({
  persons: P.map(([id, , sex, birthYear]) => ({ id, sex, birthYear })),
  parentLinks: P.flatMap(([childId, , , , ps]) => ps.map(parentId => ({ childId, parentId }))),
  unions: P.filter(p => p[5]).map(p => ({ partnerAId: p[0], partnerBId: p[5]! }))
})
export const sampleNames = Object.fromEntries(P.map(p => [p[0], p[1]]))
