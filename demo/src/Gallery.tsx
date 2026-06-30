import { usePaintWorklet } from 'css-paint-worklet-kit';
import styles from './Gallery.module.css';

function WorkletCard({
  title,
  description,
  code,
  children,
  isReady,
}: {
  title: string;
  description: string;
  code: string;
  children: React.ReactNode;
  isReady: boolean;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.preview}>
        {children}
        {!isReady && <div className={styles.loading}>Loading worklet…</div>}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <pre className={styles.code}><code>{code}</code></pre>
      </div>
    </div>
  );
}

function NoiseCard() {
  const { style, isReady } = usePaintWorklet('noise', {
    scale: 0.005,
    octaves: 4,
    color: '#6c63ff',
    background: '#1a1a2e',
    opacity: 0.4,
    seed: 42,
    pixel: 2,
  });

  return (
    <WorkletCard
      title="noise"
      description="Perlin/octave noise as background — generated entirely on GPU thread. Seeded for reproducibility."
      code={`usePaintWorklet('noise', {
  scale: 0.005,
  octaves: 4,
  color: '#6c63ff',
  opacity: 0.4,
  pixel: 2,   // pixel block size
  seed: 42,
})`}
      isReady={isReady}
    >
      <div className={styles.previewBox} style={style} />
    </WorkletCard>
  );
}

function ConfettiCard() {
  const { style, isReady } = usePaintWorklet('confetti', {
    count: 120,
    seed: 7,
    colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'],
    size: 10,
    shape: 'mixed',
  });

  return (
    <WorkletCard
      title="confetti"
      description="Seeded random confetti — circles, rects, triangles. Same seed = same pattern every render."
      code={`usePaintWorklet('confetti', {
  count: 120,
  seed: 7,
  colors: ['#ff6b6b', '#feca57', '#48dbfb'],
  shape: 'mixed',
})`}
      isReady={isReady}
    >
      <div className={styles.previewBox} style={{ ...style, background: '#0d0d1a' }} />
    </WorkletCard>
  );
}

function GradientCard() {
  const { style: linear, isReady } = usePaintWorklet('gradient', {
    colors: ['#667eea', '#764ba2', '#f64f59'],
    angle: 135,
    type: 'linear',
  });

  const { style: mesh } = usePaintWorklet('gradient', {
    colors: ['#0f0c29', '#302b63', '#24243e', '#7c3aed'],
    type: 'mesh',
  });

  return (
    <WorkletCard
      title="gradient"
      description="Multi-stop linear, radial, or mesh gradients. Animate --paint-gradient-angle via CSS @keyframes."
      code={`usePaintWorklet('gradient', {
  colors: ['#667eea', '#764ba2', '#f64f59'],
  angle: 135,
  type: 'linear', // | 'radial' | 'mesh'
})`}
      isReady={isReady}
    >
      <div className={styles.previewRow}>
        <div className={`${styles.previewBox} ${styles.half}`} style={linear} />
        <div className={`${styles.previewBox} ${styles.half}`} style={mesh} />
      </div>
    </WorkletCard>
  );
}

function GlitchCard() {
  const { style, isReady } = usePaintWorklet('glitch', {
    intensity: 0.55,
    frequency: 0.28,
    seed: 13,
    color1: '#ff006e',
    color2: '#3a86ff',
    background: '#070709',
    style: 'vhs',
    rgbOffset: 10,
    scanlines: 0.06,
  });

  return (
    <WorkletCard
      title="glitch"
      description="VHS/digital glitch with RGB channel shift, corruption blocks, and scanlines. Five styles: vhs · digital · rgb · slice · all."
      code={`usePaintWorklet('glitch', {
  intensity: 0.55,
  frequency: 0.28,
  style: 'vhs',      // vhs | digital | rgb | slice | all
  rgbOffset: 10,     // channel separation in px
  scanlines: 0.06,   // scanline opacity
  color1: '#ff006e',
  color2: '#3a86ff',
})`}
      isReady={isReady}
    >
      <div className={styles.previewBox} style={style} />
    </WorkletCard>
  );
}

function LiquidBlobCard() {
  const { style, isReady } = usePaintWorklet('liquid-blob', {
    color: '#7c3aed',
    count: 7,
    radius: 0.4,
    seed: 99,
    threshold: 1.1,
    background: '#0a0a14',
    glow: 0.6,
    pixel: 3,
  });

  return (
    <WorkletCard
      title="liquid-blob"
      description="Metaball field rendered as background with soft radial glow. threshold controls blob merging, glow adds ambient light."
      code={`usePaintWorklet('liquid-blob', {
  color: '#7c3aed',
  count: 7,
  radius: 0.4,
  threshold: 1.1,
  glow: 0.6,   // soft ambient glow 0–1
  pixel: 3,    // pixel block size
})`}
      isReady={isReady}
    >
      <div className={styles.previewBox} style={style} />
    </WorkletCard>
  );
}

export default function Gallery() {
  return (
    <div className={styles.gallery}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>CSS Houdini Paint Worklets</h1>
        <p className={styles.heroSub}>
          Canvas effects running off the main thread — in pure CSS.
          <br />
          <code>npm install css-paint-worklet-kit</code>
        </p>
        <div className={styles.badges}>
          <span className={styles.badge}>Zero JS on main thread</span>
          <span className={styles.badge}>React hook API</span>
          <span className={styles.badge}>TypeScript</span>
          <span className={styles.badge}>SSR safe</span>
        </div>
      </div>

      <div className={styles.grid}>
        <NoiseCard />
        <ConfettiCard />
        <GradientCard />
        <GlitchCard />
        <LiquidBlobCard />
      </div>
    </div>
  );
}
