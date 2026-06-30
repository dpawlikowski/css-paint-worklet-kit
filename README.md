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

## License

MIT © Dominik Pawlikowski
