import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import React from 'react';

vi.mock('../hook/registry', () => ({
  registerWorklet: vi.fn().mockResolvedValue(true),
  isWorkletRegistered: vi.fn().mockReturnValue(false),
}));

import { usePointerWorklet } from '../hook/usePointerWorklet';

function fireMove(el: Element, clientX: number, clientY: number) {
  el.dispatchEvent(new MouseEvent('pointermove', { clientX, clientY, bubbles: true }));
}

function stubRect(el: HTMLElement, width: number, height: number) {
  el.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width, height, right: width, bottom: height, x: 0, y: 0, toJSON() {} }) as DOMRect;
}

function SpotlightBox() {
  const { ref, style } = usePointerWorklet('spotlight', { color: '#7c3aed' });
  return <div ref={ref as React.RefObject<HTMLDivElement>} style={style} data-testid="box" />;
}

describe('usePointerWorklet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the same style/isReady/isSupported shape as usePaintWorklet, plus a ref', async () => {
    const { result } = renderHook(() => usePointerWorklet('spotlight', { color: '#7c3aed' }));

    await act(async () => { await Promise.resolve(); });

    expect(result.current.ref.current).toBeNull();
    expect(result.current.isReady).toBe(true);
    expect(result.current.isSupported).toBe(true);
    expect(result.current.style.backgroundImage).toBe('paint(spotlight)');
  });

  it('writes pointer position to --paint-spotlight-x/y directly on the DOM element', async () => {
    const { getByTestId } = render(<SpotlightBox />);
    await act(async () => { await Promise.resolve(); });

    const box = getByTestId('box');
    stubRect(box, 200, 100);

    act(() => { fireMove(box, 100, 50); });

    expect(box.style.getPropertyValue('--paint-spotlight-x')).toBe('0.5000');
    expect(box.style.getPropertyValue('--paint-spotlight-y')).toBe('0.5000');
  });

  it('tracks off-center pointer positions correctly', async () => {
    const { getByTestId } = render(<SpotlightBox />);
    await act(async () => { await Promise.resolve(); });

    const box = getByTestId('box');
    stubRect(box, 200, 100);

    act(() => { fireMove(box, 20, 90); });

    expect(box.style.getPropertyValue('--paint-spotlight-x')).toBe('0.1000');
    expect(box.style.getPropertyValue('--paint-spotlight-y')).toBe('0.9000');
  });

  it('removes the pointermove listener on unmount', async () => {
    const { getByTestId, unmount } = render(<SpotlightBox />);
    await act(async () => { await Promise.resolve(); });

    const box = getByTestId('box');
    const removeSpy = vi.spyOn(box, 'removeEventListener');

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
  });
});
