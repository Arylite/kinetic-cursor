# kinetic-cursor

Physics-driven custom cursors for React. Analytic springs, velocity-matched following, context-aware shapes and canvas effects, with no React re-renders per frame.

```sh
npm install kinetic-cursor
```

```tsx
import { Cursor, CursorProvider } from 'kinetic-cursor'

export function App() {
  return (
    <CursorProvider>
      <Cursor preset="glide" />
      <Page />
    </CursorProvider>
  )
}
```

## Features

- Spring, adaptive and exponential motion models, independently tunable per layer
- Trails that retract along their own path instead of collapsing into the pointer
- Shapes that react to links, buttons, text fields and custom targets, including morphing around controls
- Magnetic elements, labels, particles and click ripples
- Five presets, composable layers and effects, and hooks for fully custom cursors
- SSR-safe, touch-aware, respects reduced motion and forced colors
- Tree-shakeable ESM, no runtime dependencies, framework-agnostic core

## Documentation

- [Getting started](./docs/getting-started.md)
- [Targets and states](./docs/targets.md)
- [Motion](./docs/motion.md)
- [API reference](./docs/api.md)

## Development

```sh
pnpm install
pnpm dev      # playground
pnpm check    # format, lint, types, tests
pnpm build
```

## License

[MIT](./LICENSE)
