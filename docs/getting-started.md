# Getting started

## Install

```sh
npm install kinetic-cursor
```

React 18 or later is required. The package has no runtime dependencies.

## Add the cursor

Wrap your app in `CursorProvider` and render a `Cursor` anywhere inside it.

```tsx
import { Cursor, CursorProvider } from 'kinetic-cursor'

export function App() {
  return (
    <CursorProvider>
      <Cursor />
      <Page />
    </CursorProvider>
  )
}
```

The native cursor is hidden as soon as the custom one appears, and restored when the pointer leaves the window or a touch is detected.

## Pick a preset

```tsx
<Cursor preset="ribbon" />
```

| Preset    | Look                                                            |
| --------- | --------------------------------------------------------------- |
| `glide`   | Crisp dot with a soft ring that wraps around controls. Default. |
| `minimal` | Single dot with speed-adaptive smoothing.                       |
| `ribbon`  | Dot drawing a tapered trail along its path.                     |
| `sparkle` | Warm dot shedding particles, with a ripple on click.            |
| `lens`    | Large inverting disc that grows over interactive elements.      |

## Customize

Any prop passed to `Cursor` is merged over the preset. Pass `false` to remove a part.

```tsx
import { Cursor, spring } from 'kinetic-cursor'

export function AppCursor() {
  return (
    <Cursor
      preset="glide"
      color="#7c5cff"
      blendMode="normal"
      ring={{ size: 44, motion: spring({ stiffness: 260, damping: 24, matchVelocity: 0.6 }) }}
      ripple={{ radius: 32 }}
    />
  )
}
```

```tsx
<Cursor preset="ribbon" trail={false} />
```

`glide`, `ribbon`, `minimal` and `lens` use `mix-blend-mode: difference` so the cursor stays visible on light and dark backgrounds. Set `blendMode="normal"` and a `color` to use a fixed color instead.

## Next.js and SSR

The cursor renders nothing on the server and mounts after hydration. The React entry is marked `'use client'`, so it can be imported from a server component layout:

```tsx
// app/layout.tsx
import { Cursor, CursorProvider } from 'kinetic-cursor'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CursorProvider>
          <Cursor />
          {children}
        </CursorProvider>
      </body>
    </html>
  )
}
```

## Next steps

- [Targets and states](./targets.md) for per-element behavior
- [Motion](./motion.md) to tune how the cursor moves
- [API reference](./api.md)
