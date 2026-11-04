# Presets

```tsx
<Cursor preset="glide" />
```

| Preset      | Look                                                            | Layers                   | Effects           | Background |
| ----------- | --------------------------------------------------------------- | ------------------------ | ----------------- | ---------- |
| `glide`     | Crisp dot with a soft ring that wraps around controls. Default. | `ring`, `dot`            |                   | Any        |
| `minimal`   | Single dot with speed-adaptive smoothing.                       | `dot`                    |                   | Any        |
| `ribbon`    | Dot drawing a tapered trail along its path.                     | `dot`                    | trail             | Any        |
| `sparkle`   | Warm dot shedding particles, bursting on click.                 | `dot`                    | particles, ripple | Any        |
| `lens`      | Large inverting disc that grows over interactive elements.      | `disc`                   |                   | Any        |
| `halo`      | Translucent disc that becomes a highlight behind controls.      | `highlight`, `caret`     |                   | Any        |
| `crosshair` | Two thin bars crossing at the pointer.                          | `vertical`, `horizontal` |                   | Any        |
| `jelly`     | Bouncy ring that wobbles and stretches behind a dot.            | `ring`, `dot`            |                   | Any        |
| `confetti`  | Colorful particles that fall away and burst on click.           | `dot`                    | particles, ripple | Any        |
| `spotlight` | Soft glow drifting after the pointer.                           | `glow`, `dot`            |                   | Dark       |
| `echo`      | Dot followed by two softer echoes.                              | `far`, `near`, `dot`     |                   | Any        |
| `frame`     | Square outline that frames links, controls and fields.          | `frame`, `dot`           |                   | Any        |
| `neon`      | Glowing ring and dot with a short light streak.                 | `ring`, `dot`            | trail             | Dark       |
| `ink`       | Fine pen stroke that lingers.                                   | `dot`                    | trail             | Light      |
| `glass`     | Frosted lens that blurs what is behind it.                      | `lens`                   |                   | Imagery    |

The layer names are the keys to use when overriding a preset:

```tsx
<Cursor preset="echo" layers={{ far: false }} />
<Cursor preset="neon" color="#ff4fd8" trail={{ lifetime: 0.4 }} />
```

Every preset is also exported as an object, so it can be extended:

```tsx
import { Cursor, neon, type CursorPreset } from 'kinetic-cursor'

const pinkNeon: CursorPreset = { ...neon, color: '#ff4fd8' }

export function AppCursor() {
  return <Cursor preset={pinkNeon} />
}
```

## Build your own

A preset is a plain object: a color, an optional blend mode, named layers and optional effects.

```tsx
import { caret, morph, spring, type CursorPreset } from 'kinetic-cursor'

const follow = spring({ stiffness: 1600, damping: 80, matchVelocity: 0.85 })

export const brand: CursorPreset = {
  color: '#7c5cff',
  layers: {
    outline: {
      label: true,
      motion: spring({ stiffness: 300, damping: 28, matchVelocity: 0.5 }),
      size: 40,
      stretch: 0.2,
      style: { border: '2px solid currentColor', display: 'grid', placeItems: 'center' },
      states: { link: { size: 60 }, button: morph({ padding: 6 }), text: { opacity: 0 } },
    },
    dot: {
      motion: follow,
      size: 6,
      pressScale: 0.6,
      style: { background: 'currentColor' },
      states: { button: { opacity: 0 }, text: caret() },
    },
  },
  trail: { motion: follow, width: 4, lifetime: 0.2 },
  ripple: { radius: 36 },
}
```

Tips:

- Later layers render on top. Put the precise layer last.
- Give a trail the same `motion` as the layer it should emerge from.
- Use `label: true` on the layer that should show target labels, and add `display: grid; place-items: center` to its style.
- With `blendMode: 'difference'` and a white color, the cursor inverts what is under it and stays visible on any background.
