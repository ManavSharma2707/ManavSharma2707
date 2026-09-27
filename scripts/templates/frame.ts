import { bevelledRectPath, cornerBrackets, palette, type Theme } from "../lib/svg.js";

const CUT = 18;
const PLATE = 14;

/**
 * The outer bevelled HUD frame used on the header banner: a filled crimson
 * plate band (not just a stroke) with angled corners, a gold hairline on
 * each edge of the band, and small gold tabs centered top and bottom.
 */
export function outerFrame(width: number, height: number, theme: Theme): string {
  const p = palette(theme);
  const gradId = `frame-grad-${theme}`;
  const outer = bevelledRectPath(0, 0, width, height, CUT);
  const bandInner = bevelledRectPath(PLATE, PLATE, width - PLATE * 2, height - PLATE * 2, CUT - PLATE * 0.5);
  const glassInner = bevelledRectPath(PLATE + 5, PLATE + 5, width - (PLATE + 5) * 2, height - (PLATE + 5) * 2, CUT - PLATE * 0.9);
  const tabWidth = 96;
  const tabX = width / 2 - tabWidth / 2;

  return `
    <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.frameA}"/>
      <stop offset="1" stop-color="${p.frameB}"/>
    </linearGradient>
    <path d="${outer} ${bandInner}" fill="url(#${gradId})" fill-rule="evenodd"/>
    <path d="${outer}" fill="none" stroke="${p.goldLight}" stroke-width="1" opacity="0.5"/>
    <path d="${bandInner}" fill="none" stroke="${p.gold}" stroke-width="1" opacity="0.7"/>
    <path d="${glassInner}" fill="none" stroke="${p.gold}" stroke-width="1.25" opacity="0.9"/>
    <rect x="${tabX}" y="0" width="${tabWidth}" height="4" fill="${p.goldLight}"/>
    <rect x="${tabX}" y="${height - 4}" width="${tabWidth}" height="4" fill="${p.goldLight}"/>
    ${cornerBrackets(PLATE + 5, PLATE + 5, width - (PLATE + 5) * 2, height - (PLATE + 5) * 2, 20, p.gold)}
  `;
}

/** A stat/chart panel: dark fill, single gold top rule, corner brackets, label left / value right. */
export function panelChrome(x: number, y: number, w: number, h: number, theme: Theme, label: string): string {
  const p = palette(theme);
  return `
    <g transform="translate(${x},${y})">
      <rect width="${w}" height="${h}" rx="4" fill="${p.bgPanel}" stroke="${p.line}" stroke-width="1"/>
      <rect width="${w}" height="2" fill="${p.gold}"/>
      ${cornerBrackets(0, 0, w, h, 10, p.gold)}
      <text x="14" y="24" font-family="Rajdhani" font-size="12" letter-spacing="1.5" fill="${p.gold}" style="text-transform:uppercase">${label}</text>
    </g>
  `;
}
