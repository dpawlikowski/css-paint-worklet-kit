import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../polyfill', () => ({
  ensureWorkletSupport: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.resetModules();
});

describe('registerWorklet', () => {
  it('returns false on server (window undefined)', async () => {
    const origWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    delete globalThis.window;

    const { registerWorklet } = await import('../hook/registry');
    await expect(registerWorklet('noise')).resolves.toBe(false);

    globalThis.window = origWindow;
  });

  it('deduplicates concurrent registration calls', async () => {
    const addModule = vi.fn().mockResolvedValue(undefined);
    (globalThis as unknown as Record<string, unknown>).CSS = { paintWorklet: { addModule } };
    (globalThis as unknown as Record<string, unknown>).URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:fake'),
    };

    const { registerWorklet } = await import('../hook/registry');

    await Promise.all([registerWorklet('noise'), registerWorklet('noise')]);

    expect(addModule).toHaveBeenCalledTimes(1);
  });
});
