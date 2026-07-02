import { useState } from 'react';
import {
  usePaintWorklet,
  usePointerWorklet,
  useAnimatedWorklet,
  useLayeredWorklets,
} from 'css-paint-worklet-kit';
import styles from './Gallery.module.css';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className={styles.copyBtn} onClick={handleCopy} aria-label="Copy code">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function WorkletCard({
  title,
  description,
  code,
  children,
  isReady,
  isSupported,
  isNew,
}: {
  title: string;
  description: string;
  code: string;
  children: React.ReactNode;
  isReady: boolean;
  isSupported: boolean;
  isNew?: boolean;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.preview}>
        {children}
        {!isReady && (
          <div className={styles.loading}>
            {isSupported === false && typeof CSS !== 'undefined' && !('paintWorklet' in CSS)
              ? 'CSS Paint API not supported'
              : 'Loading worklet…'}
          </div>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>
          {title}
          {isNew && <span className={styles.newBadge}>New</span>}
        </h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.codeWrapper}>
          <pre className={styles.code}><code>{code}</code></pre>
          <CopyButton text={code} />
        </div>
      </div>
    </div>
  );
}

function NoiseCard() {
  const { style, isReady, isSupported } = usePaintWorklet('noise', {
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
      isSupported={isSupported}
    >
      <div className={styles.previewBox} style={style} />
    </WorkletCard>
  );
}

function ConfettiCard() {
  const { style, isReady, isSupported } = usePaintWorklet('confetti', {
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
      isSupported={isSupported}
    >
      <div className={styles.previewBox} style={{ ...style, background: '#0d0d1a' }} />
    </WorkletCard>
  );
}

function GradientCard() {
  const { style: linear, isReady, isSupported } = usePaintWorklet('gradient', {
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
      isSupported={isSupported}
    >
      <div className={styles.previewRow}>
        <div className={`${styles.previewBox} ${styles.half}`} style={linear} />
        <div className={`${styles.previewBox} ${styles.half}`} style={mesh} />
      </div>
    </WorkletCard>
  );
}

function GlitchCard() {
  const { style, isReady, isSupported } = usePaintWorklet('glitch', {
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
      isSupported={isSupported}
    >
      <div className={styles.previewBox} style={style} />
    </WorkletCard>
  );
}

function LiquidBlobCard() {
  const { style, isReady, isSupported } = usePaintWorklet('liquid-blob', {
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
      isSupported={isSupported}
    >
      <div className={styles.previewBox} style={style} />
    </WorkletCard>
  );
}

function SpotlightCard() {
  const { ref, style, isReady, isSupported } = usePointerWorklet('spotlight', {
    x: 0.5,
    y: 0.5,
    color: '#7c3aed',
    background: '#0a0a14',
    radius: 0.45,
    intensity: 0.85,
    softness: 0.6,
  });

  return (
    <WorkletCard
      title="spotlight"
      description="Cursor-following glow. Pointer position is written straight to the DOM style — zero React re-renders per mousemove."
      code={`const { ref, style } = usePointerWorklet('spotlight', {
  color: '#7c3aed',
  radius: 0.45,
  intensity: 0.85,
})

<div ref={ref} style={style} />`}
      isReady={isReady}
      isSupported={isSupported}
    >
      <div ref={ref as React.RefObject<HTMLDivElement>} className={styles.previewBox} style={style} />
    </WorkletCard>
  );
}

function AuroraCard() {
  const { style, isReady, isSupported } = useAnimatedWorklet('aurora', (time) => ({
    colors: ['#00c9a7', '#845ec2', '#00b4d8'],
    background: '#05050c',
    time,
    speed: 1,
    scale: 1,
    opacity: 0.55,
  }));

  return (
    <WorkletCard
      title="aurora"
      isNew
      description="Animated mesh-glow bands drifting across the background, like aurora borealis. Runs entirely off the main thread via useAnimatedWorklet."
      code={`useAnimatedWorklet('aurora', (time) => ({
  colors: ['#00c9a7', '#845ec2', '#00b4d8'],
  time,
  speed: 1,
  opacity: 0.55,
}))`}
      isReady={isReady}
      isSupported={isSupported}
    >
      <div className={styles.previewBox} style={style} />
    </WorkletCard>
  );
}

function BorderBeamCard() {
  const { style, isReady, isSupported } = useAnimatedWorklet('border-beam', (time) => ({
    color: '#7c3aed',
    trailColor: '#00b4d8',
    width: 2,
    time,
    speed: 1,
    trail: 0.3,
    radius: 16,
  }));

  return (
    <WorkletCard
      title="border-beam"
      isNew
      description="A glowing beam chases the edge of the element — paintTarget: 'border' feeds the effect straight into border-image."
      code={`useAnimatedWorklet('border-beam', (time) => ({
  color: '#7c3aed',
  trailColor: '#00b4d8',
  time,
  radius: 16,
}), { paintTarget: 'border' })`}
      isReady={isReady}
      isSupported={isSupported}
    >
      <div className={styles.previewBox} style={{ ...style, background: '#0a0a14' }} />
    </WorkletCard>
  );
}

function HybridCard() {
  const { style, isReady, isSupported } = useLayeredWorklets([
    { name: 'aurora', options: { colors: ['#ff006e', '#7c3aed', '#00b4d8'], opacity: 0.6, speed: 0.8 } },
    { name: 'noise', options: { scale: 0.008, color: '#ffffff', opacity: 0.12, pixel: 1 }, blendMode: 'overlay' },
  ]);

  return (
    <WorkletCard
      title="hybrid: aurora + noise"
      isNew
      description="useLayeredWorklets stacks any two built-in worklets on one element with background-blend-mode — mix & match your own combos."
      code={`useLayeredWorklets([
  { name: 'aurora', options: { opacity: 0.6 } },
  { name: 'noise', options: { opacity: 0.12 }, blendMode: 'overlay' },
])`}
      isReady={isReady}
      isSupported={isSupported}
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
          <span className={styles.badge}>Off-main-thread rendering</span>
          <span className={styles.badge}>React hook API</span>
          <span className={styles.badge}>TypeScript</span>
          <span className={styles.badge}>SSR safe</span>
          <span className={styles.badge}>Tree-shakeable</span>
        </div>
      </div>

      <div className={styles.grid}>
        <NoiseCard />
        <ConfettiCard />
        <GradientCard />
        <GlitchCard />
        <LiquidBlobCard />
        <SpotlightCard />
        <AuroraCard />
        <BorderBeamCard />
        <HybridCard />
      </div>
    </div>
  );
}
