# css-paint-worklet-kit

Ready-to-use **CSS Houdini Paint Worklets** with a React hook API — canvas effects running entirely off the main thread.

[![npm](https://img.shields.io/npm/v/css-paint-worklet-kit)](https://npmjs.com/package/css-paint-worklet-kit)
[![bundle size](https://img.shields.io/bundlephobia/minzip/css-paint-worklet-kit)](https://bundlephobia.com/package/css-paint-worklet-kit)
[![license](https://img.shields.io/npm/l/css-paint-worklet-kit)](./LICENSE)

**[Live Demo →](https://dpawlikowski.github.io/css-paint-worklet-kit/)**

---

## Worklets

| Name | Effect |
|---|---|
| `noise` | Perlin/octave noise background — seeded, reproducible |
| `confetti` | Seeded confetti — circles, rects, triangles |
| `gradient` | Multi-stop linear, radial, or mesh gradient |
| `glitch` | RGB-slice glitch with scanlines |
| `liquid-blob` | Metaball field as background |

---

## Install

```bash
npm install css-paint-worklet-kit
```

> **Browser support:** Chrome 65+ natively. Firefox, Safari, and older browsers get the
> [css-paint-polyfill](https://github.com/nicolo-ribaudo/css-paint-polyfill) loaded automatically on first use.

---

## Usage

```tsx
import { usePaintWorklet } from 'css-paint-worklet-kit';

function Hero() {
  const { style, isReady } = usePaintWorklet('noise', {
    scale: 0.005,
    color: '#6c63ff',
    background: '#1a1a2e',
    opacity: 0.4,
    seed: 42,
  });

  return <div style={{ ...style, height: '400px' }} />;
}
```

That's it — no webpack config, no separate worklet files, no `addModule` calls.

---

## API

### `usePaintWorklet(name, options?, config?)`

```ts
function usePaintWorklet<N extends WorkletName>(
  name: N,
  options?: WorkletOptions[N],
  config?: PaintWorkletConfig
): { style: React.CSSProperties; isReady: boolean }
```

**`isReady`** is `false` during the first render and until the worklet registers — use it to show a fallback:

```tsx
const { style, isReady } = usePaintWorklet('glitch', { intensity: 0.4 });

return (
  <div style={style}>
    {!isReady && <Skeleton />}
  </div>
);
```

**`config`** options:

| Option | Type | Default | Description |
|---|---|---|---|
| `workletUrl` | `string` | — | Load worklet from a URL instead of inline blob |
| `paintTarget` | `'background' \| 'border' \| 'mask'` | `'background'` | Which CSS property to apply `paint()` to |

---

## Worklet Options

### `noise`

```ts
usePaintWorklet('noise', {
  scale?: number;      // 0.004  — zoom level (smaller = larger pattern)
  octaves?: number;    // 4      — detail layers
  color?: string;      // '#6c63ff'
  background?: string; // 'transparent'
  opacity?: number;    // 0.15
  seed?: number;       // 42
})
```

### `confetti`

```ts
usePaintWorklet('confetti', {
  count?: number;                                  // 80
  seed?: number;                                   // 42
  colors?: string[];                               // [...defaults]
  size?: number;                                   // 8
  shape?: 'circle' | 'rect' | 'triangle' | 'mixed'; // 'mixed'
})
```

### `gradient`

```ts
usePaintWorklet('gradient', {
  colors?: string[];                        // ['#667eea', '#764ba2']
  angle?: number;                           // 135  (degrees, linear only)
  type?: 'linear' | 'radial' | 'mesh';     // 'linear'
  position?: string;                        // '50% 50%' (radial center)
})
```

Animate the angle via CSS `@keyframes` on `--paint-gradient-angle`:

```css
@keyframes spin {
  to { --paint-gradient-angle: 495deg; }
}
.hero {
  animation: spin 4s linear infinite;
}
```

### `glitch`

```ts
usePaintWorklet('glitch', {
  intensity?: number;   // 0.3   — slice size & count
  frequency?: number;   // 0.15  — probability of each slice being drawn
  seed?: number;        // 42
  color1?: string;      // '#ff006e'
  color2?: string;      // '#3a86ff'
  background?: string;  // '#0a0a0a'
})
```

### `liquid-blob`

```ts
usePaintWorklet('liquid-blob', {
  color?: string;       // '#7c3aed'
  count?: number;       // 6      — number of metaballs
  radius?: number;      // 0.35   — blob size (0–1 of element width)
  seed?: number;        // 42
  threshold?: number;   // 1.2    — merge threshold (higher = smaller blobs)
  background?: string;  // 'transparent'
})
```

---

## Lower-level API

```ts
import { registerWorklet, isWorkletRegistered } from 'css-paint-worklet-kit';

// Eagerly register before the component mounts
await registerWorklet('noise');

// Check registration status
if (isWorkletRegistered('noise')) { ... }
```

---

## SSR / Next.js

The hook is SSR-safe out of the box. It returns an empty `style` on the server and registers the worklet in `useEffect` after hydration. No `typeof window` guards needed in your component.

---

## Tree-shaking

Each worklet's source is a separate export — bundlers that support `sideEffects: false` will drop unused worklet code automatically.

---

## Animating CSS custom properties

All numeric options map to CSS custom properties you can animate with `@keyframes` or the Web Animations API. The worklet re-paints on every frame automatically.

```css
@keyframes blob-pulse {
  0%   { --paint-blob-threshold: 1.0; --paint-blob-radius: 0.3; }
  50%  { --paint-blob-threshold: 1.5; --paint-blob-radius: 0.45; }
  100% { --paint-blob-threshold: 1.0; --paint-blob-radius: 0.3; }
}

.hero {
  animation: blob-pulse 4s ease-in-out infinite;
}
```

> Custom property animation requires Chrome 65+ or the polyfill — properties must be registered with `CSS.registerProperty` first (the worklet does this via `inputProperties`).

---

## Performance notes

- All painting runs in a **Worklet thread**, off the main thread, with direct access to a `CanvasRenderingContext2D`.
- Worklet code is inlined as a Blob URL — no extra HTTP request.
- Each worklet is registered once per page load regardless of how many components use the same effect.
- Pixel-level operations (`noise`, `liquid-blob`) are intentionally limited to small surfaces; for full-viewport use, consider a lower `scale` or a downscaled canvas trick.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| White / blank element | Worklet registered but `isReady` not yet `true` — add a background fallback |
| `CSS.paintWorklet not available` in console | Polyfill failed to load (CSP or network) |
| Colors look wrong | Color values must be 6-digit hex strings (e.g. `#ff0000`) |
| SSR hydration mismatch | Normal — hook returns empty style on server, applies on client after `useEffect` |

---

## Contributing

```bash
git clone https://github.com/dpawlikowski/css-paint-worklet-kit
cd css-paint-worklet-kit
npm install --legacy-peer-deps

npm run dev        # demo at http://localhost:5173
npm test           # run test suite
npm run type-check # TypeScript strict check
npm run lint       # ESLint
npm run build      # build dist/
```

Adding a new worklet:
1. Create `src/worklets/<name>.ts` — default export is a JS string with `registerPaint('<name>', ...)`.
2. Add the name to `WorkletName` in `src/hook/types.ts` and the options interface.
3. Import and add to `workletSources` in `src/hook/registry.ts`.
4. Add a demo panel in `demo/src/Gallery.tsx`.

---

## Changelog

### 0.1.0 — 2025-07-01

- Initial release: `noise`, `confetti`, `gradient`, `glitch`, `liquid-blob` worklets
- `usePaintWorklet` React hook with SSR safety and deduplication
- Automatic polyfill loading for non-Chrome browsers
- `paintTarget` support: `background`, `border`, `mask`
- Full TypeScript types

---

## License

MIT © Dominik Pawlikowski
