import { NextResponse } from "next/server";
import { getSalesSummary, listOrders } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  return NextResponse.json({ orders: listOrders(), summary: getSalesSummary() });
}