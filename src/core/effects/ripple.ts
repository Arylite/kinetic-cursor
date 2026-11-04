import type { CursorEffect, Frame } from '../types'

export interface RippleOptions {
  color?: string
  /** Final radius, in px. */
  radius?: number
  /** Seconds a ripple lasts. */
  duration?: number
  /** Stroke width, in px. */
  width?: number
  opacity?: number
}

interface Wave {
  x: number
  y: number
  start: number | null
}

type ResolvedOptions = Required<Omit<RippleOptions, 'color'>> & Pick<RippleOptions, 'color'>

const MAX_WAVES = 8

/** An expanding ring emitted on every press. */
export class Ripple implements CursorEffect {
  private options: ResolvedOptions
  private waves: Wave[] = []
  private time = 0

  constructor(options: RippleOptions = {}) {
    this.options = resolve(options)
  }

  configure(options: RippleOptions): void {
    this.options = resolve(options)
  }

  get idle(): boolean {
    return this.waves.length === 0
  }

  press(x: number, y: number): void {
    this.waves.push({ x, y, start: null })
    if (this.waves.length > MAX_WAVES) this.waves.shift()
  }

  update({ time }: Frame): void {
    this.time = time
    for (const wave of this.waves) wave.start ??= time
    this.waves = this.waves.filter(({ start }) => time - (start ?? time) < this.options.duration)
  }

  draw(context: CanvasRenderingContext2D): void {
    const { color, radius, duration, width, opacity } = this.options
    if (color) context.strokeStyle = color
    context.lineWidth = width
    for (const wave of this.waves) {
      const t = Math.min((this.time - (wave.start ?? this.time)) / duration, 1)
      const eased = 1 - (1 - t) ** 3
      context.globalAlpha = opacity * (1 - t) * (1 - t)
      context.beginPath()
      context.arc(wave.x, wave.y, radius * (0.25 + 0.75 * eased), 0, Math.PI * 2)
      context.stroke()
    }
  }
}

function resolve(options: RippleOptions): ResolvedOptions {
  return {
    color: options.color,
    radius: options.radius ?? 28,
    duration: options.duration ?? 0.6,
    width: options.width ?? 1.5,
    opacity: options.opacity ?? 0.6,
  }
}
