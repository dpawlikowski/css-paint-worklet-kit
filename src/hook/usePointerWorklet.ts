import { useEffect, useRef } from 'react';
import { usePaintWorklet } from './usePaintWorklet';
import type {
  WorkletName,
  WorkletOptions,
  PaintWorkletConfig,
  UsePaintWorkletResult,
} from './types';

export interface UsePointerWorkletResult extends UsePaintWorkletResult {
  ref: React.RefObject<HTMLElement>;
}

/**
 * Like usePaintWorklet, but tracks the pointer position over the returned `ref`
 * and writes it straight to `--paint-<name>-x` / `-y` via the DOM — no React
 * state, no re-render per pointer event. Ideal for spotlight/cursor-reactive effects.
 */
export function usePointerWorklet<N extends WorkletName>(
  name: N,
  options?: WorkletOptions[N],
  config: PaintWorkletConfig = {}
): UsePointerWorkletResult {
  const ref = useRef<HTMLElement>(null);
  const result = usePaintWorklet(name, options, config);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const xProp = `--paint-${name}-x`;
    const yProp = `--paint-${name}-y`;

    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      el.style.setProperty(xProp, x.toFixed(4));
      el.style.setProperty(yProp, y.toFixed(4));
    };

    el.addEventListener('pointermove', handleMove);
    return () => el.removeEventListener('pointermove', handleMove);
  }, [name]);

  return { ...result, ref };
}
