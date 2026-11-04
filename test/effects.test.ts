import { describe, expect, it } from 'vitest'
import { Particles } from '../src/core/effects/particles'
import { Ripple } from '../src/core/effects/ripple'
import { frame, recordingContext } from './browser'

function drawn(effect: Particles | Ripple): number {
  const { context, arcs } = recordingContext()
  effect.draw(context)
  return arcs()
}

describe('Particles', () => {
  it('emits nothing while the pointer rests', () => {
    const particles = new Particles()
    for (let i = 0; i < 30; i++) particles.update(frame(i / 60, 100))
    expect(particles.idle).toBe(true)
  })

  it('releases `count` particles every `spacing` pixels', () => {
    const particles = new Particles({ spacing: 10, count: 3 })
    particles.update(frame(0, 0))
    particles.update(frame(1 / 60, 100))
    expect(drawn(particles)).toBe(30)
  })

  it('never keeps more than `max` particles alive', () => {
    const particles = new Particles({ spacing: 2, max: 5 })
    particles.update(frame(0, 0))
    particles.update(frame(1 / 60, 500))
    expect(drawn(particles)).toBe(5)
  })

  it('bursts on press', () => {
    const particles = new Particles({ burst: 12 })
    particles.press(10, 10)
    expect(particles.idle).toBe(false)
    particles.update(frame(0, 10))
    expect(drawn(particles)).toBe(12)
  })

  it('expires particles after their lifetime', () => {
    const particles = new Particles({ burst: 4, lifetime: 0.5 })
    particles.press(0, 0)
    particles.update(frame(0, 0))
    particles.update(frame(1, 0))
    expect(particles.idle).toBe(true)
  })
})

describe('Ripple', () => {
  it('runs for its duration after a press', () => {
    const ripple = new Ripple({ duration: 0.5 })
    expect(ripple.idle).toBe(true)

    ripple.press(10, 10)
    ripple.update(frame(0, 10))
    expect(drawn(ripple)).toBe(1)

    ripple.update(frame(0.6, 10))
    expect(ripple.idle).toBe(true)
  })
})
