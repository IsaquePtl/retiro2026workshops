import { readFile } from "node:fs/promises";
import path from "node:path";

const imagePath = path.join(process.cwd(), "public", "str.png");

export async function GET() {
  try {
    const file = await readFile(imagePath);

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Image not found", { status: 404 });
  }
}
