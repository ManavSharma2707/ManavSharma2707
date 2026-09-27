import { palette, type Theme } from "../lib/svg.js";

export interface ChartPoint {
  label: string;
  value: number;
}

function buildPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  const segments = rest.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  return `M${first!.x.toFixed(1)},${first!.y.toFixed(1)} ${segments.join(" ")}`;
}

/**
 * A smooth area chart with a cyan stroke that draws in left-to-right and a
 * teal fill that fades in behind it, matching the reference activity panels.
 */
export function areaChart(
  points: ChartPoint[],
  width: number,
  height: number,
  theme: Theme,
  id: string,
  padding = { top: 12, right: 12, bottom: 22, left: 12 },
): string {
  const p = palette(theme);
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const max = Math.max(1, ...points.map((pt) => pt.value));
  const step = points.length > 1 ? plotW / (points.length - 1) : 0;

  const coords = points.map((pt, i) => ({
    x: padding.left + i * step,
    y: padding.top + plotH - (pt.value / max) * plotH,
  }));

  const linePath = buildPath(coords);
  const areaPath = `${linePath} L${coords.at(-1)?.x.toFixed(1)},${padding.top + plotH} L${coords[0]?.x.toFixed(1)},${padding.top + plotH} Z`;

  const gridLines = [0.25, 0.5, 0.75].map((frac) => {
    const y = padding.top + plotH * frac;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${p.line}" stroke-width="1" opacity="0.4"/>`;
  });

  const lineLength = coords.reduce((sum, pt, i) => (i === 0 ? 0 : sum + Math.hypot(pt.x - coords[i - 1]!.x, pt.y - coords[i - 1]!.y)), 0);

  const labelEvery = Math.max(1, Math.floor(points.length / 6));
  const labels = points
    .map((pt, i) => (i % labelEvery === 0 ? { x: coords[i]!.x, text: pt.label } : null))
    .filter((v): v is { x: number; text: string } => v !== null)
    .map((l) => `<text x="${l.x}" y="${height - 6}" font-family="JetBrains Mono" font-size="9" fill="${p.textMuted}" text-anchor="middle">${l.text}</text>`);

  return `
    <style>
      #${id}-line{stroke-dasharray:${lineLength};stroke-dashoffset:${lineLength};animation:${id}-draw 1.2s ease-out forwards;}
      #${id}-area{opacity:0;animation:${id}-fade 0.8s ease-out 0.6s forwards;}
      @keyframes ${id}-draw{to{stroke-dashoffset:0;}}
      @keyframes ${id}-fade{to{opacity:1;}}
      @media (prefers-reduced-motion: reduce){
        #${id}-line{stroke-dashoffset:0;animation:none;}
        #${id}-area{opacity:1;animation:none;}
      }
    </style>
    ${gridLines.join("")}
    <path id="${id}-area" d="${areaPath}" fill="${p.teal}" opacity="0.28"/>
    <path id="${id}-line" d="${linePath}" fill="none" stroke="${p.cyan}" stroke-width="2"/>
    ${labels.join("")}
  `;
}
