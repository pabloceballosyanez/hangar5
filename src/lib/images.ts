import fs from "fs";
import path from "path";

export function getItemImages(slug: string): string[] {
  const dir = path.join(process.cwd(), "public", "img", "items", slug);

  try {
    const files = fs.readdirSync(dir);
    return files
      .filter((f) => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
      .sort()
      .map((f) => `/img/items/${slug}/${f}`);
  } catch {
    return [];
  }
}
