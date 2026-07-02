import { WORKLET_SHARED } from './shared';

const borderBeamWorkletCode = /* js */ `
${WORKLET_SHARED}

class BorderBeamWorklet {
  static get inputProperties() {
    return [
      '--paint-border-beam-color',
      '--paint-border-beam-trail-color',
      '--paint-border-beam-width',
      '--paint-border-beam-time',
      '--paint-border-beam-speed',
      '--paint-border-beam-trail',
      '--paint-border-beam-radius',
    ];
  }

  paint(ctx, geom, props) {
    const color      = (props.get('--paint-border-beam-color')       + '').trim() || '#7c3aed';
    const trailColor = (props.get('--paint-border-beam-trail-color') + '').trim() || 'transparent';
    const strokeW    = parseFloat(props.get('--paint-border-beam-width'))  || 2;
    const time       = parseFloat(props.get('--paint-border-beam-time'))   || 0;
    const speed      = parseFloat(props.get('--paint-border-beam-speed'))  || 1;
    const trail      = Math.min(0.98, Math.max(0.02, parseFloat(props.get('--paint-border-beam-trail')) || 0.25));
    const radius     = parseFloat(props.get('--paint-border-beam-radius')) || 0;

    const { width, height } = geom;
    const inset = strokeW / 2;
    const w = Math.max(0, width - strokeW);
    const h = Math.max(0, height - strokeW);
    const r = Math.min(radius, w / 2, h / 2);

    const path = new Path2D();
    path.moveTo(inset + r, inset);
    path.arcTo(inset + w, inset, inset + w, inset + h, r);
    path.arcTo(inset + w, inset + h, inset, inset + h, r);
    path.arcTo(inset, inset + h, inset, inset, r);
    path.arcTo(inset, inset, inset + w, inset, r);
    path.closePath();

    const [r0, g0, b0] = hexToRgb(color);
    const trailRgb = trailColor === 'transparent' ? null : hexToRgb(trailColor);

    const angle = ((time * speed * 0.0006) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const cx = width / 2;
    const cy = height / 2;

    let grad;
    if (typeof ctx.createConicGradient === 'function') {
      grad = ctx.createConicGradient(angle, cx, cy);
      const headColor = \`rgba(\${r0},\${g0},\${b0},1)\`;
      const tailColor = trailRgb
        ? \`rgba(\${trailRgb[0]},\${trailRgb[1]},\${trailRgb[2]},0)\`
        : \`rgba(\${r0},\${g0},\${b0},0)\`;
      grad.addColorStop(0, headColor);
      grad.addColorStop(Math.max(0.001, trail), tailColor);
      grad.addColorStop(Math.min(0.999, trail + 0.001), 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
    }

    ctx.save();
    ctx.clip(path);
    ctx.lineWidth = strokeW * 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = grad || \`rgba(\${r0},\${g0},\${b0},0.9)\`;
    ctx.stroke(path);
    ctx.restore();
  }
}

registerPaint('border-beam', BorderBeamWorklet);
`;

export default borderBeamWorkletCode;
