import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Cursor, CursorProvider, presets } from '../src'

type PresetName = keyof typeof presets

const names = Object.keys(presets) as PresetName[]

function App() {
  const [preset, setPreset] = useState<PresetName>('glide')

  return (
    <CursorProvider>
      <Cursor preset={preset} />
      <main>
        <header>
          <h1>kinetic-cursor</h1>
          <p>Physics-driven cursors for React.</p>
        </header>

        <nav aria-label="Presets">
          {names.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={preset === name}
              onClick={() => {
                setPreset(name)
              }}
            >
              {name}
            </button>
          ))}
        </nav>

        <section>
          <h2>Targets</h2>
          <div className="row">
            <a href="#links">A plain link</a>
            <button type="button" className="primary" data-cursor-magnetic="0.35">
              Magnetic
            </button>
            <button type="button">Button</button>
            <input placeholder="Text input" />
          </div>
        </section>

        <section>
          <h2>Labels</h2>
          <div className="cards">
            <article data-cursor-label="View">Project one</article>
            <article data-cursor-label="Drag">Project two</article>
            <article data-cursor="native">Native cursor</article>
          </div>
        </section>
      </main>
    </CursorProvider>
  )
}

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
