import { describe, expect, it } from 'vitest'
import { gridSlots, ringSlots, stageHeight } from './stageLayout'

const size = { width: 360, height: 380 }
describe('ringSlots', () => {
  const slots = ringSlots(['a', 'b', 'c', 'd', 'e'], 2, size)
  it('makes the centre the biggest, front-most and fully visible', () => {
    const c = slots.get('c')!
    for (const id of 'abde') { expect(c.s).toBeGreaterThan(slots.get(id)!.s); expect(c.z).toBeGreaterThan(slots.get(id)!.z) }
    expect(c).toMatchObject({ x: 0, o: 1 })
  })
  it('is symmetric and fades with distance', () => {
    expect(slots.get('a')!.x).toBeCloseTo(-slots.get('e')!.x)
    expect(slots.get('b')!.o).toBeGreaterThan(slots.get('a')!.o)
  })
  it('hides figures far from the centre', () => {
    const far = ringSlots(Array.from({ length: 12 }, (_, i) => String(i)), 0, size)
    expect(far.get('11')!.o).toBe(0)
  })
  it('follows a fractional centre while dragging', () => {
    const mid = ringSlots(['a', 'b'], .5, size)
    expect(mid.get('a')!.s).toBeCloseTo(mid.get('b')!.s)
  })
})

describe('gridSlots', () => {
  const rows = [['a', 'b'], ['c', 'd', 'e'], ['f']]
  const slots = gridSlots(rows, size)
  it('places every person and keeps older generations higher', () => {
    expect(slots.size).toBe(6)
    expect(slots.get('a')!.y).toBeLessThan(slots.get('f')!.y)
  })
  it('keeps figures inside the stage width', () => {
    for (const s of slots.values()) expect(Math.abs(s.x)).toBeLessThanOrEqual(size.width / 2)
  })
})

describe('stageHeight', () => {
  it('is taller for the grid and capped', () => {
    expect(stageHeight('grid', 800)).toBeGreaterThan(stageHeight('ring', 800))
    expect(stageHeight('grid', 2000)).toBe(560)
  })
})
