import noiseCode from '../worklets/noise';
import confettiCode from '../worklets/confetti';
import gradientCode from '../worklets/gradient';
import glitchCode from '../worklets/glitch';
import liquidBlobCode from '../worklets/liquid-blob';
import spotlightCode from '../worklets/spotlight';
import { ensureWorkletSupport } from '../polyfill';
import type { WorkletName } from './types';

const workletSources: Record<WorkletName, string> = {
  noise: noiseCode,
  confetti: confettiCode,
  gradient: gradientCode,
  glitch: glitchCode,
  'liquid-blob': liquidBlobCode,
  spotlight: spotlightCode,
};

const registered = new Map<string, Promise<boolean>>();

type PaintWorkletAPI = { addModule: (url: string) => Promise<void> };

function getPaintWorklet(): PaintWorkletAPI | undefined {
  return (CSS as unknown as { paintWorklet?: PaintWorkletAPI }).paintWorklet;
}

export async function registerWorklet(name: WorkletName, customUrl?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const key = customUrl ?? name;
  if (registered.has(key)) return registered.get(key)!;

  const task = (async (): Promise<boolean> => {
    await ensureWorkletSupport();

    const paintWorklet = getPaintWorklet();
    if (!paintWorklet) {
      console.warn(`[css-paint-worklet-kit] CSS.paintWorklet not available for "${name}"`);
      return false;
    }

    const url = customUrl ?? URL.createObjectURL(
      new Blob([workletSources[name]], { type: 'application/javascript' })
    );

    await paintWorklet.addModule(url);
    return true;
  })();

  registered.set(key, task);
  return task;
}

export function isWorkletRegistered(name: WorkletName): boolean {
  return registered.has(name);
}
