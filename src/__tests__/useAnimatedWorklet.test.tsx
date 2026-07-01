import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../hook/registry', () => ({
  registerWorklet: vi.fn().mockResolvedValue(true),
  isWorkletRegistered: vi.fn().mockReturnValue(false),
}));

import { useAnimatedWorklet } from '../hook/useAnimatedWorklet';

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return mql;
}

describe('useAnimatedWorklet', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockMatchMedia(false);
    rafSpy = vi.spyOn(window, 'requestAnimationFrame') as ReturnType<typeof vi.spyOn>;
    rafSpy.mockImplementation(() => 0);
  });

  afterEach(() => {
    rafSpy.mockRestore();
  });

  it('calls optionsFn with time=0 on first render', async () => {
    const optionsFn = vi.fn().mockReturnValue({ seed: 1 });
    renderHook(() => useAnimatedWorklet('noise', optionsFn));

    await act(async () => { await Promise.resolve(); });

    expect(optionsFn).toHaveBeenCalledWith(0);
  });

  it('schedules requestAnimationFrame by default', async () => {
    renderHook(() => useAnimatedWorklet('noise', () => ({ seed: 1 })));

    await act(async () => { await Promise.resolve(); });

    expect(rafSpy).toHaveBeenCalled();
  });

  it('does not schedule requestAnimationFrame when prefers-reduced-motion matches', async () => {
    mockMatchMedia(true);

    renderHook(() => useAnimatedWorklet('noise', () => ({ seed: 1 })));

    await act(async () => { await Promise.resolve(); });

    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('ignores prefers-reduced-motion when respectReducedMotion=false', async () => {
    mockMatchMedia(true);

    renderHook(() =>
      useAnimatedWorklet('noise', () => ({ seed: 1 }), { respectReducedMotion: false })
    );

    await act(async () => { await Promise.resolve(); });

    expect(rafSpy).toHaveBeenCalled();
  });
});
