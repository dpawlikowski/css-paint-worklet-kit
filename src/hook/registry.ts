import noiseCode from '../worklets/noise';
import confettiCode from '../worklets/confetti';
import gradientCode from '../worklets/gradient';
import glitchCode from '../worklets/glitch';
import liquidBlobCode from '../worklets/liquid-blob';
import { ensureWorkletSupport } from '../polyfill';
import type { WorkletName } from './types';

const workletSources: Record<WorkletName, string> = {
  noise: noiseCode,
  confetti: confettiCode,
  gradient: gradientCode,
  glitch: glitchCode,
  'liquid-blob': liquidBlobCode,
};

const registered = new Map<string, Promise<void>>();

type PaintWorkletAPI = {
  addModule: (url: string) => Promise<void>;
};

function getPaintWorklet(): PaintWorkletAPI | undefined {
  return (CSS as unknown as { paintWorklet?: PaintWorkletAPI }).paintWorklet;
}

export async function registerWorklet(name: WorkletName, customUrl?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const key = customUrl ?? name;

  if (registered.has(key)) {
    return registered.get(key);
  }

  const task = (async () => {
    await ensureWorkletSupport();

    const paintWorklet = getPaintWorklet();
    if (!paintWorklet) {
      console.warn(`[css-paint-worklet-kit] CSS.paintWorklet not available for "${name}"`);
      return;
    }

    let url: string;
    if (customUrl) {
      url = customUrl;
    } else {
      const code = workletSources[name];
      const blob = new Blob([code], { type: 'application/javascript' });
      url = URL.createObjectURL(blob);
    }

    await paintWorklet.addModule(url);
  })();

  registered.set(key, task);
  return task;
}

export function isWorkletRegistered(name: WorkletName): boolean {
  return registered.has(name);
}
