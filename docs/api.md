# API reference

## Components

### `<CursorProvider>`

Creates the cursor engine. Everything else must be rendered inside it.

| Prop               | Type                            | Default        |
| ------------------ | ------------------------------- | -------------- |
| `enabled`          | `boolean \| 'auto'`             | `'auto'`       |
| `hideNativeCursor` | `boolean`                       | `true`         |
| `reducedMotion`    | `'user' \| 'always' \| 'never'` | `'user'`       |
| `selectors`        | `Record<string, string>`        | built-in kinds |
| `magneticMotion`   | `Motion`                        | soft spring    |
| `zIndex`           | `number`                        | `2147483647`   |

`'auto'` enables the cursor only when a hovering, fine pointer is available and forced-colors mode is off.

### `<Cursor>`

Renders a preset. Every field of a preset can be passed as a prop and is merged over it; `false` removes a part.

| Prop        | Type                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| `preset`    | `'glide' \| 'minimal' \| 'ribbon' \| 'sparkle' \| 'lens' \| CursorPreset` |
| `color`     | `string`                                                                  |
| `blendMode` | CSS `mix-blend-mode`                                                      |
| `dot`       | `LayerConfig \| false`                                                    |
| `ring`      | `LayerConfig \| false`                                                    |
| `trail`     | `TrailOptions \| false`                                                   |
| `particles` | `ParticlesOptions \| false`                                               |
| `ripple`    | `RippleOptions \| false`                                                  |
| `children`  | Extra layers or effects                                                   |

The ring shows the hovered target's label.

### `<CursorLayer>`

A cursor element driven by the engine. Accepts all layer options plus `className`, `style` and `children`. Use `style` for visuals; geometry and opacity come from the options.

| Option            | Default           |                                              |
| ----------------- | ----------------- | -------------------------------------------- |
| `motion`          | responsive spring | Position motion                              |
| `shapeMotion`     | spring            | Size, radius, opacity, scale, stretch motion |
| `size`            | `8`               | Sets width and height                        |
| `width`, `height` | `size`            |                                              |
| `radius`          | circle            | Corner radius in px                          |
| `opacity`         | `1`               |                                              |
| `scale`           | `1`               |                                              |
| `stretch`         | `0`               | Velocity squash and stretch, 0 to 1          |
| `pressScale`      | `1`               | Scale while pressed                          |
| `states`          | none              | Overrides per target kind                    |

### `<CursorTrail>`

| Option      | Default      |                               |
| ----------- | ------------ | ----------------------------- |
| `color`     | cursor color |                               |
| `width`     | `6`          | Width at the head, px         |
| `opacity`   | `1`          |                               |
| `lifetime`  | `0.32`       | Seconds a point stays visible |
| `maxLength` | `260`        | Longest trail, px             |
| `spacing`   | `3`          | Distance between points, px   |
| `motion`    | dot motion   | Motion of the trail head      |

### `<CursorParticles>`

| Option     | Default      |                                     |
| ---------- | ------------ | ----------------------------------- |
| `color`    | cursor color | A color or an array of colors       |
| `spacing`  | `12`         | Pointer travel per particle, px     |
| `size`     | `4`          | Largest diameter, px                |
| `lifetime` | `0.7`        | Average seconds                     |
| `inherit`  | `0.12`       | Share of pointer velocity inherited |
| `spread`   | `50`         | Random launch speed, px/s           |
| `drag`     | `3`          | Velocity decay per second           |
| `gravity`  | `0`          | Downward acceleration, px/s²        |
| `max`      | `90`         | Most particles alive at once        |

### `<CursorRipple>`

| Option     | Default      |                  |
| ---------- | ------------ | ---------------- |
| `color`    | cursor color |                  |
| `radius`   | `28`         | Final radius, px |
| `duration` | `0.6`        | Seconds          |
| `width`    | `1.5`        | Stroke width, px |
| `opacity`  | `0.6`        |                  |

## Hooks

| Hook                               | Purpose                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| `useCursorState()`                 | `{ enabled, visible, pressed, target }`. Re-renders only on changes. |
| `useCursorTarget(ref, options)`    | Assigns `kind`, `label` and `magnetic` to an element.                |
| `useCursorLayer(options)`          | Returns a ref that turns any element into a cursor layer.            |
| `useCursorFrame(callback)`         | Runs on every animation frame while the cursor moves.                |
| `useCursorEffect(create, options)` | Mounts a custom canvas effect.                                       |
| `useCursorEngine()`                | The underlying `CursorEngine`.                                       |

### Custom layer

```tsx
import { spring, useCursorLayer } from 'kinetic-cursor'

function Blob() {
  const ref = useCursorLayer<HTMLDivElement>({
    size: 80,
    motion: spring({ stiffness: 90, damping: 14 }),
  })
  return <div ref={ref} className="blob" />
}

export function AppCursor() {
  return (
    <Cursor preset="minimal">
      <Blob />
    </Cursor>
  )
}
```

### Frame callback

`useCursorFrame` receives the frame: `time`, `dt`, `pointer` (`x`, `y`, `vx`, `vy`), `pressed`, `visible` and `target`. Use it to drive your own animations without re-rendering.

```tsx
useCursorFrame(({ pointer }) => {
  const speed = Math.hypot(pointer.vx, pointer.vy)
  element.style.setProperty('--speed', String(speed))
})
```

### Custom effect

An effect implements `update(frame)`, `draw(context)`, an `idle` getter and optionally `press(x, y)`. Add a `configure(options)` method to use it with `useCursorEffect`.

## Without React

`kinetic-cursor/core` exports the engine, motion models, shape helpers and effects with no React dependency.

```ts
import { CursorEngine, Trail, spring } from 'kinetic-cursor/core'

const engine = new CursorEngine()
engine.connect()
engine.setAppearance({ color: '#fff', blendMode: 'difference' })

const dot = document.createElement('div')
dot.style.cssText = 'position:absolute;top:0;left:0;background:currentColor'
engine.root?.append(dot)
engine.addLayer(dot, { size: 8, motion: spring({ stiffness: 1800, damping: 85 }) })
engine.addEffect(new Trail())
```

`connect()` and `disconnect()` attach and remove all listeners and DOM; the engine can be reconnected.
