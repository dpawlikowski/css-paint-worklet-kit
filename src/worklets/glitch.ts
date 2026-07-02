import { WORKLET_SHARED } from './shared';

const glitchWorkletCode = /* js */ `
${WORKLET_SHARED}

// --- Tuning constants -------------------------------------------------
// Slice effect (large horizontal color bands)
const SLICE_BASE_COUNT       = 6;    // minimum number of slices drawn regardless of intensity
const SLICE_COUNT_PER_INTENSITY = 22; // extra slices added at full intensity
const SLICE_HEIGHT_BASE      = 2;    // minimum slice height in px
const SLICE_HEIGHT_FACTOR    = 0.07; // slice height as a fraction of canvas height * intensity
const SLICE_OFFSET_FACTOR    = 0.22; // horizontal offset as a fraction of canvas width * intensity
const SLICE_WIDTH_MIN_FACTOR = 0.2;  // minimum slice width as a fraction of canvas width
const SLICE_WIDTH_MAX_FACTOR = 0.8;  // additional random width as a fraction of canvas width
const SLICE_ALPHA_MIN        = 0.3;  // minimum opacity of a slice
const SLICE_ALPHA_RANGE      = 0.5;  // additional random opacity range

// RGB channel shift effect
const RGB_SHIFT_BASE_COUNT      = 4;   // minimum number of shift bands
const RGB_SHIFT_COUNT_PER_INTENSITY = 12; // extra shift bands added at full intensity
const RGB_SHIFT_FREQUENCY_BOOST = 1.4; // multiplier applied to frequency for this effect
const RGB_SHIFT_HEIGHT_BASE     = 1;   // minimum band height in px
const RGB_SHIFT_HEIGHT_FACTOR   = 0.06; // band height as a fraction of canvas height * intensity
const RGB_SHIFT_DX_FACTOR       = 0.12; // horizontal jitter as a fraction of canvas width * intensity
const RGB_SHIFT_RED_ALPHA_MIN   = 0.45;
const RGB_SHIFT_RED_ALPHA_RANGE = 0.3;
const RGB_SHIFT_GREEN_ALPHA_MIN   = 0.3;
const RGB_SHIFT_GREEN_ALPHA_RANGE = 0.2;
const RGB_SHIFT_BLUE_ALPHA_MIN    = 0.45;
const RGB_SHIFT_BLUE_ALPHA_RANGE  = 0.3;

// Digital corruption blocks
const CORRUPTION_BASE_COUNT      = 3;   // minimum number of corruption blocks
const CORRUPTION_COUNT_PER_INTENSITY = 18; // extra blocks added at full intensity
const CORRUPTION_FREQUENCY_BOOST = 1.6; // multiplier applied to frequency for this effect
const CORRUPTION_WIDTH_BASE      = 4;   // minimum block width in px
const CORRUPTION_WIDTH_FACTOR    = 0.28; // block width as a fraction of canvas width * intensity
const CORRUPTION_HEIGHT_BASE     = 1;   // minimum block height in px
const CORRUPTION_HEIGHT_FACTOR   = 12;  // additional block height range * intensity
const CORRUPTION_ALPHA_MIN       = 0.35;
const CORRUPTION_ALPHA_RANGE     = 0.55;
const CORRUPTION_FLASH_COUNT_FACTOR = 3; // max number of white flash bursts * intensity
const CORRUPTION_FLASH_ALPHA_MIN    = 0.6;
const CORRUPTION_FLASH_ALPHA_RANGE  = 0.4;
const CORRUPTION_FLASH_WIDTH_BASE   = 2;
const CORRUPTION_FLASH_WIDTH_FACTOR = 0.15;
const CORRUPTION_FLASH_HEIGHT_BASE  = 1;
const CORRUPTION_FLASH_HEIGHT_RANGE = 3;

// Scanlines overlay
const SCANLINE_SPACING = 3; // vertical spacing between scanlines in px

// Vertical color bars overlay
const BAR_COUNT_FACTOR  = 5; // max number of bars * intensity
const BAR_ALPHA_MIN     = 0.12;
const BAR_ALPHA_RANGE   = 0.22;
const BAR_WIDTH_BASE    = 1;
const BAR_WIDTH_RANGE   = 3;

// Horizontal tear lines overlay
const TEAR_COUNT_FACTOR = 4; // max number of tears * intensity
const TEAR_WHITE_CHANCE = 0.6; // probability threshold above which a tear renders white
const TEAR_ALPHA_MIN    = 0.5;
const TEAR_ALPHA_RANGE  = 0.5;
const TEAR_HEIGHT_BASE  = 1;
const TEAR_HEIGHT_RANGE = 2;

class GlitchWorklet {
  static get inputProperties() {
    return [
      '--paint-glitch-intensity',
      '--paint-glitch-frequency',
      '--paint-glitch-seed',
      '--paint-glitch-color1',
      '--paint-glitch-color2',
      '--paint-glitch-background',
      '--paint-glitch-rgb-offset',
      '--paint-glitch-style',
      '--paint-glitch-scanlines',
    ];
  }

  drawSlices(ctx, rand, intensity, frequency, color1, color2, width, height) {
    const sliceCount = Math.floor(SLICE_BASE_COUNT + intensity * SLICE_COUNT_PER_INTENSITY);
    const [r1,g1,b1] = hexToRgb(color1);
    const [r2,g2,b2] = hexToRgb(color2);

    for (let i = 0; i < sliceCount; i++) {
      if (rand() > frequency) continue;
      const y      = rand() * height;
      const h      = SLICE_HEIGHT_BASE + rand() * height * SLICE_HEIGHT_FACTOR * intensity;
      const offset = (rand() - 0.5) * width * SLICE_OFFSET_FACTOR * intensity;
      const [cr,cg,cb] = rand() > 0.5 ? [r1,g1,b1] : [r2,g2,b2];
      ctx.globalAlpha = SLICE_ALPHA_MIN + rand() * SLICE_ALPHA_RANGE;
      ctx.fillStyle   = \`rgb(\${cr},\${cg},\${cb})\`;
      ctx.fillRect(offset, y, width * (SLICE_WIDTH_MIN_FACTOR + rand() * SLICE_WIDTH_MAX_FACTOR), h);
    }
  }

  drawRgbShift(ctx, rand, intensity, frequency, rgbOffset, color1, color2, width, height) {
    const shiftCount = Math.floor(RGB_SHIFT_BASE_COUNT + intensity * RGB_SHIFT_COUNT_PER_INTENSITY);
    const [r1]   = hexToRgb(color1);
    const [,g2]  = hexToRgb(color2);
    const [,,b2] = hexToRgb(color2);

    for (let i = 0; i < shiftCount; i++) {
      if (rand() > frequency * RGB_SHIFT_FREQUENCY_BOOST) continue;
      const y  = rand() * height;
      const h  = RGB_SHIFT_HEIGHT_BASE + rand() * height * RGB_SHIFT_HEIGHT_FACTOR * intensity;
      const dx = (rand() - 0.5) * width * RGB_SHIFT_DX_FACTOR * intensity;

      ctx.globalAlpha = RGB_SHIFT_RED_ALPHA_MIN + rand() * RGB_SHIFT_RED_ALPHA_RANGE;
      ctx.fillStyle   = \`rgb(\${r1},0,0)\`;
      ctx.fillRect(dx - rgbOffset, y, width, h);

      ctx.globalAlpha = RGB_SHIFT_GREEN_ALPHA_MIN + rand() * RGB_SHIFT_GREEN_ALPHA_RANGE;
      ctx.fillStyle   = \`rgb(0,\${g2},0)\`;
      ctx.fillRect(dx, y, width, h);

      ctx.globalAlpha = RGB_SHIFT_BLUE_ALPHA_MIN + rand() * RGB_SHIFT_BLUE_ALPHA_RANGE;
      ctx.fillStyle   = \`rgb(0,0,\${b2})\`;
      ctx.fillRect(dx + rgbOffset, y, width, h);
    }
  }

  drawCorruption(ctx, rand, intensity, frequency, color1, color2, width, height) {
    const blockCount = Math.floor(CORRUPTION_BASE_COUNT + intensity * CORRUPTION_COUNT_PER_INTENSITY);
    for (let i = 0; i < blockCount; i++) {
      if (rand() > frequency * CORRUPTION_FREQUENCY_BOOST) continue;
      const x = rand() * width;
      const y = rand() * height;
      const w = CORRUPTION_WIDTH_BASE + rand() * width * CORRUPTION_WIDTH_FACTOR * intensity;
      const h = CORRUPTION_HEIGHT_BASE + rand() * CORRUPTION_HEIGHT_FACTOR * intensity;
      ctx.globalAlpha = CORRUPTION_ALPHA_MIN + rand() * CORRUPTION_ALPHA_RANGE;
      ctx.fillStyle   = rand() > 0.5 ? color1 : color2;
      ctx.fillRect(x, y, w, h);
    }

    this.drawCorruptionFlashes(ctx, rand, intensity, width, height);
  }

  drawCorruptionFlashes(ctx, rand, intensity, width, height) {
    const flashCount = Math.floor(rand() * CORRUPTION_FLASH_COUNT_FACTOR * intensity);
    for (let i = 0; i < flashCount; i++) {
      ctx.globalAlpha = CORRUPTION_FLASH_ALPHA_MIN + rand() * CORRUPTION_FLASH_ALPHA_RANGE;
      ctx.fillStyle   = '#ffffff';
      ctx.fillRect(
        rand() * width,
        rand() * height,
        CORRUPTION_FLASH_WIDTH_BASE + rand() * width * CORRUPTION_FLASH_WIDTH_FACTOR,
        CORRUPTION_FLASH_HEIGHT_BASE + rand() * CORRUPTION_FLASH_HEIGHT_RANGE
      );
    }
  }

  drawScanlines(ctx, scanlines, width, height) {
    ctx.fillStyle = '#000';
    for (let y = 0; y < height; y += SCANLINE_SPACING) {
      ctx.globalAlpha = scanlines;
      ctx.fillRect(0, y, width, 1);
    }
  }

  drawBars(ctx, rand, intensity, color1, color2, width, height) {
    const barCount = Math.floor(rand() * BAR_COUNT_FACTOR * intensity);
    for (let i = 0; i < barCount; i++) {
      ctx.globalAlpha = BAR_ALPHA_MIN + rand() * BAR_ALPHA_RANGE;
      ctx.fillStyle   = rand() > 0.5 ? color1 : color2;
      ctx.fillRect(rand() * width, 0, BAR_WIDTH_BASE + rand() * BAR_WIDTH_RANGE, height);
    }
  }

  drawTears(ctx, rand, intensity, color1, color2, width, height) {
    const tearCount = Math.floor(rand() * TEAR_COUNT_FACTOR * intensity);
    for (let i = 0; i < tearCount; i++) {
      ctx.globalAlpha = TEAR_ALPHA_MIN + rand() * TEAR_ALPHA_RANGE;
      ctx.fillStyle   = rand() > TEAR_WHITE_CHANCE ? '#ffffff' : (rand() > 0.5 ? color1 : color2);
      ctx.fillRect(0, rand() * height, width, TEAR_HEIGHT_BASE + rand() * TEAR_HEIGHT_RANGE);
    }
  }

  paint(ctx, geom, props) {
    const intensity   = parseFloat(props.get('--paint-glitch-intensity'))  || 0.3;
    const frequency   = parseFloat(props.get('--paint-glitch-frequency'))  || 0.15;
    const seed        = parseFloat(props.get('--paint-glitch-seed'))       || 42;
    const color1      = (props.get('--paint-glitch-color1')     + '').trim() || '#ff006e';
    const color2      = (props.get('--paint-glitch-color2')     + '').trim() || '#3a86ff';
    const bg          = (props.get('--paint-glitch-background') + '').trim() || '#0a0a0a';
    const rgbOffset   = parseFloat(props.get('--paint-glitch-rgb-offset')) || 8;
    const glitchStyle = (props.get('--paint-glitch-style')      + '').trim() || 'vhs';
    const scanlines   = parseFloat(props.get('--paint-glitch-scanlines'))  || 0.05;

    const { width, height } = geom;
    const rand = lcg(seed);

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    if (glitchStyle === 'vhs' || glitchStyle === 'all') {
      this.drawSlices(ctx, rand, intensity, frequency, color1, color2, width, height);
      this.drawRgbShift(ctx, rand, intensity, frequency, rgbOffset, color1, color2, width, height);
    }
    if (glitchStyle === 'digital' || glitchStyle === 'all') {
      this.drawCorruption(ctx, rand, intensity, frequency, color1, color2, width, height);
    }
    if (glitchStyle === 'rgb') {
      this.drawRgbShift(ctx, rand, intensity, frequency, rgbOffset, color1, color2, width, height);
    }
    if (glitchStyle === 'slice') {
      this.drawSlices(ctx, rand, intensity, frequency, color1, color2, width, height);
    }

    if (scanlines > 0) {
      this.drawScanlines(ctx, scanlines, width, height);
    }

    ctx.globalAlpha = 1;
    this.drawBars(ctx, rand, intensity, color1, color2, width, height);
    this.drawTears(ctx, rand, intensity, color1, color2, width, height);

    ctx.globalAlpha = 1;
  }
}

registerPaint('glitch', GlitchWorklet);
`;

export default glitchWorkletCode;
