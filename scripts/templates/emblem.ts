import { palette, type Theme } from "../lib/svg.js";

function hexagonPoints(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 90);
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return points.join(" ");
}

function segmentedRing(cx: number, cy: number, r: number, segments: number, color: string): string {
  const gap = 6;
  const arcs: string[] = [];
  const step = 360 / segments;
  for (let i = 0; i < segments; i++) {
    const start = (i * step + gap / 2) * (Math.PI / 180);
    const end = ((i + 1) * step - gap / 2) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(start - Math.PI / 2);
    const y1 = cy + r * Math.sin(start - Math.PI / 2);
    const x2 = cx + r * Math.cos(end - Math.PI / 2);
    const y2 = cy + r * Math.sin(end - Math.PI / 2);
    const largeArc = end - start > Math.PI ? 1 : 0;
    arcs.push(`<path d="M${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2}" stroke="${color}" stroke-width="2.5" fill="none"/>`);
  }
  return arcs.join("");
}

/**
 * The original concentric-ring emblem: a segmented rotating cyan outer ring,
 * a solid gold inner ring, and a pulsing hexagonal core. No animation id
 * collisions across multiple embeds, since each caller supplies a unique id.
 */
export function emblem(cx: number, cy: number, radius: number, theme: Theme, id: string, animated = true): string {
  const p = palette(theme);
  const outerR = radius;
  const midR = radius * 0.72;
  const hexR = radius * 0.42;

  const rotateStyle = animated
    ? `<style>
        #${id}-outer{transform-origin:${cx}px ${cy}px;animation:${id}-rotate 20s linear infinite;}
        #${id}-core{transform-origin:${cx}px ${cy}px;animation:${id}-pulse 3s ease-in-out infinite;}
        @keyframes ${id}-rotate{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes ${id}-pulse{0%,100%{opacity:0.75;}50%{opacity:1;}}
        @media (prefers-reduced-motion: reduce){
          #${id}-outer{animation:none;}
          #${id}-core{animation:none;}
        }
      </style>`
    : "";

  return `
    ${rotateStyle}
    <g id="${id}-outer">${segmentedRing(cx, cy, outerR, 18, p.cyan)}</g>
    <circle cx="${cx}" cy="${cy}" r="${midR}" fill="none" stroke="${p.gold}" stroke-width="1.5" opacity="0.9"/>
    <g id="${id}-core">
      <polygon points="${hexagonPoints(cx, cy, hexR)}" fill="${p.bgPanelAlt}" stroke="${p.goldLight}" stroke-width="1.5"/>
      <polygon points="${hexagonPoints(cx, cy, hexR * 0.55)}" fill="${p.cyan}" opacity="0.18"/>
      <circle cx="${cx}" cy="${cy}" r="2.5" fill="${p.goldLight}"/>
    </g>
  `;
}

/** A thin gold leader line from the emblem edge to a panel edge, with a staggered draw-in. */
export function leaderLine(x1: number, y1: number, x2: number, y2: number, theme: Theme, id: string, delay: number): string {
  const p = palette(theme);
  const length = Math.hypot(x2 - x1, y2 - y1);
  return `
    <style>
      #${id}{stroke-dasharray:${length};stroke-dashoffset:${length};animation:${id}-draw 0.6s ease-out ${delay}s forwards;}
      @keyframes ${id}-draw{to{stroke-dashoffset:0;}}
      @media (prefers-reduced-motion: reduce){#${id}{stroke-dashoffset:0;animation:none;}}
    </style>
    <line id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${p.gold}" stroke-width="1" opacity="0.6"/>
  `;
}
