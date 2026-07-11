export type WorkletName =
  | 'noise'
  | 'confetti'
  | 'gradient'
  | 'glitch'
  | 'liquid-blob'
  | 'spotlight'
  | 'aurora'
  | 'border-beam';

export interface NoiseOptions {
  scale?: number;
  octaves?: number;
  color?: string;
  background?: string;
  opacity?: number;
  seed?: number;
  pixel?: number;
}

export interface ConfettiOptions {
  count?: number;
  seed?: number;
  colors?: string[];
  size?: number;
  shape?: 'circle' | 'rect' | 'triangle' | 'mixed';
}

export interface GradientOptions {
  colors?: string[];
  angle?: number;
  type?: 'linear' | 'radial' | 'mesh';
  position?: string;
}

export interface GlitchOptions {
  intensity?: number;
  frequency?: number;
  seed?: number;
  color1?: string;
  color2?: string;
  background?: string;
  rgbOffset?: number;
  style?: 'vhs' | 'digital' | 'rgb' | 'slice' | 'all';
  scanlines?: number;
}

export interface LiquidBlobOptions {
  color?: string;
  count?: number;
  radius?: number;
  seed?: number;
  threshold?: number;
  background?: string;
  glow?: number;
  pixel?: number;
}

export interface SpotlightOptions {
  x?: number;
  y?: number;
  color?: string;
  background?: string;
  radius?: number;
  intensity?: number;
  softness?: number;
}

export interface AuroraOptions {
  colors?: string[];
  background?: string;
  speed?: number;
  scale?: number;
  opacity?: number;
  blur?: number;
  /** Animation time, typically driven by `useAnimatedWorklet`. Read by the worklet as `--paint-aurora-time`. */
  time?: number;
}

export interface BorderBeamOptions {
  color?: string;
  trailColor?: string;
  width?: number;
  speed?: number;
  trail?: number;
  radius?: number;
  /** Animation time, typically driven by `useAnimatedWorklet`. Read by the worklet as `--paint-border-beam-time`. */
  time?: number;
}

export interface WorkletOptions {
  noise: NoiseOptions;
  confetti: ConfettiOptions;
  gradient: GradientOptions;
  glitch: GlitchOptions;
  'liquid-blob': LiquidBlobOptions;
  spotlight: SpotlightOptions;
  aurora: AuroraOptions;
  'border-beam': BorderBeamOptions;
}

export interface PaintWorkletConfig {
  workletUrl?: string;
  paintTarget?: 'background' | 'border' | 'mask';
  /** Skip registration until true. Useful for lazy-loading a worklet only when it enters the viewport. Default: true. */
  enabled?: boolean;
  /** Called if worklet registration throws (e.g. blocked polyfill fetch). */
  onError?: (error: unknown) => void;
}

export interface UsePaintWorkletResult {
  style: React.CSSProperties;
  isReady: boolean;
  isSupported: boolean;
}
