import { mkdir, readFile, writeFile } from "node:fs/promises";
import { MetricsSchema } from "./lib/schema.js";
import { buildFontStyleBlock } from "./lib/font-style.js";
import { fetchAvatarDataUri } from "./lib/avatar.js";
import { PANELS, renderProject } from "./lib/panels.js";
import type { Theme } from "./lib/svg.js";

const OUT_DIR = "assets/generated";
const METRICS_PATH = `${OUT_DIR}/metrics.json`;

async function writeSized(path: string, svg: string): Promise<void> {
  await writeFile(path, svg, "utf8");
  const kb = Buffer.byteLength(svg, "utf8") / 1024;
  if (kb > 150) {
    console.warn(`Warning: ${path} is ${kb.toFixed(1)} KB, over the 150 KB budget`);
  }
}

async function main() {
  const raw = await readFile(METRICS_PATH, "utf8").catch(() => {
    throw new Error(`${METRICS_PATH} not found. Run fetch-metrics first (needs METRICS_TOKEN).`);
  });
  const metrics = MetricsSchema.parse(JSON.parse(raw));

  await mkdir(OUT_DIR, { recursive: true });
  const fontStyle = await buildFontStyleBlock();
  const avatarDataUri = await fetchAvatarDataUri(metrics.profile.avatarUrl);
  // SVGs embedded via <img> can't fetch external resources, so the header
  // needs a base64 avatar; metrics.json itself keeps the real URL for the
  // dashboard, which renders in a normal (unrestricted) HTML <img> context.
  const renderMetrics = { ...metrics, profile: { ...metrics.profile, avatarUrl: avatarDataUri } };
  const themes: Theme[] = ["dark", "light"];

  for (const [name, renderer] of PANELS) {
    for (const theme of themes) {
      await writeSized(`${OUT_DIR}/${name}-${theme}.svg`, renderer(renderMetrics, theme, fontStyle));
    }
  }

  for (let i = 0; i < metrics.projects.length; i++) {
    for (const theme of themes) {
      await writeSized(`${OUT_DIR}/project-${i}-${theme}.svg`, renderProject(renderMetrics, i, theme, fontStyle));
    }
  }

  console.log(`Rendered ${PANELS.length * 2 + metrics.projects.length * 2} SVGs into ${OUT_DIR}`);
}

main().catch((error) => {
  console.error("render-svgs failed:", error);
  process.exitCode = 1;
});
