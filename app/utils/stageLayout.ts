/** Pure layout maths for the tree stage. No Vue, so it is easy to test. */
export interface Slot { x: number, y: number, s: number, o: number, z: number }
export interface StageSize { width: number, height: number }
export type StageMode = 'ring' | 'grid'

export const HIDDEN: Slot = { x: 0, y: 0, s: .3, o: 0, z: 0 }
export const FIGURE = { width: 96, height: 190, labelRoom: 34 }

export const stageHeight = (mode: StageMode, viewportHeight: number) =>
  mode === 'grid' ? Math.min(viewportHeight * .72, 560) : Math.min(viewportHeight * .5, 400)

export const ringSpacing = (width: number) => Math.min(112, width / 6.2)

/** One row in perspective: `center` (may be fractional while dragging) is the tall figure, the rest shrink and fade away from it. */
export function ringSlots(row: string[], center: number, { width, height }: StageSize): Map<string, Slot> {
  const base = height - FIGURE.labelRoom, spacing = ringSpacing(width)
  return new Map(row.map((id, k) => {
    const d = k - center, a = Math.abs(d)
    return [id, {
      x: d * spacing * (1 - .05 * Math.min(a, 6)),
      y: -a * 5,
      s: Math.max(.4, 1.3 * base / 330 - .2 * a),
      o: a > 5.5 ? 0 : 1 - .09 * a,
      z: 50 - Math.round(a * 10)
    }]
  }))
}

const jitter = (id: string) => ([...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 7 - 3) * .015

/** Everyone at once: one loose row per generation, each figure a little offset for depth. */
export function gridSlots(rows: string[][], { width, height }: StageSize): Map<string, Slot> {
  const base = height - FIGURE.labelRoom, rowHeight = base / Math.max(1, rows.length)
  const widest = Math.max(1, ...rows.map(r => r.length))
  const scale = Math.min(.62, (rowHeight - 26) / FIGURE.height, width / (widest * 92))
  const out = new Map<string, Slot>()
  rows.forEach((row, r) => row.forEach((id, k) => out.set(id, {
    x: ((k + .5) / row.length - .5) * (width - 60),
    y: (r + 1) * rowHeight - 6 - base + (k % 2 ? -8 : 0),
    s: scale * (1 + jitter(id)),
    o: 1,
    z: 10 + r
  })))
  return out
}
