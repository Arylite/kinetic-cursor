# Examples

All examples assume a `CursorProvider` higher in the tree.

## Brand color

```tsx
<Cursor preset="glide" color="#7c5cff" blendMode="normal" />
```

## Labels on cards

```tsx
<a href="/work/atlas" data-cursor-label="View">
  <img src="/atlas.jpg" alt="Atlas" />
</a>
```

The `glide`, `lens`, `halo`, `jelly`, `frame`, `neon`, `spotlight` and `glass` presets show labels. To change the size of the labeled state:

```tsx
<Cursor layers={{ ring: { states: { label: { size: 104 } } } }} />
```

## Magnetic call to action

```tsx
<button data-cursor-magnetic="0.4">Get started</button>
```

## A custom "drag" state

```tsx
function Carousel() {
  return (
    <div data-cursor="drag" data-cursor-label="Drag">
      ...
    </div>
  )
}

export function AppCursor() {
  return <Cursor layers={{ ring: { states: { drag: { size: 72, stretch: 0 } } } }} />
}
```

Style it further with CSS:

```css
[data-cursor-layer='ring'][data-cursor-state='drag'] {
  background: rgb(255 255 255 / 0.1);
}
```

## Keep the system cursor in an editor

```tsx
<div className="code-editor" data-cursor="native">
  ...
</div>
```

Or turn the cursor off for a whole route:

```tsx
<CursorProvider enabled={!isEditorRoute}>
```

## Stop dead, without overshoot

```tsx
import { Cursor, spring } from 'kinetic-cursor'

const stopDead = spring({ stiffness: 2200, damping: 94, matchVelocity: 0.85, overshoot: false })

export function AppCursor() {
  return (
    <Cursor preset="ribbon" layers={{ dot: { motion: stopDead } }} trail={{ motion: stopDead }} />
  )
}
```

## More or fewer particles

```tsx
<Cursor preset="sparkle" particles={{ count: 3, spacing: 8, burst: 30, max: 300 }} />
<Cursor preset="confetti" particles={{ spacing: 40, burst: 0 }} />
```

`count` and `spacing` set the density while moving, `burst` the amount on click, and `max` caps the total.

## An icon that reacts to targets

```tsx
import { Cursor, CursorLayer, spring, useCursorState } from 'kinetic-cursor'

function ArrowLayer() {
  const { target } = useCursorState()
  return (
    <CursorLayer
      size={28}
      opacity={target?.kind === 'link' ? 1 : 0}
      motion={spring({ stiffness: 900, damping: 60, matchVelocity: 0.8 })}
      style={{ display: 'grid', placeItems: 'center' }}
    >
      <ArrowUpRightIcon />
    </CursorLayer>
  )
}

export function AppCursor() {
  return (
    <Cursor preset="minimal">
      <ArrowLayer />
    </Cursor>
  )
}
```

`useCursorState` only re-renders when the target changes, never per frame.

## React to cursor speed

```tsx
import { useCursorFrame } from 'kinetic-cursor'

function SpeedVariable() {
  useCursorFrame(({ pointer }) => {
    const speed = Math.min(Math.hypot(pointer.vx, pointer.vy) / 3000, 1)
    document.documentElement.style.setProperty('--cursor-speed', speed.toFixed(3))
  })
  return null
}
```

```css
.hero-title {
  letter-spacing: calc(-0.02em + var(--cursor-speed, 0) * 0.05em);
}
```

## A custom effect

```tsx
import { useCursorEffect, type CursorEffect, type Frame } from 'kinetic-cursor'

interface StampOptions {
  size: number
}

class Stamps implements CursorEffect {
  private stamps: { x: number; y: number; start: number | null }[] = []
  private time = 0

  constructor(private options: StampOptions) {}

  configure(options: StampOptions) {
    this.options = options
  }

  get idle() {
    return this.stamps.length === 0
  }

  press(x: number, y: number) {
    this.stamps.push({ x, y, start: null })
  }

  update({ time }: Frame) {
    this.time = time
    for (const stamp of this.stamps) stamp.start ??= time
    this.stamps = this.stamps.filter(({ start }) => time - (start ?? time) < 1)
  }

  draw(context: CanvasRenderingContext2D) {
    for (const { x, y, start } of this.stamps) {
      context.globalAlpha = 1 - (this.time - (start ?? this.time))
      context.beginPath()
      context.arc(x, y, this.options.size / 2, 0, Math.PI * 2)
      context.fill()
    }
  }
}

function CursorStamps(props: StampOptions) {
  useCursorEffect((options) => new Stamps(options), props)
  return null
}

export function AppCursor() {
  return (
    <Cursor preset="glide">
      <CursorStamps size={10} />
    </Cursor>
  )
}
```

## Register targets without attributes

```tsx
import { useRef } from 'react'
import { useCursorTarget } from 'kinetic-cursor'

function ProductCard({ product }: { product: Product }) {
  const ref = useRef<HTMLElement>(null)
  useCursorTarget(ref, { kind: 'product', label: product.price, magnetic: 0.1 })
  return <article ref={ref}>...</article>
}
```

## Vanilla JavaScript

See [Without React](./api.md#without-react).
