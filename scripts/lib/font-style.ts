import { fetchFontBase64, fontFaceBlock, FULL_LATIN_CHARSET } from "./fonts.js";

/**
 * The set of @font-face declarations embedded into every generated SVG.
 * Fetched once per render run (and cached to disk across runs) since
 * GitHub's image proxy will not load external font files.
 */
export async function buildFontStyleBlock(): Promise<string> {
  const [rajdhani600, rajdhaniUpper700, inter400, mono500] = await Promise.all([
    fetchFontBase64({ family: "Rajdhani", weight: 600, text: FULL_LATIN_CHARSET }),
    fetchFontBase64({ family: "Rajdhani", weight: 700, text: FULL_LATIN_CHARSET }),
    fetchFontBase64({ family: "Inter", weight: 400, text: FULL_LATIN_CHARSET }),
    fetchFontBase64({ family: "JetBrains Mono", weight: 500, text: FULL_LATIN_CHARSET }),
  ]);
  return `<style>${fontFaceBlock("Rajdhani", 600, rajdhani600)}${fontFaceBlock("Rajdhani", 700, rajdhaniUpper700)}${fontFaceBlock("Inter", 400, inter400)}${fontFaceBlock("JetBrains Mono", 500, mono500)}text{font-synthesis:none;}</style>`;
}
