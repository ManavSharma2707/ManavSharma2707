import { palette, type Theme } from "../lib/svg.js";

interface Node {
  x: number;
  y: number;
  gold?: boolean;
}

/** A small decorative node cluster for empty corners: cyan nodes, one gold node, thin connecting lines. */
export function networkCluster(originX: number, originY: number, scale: number, theme: Theme, id: string): string {
  const p = palette(theme);
  const nodes: Node[] = [
    { x: 0, y: 0, gold: true },
    { x: 28, y: -14 },
    { x: 34, y: 16 },
    { x: -22, y: 22 },
    { x: 12, y: 38 },
  ];
  const edges: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [0, 3],
    [2, 4],
  ];

  const abs = nodes.map((n) => ({ x: originX + n.x * scale, y: originY + n.y * scale, gold: n.gold }));

  const lines = edges
    .map(([a, b]) => `<line x1="${abs[a]!.x}" y1="${abs[a]!.y}" x2="${abs[b]!.x}" y2="${abs[b]!.y}" stroke="${p.cyan}" stroke-width="0.75" opacity="0.4"/>`)
    .join("");

  const points = abs
    .map((n) => `<circle cx="${n.x}" cy="${n.y}" r="${n.gold ? 3.5 : 2.5}" fill="${n.gold ? p.gold : p.cyan}" opacity="${n.gold ? 0.9 : 0.7}"/>`)
    .join("");

  return `<g id="${id}">${lines}${points}</g>`;
}
