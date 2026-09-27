import { palette, type Theme } from "../lib/svg.js";

/** A circular progress ring showing the current streak against the longest one, in days. */
export function streakRing(current: number, longest: number, size: number, theme: Theme, id: string): string {
  const p = palette(theme);
  const cx = size / 2;
  const cy = size * 0.42;
  const r = size * 0.3;
  const strokeWidth = size * 0.05;
  const circumference = 2 * Math.PI * r;
  const ratio = longest > 0 ? Math.min(current / longest, 1) : 0;
  const dash = circumference * ratio;

  return `
    <style>
      #${id}-progress{stroke-dasharray:${circumference.toFixed(1)};stroke-dashoffset:${circumference.toFixed(1)};animation:${id}-fill 1s ease-out 0.2s forwards;}
      @keyframes ${id}-fill{to{stroke-dashoffset:${(circumference - dash).toFixed(1)};}}
      @media (prefers-reduced-motion: reduce){#${id}-progress{stroke-dashoffset:${(circumference - dash).toFixed(1)};animation:none;}}
    </style>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.line}" stroke-width="${strokeWidth}" opacity="0.4"/>
    <circle id="${id}-progress" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.cyan}" stroke-width="${strokeWidth}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
    <text x="${cx}" y="${cy - 2}" font-family="JetBrains Mono" font-size="${size * 0.2}" font-weight="600" fill="${p.goldLight}" text-anchor="middle">${current}</text>
    <text x="${cx}" y="${cy + 18}" font-family="Rajdhani" font-size="11" letter-spacing="1" fill="${p.textMuted}" text-anchor="middle">DAY STREAK</text>
    <text x="${cx}" y="${cy + r + 24}" font-family="Inter" font-size="10" fill="${p.textMuted}" text-anchor="middle">Longest: ${longest}</text>
  `;
}
