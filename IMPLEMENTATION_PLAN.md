# css-paint-worklet-kit — Plan Implementacji

> Autor: Dominik Pawlikowski — Senior Frontend Engineer / Frontend Architect  
> Data: 2026-06-26  
> Szacowany czas: 3–4 weekendy

---

## 1. Cel projektu

Zestaw gotowych CSS Houdini Paint Workletów z React hook API. Każdy worklet działa w osobnym wątku (`PaintWorkletGlobalScope`) — zero JS na main thread podczas renderowania. Użytkownik dostaje `usePaintWorklet('noise', { scale: 0.5 })` i gotowy obiekt stylów.

---

## 2. Decyzje architektoniczne

### 2.1 Monorepo vs single package

**Decyzja: single package (`css-paint-worklet-kit`)**

Uzasadnienie: worklety są powiązane (wspólny builder, wspólny polyfill, spójne API hooka). Monorepo byłoby overengineeringiem na tym etapie — `exports` w package.json wystarczy do tree-shakingu per worklet.

### 2.2 Bundler

**Decyzja: Vite (library mode) + Rollup dla workletów**

Worklety muszą być bundlowane do osobnych plików (przeglądarka ładuje je przez `URL.createObjectURL` lub ścieżkę). Vite library mode generuje ESM/CJS dla hooka, Rollup (via Vite multi-entry) generuje IIFE dla każdego workletu.

```
dist/
  index.esm.js        # hook + registry
  index.cjs.js
  worklets/
    noise.js          # IIFE, ładowany przez worklet thread
    confetti.js
    gradient.js
    glitch.js
    liquid-blob.js
```

### 2.3 Jak worklety trafiają do przeglądarki

**Decyzja: inline jako blob URL (domyślnie) + opcja ścieżki zewnętrznej**

```ts
// Wewnątrz hooka:
const blob = new Blob([workletCode], { type: 'application/javascript' });
const url = URL.createObjectURL(blob);
CSS.paintWorklet.addModule(url);
```

Plusy: zero konfiguracji webpacka/Vite po stronie użytkownika.  
Minusy: worklet code trafia do bundle JS hooka — akceptowalne (~80 linii per worklet = <3 KB minified).  
Alternatywa (escape hatch): `usePaintWorklet('noise', opts, { workletUrl: '/worklets/noise.js' })`.

### 2.4 Polyfill

**Decyzja: lazy-load `css-paint-polyfill` (google/houdini-samples)**

Polyfill jest ~30 KB. Ładujemy go tylko gdy `!CSS.paintWorklet`. Detekcja SSR przez `typeof window === 'undefined'`.

```ts
async function ensureWorkletSupport() {
  if (typeof window === 'undefined') return;
  if (!CSS?.paintWorklet) {
    await import('css-paint-polyfill');
  }
}
```

### 2.5 Custom Properties — bridge CSS ↔ JS

**Decyzja: CSS Custom Properties jako kanał parametrów**

Każdy worklet deklaruje `inputProperties` (statyczna lista). Hook generuje inline style z `--paint-<name>-<prop>: value`. Animacje przez CSS `@keyframes` na custom properties lub `element.style.setProperty` z requestAnimationFrame.

```ts
// Hook zwraca:
{
  style: {
    backgroundImage: 'paint(noise)',
    '--paint-noise-scale': '0.5',
    '--paint-noise-speed': '1',
  }
}
```

### 2.6 TypeScript

**Decyzja: pełny TS, typy per worklet**

```ts
type NoiseOptions = { scale?: number; speed?: number; color?: string };
type GlitchOptions = { intensity?: number; frequency?: number };
// ...
usePaintWorklet('noise', opts: NoiseOptions)
usePaintWorklet('glitch', opts: GlitchOptions)
// Discriminated union na pierwszym argumencie
```

### 2.7 SSR / Next.js

**Decyzja: hook zwraca pusty style object podczas SSR, rejestruje worklet po hydration**

`useEffect` + `useRef(false)` — klasyczny pattern. Bez `typeof window` w render path.

---

## 3. Struktura projektu

```
css-paint-worklet-kit/
├── src/
│   ├── worklets/
│   │   ├── noise.ts           # kod workletu (kompilowany do IIFE)
│   │   ├── confetti.ts
│   │   ├── gradient.ts
│   │   ├── glitch.ts
│   │   └── liquid-blob.ts
│   ├── hook/
│   │   ├── usePaintWorklet.ts
│   │   ├── registry.ts        # singleton: worklet name → registered?
│   │   └── types.ts
│   ├── polyfill.ts
│   └── index.ts               # public API
├── demo/                      # Vite app (galeria + playground)
│   ├── src/
│   │   ├── Gallery.tsx
│   │   ├── Playground.tsx
│   │   └── main.tsx
│   └── vite.config.ts
├── vite.config.ts             # library build
├── tsconfig.json
└── package.json
```

---

## 4. API publiczne

```ts
// Hook
import { usePaintWorklet } from 'css-paint-worklet-kit';

const { style } = usePaintWorklet('noise', { scale: 0.5, color: '#6c63ff' });
// <div style={style} />

// Niższy poziom (opcjonalnie)
import { registerWorklet } from 'css-paint-worklet-kit';
await registerWorklet('noise');
```

### Hook signature

```ts
function usePaintWorklet<N extends WorkletName>(
  name: N,
  options?: WorkletOptions[N],
  config?: { workletUrl?: string; paintTarget?: 'background' | 'border' | 'mask' }
): { style: React.CSSProperties; isReady: boolean }
```

`isReady` pozwala pokazać fallback zanim worklet się zarejestruje (pierwsze renderowanie).

---

## 5. Worklety — specyfikacja

### 5.1 `noise`
- Perlin/simplex noise jako tło lub maska
- Params: `scale`, `speed` (statyczny — brak animacji w worklet thread), `color`, `background`
- Technika: LCG pseudo-random + smoothstep, ~60 linii

### 5.2 `confetti`
- Losowe kolorowe prostokąty/kółka — dekoratywne tło
- Params: `count`, `seed`, `colors[]`, `size`
- Technika: seeded random (seed z custom property), statyczny snapshot

### 5.3 `gradient` (animowany)
- Wielopunktowy gradient z animacją pozycji przez CSS `@keyframes`
- Params: `colors[]`, `angle`, `stops[]`
- Animacja: user animuje `--paint-gradient-angle` przez CSS, worklet reaguje na zmianę

### 5.4 `glitch`
- Efekt glitch: poziome "slice" z przesunięciem i kolorowym shiftem RGB
- Params: `intensity`, `frequency`, `seed`
- Technika: seeded slicing canvas, kolorowe overlay bloki

### 5.5 `liquid-blob` (border)
- Organiczny, animowany border bazujący na `border-image: paint(liquid-blob)`
- Params: `color`, `blobCount`, `radius`, `seed`
- Technika: metaballs uproszczone (odległości od punktów), rysowanie na border box

---

## 6. Plan implementacji — weekendy

### Weekend 1 — Fundament

**Cele:**
- Scaffold projektu (Vite library + demo app)
- Konfiguracja TS, ESLint, Prettier
- System buildowania workletów (IIFE output)
- `registry.ts` — singleton rejestracji
- `polyfill.ts` — lazy load
- `usePaintWorklet` — szkielet hooka
- Worklet `noise` — pierwszy działający efekt
- Demo: jedna strona z `noise` jako tło

**Deliverable:** `npm run dev` w demo pokazuje noise background.

---

### Weekend 2 — Worklety i hook API

**Cele:**
- Worklety: `confetti`, `gradient`, `glitch`
- Pełne typy TS (discriminated union na `WorkletName`)
- `isReady` flag + fallback UX w hooku
- CSS bridge — animowanie przez custom properties
- Demo: galeria 4 efektów

**Deliverable:** Galeria z 4 działającymi efektami, animowany gradient przez CSS.

---

### Weekend 3 — `liquid-blob` + Playground

**Cele:**
- Worklet `liquid-blob` (najtrudniejszy — border-image paint)
- Playground: kontrolki (sliders, color pickers) per worklet, live preview
- Generowanie kodu snippetu ("skopiuj do projektu")
- SSR test (Next.js minimal sandbox)
- Polishing błędów

**Deliverable:** Pełna galeria 5 efektów + interaktywny playground.

---

### Weekend 4 — Release

**Cele:**
- README z przykładami (GIF-y / video z efektami)
- Konfiguracja `package.json` (`exports`, `types`, `sideEffects: false`)
- Publish na npm (wersja `0.1.0`)
- Post na dev.to / Twitter o CSS Houdini
- GitHub: badges (npm version, bundle size via bundlephobia)

**Deliverable:** Opublikowany pakiet na npm.

---

## 7. Kluczowe pułapki i mitygacje

| Pułapka | Mitygacja |
|---|---|
| `window` undefined (SSR) | Wszystko w `useEffect`, detekcja SSR w `registry.ts` |
| Worklet thread — brak `Math.random()` (deterministyczny) | Seeded LCG przekazany przez custom property `--paint-x-seed` |
| `addModule()` rzuca gdy worklet już zarejestrowany | Registry singleton — rejestracja raz per worklet per sesję |
| `border-image: paint()` — ograniczone wsparcie | Feature flag + fallback CSS border w hooku |
| Polyfill zmienia model renderowania | Testować osobno z polyfill ON/OFF, nie mieszać w tym samym teście |
| Bundle size workletu w JS hooka | Każdy worklet jako osobny chunk, lazy import wewnątrz hooka |

---

## 8. Narzędzia i zależności

```json
{
  "dependencies": {
    "css-paint-polyfill": "^0.6.1"
  },
  "peerDependencies": {
    "react": ">=17"
  },
  "devDependencies": {
    "vite": "^5",
    "typescript": "^5",
    "@types/react": "^18",
    "eslint": "^9",
    "prettier": "^3",
    "vitest": "^1"
  }
}
```

---

## 9. Metryki sukcesu

- Pakiet opublikowany na npm z poprawnym `exports` map
- 5 działających workletów (zweryfikowane w Chrome + Firefox z polyfill)
- Bundle size hooka < 5 KB gzip (bez kodu workletów)
- Demo dostępne na GitHub Pages
- Zero błędów TypeScript w strict mode
- SSR safe (Next.js app nie crasha na server)
