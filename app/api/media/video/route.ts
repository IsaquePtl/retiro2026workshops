import { readFile } from "node:fs/promises";
import path from "node:path";

const candidates = [
  path.join(process.cwd(), "public", "video.mp4"),
  path.join(process.cwd(), "NOVADATA_STR MOTION.mp4"),
];

export async function GET() {
  for (const videoPath of candidates) {
    try {
      const file = await readFile(videoPath);

      return new Response(new Uint8Array(file), {
        headers: {
          "Content-Type": "video/mp4",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // tenta o proximo caminho
    }
  }

  return new Response("Video not found", { status: 404 });
}
