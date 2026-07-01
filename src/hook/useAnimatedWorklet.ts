import { useEffect, useRef, useState } from 'react';
import { usePaintWorklet } from './usePaintWorklet';
import type { WorkletName, WorkletOptions, PaintWorkletConfig, UsePaintWorkletResult } from './types';

const DEFAULT_FPS = 30;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export interface AnimatedWorkletConfig extends PaintWorkletConfig {
  fps?: number;
  /** Freeze on the first frame for users with `prefers-reduced-motion: reduce`. Default: true. */
  respectReducedMotion?: boolean;
}

function useReducedMotion(respect: boolean): boolean {
  const [reduced, setReduced] = useState(
    () => respect && typeof window !== 'undefined' && window.matchMedia?.(REDUCED_MOTION_QUERY).matches
  );

  useEffect(() => {
    if (!respect || typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [respect]);

  return respect && reduced;
}

export function useAnimatedWorklet<N extends WorkletName>(
  name: N,
  optionsFn: (time: number) => WorkletOptions[N],
  config: AnimatedWorkletConfig = {}
): UsePaintWorkletResult {
  const { fps = DEFAULT_FPS, respectReducedMotion = true, ...paintConfig } = config;
  const reducedMotion = useReducedMotion(respectReducedMotion);
  const [time, setTime] = useState(0);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const intervalRef = useRef(1000 / fps);

  useEffect(() => {
    intervalRef.current = 1000 / fps;
  }, [fps]);

  useEffect(() => {
    if (reducedMotion) return;

    const tick = (now: number) => {
      if (now - lastFrameRef.current >= intervalRef.current) {
        lastFrameRef.current = now;
        setTime(now);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);

  return usePaintWorklet(name, optionsFn(time), paintConfig);
}
