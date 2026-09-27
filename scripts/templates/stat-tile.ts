import { cornerBrackets, escapeXml, palette, type Theme } from "../lib/svg.js";

/** A single stat tile: gold caption, large mono value, optional delta line. */
export function statTile(
  x: number,
  y: number,
  w: number,
  h: number,
  theme: Theme,
  label: string,
  value: string,
  delta?: string,
): string {
  const p = palette(theme);
  const deltaColor = delta && delta.startsWith("-") ? p.textMuted : p.cyan;
  return `
    <g transform="translate(${x},${y})">
      <rect width="${w}" height="${h}" rx="4" fill="${p.bgPanel}" stroke="${p.line}" stroke-width="1"/>
      <rect width="${w}" height="2" fill="${p.gold}"/>
      ${cornerBrackets(0, 0, w, h, 8, p.gold)}
      <text x="${w / 2}" y="24" font-family="Rajdhani" font-size="11" letter-spacing="1.4" fill="${p.gold}" text-anchor="middle" style="text-transform:uppercase">${escapeXml(label)}</text>
      <text x="${w / 2}" y="${h / 2 + 14}" font-family="JetBrains Mono" font-size="26" font-weight="500" fill="${p.textPrimary}" text-anchor="middle">${escapeXml(value)}</text>
      ${delta ? `<text x="${w / 2}" y="${h - 12}" font-family="JetBrains Mono" font-size="10" fill="${deltaColor}" text-anchor="middle">${escapeXml(delta)}</text>` : ""}
    </g>
  `;
}
