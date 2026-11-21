import { Hono } from "hono";
import { mkdir } from "node:fs/promises";

const uploadsRouter = new Hono();
const UPLOADS_DIR = "uploads";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

uploadsRouter.post("/", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!(file instanceof File)) {
    return c.json({ error: { message: "file is required", code: "FILE_REQUIRED" } }, 400);
  }

  const ext = EXT_BY_TYPE[file.type] ?? "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;

  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
    await Bun.write(`${UPLOADS_DIR}/${filename}`, file);
  } catch (err) {
    console.error("Upload failed:", err);
    return c.json({ error: { message: "Failed to save file. Please try again.", code: "UPLOAD_FAILED" } }, 502);
  }

  const origin = new URL(c.req.url).origin;
  return c.json({ data: { url: `${origin}/uploads/${filename}` } });
});

export { uploadsRouter };
