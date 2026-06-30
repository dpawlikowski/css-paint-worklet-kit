import { WORKLET_SHARED } from './shared';

const DEFAULT_CONFETTI_COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];

const confettiWorkletCode = /* js */ `
${WORKLET_SHARED}

const DEFAULT_CONFETTI_COLORS = ${JSON.stringify(DEFAULT_CONFETTI_COLORS)};

class ConfettiWorklet {
  static get inputProperties() {
    return [
      '--paint-confetti-count',
      '--paint-confetti-seed',
      '--paint-confetti-colors',
      '--paint-confetti-size',
      '--paint-confetti-shape',
    ];
  }

  drawCircle(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRect(ctx, x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillRect(-size / 2, -size / 4, size, size / 2);
    ctx.restore();
  }

  drawTriangle(ctx, x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  paint(ctx, geom, props) {
    const count  = parseInt(props.get('--paint-confetti-count'))  || 80;
    const seed   = parseFloat(props.get('--paint-confetti-seed')) || 42;
    const colors = parseColors(props.get('--paint-confetti-colors'), DEFAULT_CONFETTI_COLORS);
    const size   = parseFloat(props.get('--paint-confetti-size')) || 8;
    const shape  = (props.get('--paint-confetti-shape') + '').trim() || 'mixed';

    const { width, height } = geom;
    const rand = lcg(seed);

    const SHAPES = ['circle', 'rect', 'triangle'];

    for (let i = 0; i < count; i++) {
      const x     = rand() * width;
      const y     = rand() * height;
      const color = colors[Math.floor(rand() * colors.length)];
      const s     = size * (0.5 + rand() * 0.8);
      const angle = rand() * Math.PI * 2;
      const alpha = 0.6 + rand() * 0.4;

      ctx.globalAlpha = alpha;
      ctx.fillStyle   = color;

      const shapeType = shape === 'mixed' ? SHAPES[Math.floor(rand() * 3)] : shape;

      if (shapeType === 'circle')        this.drawCircle(ctx, x, y, s);
      else if (shapeType === 'triangle') this.drawTriangle(ctx, x, y, s, angle);
      else                               this.drawRect(ctx, x, y, s, angle);
    }

    ctx.globalAlpha = 1;
  }
}

registerPaint('confetti', ConfettiWorklet);
`;

export default confettiWorkletCode;
