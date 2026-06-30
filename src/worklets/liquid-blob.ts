const liquidBlobWorkletCode = /* js */ `
class LiquidBlobWorklet {
  static get inputProperties() {
    return [
      '--paint-blob-color',
      '--paint-blob-count',
      '--paint-blob-radius',
      '--paint-blob-seed',
      '--paint-blob-threshold',
      '--paint-blob-background',
      '--paint-blob-glow',
      '--paint-blob-pixel',
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
    const h = (hex + '').replace(/[^0-9a-fA-F]/g, '').padEnd(6, '0').slice(0, 6);
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  paint(ctx, geom, props) {
    const color = (props.get('--paint-blob-color') + '').trim() || '#7c3aed';
    const count = parseInt(props.get('--paint-blob-count')) || 6;
    const radius = parseFloat(props.get('--paint-blob-radius')) || 0.35;
    const seed = parseFloat(props.get('--paint-blob-seed')) || 42;
    const threshold = parseFloat(props.get('--paint-blob-threshold')) || 1.2;
    const bg = (props.get('--paint-blob-background') + '').trim() || 'transparent';
    const glow = parseFloat(props.get('--paint-blob-glow')) || 0.5;
    const pixelSize = Math.max(1, parseInt(props.get('--paint-blob-pixel')) || 3);

    const { width, height } = geom;
    const rand = this.lcg(seed);

    if (bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }

    const blobs = Array.from({ length: count }, () => ({
      x: 0.1 + rand() * 0.8,
      y: 0.1 + rand() * 0.8,
      r: (0.5 + rand() * 0.5) * radius,
    }));

    const [r, g, b] = this.hexToRgb(color);

    // Soft glow pass using radial gradients
    if (glow > 0) {
      for (const blob of blobs) {
        const cx = blob.x * width;
        const cy = blob.y * height;
        const glowR = blob.r * Math.min(width, height) * 1.4;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
        grad.addColorStop(0, \`rgba(\${r},\${g},\${b},\${0.25 * glow})\`);
        grad.addColorStop(1, \`rgba(\${r},\${g},\${b},0)\`);
        ctx.fillStyle = grad;
        ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);
      }
    }

    // Metaball field via pixel blocks
    ctx.fillStyle = \`rgb(\${r},\${g},\${b})\`;
    for (let py = 0; py < height; py += pixelSize) {
      for (let px = 0; px < width; px += pixelSize) {
        const nx = px / width;
        const ny = py / height;

        let field = 0;
        for (const blob of blobs) {
          const dx = nx - blob.x;
          const dy = ny - blob.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 0.0001) { field = 999; break; }
          field += (blob.r * blob.r) / d2;
        }

        if (field >= threshold) {
          const intensity = Math.min(1, (field - threshold) * 4);
          ctx.globalAlpha = intensity;
          ctx.fillRect(px, py, pixelSize, pixelSize);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}

registerPaint('liquid-blob', LiquidBlobWorklet);
`;

export default liquidBlobWorkletCode;
