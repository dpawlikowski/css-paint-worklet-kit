let polyfillLoaded = false;
let polyfillLoading: Promise<void> | null = null;

export async function ensureWorkletSupport(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Native support
  if ((CSS as { paintWorklet?: { addModule: (url: string) => Promise<void> } }).paintWorklet) return;

  if (polyfillLoaded) return;

  if (polyfillLoading) {
    await polyfillLoading;
    return;
  }

  polyfillLoading = import('css-paint-polyfill').then(() => {
    polyfillLoaded = true;
  });

  await polyfillLoading;
}
