import { useEffect, useRef, useState } from 'react';
import { usePaintWorklet } from './usePaintWorklet';
import type { WorkletName, WorkletOptions, PaintWorkletConfig, UsePaintWorkletResult } from './types';

const DEFAULT_FPS = 30;

export interface AnimatedWorkletConfig extends PaintWorkletConfig {
  fps?: number;
}

export function useAnimatedWorklet<N extends WorkletName>(
  name: N,
  optionsFn: (time: number) => WorkletOptions[N],
  config: AnimatedWorkletConfig = {}
): UsePaintWorkletResult {
  const { fps = DEFAULT_FPS, ...paintConfig } = config;
  const [time, setTime] = useState(0);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const intervalRef = useRef(1000 / fps);

  useEffect(() => {
    intervalRef.current = 1000 / fps;
  }, [fps]);

  useEffect(() => {
    const tick = (now: number) => {
      if (now - lastFrameRef.current >= intervalRef.current) {
        lastFrameRef.current = now;
        setTime(now);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return usePaintWorklet(name, optionsFn(time), paintConfig);
}
