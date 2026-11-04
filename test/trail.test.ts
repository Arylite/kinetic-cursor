import { describe, expect, it } from 'vitest'
import { Trail } from '../src/core/effects/trail'
import { instant } from '../src/core/motion'
import type { Frame } from '../src/core/types'

const dt = 1 / 60

function frame(time: number, x: number, vx: number): Frame {
  return {
    time,
    dt,
    pointer: { x, y: 0, vx, vy: 0 },
    pressed: false,
    visible: true,
    target: null,
  }
}

function recorded(trail: Trail): { x: number; time: number }[] {
  return (trail as unknown as { points: { x: number; time: number }[] }).points
}

describe('Trail', () => {
  it('records evenly spaced points even during fast movement', () => {
    const trail = new Trail({ motion: instant(), spacing: 4, maxLength: 10000, lifetime: 10 })
    for (let i = 0; i <= 10; i++) trail.update(frame(i * dt, i * 120, 7200))

    const xs = recorded(trail).map((point) => point.x)
    expect(xs.length).toBeGreaterThan(250)
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeCloseTo(4, 0)
  })

  it('stays attached to the head while moving', () => {
    const trail = new Trail({ motion: instant(), spacing: 4 })
    let x = 0
    for (let i = 0; i <= 30; i++) trail.update(frame(i * dt, (x = i * i), 120 * i))
    const newest = recorded(trail).at(-1)
    expect(newest).toBeDefined()
    expect(x - (newest?.x ?? 0)).toBeLessThanOrEqual(4)
  })

  it('retracts along its path instead of collapsing into the head', () => {
    const trail = new Trail({ motion: instant(), lifetime: 0.3 })
    let time = 0
    for (let i = 0; i <= 20; i++, time += dt) trail.update(frame(time, i * 10, 600))
    const snapshot = recorded(trail).map((point) => point.x)

    trail.update(frame(time, 200, 0))
    const remaining = recorded(trail).map((point) => point.x)
    expect(snapshot.slice(-remaining.length)).toEqual(remaining)

    for (let i = 0; i < 30; i++) trail.update(frame((time += dt), 200, 0))
    expect(recorded(trail)).toHaveLength(0)
    expect(trail.idle).toBe(true)
  })
})
