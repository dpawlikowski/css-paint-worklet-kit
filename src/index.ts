export { usePaintWorklet } from './hook/usePaintWorklet';
export { useAnimatedWorklet } from './hook/useAnimatedWorklet';
export { registerWorklet, isWorkletRegistered } from './hook/registry';
export type {
  WorkletName,
  WorkletOptions,
  NoiseOptions,
  ConfettiOptions,
  GradientOptions,
  GlitchOptions,
  LiquidBlobOptions,
  PaintWorkletConfig,
  UsePaintWorkletResult,
} from './hook/types';
export type { AnimatedWorkletConfig } from './hook/useAnimatedWorklet';
