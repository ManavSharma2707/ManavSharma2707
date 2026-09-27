import { palette, type Theme } from "../lib/svg.js";

export interface LanguageSlice {
  name: string;
  percent: number;
  color: string;
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = (Math.PI / 180) * (startDeg - 90);
  const end = (Math.PI / 180) * (endDeg - 90);
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2}`;
}

/** A ring-style donut of top languages, with a small legend beside it. */
export function languageDonut(languages: LanguageSlice[], width: number, height: number, theme: Theme, id: string): string {
  const p = palette(theme);
  const cx = height / 2 + 4;
  const cy = height / 2;
  const r = height / 2 - 14;
  const strokeWidth = 14;

  let cursor = 0;
  const arcs = languages
    .map((lang, i) => {
      const sweep = (lang.percent / 100) * 360;
      const path = arcPath(cx, cy, r, cursor, cursor + Math.max(sweep - 1.5, 0.5));
      const length = (sweep / 360) * 2 * Math.PI * r;
      cursor += sweep;
      const delay = i * 0.08;
      return `<path class="${id}-arc" d="${path}" fill="none" stroke="${lang.color}" stroke-width="${strokeWidth}" stroke-linecap="round" style="stroke-dasharray:${length.toFixed(1)};animation-delay:${delay}s"/>`;
    })
    .join("");

  const legendX = height + 16;
  const legend = languages
    .slice(0, 6)
    .map((lang, i) => {
      const y = 18 + i * 20;
      return `
        <circle cx="${legendX}" cy="${y - 4}" r="4" fill="${lang.color}"/>
        <text x="${legendX + 12}" y="${y}" font-family="Inter" font-size="12" fill="${p.textPrimary}">${lang.name}</text>
        <text x="${width - 8}" y="${y}" font-family="JetBrains Mono" font-size="12" fill="${p.textMuted}" text-anchor="end">${lang.percent.toFixed(1)}%</text>
      `;
    })
    .join("");

  return `
    <style>
      .${id}-arc{opacity:0;animation:${id}-in 0.9s ease-out forwards;}
      @keyframes ${id}-in{from{opacity:0;stroke-dashoffset:100%;}to{opacity:1;stroke-dashoffset:0;}}
      @media (prefers-reduced-motion: reduce){.${id}-arc{opacity:1;animation:none;}}
    </style>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.line}" stroke-width="${strokeWidth}" opacity="0.35"/>
    ${arcs}
    ${legend}
  `;
}
