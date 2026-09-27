import { tokens, palette, type Theme } from "../lib/svg.js";

export interface CalendarDay {
  date: string;
  count: number;
  level: number;
}

/**
 * The 53x7 contribution heatmap. Cells fade in column by column (one week
 * at a time) so the whole grid draws left to right on first paint.
 */
export function heatmap(days: CalendarDay[], width: number, height: number, theme: Theme, id: string): string {
  const p = palette(theme);
  const scale = p.heatmapScale;
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const cell = Math.min((width - 24) / weeks.length - 2, (height - 24) / 7 - 2);
  const gap = 2;
  const cellStep = cell + gap;
  const gridW = weeks.length * cellStep;
  const offsetX = (width - gridW) / 2;
  const offsetY = 20;

  const cells = weeks
    .map((week, wi) =>
      week
        .map((day, di) => {
          const x = offsetX + wi * cellStep;
          const y = offsetY + di * cellStep;
          const color = scale[day.level] ?? scale[0];
          const delay = (wi / weeks.length) * (tokens.motion.heatmapFadeSeconds as number);
          return `<rect class="${id}-cell" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" rx="2" fill="${color}" style="animation-delay:${delay.toFixed(2)}s"><title>${day.date}: ${day.count} contributions</title></rect>`;
        })
        .join(""),
    )
    .join("");

  return `
    <style>
      .${id}-cell{opacity:0;animation:${id}-fade 0.4s ease-out forwards;}
      @keyframes ${id}-fade{to{opacity:1;}}
      @media (prefers-reduced-motion: reduce){.${id}-cell{opacity:1;animation:none;}}
    </style>
    <text x="${offsetX}" y="12" font-family="Rajdhani" font-size="11" letter-spacing="1" fill="${p.textMuted}">LESS</text>
    ${scale
      .map(
        (c, i) =>
          `<rect x="${offsetX + 40 + i * 14}" y="3" width="10" height="10" rx="2" fill="${c}"/>`,
      )
      .join("")}
    <text x="${offsetX + 40 + scale.length * 14 + 6}" y="12" font-family="Rajdhani" font-size="11" letter-spacing="1" fill="${p.textMuted}">MORE</text>
    ${cells}
  `;
}
