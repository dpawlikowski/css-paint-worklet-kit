const noiseWorkletCode = /* js */ `
class NoiseWorklet {
  static get inputProperties() {
    return [
      '--paint-noise-scale',
      '--paint-noise-octaves',
      '--paint-noise-color',
      '--paint-noise-background',
      '--paint-noise-opacity',
      '--paint-noise-seed',
    ];
  }

  // Seeded LCG pseudo-random
  lcg(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

  lerp(a, b, t) { return a + t * (b - a); }

  grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }

  buildPermTable(rand) {
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    return [...p, ...p];
  }

  perlin(x, y, perm) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this.fade(xf);
    const v = this.fade(yf);
    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];
    return this.lerp(
      this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u),
      this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u),
      v
    );
  }

  octaveNoise(x, y, octaves, perm) {
    let value = 0, amp = 1, freq = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
      value += this.perlin(x * freq, y * freq, perm) * amp;
      max += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return value / max;
  }

  paint(ctx, geom, props) {
    const scale = parseFloat(props.get('--paint-noise-scale')) || 0.004;
    const octaves = parseInt(props.get('--paint-noise-octaves')) || 4;
    const color = (props.get('--paint-noise-color') + '').trim() || '#6c63ff';
    const bg = (props.get('--paint-noise-background') + '').trim() || 'transparent';
    const opacity = parseFloat(props.get('--paint-noise-opacity')) || 0.15;
    const seed = parseFloat(props.get('--paint-noise-seed')) || 42;

    const { width, height } = geom;
    const rand = this.lcg(seed);
    const perm = this.buildPermTable(rand);

    if (bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const n = this.octaveNoise(x * scale, y * scale, octaves, perm);
        const normalized = (n + 1) / 2;
        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = Math.round(normalized * opacity * 255);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }
}

registerPaint('noise', NoiseWorklet);
`;

export default noiseWorkletCode;
