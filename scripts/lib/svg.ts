import tokensJson from "../../design/tokens.json" with { type: "json" };

export const tokens = tokensJson;

export type Theme = "dark" | "light";

export function palette(theme: Theme) {
  if (theme === "light") {
    return {
      bgBase: tokens.light.bg.base,
      bgPanel: tokens.light.bg.panel,
      bgPanelAlt: tokens.light.bg.panelAlt,
      frameA: tokens.light.frame.silver,
      frameB: tokens.light.frame.silverDeep,
      gold: tokens.color.accent.gold,
      goldLight: tokens.color.accent.goldLight,
      cyan: tokens.light.data.cyan,
      teal: tokens.light.data.teal,
      textPrimary: tokens.light.text.primary,
      textMuted: tokens.light.text.muted,
      line: "#D8D6D0",
      heatmapScale: tokens.light.heatmapScale,
    };
  }
  return {
    bgBase: tokens.color.bg.base,
    bgPanel: tokens.color.bg.panel,
    bgPanelAlt: tokens.color.bg.panelAlt,
    frameA: tokens.color.frame.crimson,
    frameB: tokens.color.frame.crimsonDeep,
    gold: tokens.color.accent.gold,
    goldLight: tokens.color.accent.goldLight,
    cyan: tokens.color.data.cyan,
    teal: tokens.color.data.teal,
    textPrimary: tokens.color.text.primary,
    textMuted: tokens.color.text.muted,
    line: tokens.color.line.subtle,
    heatmapScale: tokens.heatmapScale,
  };
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

/** Greedily wraps words to a max character width per line, up to maxLines, ellipsizing any overflow. */
export function wrapText(value: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine) {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1]!;
    const consumed = lines.slice(0, -1).join(" ").length + (lines.length > 1 ? 1 : 0);
    const remainingSource = value.slice(consumed).trim();
    if (remainingSource.length > last.length) {
      lines[maxLines - 1] = truncate(last, maxCharsPerLine);
    }
  }

  return lines;
}

/** An angled-corner rect path, the recurring bevelled-plate motif. */
export function bevelledRectPath(x: number, y: number, w: number, h: number, cut: number): string {
  return [
    `M${x + cut},${y}`,
    `L${x + w - cut},${y}`,
    `L${x + w},${y + cut}`,
    `L${x + w},${y + h - cut}`,
    `L${x + w - cut},${y + h}`,
    `L${x + cut},${y + h}`,
    `L${x},${y + h - cut}`,
    `L${x},${y + cut}`,
    "Z",
  ].join(" ");
}

/** Small L-shaped brackets in each corner of a rect, a signature panel accent. */
export function cornerBrackets(x: number, y: number, w: number, h: number, size: number, color: string): string {
  const s = size;
  const corners = [
    [x, y, s, 0, 0, s],
    [x + w, y, -s, 0, 0, s],
    [x, y + h, s, 0, 0, -s],
    [x + w, y + h, -s, 0, 0, -s],
  ];
  return corners
    .map(
      ([cx, cy, dx1, dy1, dx2, dy2]) =>
        `<path d="M${cx! + dx1!},${cy! + dy1!} L${cx},${cy} L${cx! + dx2!},${cy! + dy2!}" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.85"/>`,
    )
    .join("");
}

export function svgDocument(width: number, height: number, body: string, extraDefs = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">` +
    `<defs>${extraDefs}</defs>${body}</svg>`;
}

export function circuitTexture(id: string, width: number, height: number, color: string): string {
  const lines: string[] = [];
  const step = 64;
  for (let x = step; x < width; x += step) {
    const jitter = (x * 37) % 40;
    lines.push(`<path d="M${x},0 L${x},${jitter} L${x + 20},${jitter} L${x + 20},${height}" />`);
  }
  return `<g id="${id}" stroke="${color}" stroke-width="1" fill="none" opacity="0.06">${lines.join("")}</g>`;
}
