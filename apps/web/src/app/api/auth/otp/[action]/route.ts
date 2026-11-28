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
    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { message: "The verification service is temporarily unavailable." },
      { status: 503 },
    );
  }
}
