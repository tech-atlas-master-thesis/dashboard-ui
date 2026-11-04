const DARK_INK = '#1F1A08';
const LIGHT_INK = '#FFFFFF';

export function isLightColor(hex: string): boolean {
  const value = hex.replace('#', '');
  if (value.length !== 6) return false;

  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b) > 0.45;
}

export function inkOn(hex: string): string {
  return isLightColor(hex) ? DARK_INK : LIGHT_INK;
}
