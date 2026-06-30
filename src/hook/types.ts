export type WorkletName = 'noise' | 'confetti' | 'gradient' | 'glitch' | 'liquid-blob';

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

export interface WorkletOptions {
  noise: NoiseOptions;
  confetti: ConfettiOptions;
  gradient: GradientOptions;
  glitch: GlitchOptions;
  'liquid-blob': LiquidBlobOptions;
}

export interface PaintWorkletConfig {
  workletUrl?: string;
  paintTarget?: 'background' | 'border' | 'mask';
}

export interface UsePaintWorkletResult {
  style: React.CSSProperties;
  isReady: boolean;
}
