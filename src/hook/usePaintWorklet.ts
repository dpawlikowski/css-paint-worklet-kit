import { useEffect, useRef, useState } from 'react';
import { registerWorklet } from './registry';
import type {
  WorkletName,
  WorkletOptions,
  PaintWorkletConfig,
  UsePaintWorkletResult,
} from './types';

type CSSValue = string | number | undefined;

function buildCustomProperties(
  name: WorkletName,
  options: Record<string, CSSValue>
): Record<string, string> {
  const props: Record<string, string> = {};
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined) continue;
    const cssKey = `--paint-${name}-${key}`;
    props[cssKey] = Array.isArray(value) ? value.join(',') : String(value);
  }
  return props;
}

function getPaintImageValue(name: WorkletName, target: PaintWorkletConfig['paintTarget']): string {
  const paintFn = `paint(${name})`;
  switch (target) {
    case 'mask': return paintFn;
    case 'border': return paintFn;
    default: return paintFn;
  }
}

function buildStyle(
  name: WorkletName,
  options: Record<string, CSSValue>,
  config: PaintWorkletConfig,
  ready: boolean
): React.CSSProperties {
  if (!ready) return {};

  const customProps = buildCustomProperties(name, options);
  const paintValue = getPaintImageValue(name, config.paintTarget);

  const paintProp: React.CSSProperties =
    config.paintTarget === 'border'
      ? { borderImage: `${paintValue} 1`, borderImageSlice: 1 }
      : config.paintTarget === 'mask'
      ? { maskImage: paintValue, WebkitMaskImage: paintValue }
      : { backgroundImage: paintValue };

  return {
    ...paintProp,
    ...(customProps as React.CSSProperties),
  };
}

export function usePaintWorklet<N extends WorkletName>(
  name: N,
  options?: WorkletOptions[N],
  config: PaintWorkletConfig = {}
): UsePaintWorkletResult {
  const [isReady, setIsReady] = useState(false);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (registeredRef.current) return;
    registeredRef.current = true;

    registerWorklet(name, config.workletUrl)
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error(`[css-paint-worklet-kit] Failed to register worklet "${name}":`, err);
      });
  }, [name, config.workletUrl]);

  const style = buildStyle(
    name,
    (options ?? {}) as Record<string, CSSValue>,
    config,
    isReady
  );

  return { style, isReady };
}
