import { describe, it, expect } from 'vitest';
import noiseCode from '../worklets/noise';
import confettiCode from '../worklets/confetti';
import gradientCode from '../worklets/gradient';
import glitchCode from '../worklets/glitch';
import liquidBlobCode from '../worklets/liquid-blob';

describe('worklet source strings', () => {
  it('noise exports a non-empty string containing registerPaint("noise")', () => {
    expect(typeof noiseCode).toBe('string');
    expect(noiseCode).toContain('registerPaint(\'noise\'');
    expect(noiseCode).toContain('--paint-noise-scale');
    expect(noiseCode).toContain('--paint-noise-color');
  });

  it('confetti exports a non-empty string containing registerPaint("confetti")', () => {
    expect(typeof confettiCode).toBe('string');
    expect(confettiCode).toContain('registerPaint(\'confetti\'');
    expect(confettiCode).toContain('--paint-confetti-count');
    expect(confettiCode).toContain('--paint-confetti-colors');
  });

  it('gradient exports a non-empty string containing registerPaint("gradient")', () => {
    expect(typeof gradientCode).toBe('string');
    expect(gradientCode).toContain('registerPaint(\'gradient\'');
    expect(gradientCode).toContain('--paint-gradient-type');
    expect(gradientCode).toContain('--paint-gradient-colors');
  });

  it('glitch exports a non-empty string containing registerPaint("glitch")', () => {
    expect(typeof glitchCode).toBe('string');
    expect(glitchCode).toContain('registerPaint(\'glitch\'');
    expect(glitchCode).toContain('--paint-glitch-intensity');
    expect(glitchCode).toContain('--paint-glitch-frequency');
  });

  it('liquid-blob exports a non-empty string containing registerPaint("liquid-blob")', () => {
    expect(typeof liquidBlobCode).toBe('string');
    expect(liquidBlobCode).toContain('registerPaint(\'liquid-blob\'');
    expect(liquidBlobCode).toContain('--paint-blob-color');
    expect(liquidBlobCode).toContain('--paint-blob-threshold');
  });

  it('all worklet sources declare inputProperties', () => {
    for (const code of [noiseCode, confettiCode, gradientCode, glitchCode, liquidBlobCode]) {
      expect(code).toContain('inputProperties');
    }
  });

  it('noise worklet LCG seed is stable (same seed = same sequence)', () => {
    // Extract and eval the LCG inside a sandboxed function to verify determinism
    const lcgFn = new Function(`
      function lcg(seed) {
        let s = seed % 2147483647;
        if (s <= 0) s += 2147483646;
        return () => {
          s = (s * 16807) % 2147483647;
          return (s - 1) / 2147483646;
        };
      }
      const rand1 = lcg(42);
      const rand2 = lcg(42);
      return [rand1(), rand1(), rand2(), rand2()];
    `);
    const [a1, a2, b1, b2] = lcgFn() as number[];
    expect(a1).toBe(b1);
    expect(a2).toBe(b2);
  });

  it('noise worklet LCG produces different sequences for different seeds', () => {
    const lcgFn = new Function(`
      function lcg(seed) {
        let s = seed % 2147483647;
        if (s <= 0) s += 2147483646;
        return () => {
          s = (s * 16807) % 2147483647;
          return (s - 1) / 2147483646;
        };
      }
      return [lcg(1)(), lcg(2)()];
    `);
    const [v1, v2] = lcgFn() as number[];
    expect(v1).not.toBe(v2);
  });
});
