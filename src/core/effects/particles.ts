import type { CursorEffect, Frame, Point } from '../types'

export interface ParticlesOptions {
  /** One color, or a palette sampled per particle. */
  color?: string | readonly string[]
  /** Distance the pointer travels between emissions, in px. */
  spacing?: number
  /** Particles released at each emission. */
  count?: number
  /** Particles thrown outward on each press. */
  burst?: number
  /** Largest particle diameter, in px. */
  size?: number
  /** Average lifetime, in seconds. */
  lifetime?: number
  /** Share of the pointer velocity a particle launches with. */
  inherit?: number
  /** Random launch speed, in px/s. */
  spread?: number
  /** Rate at which particle velocity decays, per second. */
  drag?: number
  /** Downward acceleration, in px/s². */
  gravity?: number
  /** Most particles alive at once. */
  max?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  born: number
  life: number
  size: number
  color: string | undefined
}

type ResolvedOptions = Required<Omit<ParticlesOptions, 'color'>> & Pick<ParticlesOptions, 'color'>

/** Particles shed by distance travelled, so a resting pointer never accumulates them. */
export class Particles implements CursorEffect {
  private options: ResolvedOptions
  private particles: Particle[] = []
  private bursts: Point[] = []
  private last: Point | null = null
  private carry = 0
  private time = 0

  constructor(options: ParticlesOptions = {}) {
    this.options = resolve(options)
  }

  configure(options: ParticlesOptions): void {
    this.options = resolve(options)
  }

  get idle(): boolean {
    return this.particles.length === 0 && this.bursts.length === 0
  }

  press(x: number, y: number): void {
    if (this.options.burst > 0) this.bursts.push({ x, y })
  }

  update(frame: Frame): void {
    const { time, dt, pointer } = frame
    const { drag, gravity } = this.options
    const decay = Math.exp(-drag * dt)
    this.time = time

    for (const particle of this.particles) {
      particle.vx *= decay
      particle.vy = particle.vy * decay + gravity * dt
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
    }
    this.particles = this.particles.filter((particle) => time - particle.born < particle.life)

    for (const { x, y } of this.bursts) {
      const { burst, spread } = this.options
      for (let i = 0; i < burst; i++) {
        const angle = ((i + Math.random() * 0.6) / burst) * Math.PI * 2
        const speed = spread * (1.5 + Math.random())
        this.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, time)
      }
    }
    this.bursts.length = 0

    if (!frame.visible) {
      this.last = null
      return
    }
    if (this.last) this.emit(this.last, frame)
    this.last = { x: pointer.x, y: pointer.y }
  }

  draw(context: CanvasRenderingContext2D): void {
    const inherited = context.fillStyle
    for (const particle of this.particles) {
      const t = (this.time - particle.born) / particle.life
      context.globalAlpha = (1 - t) * (1 - t)
      context.fillStyle = particle.color ?? inherited
      context.beginPath()
      context.arc(particle.x, particle.y, (particle.size / 2) * (1 - t * t), 0, Math.PI * 2)
      context.fill()
    }
  }

  private emit(from: Point, { pointer, time }: Frame): void {
    const { spacing, count, inherit, spread } = this.options
    const distance = Math.hypot(pointer.x - from.x, pointer.y - from.y)
    if (distance === 0) return

    let offset = spacing - this.carry
    while (offset <= distance) {
      const s = offset / distance
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = spread * (0.3 + Math.random() * 0.7)
        this.spawn(
          from.x + (pointer.x - from.x) * s,
          from.y + (pointer.y - from.y) * s,
          pointer.vx * inherit + Math.cos(angle) * speed,
          pointer.vy * inherit + Math.sin(angle) * speed,
          time,
        )
      }
      offset += spacing
    }
    this.carry = distance - (offset - spacing)
  }

  private spawn(x: number, y: number, vx: number, vy: number, time: number): void {
    const { color, size, lifetime, max } = this.options
    const palette = typeof color === 'string' ? [color] : color

    this.particles.push({
      x,
      y,
      vx,
      vy,
      born: time,
      life: lifetime * (0.6 + Math.random() * 0.8),
      size: size * (0.4 + Math.random() * 0.6),
      color: palette?.[Math.floor(Math.random() * palette.length)],
    })
    if (this.particles.length > max) this.particles.shift()
  }
}

function resolve(options: ParticlesOptions): ResolvedOptions {
  return {
    color: options.color,
    spacing: options.spacing ?? 12,
    count: options.count ?? 1,
    burst: options.burst ?? 0,
    size: options.size ?? 4,
    lifetime: options.lifetime ?? 0.7,
    inherit: options.inherit ?? 0.12,
    spread: options.spread ?? 50,
    drag: options.drag ?? 3,
    gravity: options.gravity ?? 0,
    max: options.max ?? 90,
  }
}
