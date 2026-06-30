import { useEffect, useMemo, useRef, useState } from 'react';
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
    props[`--paint-${name}-${key}`] = Array.isArray(value) ? value.join(',') : String(value);
  }
  return props;
}

function buildStyle(
  name: WorkletName,
  options: Record<string, CSSValue>,
  config: PaintWorkletConfig,
  ready: boolean
): React.CSSProperties {
  if (!ready) return {};

  const paintValue = `paint(${name})`;
  const customProps = buildCustomProperties(name, options);

  const paintProp: React.CSSProperties =
    config.paintTarget === 'border'
      ? { borderImage: `${paintValue} 1`, borderImageSlice: 1 }
      : config.paintTarget === 'mask'
      ? { maskImage: paintValue, WebkitMaskImage: paintValue }
      : { backgroundImage: paintValue };

  return { ...paintProp, ...(customProps as React.CSSProperties) };
}

export function usePaintWorklet<N extends WorkletName>(
  name: N,
  options?: WorkletOptions[N],
  config: PaintWorkletConfig = {}
): UsePaintWorkletResult {
  const [isReady, setIsReady] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (registeredRef.current) return;
    registeredRef.current = true;

    registerWorklet(name, config.workletUrl)
      .then((supported) => {
        setIsSupported(supported);
        if (supported) setIsReady(true);
      })
      .catch((err) => {
        console.error(`[css-paint-worklet-kit] Failed to register worklet "${name}":`, err);
      });
  }, [name, config.workletUrl]);

  const style = useMemo(
    () => buildStyle(name, (options ?? {}) as Record<string, CSSValue>, config, isReady),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, isReady, config.paintTarget, JSON.stringify(options)]
  );

  return { style, isReady, isSupported };
}
