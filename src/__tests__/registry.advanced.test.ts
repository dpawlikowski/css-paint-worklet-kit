import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../polyfill', () => ({
  ensureWorkletSupport: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.resetModules();
  (globalThis as Record<string, unknown>).CSS = {};
  (globalThis as Record<string, unknown>).URL = {
    createObjectURL: vi.fn().mockReturnValue('blob:fake'),
    revokeObjectURL: vi.fn(),
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

  it('returns true when paintWorklet is available', async () => {
    const addModule = vi.fn().mockResolvedValue(undefined);
    (globalThis as Record<string, unknown>).CSS = { paintWorklet: { addModule } };

    const { registerWorklet } = await import('../hook/registry');
    const result = await registerWorklet('noise');
    expect(result).toBe(true);
  });

  it('returns false when paintWorklet is unavailable', async () => {
    (globalThis as Record<string, unknown>).CSS = {};
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { registerWorklet } = await import('../hook/registry');
    const result = await registerWorklet('noise');

    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('CSS.paintWorklet not available'));
    warnSpy.mockRestore();
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

  it('revokes the object URL it created once addModule settles', async () => {
    const addModule = vi.fn().mockResolvedValue(undefined);
    const revokeObjectURL = vi.fn();
    (globalThis as Record<string, unknown>).CSS = { paintWorklet: { addModule } };
    (globalThis as Record<string, unknown>).URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:fake'),
      revokeObjectURL,
    };

    const { registerWorklet } = await import('../hook/registry');
    await registerWorklet('noise');

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });

  it('does not cache a rejected registration, so a later call can retry', async () => {
    const addModule = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient CSP failure'))
      .mockResolvedValueOnce(undefined);
    (globalThis as Record<string, unknown>).CSS = { paintWorklet: { addModule } };

    const { registerWorklet, isWorkletRegistered } = await import('../hook/registry');

    await expect(registerWorklet('noise')).rejects.toThrow('transient CSP failure');
    expect(isWorkletRegistered('noise')).toBe(false);

    // The failed attempt must not be cached as a permanently-rejected promise.
    await expect(registerWorklet('noise')).resolves.toBe(true);
    expect(isWorkletRegistered('noise')).toBe(true);
    expect(addModule).toHaveBeenCalledTimes(2);
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
