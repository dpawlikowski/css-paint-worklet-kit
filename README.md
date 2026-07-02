# css-paint-worklet-kit

Ready-to-use **CSS Houdini Paint Worklets** with a React hook API — canvas effects running entirely off the main thread.

[![npm](https://img.shields.io/npm/v/css-paint-worklet-kit)](https://npmjs.com/package/css-paint-worklet-kit)
[![bundle size](https://img.shields.io/bundlephobia/minzip/css-paint-worklet-kit)](https://bundlephobia.com/package/css-paint-worklet-kit)
[![license](https://img.shields.io/npm/l/css-paint-worklet-kit)](./LICENSE)
[![types](https://img.shields.io/npm/types/css-paint-worklet-kit)](https://npmjs.com/package/css-paint-worklet-kit)

**[Live Demo →](https://dpawlikowski.github.io/css-paint-worklet-kit/)**

---

## What's inside

Seven production-ready paint worklets, each accessible via a single React hook call:

| Worklet | Effect |
|---|---|
| `noise` | Perlin/octave noise — seeded, reproducible, zero JS on main thread |
| `confetti` | Seeded confetti — circles, rects, triangles |
| `gradient` | Multi-stop linear, radial, or mesh gradient |
| `glitch` | VHS/RGB-slice glitch with scanlines — five style variants |
| `liquid-blob` | Metaball field with soft radial glow |
| `spotlight` | Cursor-following radial glow — pairs with `usePointerWorklet` for zero-re-render pointer tracking |
| `aurora` | Animated mesh-glow bands (aurora borealis) — pairs with `useAnimatedWorklet` |
| `border-beam` | Glowing beam chasing the element's edge — pairs with `paintTarget: 'border'` |

Any two worklets can also be stacked on one element with `useLayeredWorklets` to build your own "hybrid" effects (see below).

All worklets run inside a `PaintWorkletGlobalScope` — completely off the main thread. The hook handles registration, deduplication, polyfill loading, and SSR safety automatically.

---

## Install

```bash
npm install css-paint-worklet-kit
```

**Peer dependency:** `react >= 17`

**Browser support:** Chrome 65+ natively. Firefox, Safari, and older browsers get the [`css-paint-polyfill`](https://github.com/nicolo-ribaudo/css-paint-polyfill) loaded automatically on first use — no extra setup required.

---

## Quick start

```tsx
import { usePaintWorklet } from 'css-paint-worklet-kit';

function Hero() {
  const { style } = usePaintWorklet('noise', {
    scale: 0.005,
    color: '#6c63ff',
    background: '#1a1a2e',
    opacity: 0.4,
    seed: 42,
  });

  return <div style={{ ...style, height: '400px' }} />;
}
```

No webpack config, no separate worklet files, no `CSS.paintWorklet.addModule` calls.

---

## API

### `usePaintWorklet(name, options?, config?)`

```ts
function usePaintWorklet<N extends WorkletName>(
  name: N,
  options?: WorkletOptions[N],
  config?: PaintWorkletConfig
): {
  style: React.CSSProperties;
  isReady: boolean;
  isSupported: boolean;
}
```

**Return values:**

| Field | Type | Description |
|---|---|---|
| `style` | `React.CSSProperties` | Spread onto your element — contains `backgroundImage: 'paint(...)'` and all CSS custom properties |
| `isReady` | `boolean` | `true` once the worklet has registered and is ready to paint |
| `isSupported` | `boolean` | `true` when CSS Paint API is available (native or via polyfill); `false` if unavailable even after polyfill loads |

Use `isReady` to render a fallback during the initial load:

```tsx
const { style, isReady } = usePaintWorklet('glitch', { intensity: 0.4 });

return (
  <div style={style}>
    {!isReady && <div className="skeleton" />}
  </div>
);
```

Use `isSupported` to conditionally render a CSS fallback when the Paint API isn't available:

```tsx
const { style, isSupported } = usePaintWorklet('noise', { opacity: 0.3 });

return (
  <div style={isSupported ? style : undefined} className={isSupported ? '' : 'fallback-bg'} />
);
```

**`config` options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `paintTarget` | `'background' \| 'border' \| 'mask'` | `'background'` | Which CSS property receives `paint()` |
| `workletUrl` | `string` | — | Load worklet from a URL instead of an inline blob |
| `enabled` | `boolean` | `true` | Skip registration until `true` — pair with `IntersectionObserver` to lazy-load a worklet only when its element is visible |
| `onError` | `(error: unknown) => void` | — | Called if registration throws (e.g. the polyfill fetch was blocked by CSP) |

```tsx
// Apply as a mask instead of background
const { style } = usePaintWorklet('noise', { opacity: 0.5 }, { paintTarget: 'mask' });

// Supply a custom worklet file (e.g. from your CDN)
const { style } = usePaintWorklet('noise', opts, { workletUrl: '/worklets/noise.js' });

// Lazy-load only once the element is on screen, and react to registration failures
const [visible, setVisible] = useState(false);
const { style } = usePaintWorklet(
  'noise',
  opts,
  { enabled: visible, onError: (err) => reportToSentry(err) }
);
```

---

### `useAnimatedWorklet(name, optionsFn, config?)`

Drives a worklet with `requestAnimationFrame` at a configurable frame rate. `optionsFn` receives the current timestamp (ms) and returns options — ideal for animating `seed` or any numeric parameter.

```ts
function useAnimatedWorklet<N extends WorkletName>(
  name: N,
  optionsFn: (time: number) => WorkletOptions[N],
  config?: AnimatedWorkletConfig
): UsePaintWorkletResult
```

```tsx
import { useAnimatedWorklet } from 'css-paint-worklet-kit';

function AnimatedNoise() {
  const { style } = useAnimatedWorklet(
    'noise',
    (t) => ({ seed: t * 0.001, scale: 0.005, opacity: 0.4 }),
    { fps: 24 }
  );

  return <div style={{ ...style, height: '400px' }} />;
}
```

**`AnimatedWorkletConfig` extends `PaintWorkletConfig`:**

| Option | Type | Default | Description |
|---|---|---|---|
| `fps` | `number` | `30` | Target frames per second |
| `respectReducedMotion` | `boolean` | `true` | Freeze on the first frame for users with `prefers-reduced-motion: reduce` instead of running the `requestAnimationFrame` loop |
| `paintTarget` | `'background' \| 'border' \| 'mask'` | `'background'` | Inherited from `PaintWorkletConfig` |

> **Tip:** For animated glitch/noise effects, animate `seed` over time. The worklet is deterministic per seed, so this produces smooth pseudo-random motion.

> **Accessibility:** `useAnimatedWorklet` respects `prefers-reduced-motion` by default — it renders a single static frame instead of animating. Set `respectReducedMotion: false` only if the animation is essential content rather than decoration.

---

## Worklet options reference

### `noise`

Perlin noise rendered as repeating pixel blocks. Seeded for reproducibility.

```ts
usePaintWorklet('noise', {
  scale?: number;      // 0.004  — zoom (smaller = larger pattern)
  octaves?: number;    // 4      — detail layers (1–8)
  color?: string;      // '#6c63ff'  — noise color (6-digit hex)
  background?: string; // 'transparent'
  opacity?: number;    // 0.15   — noise intensity (0–1)
  seed?: number;       // 42     — RNG seed
  pixel?: number;      // 2      — pixel block size in px (1 = sharp, 4+ = chunky)
});
```

### `confetti`

Seeded random shapes scattered across the element. Same seed always produces the same layout.

```ts
usePaintWorklet('confetti', {
  count?: number;                                    // 80    — piece count
  seed?: number;                                     // 42
  colors?: string[];                                 // default rainbow palette
  size?: number;                                     // 8     — base size in px
  shape?: 'circle' | 'rect' | 'triangle' | 'mixed'; // 'mixed'
});
```

### `gradient`

Multi-stop gradients in three modes. The `linear` and `radial` modes use the native Canvas gradient API; `mesh` performs bilinear interpolation across four corners.

```ts
usePaintWorklet('gradient', {
  colors?: string[];                     // ['#667eea', '#764ba2']
  angle?: number;                        // 135   — degrees, linear only
  type?: 'linear' | 'radial' | 'mesh';  // 'linear'
  position?: string;                     // '50% 50%'  — radial center (x% y%)
});
```

Animate the angle via CSS `@keyframes` (no JS required):

```css
@keyframes spin-gradient {
  to { --paint-gradient-angle: 495deg; }
}

.hero {
  animation: spin-gradient 4s linear infinite;
}
```

### `glitch`

Five glitch styles built from three composable layers: horizontal slice shifts, RGB channel separation, and corruption blocks.

```ts
usePaintWorklet('glitch', {
  style?: 'vhs' | 'digital' | 'rgb' | 'slice' | 'all'; // 'vhs'
  intensity?: number;   // 0.3   — slice size & count (0–1)
  frequency?: number;   // 0.15  — probability each artifact is drawn (0–1)
  rgbOffset?: number;   // 8     — RGB channel separation in px
  scanlines?: number;   // 0.05  — scanline overlay opacity (0–0.3)
  seed?: number;        // 42
  color1?: string;      // '#ff006e'
  color2?: string;      // '#3a86ff'
  background?: string;  // '#0a0a0a'
});
```

**Style variants:**

| Value | Layers active |
|---|---|
| `vhs` | Slice shifts + RGB shift |
| `digital` | Corruption blocks + white flashes |
| `rgb` | RGB channel shift only |
| `slice` | Horizontal slice shifts only |
| `all` | All layers combined |

### `liquid-blob`

A metaball field rendered pixel by pixel. Blobs merge organically when they overlap (controlled by `threshold`). A soft radial glow pass is applied before the field.

```ts
usePaintWorklet('liquid-blob', {
  color?: string;       // '#7c3aed'  — blob color (6-digit hex)
  count?: number;       // 6          — number of metaballs
  radius?: number;      // 0.35       — blob influence radius (0–1 of element size)
  seed?: number;        // 42
  threshold?: number;   // 1.2        — merge threshold; higher = more separated blobs
  background?: string;  // 'transparent'
  glow?: number;        // 0.5        — soft ambient glow intensity (0–1)
  pixel?: number;       // 3          — pixel block size (larger = faster, chunkier)
});
```

### `spotlight`

A radial glow centered at `(x, y)` — fractions of the element's size (`0–1`, default `0.5, 0.5`). Designed to be driven by pointer position via `usePointerWorklet` below, but works with any `x`/`y` source (scroll position, animation, etc.).

```ts
usePaintWorklet('spotlight', {
  x?: number;           // 0.5   — glow center, 0–1 fraction of width
  y?: number;           // 0.5   — glow center, 0–1 fraction of height
  color?: string;       // '#7c3aed'
  background?: string;  // 'transparent'
  radius?: number;      // 0.35  — glow radius, fraction of max(width, height)
  intensity?: number;   // 0.8   — peak opacity (0–1)
  softness?: number;    // 0.6   — falloff position (0–1, higher = softer edge)
});
```

### `aurora`

Animated mesh-glow bands drifting across the element, like aurora borealis. Drive `time` from `useAnimatedWorklet` for continuous motion.

```ts
usePaintWorklet('aurora', {
  colors?: string[];     // ['#00c9a7', '#845ec2', '#00b4d8']
  background?: string;   // '#05050c'
  time?: number;         // 0     — animation clock, feed from useAnimatedWorklet
  speed?: number;        // 1     — animation speed multiplier
  scale?: number;        // 1     — horizontal wave frequency
  opacity?: number;      // 0.55  — band intensity (0–1)
  blur?: number;         // 24    — horizontal sample resolution (higher = smoother, slower)
});
```

### `border-beam`

A glowing beam that chases the element's border. Use with `{ paintTarget: 'border' }` so the effect feeds `border-image` instead of the background.

```ts
usePaintWorklet('border-beam', {
  color?: string;       // '#7c3aed'      — beam head color
  trailColor?: string;  // 'transparent'  — color the trail fades to
  width?: number;       // 2              — beam stroke width in px
  time?: number;        // 0              — animation clock, feed from useAnimatedWorklet
  speed?: number;       // 1              — animation speed multiplier
  trail?: number;       // 0.25           — trail length, fraction of perimeter (0–1)
  radius?: number;      // 0              — corner radius in px
}, { paintTarget: 'border' });
```

---

## `useLayeredWorklets(layers)`

Stacks multiple paint worklets as CSS background layers on a **single element**, blended with `background-blend-mode` — the primitive for building your own hybrid effects out of the built-ins (e.g. `aurora` for ambient motion under `noise` for grain).

```ts
function useLayeredWorklets(layers: WorkletLayer[]): {
  style: React.CSSProperties;
  isReady: boolean;
  isSupported: boolean;
}

interface WorkletLayer<N extends WorkletName = WorkletName> {
  name: N;
  options?: WorkletOptions[N];
  blendMode?: React.CSSProperties['mixBlendMode']; // default: 'normal'
}
```

```tsx
import { useLayeredWorklets } from 'css-paint-worklet-kit';

function HybridHero() {
  const { style } = useLayeredWorklets([
    { name: 'aurora', options: { opacity: 0.6, speed: 0.8 } },
    { name: 'noise', options: { opacity: 0.12 }, blendMode: 'overlay' },
  ]);

  return <div style={{ ...style, height: '400px' }} />;
}
```

Each layer keeps its own `--paint-<name>-*` custom properties (they never collide), so any combination of the built-in worklets — or your own custom ones — can be layered this way.

---

## `usePointerWorklet(name, options?, config?)`

A **wow-factor addition for interactive UIs**: like `usePaintWorklet`, but it also tracks the pointer position over the element and writes it straight to `--paint-<name>-x` / `-y` **via the DOM**, not React state. Moving the mouse never triggers a re-render — the worklet repaints on the CSS custom property change alone, entirely off the main thread.

```ts
function usePointerWorklet<N extends WorkletName>(
  name: N,
  options?: WorkletOptions[N],
  config?: PaintWorkletConfig
): {
  ref: React.RefObject<HTMLElement>;
  style: React.CSSProperties;
  isReady: boolean;
  isSupported: boolean;
}
```

```tsx
import { usePointerWorklet } from 'css-paint-worklet-kit';

function SpotlightCard() {
  const { ref, style } = usePointerWorklet('spotlight', {
    color: '#7c3aed',
    radius: 0.45,
    intensity: 0.85,
  });

  return <div ref={ref} style={{ ...style, height: '300px' }} />;
}
```

Attach `ref` to the element that receives `style` — pointer coordinates are measured relative to that element's bounding box. Works with any worklet that reads `--paint-<name>-x` / `-y` (currently `spotlight`, but any custom worklet following the same convention benefits too).

---

## Animating with CSS custom properties

Every numeric option maps directly to a CSS custom property (`--paint-<worklet>-<option>`). You can animate them with `@keyframes` or the Web Animations API — the worklet re-paints automatically on each change.

```css
@keyframes blob-pulse {
  0%, 100% { --paint-liquid-blob-threshold: 1.0; --paint-liquid-blob-radius: 0.3; }
  50%       { --paint-liquid-blob-threshold: 1.5; --paint-liquid-blob-radius: 0.45; }
}

.hero {
  animation: blob-pulse 4s ease-in-out infinite;
}
```

```ts
// Or animate imperatively
const el = document.querySelector('.hero');
let t = 0;
requestAnimationFrame(function tick() {
  el.style.setProperty('--paint-noise-seed', String(t++ * 0.01));
  requestAnimationFrame(tick);
});
```

---

## Lower-level API

```ts
import { registerWorklet, isWorkletRegistered } from 'css-paint-worklet-kit';

// Eagerly register before any component mounts (e.g. in app bootstrap)
await registerWorklet('noise');

// Check registration status synchronously
if (isWorkletRegistered('noise')) { /* ... */ }
```

`registerWorklet` returns `Promise<boolean>` — `true` if the worklet registered successfully, `false` if `CSS.paintWorklet` was not available even after the polyfill loaded.

---

## SSR / Next.js

The hook is SSR-safe. It returns an empty `style` object on the server and registers the worklet in a `useEffect` after hydration. No `typeof window` guards are needed in your components.

```tsx
// Works in Next.js App Router, Pages Router, Remix, etc.
export default function Page() {
  const { style } = usePaintWorklet('noise', { opacity: 0.2 });
  return <section style={style}>...</section>;
}
```

---

## Tree-shaking

The package has `"sideEffects": false`. Each worklet's source string is a separate module — bundlers will drop any worklets your code doesn't import.

---

## Performance

- All rendering runs in a **Worklet thread** (a `PaintWorkletGlobalScope`), completely off the main thread.
- Worklet code ships as an inline Blob URL — no extra HTTP request, no Webpack configuration needed.
- Each worklet is registered once per browser session regardless of how many components use it.
- For pixel-based worklets (`noise`, `liquid-blob`): use a larger `pixel` value to trade visual fidelity for rendering speed on large surfaces.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Blank / white element | Worklet isn't ready yet — `isReady` is `false`; use a background-color fallback |
| `CSS.paintWorklet not available` in console | Polyfill blocked by CSP or network — check `isSupported` and provide a CSS fallback |
| Colors render incorrectly | All color values must be 6-digit hex strings (`#ff0000`, not `red` or `#f00`) |
| SSR hydration mismatch | Expected — hook returns `{}` on server, applies style on client after `useEffect` |
| Noise/blob rendering slowly | Increase `pixel` value (e.g. `pixel: 4`) to reduce the number of draw calls |

---

## Contributing

```bash
git clone https://github.com/dpawlikowski/css-paint-worklet-kit
cd css-paint-worklet-kit
npm install

npm run dev        # demo at http://localhost:5173
npm test           # run test suite (vitest)
npm run type-check # TypeScript strict check
npm run lint       # ESLint
npm run build      # build dist/
npm run build:demo # build demo for GitHub Pages
```

**Adding a new worklet:**

1. Create `src/worklets/<name>.ts` — default export is a JS string (use `WORKLET_SHARED` from `./shared` for `lcg`, `hexToRgb`, `parseColors`).
2. Add the name to `WorkletName` in `src/hook/types.ts` and define its options interface.
3. Import and add to `workletSources` in `src/hook/registry.ts`.
4. Add a card to `demo/src/Gallery.tsx` and a panel to `demo/src/Playground.tsx`.

---

## Changelog

### Unreleased

- **New `aurora` worklet** — animated mesh-glow bands (aurora borealis), pairs with `useAnimatedWorklet`
- **New `border-beam` worklet** — glowing beam chasing the element's edge, pairs with `paintTarget: 'border'`
- **New `useLayeredWorklets` hook** — stacks any two (or more) worklets on one element via `background-blend-mode`, the primitive for building custom hybrid effects
- Demo: Gallery/Playground entrance and hover motion (respects `prefers-reduced-motion`), accessible tabs (`role="tab"`/`aria-selected`), visible focus states, and a footer
- **New `spotlight` worklet** — cursor-following radial glow
- **New `usePointerWorklet` hook** — tracks pointer position over an element and writes it directly to the DOM (`--paint-<name>-x`/`-y`), bypassing React state entirely so mouse movement never triggers a re-render
- `PaintWorkletConfig.enabled` — skip registration until `true`, for lazy-loading a worklet only when its element becomes visible
- `PaintWorkletConfig.onError` — callback fired when worklet registration throws
- `useAnimatedWorklet` now respects `prefers-reduced-motion` by default (`respectReducedMotion` config, default `true`) — freezes on the first frame instead of animating
- Fixed an ESLint `react-hooks/exhaustive-deps` violation in `usePaintWorklet`'s style memo
- Added test coverage for `useAnimatedWorklet` and `usePointerWorklet` (previously untested)

### 0.2.0 — 2026-07-01

- `useAnimatedWorklet` hook — drives any worklet from a `(time: number) => options` function at configurable FPS
- `isSupported` added to `usePaintWorklet` return value — distinguish "loading" from "unsupported"
- `usePaintWorklet` now memoises the computed style object — no unnecessary re-renders on parent updates
- Shared worklet utilities (`lcg`, `hexToRgb`, `parseColors`) extracted to a single source — worklet bundle size reduced by ~30%
- Gallery: copy-to-clipboard button on all code examples
- GitHub link in demo header
- `registerWorklet` now returns `Promise<boolean>` (breaking: was `Promise<void>`)

### 0.1.0 — 2026-06-26

- Initial release: `noise`, `confetti`, `gradient`, `glitch`, `liquid-blob` worklets
- `usePaintWorklet` React hook with SSR safety and registration deduplication
- Automatic polyfill loading for non-Chrome browsers
- `paintTarget` support: `background`, `border`, `mask`
- Full TypeScript types

---

## License

MIT © [Dominik Pawlikowski](https://github.com/dpawlikowski)
