import { NextRequest, NextResponse } from "next/server";

const allowedActions = new Set(["request", "verify"]);

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
    const body = await request.json();
    const upstream = await fetch(`${apiBase}/auth/otp/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({ message: "Unable to process the request." }));
    if (!upstream.ok || action !== "verify" || typeof payload.sessionToken !== "string") {
      return NextResponse.json(payload, { status: upstream.status });
    }
    const { sessionToken, ...safePayload } = payload;
    const response = NextResponse.json(safePayload, { status: upstream.status });
    response.cookies.set("anan_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(payload.expiresAt),
    });
    return response;
  } catch {
    return NextResponse.json(
      { message: "The verification service is temporarily unavailable." },
      { status: 503 },
    );
  }
}
