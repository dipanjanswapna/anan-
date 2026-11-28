import { NextRequest, NextResponse } from "next/server";

const allowedActions = new Set(["request", "verify", "logout"]);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ action: string }> },
) {
  const { action } = await context.params;
  if (!allowedActions.has(action)) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const apiBase = process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1";
  try {
    const sessionToken = request.cookies.get("anan_session")?.value;
    const body = action === "logout" ? {} : await request.json();
    const upstream = await fetch(`${apiBase}/auth/${action === "logout" ? "logout" : `otp/${action}`}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({ message: "Unable to process the request." }));
    if (!upstream.ok || action !== "verify" || typeof payload.sessionToken !== "string") {
      const response = NextResponse.json(payload, { status: upstream.status });
      if (action === "logout" && upstream.ok) response.cookies.delete("anan_session");
      return response;
    }
    const { sessionToken: issuedToken, ...safePayload } = payload;
    const response = NextResponse.json(safePayload, { status: upstream.status });
    response.cookies.set("anan_session", issuedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(payload.expiresAt),
    });
    return response;
  } catch {
    return NextResponse.json(
      { message: "The authentication service is temporarily unavailable." },
      { status: 503 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ action: string }> },
) {
  const { action } = await context.params;
  if (action !== "session") return NextResponse.json({ message: "Not found." }, { status: 404 });
  const token = request.cookies.get("anan_session")?.value;
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });
  const apiBase = process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1";
  try {
    const upstream = await fetch(`${apiBase}/auth/session`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({ authenticated: false }));
    const response = NextResponse.json(payload, { status: upstream.status });
    if (!upstream.ok) response.cookies.delete("anan_session");
    return response;
  } catch {
    return NextResponse.json({ message: "The authentication service is temporarily unavailable." }, { status: 503 });
  }
}
