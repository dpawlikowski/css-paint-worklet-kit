import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  // Reset CSS global
  (globalThis as unknown as Record<string, unknown>).CSS = {};
});

describe('ensureWorkletSupport', () => {
  it('does nothing on server', async () => {
    const origWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    delete globalThis.window;

    const { ensureWorkletSupport } = await import('../polyfill');
    await expect(ensureWorkletSupport()).resolves.toBeUndefined();

    globalThis.window = origWindow;
  });

  it('skips polyfill when CSS.paintWorklet is available', async () => {
    (globalThis as unknown as Record<string, unknown>).CSS = {
      paintWorklet: { addModule: vi.fn() },
    };

    const { ensureWorkletSupport } = await import('../polyfill');
    await expect(ensureWorkletSupport()).resolves.toBeUndefined();
  });
});
