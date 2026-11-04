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

Renders a preset. Every field of a preset can be passed as a prop and is merged over it; `false` removes a layer or an effect.

| Prop        | Type                                                      |
| ----------- | --------------------------------------------------------- |
| `preset`    | `PresetName \| CursorPreset`, see [Presets](./presets.md) |
| `color`     | `string`                                                  |
| `blendMode` | CSS `mix-blend-mode`                                      |
| `layers`    | `Record<string, LayerConfig \| false>`                    |
| `trail`     | `TrailOptions \| false`                                   |
| `particles` | `ParticlesOptions \| false`                               |
| `ripple`    | `RippleOptions \| false`                                  |
| `children`  | Extra layers or effects, rendered on top                  |

Layers are merged with the preset's layers by name; their `style` and `states` are merged too. New names are added on top, in order.

`LayerConfig` takes every `CursorLayer` option plus `label`, which renders the hovered target's label inside the layer.

### `<CursorLayer>`

A cursor element driven by the engine. Use `style` and `className` for visuals; geometry and opacity come from the options.

| Option            | Default           |                                                 |
| ----------------- | ----------------- | ----------------------------------------------- |
| `name`            | none              | Exposed as `data-cursor-layer`                  |
| `motion`          | responsive spring | Position motion                                 |
| `shapeMotion`     | spring            | Size, radius, opacity, scale and stretch motion |
| `size`            | `8`               | Sets width and height                           |
| `width`, `height` | `size`            |                                                 |
| `radius`          | circle            | Corner radius in px                             |
| `opacity`         | `1`               |                                                 |
| `scale`           | `1`               |                                                 |
| `stretch`         | `0`               | Velocity squash and stretch, 0 to 1             |
| `pressScale`      | `1`               | Scale while pressed                             |
| `states`          | none              | Overrides per target kind                       |

The element also carries `data-cursor-state` with the hovered target's kind.

### `<CursorLabel>`

Renders the hovered target's label, or nothing. Place it inside a custom layer. Accepts `className` and `style`.

### `<CursorTrail>`

| Option      | Default        |                               |
| ----------- | -------------- | ----------------------------- |
| `color`     | cursor color   |                               |
| `width`     | `6`            | Width at the head, px         |
| `opacity`   | `1`            |                               |
| `lifetime`  | `0.32`         | Seconds a point stays visible |
| `maxLength` | `260`          | Longest trail, px             |
| `spacing`   | `3`            | Distance between points, px   |
| `motion`    | default spring | Motion of the trail head      |

### `<CursorParticles>`

| Option     | Default      |                                        |
| ---------- | ------------ | -------------------------------------- |
| `color`    | cursor color | A color or an array of colors          |
| `spacing`  | `12`         | Pointer travel between emissions, px   |
| `count`    | `1`          | Particles released at each emission    |
| `burst`    | `0`          | Particles thrown outward on each press |
| `size`     | `4`          | Largest diameter, px                   |
| `lifetime` | `0.7`        | Average seconds                        |
| `inherit`  | `0.12`       | Share of pointer velocity inherited    |
| `spread`   | `50`         | Random launch speed, px/s              |
| `drag`     | `3`          | Velocity decay per second              |
| `gravity`  | `0`          | Downward acceleration, px/s²           |
| `max`      | `90`         | Most particles alive at once           |

The number of particles is set by `spacing` and `count` while moving, `burst` on press, and capped by `max`.

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

`useCursorFrame` receives the frame: `time` and `dt` in seconds, `pointer` (`x`, `y`, `vx`, `vy`), `pressed`, `visible` and `target`. `target` adds `rect`, `radius` and `fontSize` to the hovered target.

See [Examples](./examples.md) for each hook in use.

## Effects

An effect implements:

```ts
interface CursorEffect {
  update(frame: Frame): void
  draw(context: CanvasRenderingContext2D): void
  press?(x: number, y: number): void
  readonly idle: boolean
}
```

`update` runs every frame, `draw` receives a context already scaled to CSS pixels with the cursor color as fill and stroke, and `idle` lets the engine stop its animation loop once nothing is left to draw. Add a `configure(options)` method to mount it with `useCursorEffect`.

## Without React

`kinetic-cursor/core` exports the engine, motion models, shape helpers and effects with no React dependency.

| Method                                | Purpose                                                    |
| ------------------------------------- | ---------------------------------------------------------- |
| `connect()`, `disconnect()`           | Attach or remove all listeners and DOM. Can be repeated.   |
| `configure(options)`                  | Replace the engine options.                                |
| `setAppearance({ color, blendMode })` | Color inherited by layers and effects, and blend mode.     |
| `addLayer(element, options)`          | Returns a handle with `configure(options)` and `remove()`. |
| `addEffect(effect)`                   | Returns a function that removes it.                        |
| `registerTarget(element, options)`    | Returns a function that unregisters it.                    |
| `subscribe(listener)`, `getState()`   | Discrete state, for external stores.                       |
| `onFrame(listener)`                   | Returns a function that unsubscribes.                      |
| `root`                                | The overlay element layers are appended to.                |

```ts
import { CursorEngine, Trail, spring } from 'kinetic-cursor/core'

const engine = new CursorEngine()
engine.connect()
engine.setAppearance({ color: '#fff', blendMode: 'difference' })

const dot = document.createElement('div')
dot.style.cssText = 'position:absolute;top:0;left:0;background:currentColor'
engine.root?.append(dot)

const motion = spring({ stiffness: 1800, damping: 85, matchVelocity: 0.8 })
engine.addLayer(dot, { size: 8, motion })
engine.addEffect(new Trail({ motion }))
```
