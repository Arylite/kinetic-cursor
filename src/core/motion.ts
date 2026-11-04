export interface Body {
  value: number[]
  velocity: number[]
}

/**
 * Advances a body toward a target over `dt` seconds. `targetVelocity` is the
 * velocity of a moving target, or `null` when the target is at rest.
 */
export type Motion = (
  body: Body,
  target: readonly number[],
  targetVelocity: readonly number[] | null,
  dt: number,
) => void

export function createBody(value: readonly number[]): Body {
  return { value: [...value], velocity: value.map(() => 0) }
}

export function snapBody(body: Body, value: readonly number[]): void {
  value.forEach((v, i) => {
    body.value[i] = v
    body.velocity[i] = 0
  })
}

export function isSettled(body: Body, target: readonly number[], epsilon = 0.01): boolean {
  return target.every(
    (v, i) => Math.abs(body.value[i] - v) < epsilon && Math.abs(body.velocity[i]) < epsilon * 10,
  )
}

/** Follows the target exactly. */
export function instant(): Motion {
  return (body, target, targetVelocity) => {
    target.forEach((v, i) => {
      body.value[i] = v
      body.velocity[i] = targetVelocity?.[i] ?? 0
    })
  }
}

export interface SmoothOptions {
  /** Seconds for the remaining distance to halve. */
  halfLife?: number
}

/** Frame-rate independent exponential smoothing. No inertia, no overshoot. */
export function smooth({ halfLife = 0.04 }: SmoothOptions = {}): Motion {
  return (body, target, _targetVelocity, dt) => {
    approach(body, target, halfLife, dt)
  }
}

export interface AdaptiveOptions {
  /** Half-life applied when the target is at rest. */
  halfLife?: number
  /** How quickly smoothing falls off with target speed, per px/s. */
  responsiveness?: number
}

/**
 * Exponential smoothing whose half-life shrinks as the target speeds up:
 * soft and stable at rest, tight during fast movement. Lag stays bounded at
 * roughly `halfLife / (ln 2 * responsiveness)` pixels regardless of speed.
 */
export function adaptive({
  halfLife = 0.08,
  responsiveness = 0.006,
}: AdaptiveOptions = {}): Motion {
  return (body, target, targetVelocity, dt) => {
    const speed = targetVelocity ? Math.hypot(...targetVelocity) : 0
    approach(body, target, halfLife / (1 + speed * responsiveness), dt)
  }
}

export interface SpringOptions {
  stiffness?: number
  damping?: number
  mass?: number
  /**
   * Share of the target velocity the spring damps toward, from 0 to 1. At 1 the
   * body keeps pace with a moving target instead of trailing behind it, while
   * still easing out of stops and direction changes.
   */
  matchVelocity?: number
  /**
   * When false, the body never travels past its target: an abrupt stop lands
   * it on the pointer instead of carrying it beyond and springing back.
   */
  overshoot?: boolean
}

/**
 * Damped spring solved analytically each frame, so it stays stable and
 * identical at any frame rate.
 */
export function spring({
  stiffness = 170,
  damping = 26,
  mass = 1,
  matchVelocity = 0,
  overshoot = true,
}: SpringOptions = {}): Motion {
  const omega = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))

  return (body, target, targetVelocity, dt) => {
    const before = overshoot ? null : target.map((end, i) => body.value[i] - end)

    target.forEach((end, i) => {
      const u = targetVelocity?.[i] ?? 0
      const lag = (-2 * zeta * (1 - matchVelocity) * u) / omega
      const [offset, velocity] = oscillate(
        body.value[i] - end + u * dt - lag,
        body.velocity[i] - u,
        omega,
        zeta,
        dt,
      )
      body.value[i] = end + lag + offset
      body.velocity[i] = u + velocity
    })

    if (before && target.reduce((sum, end, i) => sum + before[i] * (body.value[i] - end), 0) < 0) {
      target.forEach((end, i) => {
        body.value[i] = end
        body.velocity[i] = targetVelocity?.[i] ?? 0
      })
    }
  }
}

function approach(body: Body, target: readonly number[], halfLife: number, dt: number): void {
  const t = halfLife > 0 ? 1 - 2 ** (-dt / halfLife) : 1
  target.forEach((v, i) => {
    const previous = body.value[i]
    body.value[i] = previous + (v - previous) * t
    body.velocity[i] = dt > 0 ? (body.value[i] - previous) / dt : 0
  })
}

function oscillate(x: number, v: number, omega: number, zeta: number, t: number): [number, number] {
  if (Math.abs(zeta - 1) < 1e-4) {
    const decay = Math.exp(-omega * t)
    const c = v + omega * x
    return [(x + c * t) * decay, (v - omega * c * t) * decay]
  }

  if (zeta < 1) {
    const damped = omega * Math.sqrt(1 - zeta * zeta)
    const decay = Math.exp(-zeta * omega * t)
    const cos = Math.cos(damped * t)
    const sin = Math.sin(damped * t)
    const b = (v + zeta * omega * x) / damped
    return [decay * (x * cos + b * sin), decay * (v * cos - (x * damped + zeta * omega * b) * sin)]
  }

  const root = omega * Math.sqrt(zeta * zeta - 1)
  const r1 = -zeta * omega + root
  const r2 = -zeta * omega - root
  const c2 = (v - r1 * x) / (r2 - r1)
  const c1 = x - c2
  const e1 = Math.exp(r1 * t)
  const e2 = Math.exp(r2 * t)
  return [c1 * e1 + c2 * e2, r1 * c1 * e1 + r2 * c2 * e2]
}

export const defaultMotion: Motion = spring({ stiffness: 1800, damping: 85, matchVelocity: 0.8 })
