import { NextResponse } from "next/server";
import { insertProduct, listProducts } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(listProducts());
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const image = typeof body?.image === "string" ? body.image.trim() : "";
  const price = Number(body?.price);
  const stock = Number(body?.stock);
  if (!name || !description || !image || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "Enter a name, description, image, valid price, and whole-number stock." }, { status: 400 });
  }
  const product = insertProduct({ name, description, image, price, stock, category: typeof body?.category === "string" ? body.category.trim() : "Snacks", featured: body?.featured === true });
  return NextResponse.json(product, { status: 201 });
}