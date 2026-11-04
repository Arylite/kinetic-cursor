import {
  createBody,
  defaultMotion,
  instant,
  isSettled,
  snapBody,
  spring,
  type Motion,
} from './motion'
import type { ActiveTarget, Frame, Point } from './types'

export interface Shape {
  width: number
  height: number
  /** Corner radius in px. Defaults to a circle. */
  radius: number
  opacity: number
  scale: number
  /** Velocity-driven stretch along the direction of travel, from 0 to 1. */
  stretch: number
}

export interface ShapeOverride extends Partial<Shape> {
  /** Sets both width and height. */
  size?: number
  /** Anchors the layer to a viewport point instead of the pointer. */
  x?: number
  y?: number
}

export interface ShapeContext {
  readonly target: ActiveTarget
  readonly pointer: Readonly<Point>
}

export type ShapeRule = ShapeOverride | ((context: ShapeContext) => ShapeOverride)

export interface LayerOptions extends ShapeOverride {
  motion?: Motion
  /** Motion used for size, radius, opacity, scale and stretch. */
  shapeMotion?: Motion
  /** Scale applied while the pointer is pressed. */
  pressScale?: number
  /** Shape overrides keyed by target kind. */
  states?: Readonly<Record<string, ShapeRule>>
}

const STRETCH_SPEED = 1400
const defaultShapeMotion = spring({ stiffness: 520, damping: 42 })
const snap = instant()
const precise = (value: number): string => value.toFixed(2)

export class Layer {
  readonly element: HTMLElement
  private options: LayerOptions
  private position = createBody([0, 0])
  private shape = createBody([0, 0, 0, 0, 1, 0])
  private kind = ''
  private styles = new Map<string, string>()

  constructor(element: HTMLElement, options: LayerOptions) {
    this.element = element
    this.options = options
  }

  configure(options: LayerOptions): void {
    this.options = options
  }

  /** Steps the layer one frame. Returns true once it has come to rest. */
  update(frame: Frame, reducedMotion: boolean): boolean {
    const { pointer, target } = frame
    const override = this.resolveOverride(frame)
    const anchored = override.x !== undefined || override.y !== undefined
    const position = [override.x ?? pointer.x, override.y ?? pointer.y]
    const shape = this.resolveShape(override, frame)

    if (this.shape.value[3] < 0.01) snapBody(this.position, position)

    const motion = reducedMotion ? snap : (this.options.motion ?? defaultMotion)
    const shapeMotion = reducedMotion ? snap : (this.options.shapeMotion ?? defaultShapeMotion)
    motion(this.position, position, anchored ? null : [pointer.vx, pointer.vy], frame.dt)
    shapeMotion(this.shape, shape, null, frame.dt)

    this.setKind(frame.visible && target ? target.kind : '')
    this.render()
    return isSettled(this.position, position, 0.05) && isSettled(this.shape, shape, 0.005)
  }

  private resolveOverride({ target, pointer }: Frame): ShapeOverride {
    const rule = target ? this.options.states?.[target.kind] : undefined
    if (!rule || !target) return {}
    return typeof rule === 'function' ? rule({ target, pointer }) : rule
  }

  private resolveShape(override: ShapeOverride, frame: Frame): number[] {
    const { options } = this
    const size = options.size ?? 8
    const width = override.width ?? override.size ?? options.width ?? size
    const height = override.height ?? override.size ?? options.height ?? size
    const radius = override.radius ?? options.radius ?? Math.min(width, height) / 2
    const opacity = (override.opacity ?? options.opacity ?? 1) * (frame.visible ? 1 : 0)
    const press = frame.pressed ? (options.pressScale ?? 1) : 1
    const scale = (override.scale ?? options.scale ?? 1) * press
    const stretch = override.stretch ?? options.stretch ?? 0
    return [width, height, radius, opacity, scale, stretch]
  }

  private render(): void {
    const [x, y] = this.position.value
    const [vx, vy] = this.position.velocity
    const [width, height, radius, opacity, scale, stretch] = this.shape.value
    const speed = Math.hypot(vx, vy)
    const amount = 1 + Math.max(stretch, 0) * (speed / (speed + STRETCH_SPEED))
    const angle = speed > 1 ? Math.atan2(vy, vx) : 0

    this.setStyle(
      'transform',
      `translate3d(${precise(x - width / 2)}px, ${precise(y - height / 2)}px, 0) ` +
        `rotate(${precise(angle)}rad) scale(${precise(scale * amount)}, ${precise(scale / amount)}) ` +
        `rotate(${precise(-angle)}rad)`,
    )
    this.setStyle('width', `${precise(Math.max(width, 0))}px`)
    this.setStyle('height', `${precise(Math.max(height, 0))}px`)
    this.setStyle('border-radius', `${precise(Math.max(radius, 0))}px`)
    this.setStyle('opacity', precise(Math.min(Math.max(opacity, 0), 1)))
  }

  private setStyle(property: string, value: string): void {
    if (this.styles.get(property) === value) return
    this.styles.set(property, value)
    this.element.style.setProperty(property, value)
  }

  private setKind(kind: string): void {
    if (kind === this.kind) return
    this.kind = kind
    if (kind) this.element.dataset.cursorState = kind
    else delete this.element.dataset.cursorState
  }
}
