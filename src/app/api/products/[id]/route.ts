import { NextResponse } from "next/server";
import { deleteProduct, getProduct, updateProduct } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const { id } = await context.params;
  const current = getProduct(id);
  if (!current) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const updates: Record<string, unknown> = {};
  if (typeof body?.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body?.description === "string" && body.description.trim()) updates.description = body.description.trim();
  if (typeof body?.image === "string" && body.image.trim()) updates.image = body.image.trim();
  if (typeof body?.category === "string") updates.category = body.category.trim() || "Snacks";
  if (typeof body?.featured === "boolean") updates.featured = body.featured;
  if (body?.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ error: "Price must be greater than zero." }, { status: 400 });
    updates.price = price;
  }
  if (body?.stock !== undefined) {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) return NextResponse.json({ error: "Stock must be a whole number of zero or more." }, { status: 400 });
    updates.stock = stock;
  }
  return NextResponse.json(updateProduct(id, updates));
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const { id } = await context.params;
  if (!deleteProduct(id)) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}