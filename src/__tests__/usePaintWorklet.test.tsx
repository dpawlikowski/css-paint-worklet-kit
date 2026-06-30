import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// Must mock registry before any import of the hook
vi.mock('../hook/registry', () => ({
  registerWorklet: vi.fn().mockResolvedValue(true),
  isWorkletRegistered: vi.fn().mockReturnValue(false),
}));

import { usePaintWorklet } from '../hook/usePaintWorklet';
import { registerWorklet } from '../hook/registry';
import liquidBlobCode from '../worklets/liquid-blob';
import glitchCode from '../worklets/glitch';

describe('usePaintWorklet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (registerWorklet as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  it('starts with isReady=false and empty style', async () => {
    // Defer resolution so we can observe the initial synchronous render
    let resolve!: (v: boolean) => void;
    (registerWorklet as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise<boolean>((r) => { resolve = r; })
    );

    const { result } = renderHook(() => usePaintWorklet('noise'));
    expect(result.current.isReady).toBe(false);
    expect(result.current.style).toEqual({});

    await act(async () => { resolve(true); await Promise.resolve(); });
  });

  it('becomes isReady=true after worklet resolves', async () => {
    const { result } = renderHook(() => usePaintWorklet('noise'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isReady).toBe(true);
  });

  it('sets backgroundImage style for default paintTarget', async () => {
    const { result } = renderHook(() =>
      usePaintWorklet('noise', { color: '#ff0000' })
    );

    await act(async () => { await Promise.resolve(); });

    expect(result.current.style).toMatchObject({
      backgroundImage: 'paint(noise)',
    });
  });

  it('sets maskImage style when paintTarget=mask', async () => {
    const { result } = renderHook(() =>
      usePaintWorklet('noise', {}, { paintTarget: 'mask' })
    );

    await act(async () => { await Promise.resolve(); });

    expect(result.current.style).toMatchObject({
      maskImage: 'paint(noise)',
      WebkitMaskImage: 'paint(noise)',
    });
  });

  it('sets borderImage style when paintTarget=border', async () => {
    const { result } = renderHook(() =>
      usePaintWorklet('glitch', {}, { paintTarget: 'border' })
    );

    await act(async () => { await Promise.resolve(); });

    expect(result.current.style).toMatchObject({
      borderImage: 'paint(glitch) 1',
    });
  });

  it('includes CSS custom properties from options', async () => {
    const { result } = renderHook(() =>
      usePaintWorklet('noise', { scale: 0.005, opacity: 0.3 })
    );

    await act(async () => { await Promise.resolve(); });

    expect(result.current.style).toMatchObject({
      '--paint-noise-scale': '0.005',
      '--paint-noise-opacity': '0.3',
    });
  });

  it('serialises array options as comma-joined strings', async () => {
    const { result } = renderHook(() =>
      usePaintWorklet('confetti', { colors: ['#ff0000', '#00ff00', '#0000ff'] })
    );

    await act(async () => { await Promise.resolve(); });

    expect(result.current.style['--paint-confetti-colors' as keyof React.CSSProperties]).toBe(
      '#ff0000,#00ff00,#0000ff'
    );
  });

  it('omits undefined option values from CSS properties', async () => {
    const { result } = renderHook(() =>
      usePaintWorklet('noise', { scale: undefined, color: '#fff' })
    );

    await act(async () => { await Promise.resolve(); });

    const styleKeys = Object.keys(result.current.style);
    expect(styleKeys).not.toContain('--paint-noise-scale');
    expect(styleKeys).toContain('--paint-noise-color');
  });

  it('calls registerWorklet with the worklet name', async () => {
    renderHook(() => usePaintWorklet('gradient'));

    await act(async () => { await Promise.resolve(); });

    expect(registerWorklet).toHaveBeenCalledWith('gradient', undefined);
  });

  it('passes custom workletUrl to registerWorklet', async () => {
    renderHook(() =>
      usePaintWorklet('noise', {}, { workletUrl: '/custom/noise.js' })
    );

    await act(async () => { await Promise.resolve(); });

    expect(registerWorklet).toHaveBeenCalledWith('noise', '/custom/noise.js');
  });

  it('calls registerWorklet only once even when re-rendered', async () => {
    const { rerender } = renderHook(
      ({ seed }: { seed: number }) => usePaintWorklet('noise', { seed }),
      { initialProps: { seed: 1 } }
    );

    await act(async () => { await Promise.resolve(); });
    rerender({ seed: 2 });
    rerender({ seed: 3 });

    expect(registerWorklet).toHaveBeenCalledTimes(1);
  });

  it('stays not ready and logs error when registerWorklet rejects', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (registerWorklet as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => usePaintWorklet('noise'));

    await act(async () => { await Promise.resolve(); });

    expect(result.current.isReady).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to register worklet'),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('converts camelCase option keys to kebab-case CSS property names', async () => {
    const { result } = renderHook(() =>
      usePaintWorklet('glitch', { rgbOffset: 12 })
    );

    await act(async () => { await Promise.resolve(); });

    expect(result.current.style).toMatchObject({
      '--paint-glitch-rgb-offset': '12',
    });
    expect(Object.keys(result.current.style)).not.toContain('--paint-glitch-rgbOffset');
  });

  it('every option produced for liquid-blob matches a property the worklet declares as inputProperties', async () => {
    const options = {
      color: '#7c3aed',
      count: 7,
      radius: 0.4,
      seed: 99,
      threshold: 1.1,
      background: '#0a0a14',
      glow: 0.6,
      pixel: 3,
    };
    const { result } = renderHook(() => usePaintWorklet('liquid-blob', options));

    await act(async () => { await Promise.resolve(); });

    for (const key of Object.keys(result.current.style)) {
      if (!key.startsWith('--paint-')) continue;
      expect(liquidBlobCode).toContain(`'${key}'`);
    }
  });

  it('every option produced for glitch matches a property the worklet declares as inputProperties', async () => {
    const options = {
      intensity: 0.5,
      frequency: 0.25,
      seed: 13,
      color1: '#ff006e',
      color2: '#3a86ff',
      background: '#070709',
      rgbOffset: 8,
      style: 'vhs' as const,
      scanlines: 0.05,
    };
    const { result } = renderHook(() => usePaintWorklet('glitch', options));

    await act(async () => { await Promise.resolve(); });

    for (const key of Object.keys(result.current.style)) {
      if (!key.startsWith('--paint-')) continue;
      expect(glitchCode).toContain(`'${key}'`);
    }
  });
});
