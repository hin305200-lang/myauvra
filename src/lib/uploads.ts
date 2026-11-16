import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export async function storeImage(file: File) {
  if (file.size <= 0) throw new Error("Choose an image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");
  const extension = TYPES[file.type];
  if (!extension) throw new Error("Use a JPG, PNG, or WebP image.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (cloudinaryConfigured()) return uploadCloudinary(bytes, file.type);
  const name = `${randomBytes(16).toString("hex")}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes);
  return `/uploads/${name}`;
}

async function uploadCloudinary(bytes: Buffer, mime: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const secret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1").update(`timestamp=${timestamp}${secret}`).digest("hex");
  const body = new FormData();
  body.append("file", new Blob([new Uint8Array(bytes)], { type: mime }), `jewelry.${mime.split("/")[1]}`);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body,
  });
  const payload = (await response.json()) as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message || "Image upload failed.");
  }
  return payload.secure_url;
}
