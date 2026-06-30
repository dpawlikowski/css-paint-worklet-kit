const glitchWorkletCode = /* js */ `
class GlitchWorklet {
  static get inputProperties() {
    return [
      '--paint-glitch-intensity',
      '--paint-glitch-frequency',
      '--paint-glitch-seed',
      '--paint-glitch-color1',
      '--paint-glitch-color2',
      '--paint-glitch-background',
    ];
  }

  lcg(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  paint(ctx, geom, props) {
    const intensity = parseFloat(props.get('--paint-glitch-intensity')) || 0.3;
    const frequency = parseFloat(props.get('--paint-glitch-frequency')) || 0.15;
    const seed = parseFloat(props.get('--paint-glitch-seed')) || 42;
    const color1 = (props.get('--paint-glitch-color1') + '').trim() || '#ff006e';
    const color2 = (props.get('--paint-glitch-color2') + '').trim() || '#3a86ff';
    const bg = (props.get('--paint-glitch-background') + '').trim() || '#0a0a0a';

    const { width, height } = geom;
    const rand = this.lcg(seed);

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const sliceCount = Math.floor(8 + intensity * 20);
    const [r1, g1, b1] = this.hexToRgb(color1);
    const [r2, g2, b2] = this.hexToRgb(color2);

    for (let i = 0; i < sliceCount; i++) {
      if (rand() > frequency) continue;

      const y = rand() * height;
      const sliceH = (2 + rand() * height * 0.08 * intensity);
      const offset = (rand() - 0.5) * width * 0.2 * intensity;
      const alpha = 0.3 + rand() * 0.5;

      ctx.save();
      ctx.globalAlpha = alpha;

      // RGB channel shift blocks
      const useColor1 = rand() > 0.5;
      const [cr, cg, cb] = useColor1 ? [r1, g1, b1] : [r2, g2, b2];
      ctx.fillStyle = \`rgb(\${cr},\${cg},\${cb})\`;
      ctx.fillRect(offset, y, width * (0.3 + rand() * 0.7), sliceH);

      ctx.restore();
    }

    // Scanlines
    const lineAlpha = 0.04 + intensity * 0.06;
    ctx.fillStyle = '#000';
    for (let y = 0; y < height; y += 3) {
      ctx.globalAlpha = lineAlpha;
      ctx.fillRect(0, y, width, 1);
    }
    ctx.globalAlpha = 1;

    // Vertical noise strips
    const stripCount = Math.floor(rand() * 3 * intensity);
    for (let i = 0; i < stripCount; i++) {
      const x = rand() * width;
      const w = 1 + rand() * 3;
      ctx.globalAlpha = 0.1 + rand() * 0.2;
      ctx.fillStyle = rand() > 0.5 ? color1 : color2;
      ctx.fillRect(x, 0, w, height);
    }
    ctx.globalAlpha = 1;
  }
}

registerPaint('glitch', GlitchWorklet);
`;

export default glitchWorkletCode;
