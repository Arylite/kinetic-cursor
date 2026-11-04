export interface Point {
  x: number
  y: number
}

export interface Rect extends Point {
  width: number
  height: number
}

export interface PointerState extends Point {
  vx: number
  vy: number
}

export interface TargetOptions {
  /** Context name matched against layer `states`. `'native'` shows the system cursor instead. */
  kind?: string
  /** Text exposed to cursor layers; elements with a label default to the `'label'` kind. */
  label?: string
  /**
   * How far the element is drawn toward the pointer while hovered, from 0 to 1.
   * Applied through the CSS `translate` property.
   */
  magnetic?: number
}

export interface CursorTarget {
  readonly kind: string
  readonly element: Element
  readonly label: string | null
  readonly magnetic: number
}

export interface ActiveTarget extends CursorTarget {
  /** Viewport rect, including the current magnetic offset. */
  readonly rect: Readonly<Rect>
  readonly radius: number
  readonly fontSize: number
}

export interface Frame {
  /** Seconds, on the `performance.now()` timeline. */
  readonly time: number
  readonly dt: number
  readonly pointer: Readonly<PointerState>
  readonly pressed: boolean
  readonly visible: boolean
  readonly target: ActiveTarget | null
}

export interface CursorEffect {
  update(frame: Frame): void
  draw(context: CanvasRenderingContext2D): void
  press?(x: number, y: number): void
  /** True when the effect has nothing left to animate or draw. */
  readonly idle: boolean
}
