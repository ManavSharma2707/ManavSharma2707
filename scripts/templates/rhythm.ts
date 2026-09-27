import { palette, type Theme } from "../lib/svg.js";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** A day x hour grid showing when commits typically happen, colored on the heatmap scale. */
export function weeklyRhythm(grid: number[][], width: number, height: number, theme: Theme, id: string): string {
  const p = palette(theme);
  const scale = p.heatmapScale;
  const labelW = 34;
  const topPad = 14;
  const cols = 24;
  const rows = 7;
  const cellW = (width - labelW - 8) / cols;
  const cellH = (height - topPad - 4) / rows;
  const max = Math.max(1, ...grid.flat());

  const cells = grid
    .map((row, ri) =>
      row
        .map((value, hi) => {
          const ratio = value / max;
          const level = ratio === 0 ? 0 : ratio > 0.75 ? 4 : ratio > 0.5 ? 3 : ratio > 0.25 ? 2 : 1;
          const x = labelW + hi * cellW;
          const y = topPad + ri * cellH;
          const delay = ((ri * cols + hi) / (rows * cols)) * 0.8;
          return `<rect class="${id}-cell" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(cellW - 1.5).toFixed(1)}" height="${(cellH - 1.5).toFixed(1)}" rx="1.5" fill="${scale[level]}" style="animation-delay:${delay.toFixed(2)}s"><title>${DAY_LABELS[ri]} ${hi}:00, ${value} commits</title></rect>`;
        })
        .join(""),
    )
    .join("");

  const dayLabels = DAY_LABELS.map(
    (label, i) =>
      `<text x="${labelW - 6}" y="${topPad + i * cellH + cellH * 0.7}" font-family="Rajdhani" font-size="9" fill="${p.textMuted}" text-anchor="end">${label}</text>`,
  ).join("");

  return `
    <style>
      .${id}-cell{opacity:0;animation:${id}-fade 0.3s ease-out forwards;}
      @keyframes ${id}-fade{to{opacity:1;}}
      @media (prefers-reduced-motion: reduce){.${id}-cell{opacity:1;animation:none;}}
    </style>
    ${dayLabels}
    ${cells}
  `;
}
