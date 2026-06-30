export const WORKLET_SHARED = `
const LCG_M = 2147483647;
const LCG_A = 16807;

function lcg(seed) {
  let s = seed % LCG_M;
  if (s <= 0) s += LCG_M - 1;
  return () => {
    s = (s * LCG_A) % LCG_M;
    return (s - 1) / (LCG_M - 1);
  };
}

function hexToRgb(hex) {
  const h = (hex + '').replace(/[^0-9a-fA-F]/g, '').padEnd(6, '0').slice(0, 6);
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function parseColors(raw, fallback) {
  const str = (raw + '').trim();
  if (!str || str === 'undefined') return fallback;
  return str.split(',').map(c => c.trim()).filter(Boolean);
}
`;
