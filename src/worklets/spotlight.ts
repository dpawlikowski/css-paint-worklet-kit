import { WORKLET_SHARED } from './shared';

const spotlightWorkletCode = /* js */ `
${WORKLET_SHARED}

class SpotlightWorklet {
  static get inputProperties() {
    return [
      '--paint-spotlight-x',
      '--paint-spotlight-y',
      '--paint-spotlight-color',
      '--paint-spotlight-background',
      '--paint-spotlight-radius',
      '--paint-spotlight-intensity',
      '--paint-spotlight-softness',
    ];
  }

  paint(ctx, geom, props) {
    const x         = parseFloat(props.get('--paint-spotlight-x'))         || 0.5;
    const y         = parseFloat(props.get('--paint-spotlight-y'))         || 0.5;
    const color     = (props.get('--paint-spotlight-color')      + '').trim() || '#7c3aed';
    const bg        = (props.get('--paint-spotlight-background') + '').trim() || 'transparent';
    const radius    = parseFloat(props.get('--paint-spotlight-radius'))    || 0.35;
    const intensity = Math.min(1, Math.max(0, parseFloat(props.get('--paint-spotlight-intensity')) || 0.8));
    const softness  = Math.min(1, Math.max(0, parseFloat(props.get('--paint-spotlight-softness'))  || 0.6));

    const { width, height } = geom;

    if (bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }

    const [r, g, b] = hexToRgb(color);
    const cx = x * width;
    const cy = y * height;
    const outerRadius = radius * Math.max(width, height);

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
    grad.addColorStop(0, \`rgba(\${r},\${g},\${b},\${intensity})\`);
    grad.addColorStop(Math.min(0.99, softness), \`rgba(\${r},\${g},\${b},\${intensity * 0.3})\`);
    grad.addColorStop(1, \`rgba(\${r},\${g},\${b},0)\`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
}

registerPaint('spotlight', SpotlightWorklet);
`;

export default spotlightWorkletCode;
