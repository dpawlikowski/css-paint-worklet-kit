import { WORKLET_SHARED } from './shared';

const glitchWorkletCode = /* js */ `
${WORKLET_SHARED}

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
    const sliceCount = Math.floor(6 + intensity * 22);
    const [r1,g1,b1] = hexToRgb(color1);
    const [r2,g2,b2] = hexToRgb(color2);

    for (let i = 0; i < sliceCount; i++) {
      if (rand() > frequency) continue;
      const y      = rand() * height;
      const h      = 2 + rand() * height * 0.07 * intensity;
      const offset = (rand() - 0.5) * width * 0.22 * intensity;
      const [cr,cg,cb] = rand() > 0.5 ? [r1,g1,b1] : [r2,g2,b2];
      ctx.globalAlpha = 0.3 + rand() * 0.5;
      ctx.fillStyle   = \`rgb(\${cr},\${cg},\${cb})\`;
      ctx.fillRect(offset, y, width * (0.2 + rand() * 0.8), h);
    }
  }

  drawRgbShift(ctx, rand, intensity, frequency, rgbOffset, color1, color2, width, height) {
    const shiftCount = Math.floor(4 + intensity * 12);
    const [r1]   = hexToRgb(color1);
    const [,g2]  = hexToRgb(color2);
    const [,,b2] = hexToRgb(color2);

    for (let i = 0; i < shiftCount; i++) {
      if (rand() > frequency * 1.4) continue;
      const y  = rand() * height;
      const h  = 1 + rand() * height * 0.06 * intensity;
      const dx = (rand() - 0.5) * width * 0.12 * intensity;

      ctx.globalAlpha = 0.45 + rand() * 0.3;
      ctx.fillStyle   = \`rgb(\${r1},0,0)\`;
      ctx.fillRect(dx - rgbOffset, y, width, h);

      ctx.globalAlpha = 0.3 + rand() * 0.2;
      ctx.fillStyle   = \`rgb(0,\${g2},0)\`;
      ctx.fillRect(dx, y, width, h);

      ctx.globalAlpha = 0.45 + rand() * 0.3;
      ctx.fillStyle   = \`rgb(0,0,\${b2})\`;
      ctx.fillRect(dx + rgbOffset, y, width, h);
    }
  }

  drawCorruption(ctx, rand, intensity, frequency, color1, color2, width, height) {
    const blockCount = Math.floor(3 + intensity * 18);
    for (let i = 0; i < blockCount; i++) {
      if (rand() > frequency * 1.6) continue;
      const x = rand() * width;
      const y = rand() * height;
      const w = 4 + rand() * width * 0.28 * intensity;
      const h = 1 + rand() * 12 * intensity;
      ctx.globalAlpha = 0.35 + rand() * 0.55;
      ctx.fillStyle   = rand() > 0.5 ? color1 : color2;
      ctx.fillRect(x, y, w, h);
    }

    const flashCount = Math.floor(rand() * 3 * intensity);
    for (let i = 0; i < flashCount; i++) {
      ctx.globalAlpha = 0.6 + rand() * 0.4;
      ctx.fillStyle   = '#ffffff';
      ctx.fillRect(rand() * width, rand() * height, 2 + rand() * width * 0.15, 1 + rand() * 3);
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
      ctx.fillStyle = '#000';
      for (let y = 0; y < height; y += 3) {
        ctx.globalAlpha = scanlines;
        ctx.fillRect(0, y, width, 1);
      }
    }

    ctx.globalAlpha = 1;
    const barCount = Math.floor(rand() * 5 * intensity);
    for (let i = 0; i < barCount; i++) {
      ctx.globalAlpha = 0.12 + rand() * 0.22;
      ctx.fillStyle   = rand() > 0.5 ? color1 : color2;
      ctx.fillRect(rand() * width, 0, 1 + rand() * 3, height);
    }

    const tearCount = Math.floor(rand() * 4 * intensity);
    for (let i = 0; i < tearCount; i++) {
      ctx.globalAlpha = 0.5 + rand() * 0.5;
      ctx.fillStyle   = rand() > 0.6 ? '#ffffff' : (rand() > 0.5 ? color1 : color2);
      ctx.fillRect(0, rand() * height, width, 1 + rand() * 2);
    }

    ctx.globalAlpha = 1;
  }
}

registerPaint('glitch', GlitchWorklet);
`;

export default glitchWorkletCode;
