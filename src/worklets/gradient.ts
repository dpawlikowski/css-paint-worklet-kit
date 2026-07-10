import { WORKLET_SHARED } from './shared';

const DEFAULT_GRADIENT_COLORS = ['#667eea', '#764ba2'];

const gradientWorkletCode = /* js */ `
${WORKLET_SHARED}

const DEFAULT_GRADIENT_COLORS = ${JSON.stringify(DEFAULT_GRADIENT_COLORS)};

class GradientWorklet {
  static get inputProperties() {
    return [
      '--paint-gradient-colors',
      '--paint-gradient-angle',
      '--paint-gradient-type',
      '--paint-gradient-position',
    ];
  }

  lerpColor(a, b, t) {
    const [r1, g1, b1] = hexToRgb(a);
    const [r2, g2, b2] = hexToRgb(b);
    return \`rgb(\${Math.round(r1+(r2-r1)*t)},\${Math.round(g1+(g2-g1)*t)},\${Math.round(b1+(b2-b1)*t)})\`;
  }

  paint(ctx, geom, props) {
    const colors = parseColors(props.get('--paint-gradient-colors'), DEFAULT_GRADIENT_COLORS);
    const angle  = (parseFloat(props.get('--paint-gradient-angle')) || 135) * (Math.PI / 180);
    const type   = (props.get('--paint-gradient-type')     + '').trim() || 'linear';
    const pos    = (props.get('--paint-gradient-position') + '').trim() || '';

    const { width, height } = geom;

    if (type === 'radial') {
      let cx = width  / 2;
      let cy = height / 2;
      if (pos) {
        const [px, py] = pos.split(' ').map(v => parseFloat(v) / 100);
        cx = (px || 0.5) * width;
        cy = (py || 0.5) * height;
      }
      const radius = Math.sqrt(width * width + height * height) / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      return;
    }

    if (type === 'mesh') {
      // Bilinear 4-corner blend. PaintRenderingContext2D has no
      // getImageData/putImageData, so we fill small cells with fillRect
      // instead of writing pixels directly — visually identical, and the
      // cell size keeps it cheap.
      const MESH_CELL = 4;
      const c  = colors.length >= 4 ? colors : [...colors, ...colors].slice(0, 4);
      const [r0,g0,b0] = hexToRgb(c[0]);
      const [r1,g1,b1] = hexToRgb(c[1]);
      const [r2,g2,b2] = hexToRgb(c[2]);
      const [r3,g3,b3] = hexToRgb(c[3]);

      for (let y = 0; y < height; y += MESH_CELL) {
        for (let x = 0; x < width; x += MESH_CELL) {
          const tx = (x + MESH_CELL / 2) / width;
          const ty = (y + MESH_CELL / 2) / height;
          const r  = Math.round(r0*(1-tx)*(1-ty) + r1*tx*(1-ty) + r2*(1-tx)*ty + r3*tx*ty);
          const g  = Math.round(g0*(1-tx)*(1-ty) + g1*tx*(1-ty) + g2*(1-tx)*ty + g3*tx*ty);
          const b  = Math.round(b0*(1-tx)*(1-ty) + b1*tx*(1-ty) + b2*(1-tx)*ty + b3*tx*ty);
          ctx.fillStyle = \`rgb(\${r},\${g},\${b})\`;
          ctx.fillRect(x, y, MESH_CELL, MESH_CELL);
        }
      }
      return;
    }

    // linear (default)
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x0  = width  / 2 - cos * width;
    const y0  = height / 2 - sin * height;
    const x1  = width  / 2 + cos * width;
    const y1  = height / 2 + sin * height;
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
}

registerPaint('gradient', GradientWorklet);
`;

export default gradientWorkletCode;
