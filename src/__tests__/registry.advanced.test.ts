import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../polyfill', () => ({
  ensureWorkletSupport: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.resetModules();
  (globalThis as Record<string, unknown>).CSS = {};
  (globalThis as Record<string, unknown>).URL = {
    createObjectURL: vi.fn().mockReturnValue('blob:fake'),
  };
});

describe('registerWorklet – advanced', () => {
  it('registers each worklet name independently', async () => {
    const addModule = vi.fn().mockResolvedValue(undefined);
    (globalThis as Record<string, unknown>).CSS = { paintWorklet: { addModule } };

    const { registerWorklet } = await import('../hook/registry');
    await registerWorklet('noise');
    await registerWorklet('confetti');
    await registerWorklet('gradient');
    await registerWorklet('glitch');
    await registerWorklet('liquid-blob');

    expect(addModule).toHaveBeenCalledTimes(5);
  });

  it('uses customUrl directly without creating a blob', async () => {
    const addModule = vi.fn().mockResolvedValue(undefined);
    const createObjectURL = vi.fn().mockReturnValue('blob:fake');
    (globalThis as Record<string, unknown>).CSS = { paintWorklet: { addModule } };
    (globalThis as Record<string, unknown>).URL = { createObjectURL };

    const { registerWorklet } = await import('../hook/registry');
    await registerWorklet('noise', 'https://example.com/noise.js');

    expect(addModule).toHaveBeenCalledWith('https://example.com/noise.js');
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('logs a warning when paintWorklet is unavailable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (globalThis as Record<string, unknown>).CSS = {};

    const { registerWorklet } = await import('../hook/registry');
    await registerWorklet('noise');

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('CSS.paintWorklet not available'));
    warnSpy.mockRestore();
  });

  it('isWorkletRegistered returns false before registration', async () => {
    const { isWorkletRegistered } = await import('../hook/registry');
    expect(isWorkletRegistered('gradient')).toBe(false);
  });

  it('isWorkletRegistered returns true after registration', async () => {
    const addModule = vi.fn().mockResolvedValue(undefined);
    (globalThis as Record<string, unknown>).CSS = { paintWorklet: { addModule } };

    const { registerWorklet, isWorkletRegistered } = await import('../hook/registry');
    await registerWorklet('glitch');

    expect(isWorkletRegistered('glitch')).toBe(true);
  });

  it('deduplicates custom URL registrations by URL key', async () => {
    const addModule = vi.fn().mockResolvedValue(undefined);
    (globalThis as Record<string, unknown>).CSS = { paintWorklet: { addModule } };

    const { registerWorklet } = await import('../hook/registry');
    const url = 'https://example.com/worklet.js';
    await Promise.all([
      registerWorklet('noise', url),
      registerWorklet('confetti', url),
    ]);

    expect(addModule).toHaveBeenCalledTimes(1);
  });
});
