import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, isAdminConfigured, isAdminSession, verifyAdminCredentials } from "@/lib/admin-auth";

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminSession(), configured: isAdminConfigured() });
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) return NextResponse.json({ error: "Configure ADMIN_EMAIL, ADMIN_PASSWORD, and SESSION_SECRET in .env.local first." }, { status: 503 });
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  if (typeof body?.email !== "string" || typeof body.password !== "string" || !verifyAdminCredentials(body.email, body.password)) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }
  const session = createAdminSession();
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(ADMIN_COOKIE, session.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: session.maxAge });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}