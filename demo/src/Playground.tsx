import { useState } from 'react';
import { usePaintWorklet } from 'css-paint-worklet-kit';
import type { WorkletName } from 'css-paint-worklet-kit';
import styles from './Playground.module.css';

// ─── Controls ──────────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className={styles.control}>
      <span className={styles.label}>
        {label} <code>{value}</code>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={styles.slider}
      />
    </label>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className={styles.control}>
      <span className={styles.label}>{label}</span>
      <div className={styles.colorRow}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <code className={styles.colorHex}>{value}</code>
      </div>
    </label>
  );
}

// ─── Per-worklet panels ─────────────────────────────────────────────────────

function NoisePanel() {
  const [opts, setOpts] = useState({
    scale: 0.005,
    octaves: 4,
    color: '#6c63ff',
    background: '#1a1a2e',
    opacity: 0.4,
    seed: 42,
  });

  const { style, isReady } = usePaintWorklet('noise', opts);
  const set = <K extends keyof typeof opts>(k: K, v: (typeof opts)[K]) =>
    setOpts((p) => ({ ...p, [k]: v }));

  return (
    <div className={styles.panel}>
      <div className={styles.preview} style={style}>
        {!isReady && <span className={styles.loadingHint}>Registering worklet…</span>}
      </div>
      <div className={styles.controls}>
        <Slider label="scale" value={opts.scale} min={0.001} max={0.02} step={0.001} onChange={(v) => set('scale', v)} />
        <Slider label="octaves" value={opts.octaves} min={1} max={8} step={1} onChange={(v) => set('octaves', v)} />
        <Slider label="opacity" value={opts.opacity} min={0} max={1} step={0.01} onChange={(v) => set('opacity', v)} />
        <Slider label="seed" value={opts.seed} min={1} max={200} step={1} onChange={(v) => set('seed', v)} />
        <ColorPicker label="color" value={opts.color} onChange={(v) => set('color', v)} />
        <ColorPicker label="background" value={opts.background} onChange={(v) => set('background', v)} />
      </div>
    </div>
  );
}

function ConfettiPanel() {
  const [opts, setOpts] = useState({
    count: 100,
    seed: 42,
    size: 10,
    shape: 'mixed' as const,
  });
  const [colors, setColors] = useState(['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff']);

  const { style, isReady } = usePaintWorklet('confetti', { ...opts, colors });
  const set = <K extends keyof typeof opts>(k: K, v: (typeof opts)[K]) =>
    setOpts((p) => ({ ...p, [k]: v }));

  return (
    <div className={styles.panel}>
      <div className={styles.preview} style={{ ...style, background: '#0d0d1a' }}>
        {!isReady && <span className={styles.loadingHint}>Registering worklet…</span>}
      </div>
      <div className={styles.controls}>
        <Slider label="count" value={opts.count} min={10} max={300} step={10} onChange={(v) => set('count', v)} />
        <Slider label="size" value={opts.size} min={2} max={30} step={1} onChange={(v) => set('size', v)} />
        <Slider label="seed" value={opts.seed} min={1} max={200} step={1} onChange={(v) => set('seed', v)} />
        <label className={styles.control}>
          <span className={styles.label}>shape</span>
          <select
            value={opts.shape}
            onChange={(e) => set('shape', e.target.value as typeof opts.shape)}
          >
            <option value="mixed">mixed</option>
            <option value="circle">circle</option>
            <option value="rect">rect</option>
            <option value="triangle">triangle</option>
          </select>
        </label>
        <div className={styles.colorGroup}>
          <span className={styles.label}>colors</span>
          <div className={styles.colorPickers}>
            {colors.map((c, i) => (
              <input
                key={i}
                type="color"
                value={c}
                onChange={(e) => {
                  const next = [...colors];
                  next[i] = e.target.value;
                  setColors(next);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GradientPanel() {
  const [opts, setOpts] = useState({
    colors: ['#667eea', '#764ba2', '#f64f59'],
    angle: 135,
    type: 'linear' as 'linear' | 'radial' | 'mesh',
  });
  const { style, isReady } = usePaintWorklet('gradient', opts);

  return (
    <div className={styles.panel}>
      <div className={styles.preview} style={style}>
        {!isReady && <span className={styles.loadingHint}>Registering worklet…</span>}
      </div>
      <div className={styles.controls}>
        <label className={styles.control}>
          <span className={styles.label}>type</span>
          <select
            value={opts.type}
            onChange={(e) => setOpts((p) => ({ ...p, type: e.target.value as typeof opts.type }))}
          >
            <option value="linear">linear</option>
            <option value="radial">radial</option>
            <option value="mesh">mesh</option>
          </select>
        </label>
        {opts.type === 'linear' && (
          <Slider
            label="angle"
            value={opts.angle}
            min={0}
            max={360}
            step={1}
            onChange={(v) => setOpts((p) => ({ ...p, angle: v }))}
          />
        )}
        <div className={styles.colorGroup}>
          <span className={styles.label}>colors ({opts.colors.length})</span>
          <div className={styles.colorPickers}>
            {opts.colors.map((c, i) => (
              <input
                key={i}
                type="color"
                value={c}
                onChange={(e) => {
                  const next = [...opts.colors];
                  next[i] = e.target.value;
                  setOpts((p) => ({ ...p, colors: next }));
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GlitchPanel() {
  const [opts, setOpts] = useState({
    intensity: 0.4,
    frequency: 0.2,
    seed: 13,
    color1: '#ff006e',
    color2: '#3a86ff',
    background: '#070709',
  });
  const { style, isReady } = usePaintWorklet('glitch', opts);
  const set = <K extends keyof typeof opts>(k: K, v: (typeof opts)[K]) =>
    setOpts((p) => ({ ...p, [k]: v }));

  return (
    <div className={styles.panel}>
      <div className={styles.preview} style={style}>
        {!isReady && <span className={styles.loadingHint}>Registering worklet…</span>}
      </div>
      <div className={styles.controls}>
        <Slider label="intensity" value={opts.intensity} min={0} max={1} step={0.01} onChange={(v) => set('intensity', v)} />
        <Slider label="frequency" value={opts.frequency} min={0} max={1} step={0.01} onChange={(v) => set('frequency', v)} />
        <Slider label="seed" value={opts.seed} min={1} max={200} step={1} onChange={(v) => set('seed', v)} />
        <ColorPicker label="color1" value={opts.color1} onChange={(v) => set('color1', v)} />
        <ColorPicker label="color2" value={opts.color2} onChange={(v) => set('color2', v)} />
        <ColorPicker label="background" value={opts.background} onChange={(v) => set('background', v)} />
      </div>
    </div>
  );
}

function LiquidBlobPanel() {
  const [opts, setOpts] = useState({
    color: '#7c3aed',
    count: 7,
    radius: 0.4,
    seed: 99,
    threshold: 1.1,
    background: '#0a0a14',
  });
  const { style, isReady } = usePaintWorklet('liquid-blob', opts);
  const set = <K extends keyof typeof opts>(k: K, v: (typeof opts)[K]) =>
    setOpts((p) => ({ ...p, [k]: v }));

  return (
    <div className={styles.panel}>
      <div className={styles.preview} style={style}>
        {!isReady && <span className={styles.loadingHint}>Registering worklet…</span>}
      </div>
      <div className={styles.controls}>
        <Slider label="count" value={opts.count} min={2} max={15} step={1} onChange={(v) => set('count', v)} />
        <Slider label="radius" value={opts.radius} min={0.1} max={0.8} step={0.01} onChange={(v) => set('radius', v)} />
        <Slider label="threshold" value={opts.threshold} min={0.5} max={2.5} step={0.05} onChange={(v) => set('threshold', v)} />
        <Slider label="seed" value={opts.seed} min={1} max={200} step={1} onChange={(v) => set('seed', v)} />
        <ColorPicker label="color" value={opts.color} onChange={(v) => set('color', v)} />
        <ColorPicker label="background" value={opts.background} onChange={(v) => set('background', v)} />
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

const WORKLETS: { name: WorkletName; label: string }[] = [
  { name: 'noise', label: 'noise' },
  { name: 'confetti', label: 'confetti' },
  { name: 'gradient', label: 'gradient' },
  { name: 'glitch', label: 'glitch' },
  { name: 'liquid-blob', label: 'liquid-blob' },
];

const PANELS: Record<WorkletName, React.ComponentType> = {
  noise: NoisePanel,
  confetti: ConfettiPanel,
  gradient: GradientPanel,
  glitch: GlitchPanel,
  'liquid-blob': LiquidBlobPanel,
};

export default function Playground() {
  const [active, setActive] = useState<WorkletName>('noise');
  const Panel = PANELS[active];

  return (
    <div className={styles.playground}>
      <div className={styles.sidebar}>
        <p className={styles.sidebarTitle}>Worklet</p>
        {WORKLETS.map(({ name, label }) => (
          <button
            key={name}
            className={`${styles.sidebarBtn} ${active === name ? styles.sidebarActive : ''}`}
            onClick={() => setActive(name)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.content}>
        <Panel />
      </div>
    </div>
  );
}
