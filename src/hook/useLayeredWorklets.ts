import { useMemo } from 'react';
import { usePaintWorklet } from './usePaintWorklet';
import type { WorkletName, WorkletOptions, UsePaintWorkletResult } from './types';

export interface WorkletLayer<N extends WorkletName = WorkletName> {
  name: N;
  options?: WorkletOptions[N];
  /** CSS `background-blend-mode` applied between this layer and the one below it. Default: 'normal'. */
  blendMode?: React.CSSProperties['mixBlendMode'];
}

/**
 * Stacks several paint worklets as CSS background-image layers on a single
 * element — e.g. `aurora` for ambient motion under `noise` for grain, blended
 * with `background-blend-mode`. Each layer keeps its own `--paint-<name>-*`
 * custom properties, so layers never collide. This is the primitive for
 * building custom "hybrid" effects out of the built-in worklets.
 */
export function useLayeredWorklets(layers: WorkletLayer[]): UsePaintWorkletResult {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- `layers` length/order must stay stable across renders
  const results = layers.map((layer) => usePaintWorklet(layer.name, layer.options));

  const isReady = results.every((r) => r.isReady);
  const isSupported = results.every((r) => r.isSupported);

  const backgroundImageKey = results.map((r) => r.style.backgroundImage).join('|');
  const blendModeKey = layers.map((l) => l.blendMode).join('|');

  const style = useMemo(() => {
    if (!isReady) return {};

    const backgroundImage = results.map((r) => r.style.backgroundImage).filter(Boolean).join(', ');
    const backgroundBlendMode = layers.map((l) => l.blendMode ?? 'normal').join(', ');

    const merged: React.CSSProperties = { backgroundImage, backgroundBlendMode };
    for (const r of results) Object.assign(merged, r.style);
    merged.backgroundImage = backgroundImage;
    merged.backgroundBlendMode = backgroundBlendMode;

    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, backgroundImageKey, blendModeKey]);

  return { style, isReady, isSupported };
}
