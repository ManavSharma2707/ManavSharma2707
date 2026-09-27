import { mkdir, readFile, writeFile } from "node:fs/promises";
import { MetricsSchema } from "./lib/schema.js";
import { buildFontStyleBlock } from "./lib/font-style.js";
import { PANELS, renderProject } from "./lib/panels.js";
import type { Theme } from "./lib/svg.js";

const OUT_DIR = "preview";

async function main() {
  const raw = await readFile("scripts/fixtures/sample-metrics.json", "utf8");
  const metrics = MetricsSchema.parse(JSON.parse(raw));

  await mkdir(OUT_DIR, { recursive: true });
  const fontStyle = await buildFontStyleBlock();
  const themes: Theme[] = ["dark", "light"];

  const files: string[] = [];

  for (const [name, renderer] of PANELS) {
    for (const theme of themes) {
      const filename = `${name}-${theme}.svg`;
      await writeFile(`${OUT_DIR}/${filename}`, renderer(metrics, theme, fontStyle), "utf8");
      files.push(filename);
    }
  }

  for (let i = 0; i < metrics.projects.length; i++) {
    for (const theme of themes) {
      const filename = `project-${i}-${theme}.svg`;
      await writeFile(`${OUT_DIR}/${filename}`, renderProject(metrics, i, theme, fontStyle), "utf8");
      files.push(filename);
    }
  }

  const gallery = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>SVG panel preview</title>
<style>
  body { background: #0B0C0E; color: #E6E8EB; font-family: sans-serif; padding: 24px; }
  h2 { color: #C9A54A; margin-top: 40px; }
  .row { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; margin-bottom: 12px; }
  .cell { border: 1px solid #2A2F37; padding: 8px; background: #12151A; }
  .cell span { display: block; font-size: 11px; color: #8B929C; margin-bottom: 6px; }
</style>
</head>
<body>
<h1>Generated panel preview</h1>
${[...new Set(files.map((f) => f.replace(/-(dark|light)\.svg$/, "")))]
  .map(
    (base) => `
      <h2>${base}</h2>
      <div class="row">
        <div class="cell"><span>dark</span><img src="${base}-dark.svg" alt="${base} dark"></div>
        <div class="cell"><span>light</span><img src="${base}-light.svg" alt="${base} light"></div>
      </div>`,
  )
  .join("")}
</body>
</html>`;

  await writeFile(`${OUT_DIR}/index.html`, gallery, "utf8");
  console.log(`Preview written to ${OUT_DIR}/index.html`);
}

main().catch((error) => {
  console.error("preview failed:", error);
  process.exitCode = 1;
});
