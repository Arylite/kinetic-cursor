# Motion

Every layer, trail and magnetic element follows its target through a **motion model**. Models are plain functions, so each part of the cursor can be tuned on its own.

```tsx
import { Cursor, adaptive, spring } from 'kinetic-cursor'

export function AppCursor() {
  return (
    <Cursor
      layers={{
        dot: { motion: spring({ stiffness: 2200, damping: 94, matchVelocity: 0.85 }) },
        ring: { motion: adaptive({ halfLife: 0.1 }) },
      }}
    />
  )
}
```

## Models

### `spring({ stiffness, damping, mass, matchVelocity })`

A damped spring solved exactly each frame. It behaves identically at 30, 60 or 240 fps and stays stable with stiff values.

| Option          | Default | Effect                                                              |
| --------------- | ------- | ------------------------------------------------------------------- |
| `stiffness`     | `170`   | Pull toward the target. Higher is faster.                           |
| `damping`       | `26`    | Resistance. Lower values overshoot and bounce.                      |
| `mass`          | `1`     | Inertia. Higher is heavier and slower to react.                     |
| `matchVelocity` | `0`     | From 0 to 1, how closely the body keeps pace with a moving pointer. |
| `overshoot`     | `true`  | When false, the body never travels past its target.                 |

A plain spring trails behind a moving pointer. With `matchVelocity: 1` that lag disappears: the body moves with the pointer, and the spring only shapes how it settles when the pointer stops or turns. Values between 0.5 and 0.9 give a responsive cursor with a little inertia.

Set `overshoot: false` to stop the cursor exactly on the pointer when it stops abruptly, instead of carrying past it and springing back. It also removes the wobble of bouncy springs, while keeping their feel during movement.

```tsx
const stopDead = spring({ stiffness: 2200, damping: 94, matchVelocity: 0.85, overshoot: false })

<Cursor layers={{ dot: { motion: stopDead } }} trail={{ motion: stopDead }} />
```

The spring is critically damped (fastest settle, no overshoot) when `damping = 2 * sqrt(stiffness * mass)`.

### `adaptive({ halfLife, responsiveness })`

Smoothing that relaxes at low speed and tightens as the pointer speeds up. Small hand tremors are absorbed, while fast flicks stay close to the pointer. Lag never exceeds about `halfLife / (0.69 * responsiveness)` pixels.

| Option           | Default | Effect                                |
| ---------------- | ------- | ------------------------------------- |
| `halfLife`       | `0.08`  | Seconds to halve the distance at rest |
| `responsiveness` | `0.006` | How fast smoothing drops with speed   |

### `smooth({ halfLife })`

Exponential smoothing with no inertia and no overshoot. `halfLife` defaults to `0.04` seconds.

### `instant()`

Follows the pointer exactly.

## Shape motion

Size, radius, opacity, scale and stretch animate with `shapeMotion`, separately from position:

```tsx
<Cursor layers={{ ring: { shapeMotion: spring({ stiffness: 300, damping: 20 }) } }} />
```

## Stretch

`stretch` (0 to 1) squashes a layer along its direction of travel in proportion to its speed, while keeping its area. Its content does not rotate.

## Trails and particles

The trail head has its own `motion`. Give it the same motion as the layer it should emerge from, as the presets do, so the ribbon stays attached to it. The trail records the path the head actually travelled at fixed spacing and expires points by age: when the pointer stops, it retracts along its own path instead of being pulled into the cursor.

Particles are emitted per distance travelled, so a resting pointer never accumulates them. They drift with their own drag and are never attracted back to the cursor.

## Reduced motion

With `reducedMotion="user"` (the default), users who prefer reduced motion get a cursor that follows the pointer exactly, with canvas effects and magnetic movement turned off. Use `"always"` or `"never"` to override.

## Writing a model

A model receives a body, a target and the time step, and updates the body in place:

```ts
import type { Motion } from 'kinetic-cursor'

const stepped: Motion = (body, target, _velocity, dt) => {
  target.forEach((value, i) => {
    const next = Math.round(value / 8) * 8
    body.velocity[i] = dt > 0 ? (next - body.value[i]) / dt : 0
    body.value[i] = next
  })
}
```
