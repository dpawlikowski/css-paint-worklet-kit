import noiseCode from '../worklets/noise';
import confettiCode from '../worklets/confetti';
import gradientCode from '../worklets/gradient';
import glitchCode from '../worklets/glitch';
import liquidBlobCode from '../worklets/liquid-blob';
import spotlightCode from '../worklets/spotlight';
import auroraCode from '../worklets/aurora';
import borderBeamCode from '../worklets/border-beam';
import { ensureWorkletSupport } from '../polyfill';
import type { WorkletName } from './types';

const workletSources: Record<WorkletName, string> = {
  noise: noiseCode,
  confetti: confettiCode,
  gradient: gradientCode,
  glitch: glitchCode,
  'liquid-blob': liquidBlobCode,
  spotlight: spotlightCode,
  aurora: auroraCode,
  'border-beam': borderBeamCode,
};

/** In-flight or resolved registration attempts, keyed by worklet name or custom URL. */
const registered = new Map<string, Promise<boolean>>();
/** Keys whose registration has actually succeeded — the source of truth for {@link isWorkletRegistered}. */
const succeeded = new Set<string>();

type PaintWorkletAPI = { addModule: (url: string) => Promise<void> };

function getPaintWorklet(): PaintWorkletAPI | undefined {
  return (CSS as unknown as { paintWorklet?: PaintWorkletAPI }).paintWorklet;
}

export async function registerWorklet(name: WorkletName, customUrl?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const key = customUrl ?? name;
  const existing = registered.get(key);
  if (existing) return existing;

  const task = (async (): Promise<boolean> => {
    await ensureWorkletSupport();

    const paintWorklet = getPaintWorklet();
    if (!paintWorklet) {
      console.warn(`[css-paint-worklet-kit] CSS.paintWorklet not available for "${name}"`);
      return false;
    }

    // Only object URLs we created need revoking; a caller-supplied customUrl is theirs to own.
    let objectUrl: string | undefined;
    const url =
      customUrl ??
      (objectUrl = URL.createObjectURL(
        new Blob([workletSources[name]], { type: 'application/javascript' }),
      ));

    try {
      await paintWorklet.addModule(url);
      succeeded.add(key);
      return true;
    } finally {
      // The worklet code is loaded once addModule settles, so the blob URL can be freed.
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  })();

  registered.set(key, task);
  // Evict a failed/false attempt so a later call can retry rather than being stuck
  // on a permanently-rejected cached promise (e.g. a transient CSP/network error).
  task.then(
    (ok) => {
      if (!ok) registered.delete(key);
    },
    () => {
      registered.delete(key);
    },
  );
  return task;
}

export function isWorkletRegistered(name: WorkletName): boolean {
  return succeeded.has(name);
}
