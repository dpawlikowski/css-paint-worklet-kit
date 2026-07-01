import { describe, it, expect } from 'vitest';
import noiseCode from '../worklets/noise';
import confettiCode from '../worklets/confetti';
import gradientCode from '../worklets/gradient';
import glitchCode from '../worklets/glitch';
import liquidBlobCode from '../worklets/liquid-blob';
import spotlightCode from '../worklets/spotlight';

const ALL_CODES = [noiseCode, confettiCode, gradientCode, glitchCode, liquidBlobCode, spotlightCode];

describe('worklet source strings', () => {
  it('noise exports a non-empty string containing registerPaint("noise")', () => {
    expect(typeof noiseCode).toBe('string');
    expect(noiseCode).toContain("registerPaint('noise'");
    expect(noiseCode).toContain('--paint-noise-scale');
    expect(noiseCode).toContain('--paint-noise-color');
  });

  it('confetti exports a non-empty string containing registerPaint("confetti")', () => {
    expect(typeof confettiCode).toBe('string');
    expect(confettiCode).toContain("registerPaint('confetti'");
    expect(confettiCode).toContain('--paint-confetti-count');
    expect(confettiCode).toContain('--paint-confetti-colors');
  });

  it('gradient exports a non-empty string containing registerPaint("gradient")', () => {
    expect(typeof gradientCode).toBe('string');
    expect(gradientCode).toContain("registerPaint('gradient'");
    expect(gradientCode).toContain('--paint-gradient-type');
    expect(gradientCode).toContain('--paint-gradient-colors');
  });

  it('glitch exports a non-empty string containing registerPaint("glitch")', () => {
    expect(typeof glitchCode).toBe('string');
    expect(glitchCode).toContain("registerPaint('glitch'");
    expect(glitchCode).toContain('--paint-glitch-intensity');
    expect(glitchCode).toContain('--paint-glitch-frequency');
  });

  it('liquid-blob exports a non-empty string containing registerPaint("liquid-blob")', () => {
    expect(typeof liquidBlobCode).toBe('string');
    expect(liquidBlobCode).toContain("registerPaint('liquid-blob'");
    expect(liquidBlobCode).toContain('--paint-liquid-blob-color');
    expect(liquidBlobCode).toContain('--paint-liquid-blob-threshold');
  });

  it('all worklet sources declare inputProperties', () => {
    for (const code of ALL_CODES) {
      expect(code).toContain('inputProperties');
    }
  });

  it('all worklet sources include shared lcg helper', () => {
    for (const code of ALL_CODES) {
      expect(code).toContain('function lcg(');
      expect(code).toContain('LCG_M');
      expect(code).toContain('LCG_A');
    }
  });

  it('worklets that use color parsing include hexToRgb helper', () => {
    for (const code of [gradientCode, glitchCode, liquidBlobCode, spotlightCode]) {
      expect(code).toContain('function hexToRgb(');
    }
  });

  it('spotlight exports a non-empty string containing registerPaint("spotlight")', () => {
    expect(typeof spotlightCode).toBe('string');
    expect(spotlightCode).toContain("registerPaint('spotlight'");
    expect(spotlightCode).toContain('--paint-spotlight-x');
    expect(spotlightCode).toContain('--paint-spotlight-y');
    expect(spotlightCode).toContain('--paint-spotlight-color');
  });

  it('worklets that parse color lists include parseColors helper', () => {
    for (const code of [confettiCode, gradientCode]) {
      expect(code).toContain('function parseColors(');
    }
  });

  it('lcg is deterministic: same seed produces same sequence', () => {
    const lcgFn = new Function(`
      const LCG_M = 2147483647;
      const LCG_A = 16807;
      function lcg(seed) {
        let s = seed % LCG_M;
        if (s <= 0) s += LCG_M - 1;
        return () => { s = (s * LCG_A) % LCG_M; return (s - 1) / (LCG_M - 1); };
      }
      const r1 = lcg(42); const r2 = lcg(42);
      return [r1(), r1(), r2(), r2()];
    `);
    const [a1, a2, b1, b2] = lcgFn() as number[];
    expect(a1).toBe(b1);
    expect(a2).toBe(b2);
  });

  it('lcg produces different sequences for different seeds', () => {
    const lcgFn = new Function(`
      const LCG_M = 2147483647; const LCG_A = 16807;
      function lcg(seed) {
        let s = seed % LCG_M;
        if (s <= 0) s += LCG_M - 1;
        return () => { s = (s * LCG_A) % LCG_M; return (s - 1) / (LCG_M - 1); };
      }
      return [lcg(1)(), lcg(2)()];
    `);
    const [v1, v2] = lcgFn() as number[];
    expect(v1).not.toBe(v2);
  });
});
