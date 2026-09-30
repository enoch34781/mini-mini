import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
const validStatuses = new Set(["processing", "shipped", "delivered"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { status?: unknown } | null;
  if (typeof body?.status !== "string" || !validStatuses.has(body.status)) return NextResponse.json({ error: "Choose Processing, Shipped, or Delivered." }, { status: 400 });
  if (!updateOrderStatus(id, body.status as "processing" | "shipped" | "delivered")) return NextResponse.json({ error: "A paid order with that ID was not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}