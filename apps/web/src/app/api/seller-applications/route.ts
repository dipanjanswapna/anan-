import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiBase = process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1";

  try {
    const body = await request.json();
    const upstream = await fetch(`${apiBase}/seller-applications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({ message: "Unable to process the application." }));
    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { message: "The application service is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
