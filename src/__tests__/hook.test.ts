import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockRegisterWorklet = vi.fn();

vi.mock('../hook/registry', () => ({
  registerWorklet: mockRegisterWorklet,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockRegisterWorklet.mockResolvedValue(true);
});

/** Deferred promise – lets a test observe state before resolution */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
}

describe('usePaintWorklet', () => {
  it('returns isReady=false and isSupported=false initially', async () => {
    const d = deferred<boolean>();
    mockRegisterWorklet.mockReturnValue(d.promise);

    const { usePaintWorklet } = await import('../hook/usePaintWorklet');
    const { result } = renderHook(() => usePaintWorklet('noise'));

    expect(result.current.isReady).toBe(false);
    expect(result.current.isSupported).toBe(false);

    await act(async () => { d.resolve(true); await Promise.resolve(); });
  });

  it('style is empty object when not ready', async () => {
    const d = deferred<boolean>();
    mockRegisterWorklet.mockReturnValue(d.promise);

    const { usePaintWorklet } = await import('../hook/usePaintWorklet');
    const { result } = renderHook(() => usePaintWorklet('noise', { scale: 0.005 }));

    expect(result.current.style).toEqual({});

    await act(async () => { d.resolve(true); await Promise.resolve(); });
  });

  it('sets isReady=true and isSupported=true after successful registration', async () => {
    const { usePaintWorklet } = await import('../hook/usePaintWorklet');
    const { result } = renderHook(() => usePaintWorklet('noise', { scale: 0.005 }));
    await act(async () => { await Promise.resolve(); });
    expect(result.current.isReady).toBe(true);
    expect(result.current.isSupported).toBe(true);
  });

  it('keeps isReady=false and isSupported=false when paintWorklet is unsupported', async () => {
    mockRegisterWorklet.mockResolvedValue(false);
    const { usePaintWorklet } = await import('../hook/usePaintWorklet');
    const { result } = renderHook(() => usePaintWorklet('noise'));
    await act(async () => { await Promise.resolve(); });
    expect(result.current.isReady).toBe(false);
    expect(result.current.isSupported).toBe(false);
  });

  it('builds backgroundImage style after registration', async () => {
    const { usePaintWorklet } = await import('../hook/usePaintWorklet');
    const { result } = renderHook(() => usePaintWorklet('noise', { scale: 0.005 }));
    await act(async () => { await Promise.resolve(); });
    expect(result.current.style.backgroundImage).toBe('paint(noise)');
  });

  it('builds CSS custom properties with correct prefix', async () => {
    const { usePaintWorklet } = await import('../hook/usePaintWorklet');
    const { result } = renderHook(() => usePaintWorklet('noise', { scale: 0.005, opacity: 0.3 }));
    await act(async () => { await Promise.resolve(); });
    const style = result.current.style as Record<string, string>;
    expect(style['--paint-noise-scale']).toBe('0.005');
    expect(style['--paint-noise-opacity']).toBe('0.3');
  });

  it('serialises array options to comma-separated string', async () => {
    const { usePaintWorklet } = await import('../hook/usePaintWorklet');
    const colors = ['#ff0000', '#00ff00', '#0000ff'];
    const { result } = renderHook(() => usePaintWorklet('confetti', { colors }));
    await act(async () => { await Promise.resolve(); });
    const style = result.current.style as Record<string, string>;
    expect(style['--paint-confetti-colors']).toBe('#ff0000,#00ff00,#0000ff');
  });

  it('builds mask style when paintTarget is mask', async () => {
    const { usePaintWorklet } = await import('../hook/usePaintWorklet');
    const { result } = renderHook(() =>
      usePaintWorklet('noise', {}, { paintTarget: 'mask' })
    );
    await act(async () => { await Promise.resolve(); });
    expect(result.current.style.maskImage).toBe('paint(noise)');
  });

  it('calls registerWorklet exactly once even on re-renders', async () => {
    const { usePaintWorklet } = await import('../hook/usePaintWorklet');
    const { rerender } = renderHook(() => usePaintWorklet('noise', { scale: 0.005 }));
    await act(async () => { await Promise.resolve(); });
    rerender();
    rerender();
    expect(mockRegisterWorklet).toHaveBeenCalledTimes(1);
  });
});
