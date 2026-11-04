import { createBody, defaultMotion, isSettled, snapBody, type Motion } from '../motion'
import type { CursorEffect, Frame } from '../types'

export interface TrailOptions {
  color?: string
  /** Width at the head, in px. */
  width?: number
  opacity?: number
  /** Seconds a point of the trail stays visible. */
  lifetime?: number
  /** Longest visible trail, in px. */
  maxLength?: number
  /** Distance between recorded points, in px. */
  spacing?: number
  /** Motion of the trail head. Match it to the cursor layer it emerges from. */
  motion?: Motion
}

type ResolvedOptions = Required<Omit<TrailOptions, 'color'>> & Pick<TrailOptions, 'color'>

interface TrailPoint {
  x: number
  y: number
  time: number
}

/**
 * A tapered ribbon drawn along the path the head actually travelled. Points
 * never move once recorded; they expire by age, so the trail retracts along
 * its own path instead of collapsing into the cursor.
 */
export class Trail implements CursorEffect {
  private options: ResolvedOptions
  private head = createBody([0, 0])
  private points: TrailPoint[] = []
  private following = false
  private settled = true
  private carry = 0
  private time = 0

  constructor(options: TrailOptions = {}) {
    this.options = resolve(options)
  }

  configure(options: TrailOptions): void {
    this.options = resolve(options)
  }

  get idle(): boolean {
    return this.settled && this.points.length === 0
  }

  update(frame: Frame): void {
    const { pointer, time, dt } = frame
    this.time = time
    this.expire()

    if (!frame.visible) {
      this.following = false
      this.settled = true
      return
    }

    const target = [pointer.x, pointer.y]
    if (!this.following) {
      snapBody(this.head, target)
      this.following = true
      this.carry = 0
      return
    }

    const [x0, y0] = this.head.value
    const [vx0, vy0] = this.head.velocity
    this.options.motion(this.head, target, [pointer.vx, pointer.vy], dt)
    const [x1, y1] = this.head.value
    const [vx1, vy1] = this.head.velocity
    this.record([x0, y0, vx0 * dt, vy0 * dt], [x1, y1, vx1 * dt, vy1 * dt], time - dt, dt)
    this.settled = isSettled(this.head, target, 0.05)
  }

  draw(context: CanvasRenderingContext2D): void {
    const { width, opacity, lifetime, maxLength, color } = this.options
    const [hx, hy] = this.head.value
    const path = [{ x: hx, y: hy, time: this.time }, ...this.points.slice().reverse()]
    if (path.length < 2) return

    const widths: number[] = []
    let length = 0
    for (let i = 0; i < path.length; i++) {
      if (i > 0) length += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
      const life = 1 - (this.time - path[i].time) / lifetime
      const reach = 1 - length / maxLength
      const t = Math.max(Math.min(life, reach), 0)
      widths.push(width * t * (2 - t))
    }

    const left: number[] = []
    const right: number[] = []
    for (let i = 0; i < path.length; i++) {
      const previous = path[Math.max(i - 1, 0)]
      const next = path[Math.min(i + 1, path.length - 1)]
      const dx = next.x - previous.x
      const dy = next.y - previous.y
      const norm = Math.hypot(dx, dy) || 1
      const offset = widths[i] / 2
      const nx = (-dy / norm) * offset
      const ny = (dx / norm) * offset
      left.push(path[i].x + nx, path[i].y + ny)
      right.push(path[i].x - nx, path[i].y - ny)
    }

    const direction = Math.atan2(path[1].y - hy, path[1].x - hx)
    context.globalAlpha = opacity
    if (color) context.fillStyle = color
    context.beginPath()
    context.moveTo(left[0], left[1])
    for (let i = 2; i < left.length; i += 2) context.lineTo(left[i], left[i + 1])
    for (let i = right.length - 2; i >= 0; i -= 2) context.lineTo(right[i], right[i + 1])
    context.arc(hx, hy, widths[0] / 2, direction - Math.PI / 2, direction + Math.PI / 2, true)
    context.fill()
  }

  private record(from: number[], to: number[], start: number, dt: number): void {
    const { spacing } = this.options
    const steps = Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / 2)
    let [px, py] = from
    for (let i = 1; i <= steps; i++) {
      const s = i / steps
      const x = hermite(from[0], from[2], to[0], to[2], s)
      const y = hermite(from[1], from[3], to[1], to[3], s)
      let segment = Math.hypot(x - px, y - py)
      while (this.carry + segment >= spacing) {
        const share = (spacing - this.carry) / segment
        px += (x - px) * share
        py += (y - py) * share
        segment -= spacing - this.carry
        this.carry = 0
        this.points.push({ x: px, y: py, time: start + dt * s })
      }
      this.carry += segment
      px = x
      py = y
    }
  }

  private expire(): void {
    const { lifetime, maxLength, spacing } = this.options
    const capacity = Math.ceil(maxLength / spacing) + 1
    let stale = Math.max(this.points.length - capacity, 0)
    while (stale < this.points.length && this.time - this.points[stale].time > lifetime) stale++
    if (stale) this.points.splice(0, stale)
  }
}

function resolve(options: TrailOptions): ResolvedOptions {
  return {
    color: options.color,
    width: options.width ?? 6,
    opacity: options.opacity ?? 1,
    lifetime: options.lifetime ?? 0.32,
    maxLength: options.maxLength ?? 260,
    spacing: options.spacing ?? 3,
    motion: options.motion ?? defaultMotion,
  }
}

function hermite(p0: number, m0: number, p1: number, m1: number, s: number): number {
  const s2 = s * s
  const s3 = s2 * s
  return (
    (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * m1
  )
}
