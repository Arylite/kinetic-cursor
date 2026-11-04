import { describe, expect, it } from 'vitest'
import { adaptive, createBody, smooth, spring, type Motion } from '../src/core/motion'

function run(
  motion: Motion,
  seconds: number,
  fps: number,
  target = [100],
  velocity: number[] | null = null,
) {
  const body = createBody([0])
  const dt = 1 / fps
  for (let t = 0; t < seconds - 1e-9; t += dt) motion(body, target, velocity, dt)
  return body
}

describe('spring', () => {
  it('settles on the target', () => {
    const body = run(spring({ stiffness: 300, damping: 30 }), 2, 60)
    expect(body.value[0]).toBeCloseTo(100, 3)
    expect(body.velocity[0]).toBeCloseTo(0, 3)
  })

  it('gives the same result at any frame rate', () => {
    const motion = spring({ stiffness: 200, damping: 12 })
    const at30 = run(motion, 0.5, 30)
    const at240 = run(motion, 0.5, 240)
    expect(at30.value[0]).toBeCloseTo(at240.value[0], 6)
  })

  it('stays stable with very stiff parameters and long frames', () => {
    const body = run(spring({ stiffness: 50000, damping: 10 }), 1, 10)
    expect(Number.isFinite(body.value[0])).toBe(true)
    expect(Math.abs(body.value[0])).toBeLessThan(200)
  })

  it('never overshoots when critically damped', () => {
    const motion = spring({ stiffness: 400, damping: 40 })
    const body = createBody([0])
    for (let i = 0; i < 240; i++) {
      motion(body, [100], null, 1 / 120)
      expect(body.value[0]).toBeLessThanOrEqual(100 + 1e-9)
    }
  })

  it('keeps pace with a moving target when matching its velocity', () => {
    const speed = 1200
    const lag = (matchVelocity: number) => {
      const motion = spring({ stiffness: 400, damping: 40, matchVelocity })
      const body = createBody([0])
      let target = 0
      for (let i = 0; i < 240; i++) {
        target += speed / 120
        motion(body, [target], [speed], 1 / 120)
      }
      return target - body.value[0]
    }
    expect(lag(0)).toBeCloseTo(120, 0)
    expect(Math.abs(lag(1))).toBeLessThan(0.01)
  })
})

describe('smooth', () => {
  it('halves the distance every half-life', () => {
    const body = run(smooth({ halfLife: 0.1 }), 0.1, 50)
    expect(body.value[0]).toBeCloseTo(50, 6)
  })
})

describe('adaptive', () => {
  it('tightens as the target speeds up', () => {
    const slow = run(adaptive(), 0.05, 60, [100], [0])
    const fast = run(adaptive(), 0.05, 60, [100], [3000])
    expect(fast.value[0]).toBeGreaterThan(slow.value[0])
  })
})
