import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
const extensions: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const maxUploadBytes = 5 * 1024 * 1024;

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !extensions[file.type] || file.size > maxUploadBytes) return NextResponse.json({ error: "Choose a JPG, PNG, or WebP image under 5 MB." }, { status: 400 });
  const folder = path.join(process.cwd(), "public", "uploads");
  await mkdir(folder, { recursive: true });
  const filename = `${randomUUID()}${extensions[file.type]}`;
  await writeFile(path.join(folder, filename), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${filename}` });
}