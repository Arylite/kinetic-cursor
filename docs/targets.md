# Targets and states

The element under the pointer is resolved to a **target** with a `kind`. Each cursor layer can change shape per kind through its `states`.

## Built-in kinds

| Kind     | Matches                                                                   |
| -------- | ------------------------------------------------------------------------- |
| `text`   | Enabled `textarea`, text-like `input`s, `contenteditable` elements        |
| `button` | Enabled `button`, `select`, button inputs, `[role="button"]`, `summary`   |
| `link`   | `a[href]`, `area[href]`                                                   |
| `label`  | Any element with a label (see below)                                      |
| `custom` | Elements opted in without a kind, for example only `data-cursor-magnetic` |
| `native` | Shows the system cursor and hides the custom one                          |

The closest matching ancestor wins, so hovering an icon inside a button resolves to the button.

## Data attributes

```html
<div data-cursor="drag">Any kind name</div>
<article data-cursor-label="View">Shows "View" inside the ring</article>
<button data-cursor-magnetic="0.3">Pulled toward the pointer</button>
<button data-cursor-magnetic>Uses the default strength, 0.3</button>
<canvas data-cursor="native">Keeps the system cursor</canvas>
```

## Hook

`useCursorTarget` does the same without attributes and takes precedence over them.

```tsx
import { useRef } from 'react'
import { useCursorTarget } from 'kinetic-cursor'

function Card() {
  const ref = useRef<HTMLDivElement>(null)
  useCursorTarget(ref, { kind: 'drag', label: 'Drag', magnetic: 0.2 })
  return <div ref={ref}>...</div>
}
```

## Magnetic elements

`magnetic` is a strength from 0 to 1: the share of the distance between the element's center and the pointer that the element moves while hovered. It is applied with the CSS `translate` property, which replaces any `translate` already set on the element. The release motion is set with `magneticMotion` on `CursorProvider`.

## Layer states

`states` maps a kind to a shape override, or to a function of the hovered target.

```tsx
import { Cursor, caret, morph } from 'kinetic-cursor'

export function AppCursor() {
  return (
    <Cursor
      layers={{
        ring: {
          states: {
            link: { size: 56 },
            button: morph({ padding: 8 }),
            text: { opacity: 0 },
            drag: ({ target }) => ({ size: target.rect.height }),
          },
        },
        dot: { states: { text: caret() } },
      }}
    />
  )
}
```

States are merged with the preset's states, so this only changes the kinds it names.

An override accepts `size`, `width`, `height`, `radius`, `opacity`, `scale` and `stretch`, plus `x` and `y` to anchor the layer to a point instead of the pointer.

| Helper                         | Effect                                                 |
| ------------------------------ | ------------------------------------------------------ |
| `morph({ padding, parallax })` | Wraps the element, matching its size and corner radius |
| `caret({ width, lineHeight })` | Becomes a text caret sized to the element's font       |

Helpers return functions, so they can be extended:

```tsx
const squareMorph = (context: ShapeContext) => ({ ...morph()(context), radius: 2 })
```

## Styling by state

Every layer element carries its name in `data-cursor-layer` and the active kind in `data-cursor-state`, so states can also be styled with CSS:

```css
[data-cursor-layer='ring'][data-cursor-state='button'] {
  background: rgb(255 255 255 / 0.08);
}
```

## Custom selectors

Add kinds or replace the built-in selectors on the provider:

```tsx
<CursorProvider selectors={{ media: 'video, [data-media]', link: 'a[href]:not(.plain)' }}>
```
