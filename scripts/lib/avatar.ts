/**
 * Browsers run an SVG embedded via <img> in a restricted context that blocks
 * external resource fetches (the same reason fonts have to be base64-embedded
 * rather than linked). The avatar has to be embedded the same way, or it
 * silently fails to load on GitHub itself.
 */
export async function fetchAvatarDataUri(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Avatar download failed: ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}
