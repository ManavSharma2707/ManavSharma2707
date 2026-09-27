import type { Metrics } from "./schema.js";
import { palette, svgDocument, escapeXml, type Theme } from "./svg.js";
import { formatCount, formatDelta, formatPercent } from "./format.js";
import { outerFrame, panelChrome } from "../templates/frame.js";
import { emblem, leaderLine } from "../templates/emblem.js";
import { networkCluster } from "../templates/network.js";
import { statTile } from "../templates/stat-tile.js";
import { areaChart } from "../templates/area-chart.js";
import { heatmap } from "../templates/heatmap.js";
import { languageDonut } from "../templates/donut.js";
import { streakRing } from "../templates/ring.js";
import { weeklyRhythm as rhythmGrid } from "../templates/rhythm.js";
import { projectCard } from "../templates/project-card.js";

export const WIDTH = 830;

function monthLabel(iso: string): string {
  const [y, m] = iso.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

function scanLine(width: number, height: number, id: string, color: string): string {
  return `
    <style>
      #${id}{animation:${id}-sweep 2s ease-out 0.3s 1;}
      @keyframes ${id}-sweep{from{transform:translateX(-40px);opacity:0;}20%{opacity:0.9;}to{transform:translateX(${width + 40}px);opacity:0;}}
      @media (prefers-reduced-motion: reduce){#${id}{display:none;}}
    </style>
    <rect id="${id}" x="0" y="0" width="6" height="${height}" fill="${color}" opacity="0.5"/>
  `;
}

export function renderHeader(metrics: Metrics, theme: Theme, fontStyle: string): string {
  const p = palette(theme);
  const height = 200;
  const cx = WIDTH - 150;
  const cy = height / 2;

  const body = `
    ${fontStyle}
    <rect width="${WIDTH}" height="${height}" fill="${p.bgBase}"/>
    ${outerFrame(WIDTH, height, theme)}
    ${networkCluster(90, height - 28, 0.6, theme, "hdr-net-a")}
    ${networkCluster(430, height - 28, 0.6, theme, "hdr-net-b")}
    <clipPath id="avatar-clip"><circle cx="70" cy="${cy}" r="34"/></clipPath>
    <circle cx="70" cy="${cy}" r="37" fill="none" stroke="${p.gold}" stroke-width="2"/>
    <image href="${metrics.profile.avatarUrl}" x="36" y="${cy - 34}" width="68" height="68" clip-path="url(#avatar-clip)"/>
    <text x="122" y="${cy - 6}" font-family="Rajdhani" font-weight="700" font-size="26" letter-spacing="1" fill="${p.textPrimary}">${escapeXml(metrics.profile.name.toUpperCase())}</text>
    <text x="122" y="${cy + 18}" font-family="Inter" font-size="13" fill="${p.textMuted}">${escapeXml(metrics.profile.title)}</text>
    <text x="122" y="${cy + 38}" font-family="JetBrains Mono" font-size="11" fill="${p.cyan}">@${escapeXml(metrics.profile.login)}</text>
    ${["Repositories", "Pull Requests", "Issues", "Discussions"]
      .map(
        (label, i) =>
          `<text x="${WIDTH - 40}" y="${34 + i * 18}" font-family="Rajdhani" font-size="11" letter-spacing="1" fill="${p.textMuted}" text-anchor="end" style="text-transform:uppercase">${label}</text>`,
      )
      .join("")}
    ${emblem(cx, cy, 46, theme, "hdr-emblem")}
    ${leaderLine(cx - 46, cy, cx - 130, cy - 60, theme, "hdr-leader-a", 0.2)}
    ${leaderLine(cx + 46, cy, cx + 90, cy + 60, theme, "hdr-leader-b", 0.35)}
    ${scanLine(WIDTH, height, "hdr-scan", p.goldLight)}
  `;
  return svgDocument(WIDTH, height, body);
}

export function renderOverview(metrics: Metrics, theme: Theme, fontStyle: string): string {
  const p = palette(theme);
  const height = 130;
  const tiles = [
    { label: "Repositories", value: formatCount(metrics.totals.repositories) },
    { label: "Stars", value: formatCount(metrics.totals.stars), delta: formatDelta(metrics.trends.starsDelta30d) },
    { label: "Followers", value: formatCount(metrics.profile.followers) },
    { label: "Commits / yr", value: formatCount(metrics.totals.commitsThisYear), delta: formatDelta(metrics.trends.commitsDelta30d) },
    { label: "Pull Requests", value: formatCount(metrics.totals.pullRequests), delta: `${formatPercent(metrics.trends.mergedPrRate)} merged` },
    { label: "Issues / Reviews", value: `${metrics.totals.issues} / ${metrics.totals.reviews}` },
  ];
  const gap = 12;
  const tileW = (WIDTH - gap * (tiles.length - 1)) / tiles.length;
  const body = `
    ${fontStyle}
    <rect width="${WIDTH}" height="${height}" fill="${p.bgBase}"/>
    ${tiles.map((t, i) => statTile(i * (tileW + gap), 0, tileW, height, theme, t.label, t.value, t.delta)).join("")}
  `;
  return svgDocument(WIDTH, height, body);
}

export function renderActivityChart(metrics: Metrics, theme: Theme, fontStyle: string): string {
  const p = palette(theme);
  const w = 404;
  const h = 220;
  const points = metrics.monthlyCommits.slice(-12).map((m) => ({ label: monthLabel(m.month), value: m.count }));
  const body = `
    ${fontStyle}
    <rect width="${w}" height="${h}" fill="${p.bgBase}"/>
    ${panelChrome(0, 0, w, h, theme, "Commit Trend")}
    <g transform="translate(0,26)">${areaChart(points, w, h - 26, theme, "activity")}</g>
  `;
  return svgDocument(w, h, body);
}

export function renderLanguages(metrics: Metrics, theme: Theme, fontStyle: string): string {
  const p = palette(theme);
  const w = 404;
  const h = 220;
  const body = `
    ${fontStyle}
    <rect width="${w}" height="${h}" fill="${p.bgBase}"/>
    ${panelChrome(0, 0, w, h, theme, "Languages")}
    <g transform="translate(20,40)">${languageDonut(metrics.languages, w - 40, h - 60, theme, "lang")}</g>
  `;
  return svgDocument(w, h, body);
}

export function renderStreak(metrics: Metrics, theme: Theme, fontStyle: string): string {
  const p = palette(theme);
  const w = 404;
  const h = 180;
  const size = h - 30;
  const body = `
    ${fontStyle}
    <rect width="${w}" height="${h}" fill="${p.bgBase}"/>
    ${panelChrome(0, 0, w, h, theme, "Streak")}
    <g transform="translate(${(w - size) / 2},26)">${streakRing(metrics.streak.current, metrics.streak.longest, size, theme, "streak")}</g>
  `;
  return svgDocument(w, h, body);
}

export function renderWeeklyRhythm(metrics: Metrics, theme: Theme, fontStyle: string): string {
  const p = palette(theme);
  const w = 404;
  const h = 180;
  const body = `
    ${fontStyle}
    <rect width="${w}" height="${h}" fill="${p.bgBase}"/>
    ${panelChrome(0, 0, w, h, theme, "Weekly Rhythm")}
    <g transform="translate(12,32)">${rhythmGrid(metrics.weeklyRhythm, w - 24, h - 44, theme, "rhythm")}</g>
  `;
  return svgDocument(w, h, body);
}

export function renderContributions(metrics: Metrics, theme: Theme, fontStyle: string): string {
  const p = palette(theme);
  const h = 150;
  const body = `
    ${fontStyle}
    <rect width="${WIDTH}" height="${h}" fill="${p.bgBase}"/>
    ${panelChrome(0, 0, WIDTH, h, theme, "Contributions")}
    <g transform="translate(0,26)">${heatmap(metrics.calendar, WIDTH, h - 26, theme, "cal")}</g>
  `;
  return svgDocument(WIDTH, h, body);
}

export function renderProject(metrics: Metrics, index: number, theme: Theme, fontStyle: string): string {
  const project = metrics.projects[index];
  if (!project) throw new Error(`No featured project at index ${index}`);
  const p = palette(theme);
  const w = 404;
  const h = 140;
  const languageColors: Record<string, string> = Object.fromEntries(metrics.languages.map((l) => [l.name, l.color]));
  const body = `
    ${fontStyle}
    <rect width="${w}" height="${h}" fill="${p.bgBase}"/>
    ${projectCard(
      {
        name: project.name,
        description: project.description,
        stars: project.stars,
        forks: project.forks,
        language: project.language,
        languageColor: project.language ? languageColors[project.language] ?? p.cyan : p.cyan,
        topics: project.topics,
      },
      w,
      h,
      theme,
      `proj-${index}`,
    )}
  `;
  return svgDocument(w, h, body);
}

export const PANELS: Array<[string, (m: Metrics, t: Theme, f: string) => string]> = [
  ["header", renderHeader],
  ["overview", renderOverview],
  ["activity-chart", renderActivityChart],
  ["languages", renderLanguages],
  ["streak", renderStreak],
  ["weekly-rhythm", renderWeeklyRhythm],
  ["contributions", renderContributions],
];
