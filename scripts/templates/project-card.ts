import { escapeXml, palette, truncate, wrapText, type Theme } from "../lib/svg.js";
import { cornerBrackets } from "../lib/svg.js";

export interface ProjectCardData {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  languageColor: string;
  topics: string[];
}

/** A featured-project card: name, one-line description, language dot, stars and forks. */
export function projectCard(data: ProjectCardData, width: number, height: number, theme: Theme, id: string): string {
  const p = palette(theme);
  const descriptionLines = wrapText(data.description ?? "No description provided.", 56, 2);
  const topicsLine = data.topics.slice(0, 3).map((t) => `#${t}`).join("   ");

  return `
    <style>
      #${id}{opacity:0;animation:${id}-in 0.5s ease-out forwards;}
      @keyframes ${id}-in{to{opacity:1;}}
      @media (prefers-reduced-motion: reduce){#${id}{opacity:1;animation:none;}}
    </style>
    <g id="${id}">
      <rect width="${width}" height="${height}" rx="4" fill="${p.bgPanel}" stroke="${p.line}" stroke-width="1"/>
      <rect width="${width}" height="2" fill="${p.gold}"/>
      ${cornerBrackets(0, 0, width, height, 10, p.gold)}
      <text x="16" y="30" font-family="Rajdhani" font-size="16" font-weight="600" fill="${p.textPrimary}">${escapeXml(truncate(data.name, 30))}</text>
      ${descriptionLines
        .map(
          (line, i) =>
            `<text x="16" y="${50 + i * 16}" font-family="Inter" font-size="12" fill="${p.textMuted}">${escapeXml(line)}</text>`,
        )
        .join("")}
      ${data.language ? `<circle cx="20" cy="${height - 20}" r="4" fill="${data.languageColor}"/><text x="30" y="${height - 16}" font-family="Inter" font-size="11" fill="${p.textMuted}">${escapeXml(data.language)}</text>` : ""}
      <text x="${width - 16}" y="${height - 16}" font-family="JetBrains Mono" font-size="11" fill="${p.goldLight}" text-anchor="end">${data.stars} stars &#183; ${data.forks} forks</text>
      ${topicsLine ? `<text x="16" y="${height - 34}" font-family="JetBrains Mono" font-size="9" fill="${p.cyan}" opacity="0.85">${escapeXml(topicsLine)}</text>` : ""}
    </g>
  `;
}
