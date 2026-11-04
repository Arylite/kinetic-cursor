import { describe, expect, it } from 'vitest'
import { PointerTracker } from '../src/core/pointer'

describe('PointerTracker', () => {
  it('estimates velocity in px/s from recent samples', () => {
    const pointer = new PointerTracker()
    for (let i = 0; i <= 10; i++) pointer.record(i * 8, 0, i * 8)
    pointer.update(80)
    expect(pointer.vx).toBeCloseTo(1000, 6)
    expect(pointer.vy).toBe(0)
  })

  it('reports zero velocity once the pointer stops', () => {
    const pointer = new PointerTracker()
    for (let i = 0; i <= 10; i++) pointer.record(i * 8, 0, i * 8)
    pointer.update(200)
    expect(pointer.vx).toBe(0)
  })
})
