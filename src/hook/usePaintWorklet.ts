import { useEffect, useMemo, useRef, useState } from 'react';
import { registerWorklet } from './registry';
import type {
  WorkletName,
  WorkletOptions,
  PaintWorkletConfig,
  UsePaintWorkletResult,
} from './types';

// Array values (e.g. `colors`) are joined into a comma-separated custom property.
type CSSValue = string | number | string[] | undefined;

function toKebabCase(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function buildCustomProperties(
  name: WorkletName,
  options: Record<string, CSSValue>
): Record<string, string> {
  const props: Record<string, string> = {};
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined) continue;
    props[`--paint-${name}-${toKebabCase(key)}`] = Array.isArray(value) ? value.join(',') : String(value);
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
  // The (name, workletUrl) pair we last registered for. A plain boolean would
  // freeze on the first worklet and ignore later name/url changes.
  const registeredKeyRef = useRef<string | null>(null);

  const enabled = config.enabled ?? true;

  // Callers frequently pass an inline `config` object literal, so its
  // reference changes every render. We keep a ref pointing at the latest
  // `config` (synced in its own effect, never read during render) so the
  // registration effect below can call `onError` with the current
  // callback without needing `config` itself as a dependency.
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    if (!enabled) return;

    const key = `${name}|${config.workletUrl ?? ''}`;
    if (registeredKeyRef.current === key) return;
    registeredKeyRef.current = key;

    // Reset readiness while (re)registering a different worklet so stale state
    // from the previous worklet isn't reported for the new one.
    setIsReady(false);
    setIsSupported(false);

    registerWorklet(name, config.workletUrl)
      .then((supported) => {
        // A newer registration may have superseded this one mid-flight.
        if (registeredKeyRef.current !== key) return;
        setIsSupported(supported);
        if (supported) setIsReady(true);
      })
      .catch((err) => {
        console.error(`[css-paint-worklet-kit] Failed to register worklet "${name}":`, err);
        configRef.current.onError?.(err);
      });
  }, [name, config.workletUrl, enabled]);

  const optionsKey = JSON.stringify(options);
  const style = useMemo(
    () => buildStyle(name, (options ?? {}) as Record<string, CSSValue>, config, isReady),
    // `options` and `config` are deliberately excluded: callers commonly pass
    // new object/array literals each render, which would defeat this memo.
    // `optionsKey` (a stable JSON serialization) and `config.paintTarget`
    // capture everything that actually affects the computed style.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, isReady, config.paintTarget, optionsKey]
  );

  return { style, isReady, isSupported };
}
