import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CACHE_DIR = ".font-cache";
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

export interface FontRequest {
  family: string;
  weight: number;
  text: string;
}

function cacheKey(req: FontRequest): string {
  const safeText = Buffer.from(req.text).toString("base64url").slice(0, 24);
  return `${req.family.replace(/\s+/g, "-")}-${req.weight}-${safeText}.txt`;
}

async function readCache(key: string): Promise<string | null> {
  try {
    return await readFile(path.join(CACHE_DIR, key), "utf8");
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: string): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(path.join(CACHE_DIR, key), value, "utf8");
}

/**
 * Fetches a Google Fonts subset containing only the requested characters,
 * downloads the woff2 binary, and returns it as a base64 string. Cached to
 * disk since the same request during preview builds would otherwise re-fetch
 * from Google every time.
 */
export async function fetchFontBase64(req: FontRequest): Promise<string> {
  const key = cacheKey(req);
  const cached = await readCache(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    family: `${req.family}:wght@${req.weight}`,
    text: req.text,
  });
  const cssResponse = await fetch(`https://fonts.googleapis.com/css2?${params.toString()}`, {
    headers: { "User-Agent": CHROME_UA },
  });
  if (!cssResponse.ok) throw new Error(`Google Fonts CSS request failed: ${cssResponse.status}`);
  const css = await cssResponse.text();
  const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
  if (!match?.[1]) throw new Error(`No font URL found in Google Fonts response for ${req.family}`);

  const fontResponse = await fetch(match[1]);
  if (!fontResponse.ok) throw new Error(`Font binary download failed: ${fontResponse.status}`);
  const buffer = Buffer.from(await fontResponse.arrayBuffer());
  const base64 = buffer.toString("base64");

  await writeCache(key, base64);
  return base64;
}

export function fontFaceBlock(family: string, weight: number, base64: string): string {
  return `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;src:url(data:font/woff2;base64,${base64}) format('woff2');}`;
}

const CHARSET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARSET_LOWER = "abcdefghijklmnopqrstuvwxyz";
const CHARSET_DIGITS = "0123456789";
const CHARSET_PUNCT = " ·.,:%+-/@()&'\"…";

export const FULL_LATIN_CHARSET = CHARSET_UPPER + CHARSET_LOWER + CHARSET_DIGITS + CHARSET_PUNCT;
