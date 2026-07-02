import { WORKLET_SHARED } from './shared';

const DEFAULT_AURORA_COLORS = ['#00c9a7', '#845ec2', '#00b4d8'];

const auroraWorkletCode = /* js */ `
${WORKLET_SHARED}

const DEFAULT_AURORA_COLORS = ${JSON.stringify(DEFAULT_AURORA_COLORS)};

class AuroraWorklet {
  static get inputProperties() {
    return [
      '--paint-aurora-colors',
      '--paint-aurora-background',
      '--paint-aurora-time',
      '--paint-aurora-speed',
      '--paint-aurora-scale',
      '--paint-aurora-opacity',
      '--paint-aurora-blur',
    ];
  }

  paint(ctx, geom, props) {
    const colors    = parseColors(props.get('--paint-aurora-colors'), DEFAULT_AURORA_COLORS);
    const bg        = (props.get('--paint-aurora-background') + '').trim() || '#05050c';
    const time      = parseFloat(props.get('--paint-aurora-time'))    || 0;
    const speed     = parseFloat(props.get('--paint-aurora-speed'))   || 1;
    const scale     = parseFloat(props.get('--paint-aurora-scale'))   || 1;
    const opacity   = Math.min(1, Math.max(0, parseFloat(props.get('--paint-aurora-opacity')) || 0.55));
    const blurCells = Math.max(1, parseFloat(props.get('--paint-aurora-blur')) || 24);

    const { width, height } = geom;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const t = time * speed * 0.001;
    const bandCount = colors.length;
    const cellW = Math.max(1, width / blurCells);

    ctx.globalCompositeOperation = 'lighter';

    colors.forEach((color, i) => {
      const [r, g, b] = hexToRgb(color);
      const phase = (i / bandCount) * Math.PI * 2;
      const baseY = height * (0.25 + 0.5 * (i / Math.max(1, bandCount - 1)));

      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += cellW) {
        const nx = (x / width) * 4 * scale;
        const wave =
          Math.sin(nx + t * 1.3 + phase) * 0.5 +
          Math.sin(nx * 0.6 - t * 0.8 + phase * 1.7) * 0.3;
        const y = baseY + wave * height * 0.18;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, \`rgba(\${r},\${g},\${b},\${opacity})\`);
      grad.addColorStop(1, \`rgba(\${r},\${g},\${b},0)\`);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';
  }
}

registerPaint('aurora', AuroraWorklet);
`;

export default auroraWorkletCode;
