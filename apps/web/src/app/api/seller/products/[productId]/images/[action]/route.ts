import { NextRequest, NextResponse } from "next/server";

type Context = { params: Promise<{ productId: string; action: string }> };
const apiBase = () => process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1";

export async function GET(request: NextRequest, context: Context) {
  const token = request.cookies.get("anan_session")?.value;
  if (!token) return NextResponse.json({ message: "Seller sign-in required." }, { status: 401 });
  const { productId, action } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(productId) || action !== "list") {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  try {
    const upstream = await fetch(`${apiBase()}/sellers/me/products/${productId}/images`, {
      headers: { authorization: `Bearer ${token}` }, cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({}));
    const response = NextResponse.json(payload, { status: upstream.status });
    if (upstream.status === 401) response.cookies.delete("anan_session");
    return response;
  } catch { return NextResponse.json({ message: "Seller service unavailable." }, { status: 503 }); }
}

export async function POST(request: NextRequest, context: Context) {
  const token = request.cookies.get("anan_session")?.value;
  if (!token) return NextResponse.json({ message: "Seller sign-in required." }, { status: 401 });
  const { productId, action } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(productId) || !["upload", "complete"].includes(action)) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  try {
    const body = await request.json();
    const upstream = await fetch(`${apiBase()}/sellers/me/products/${productId}/images/${action}`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({}));
    const response = NextResponse.json(payload, { status: upstream.status });
    if (upstream.status === 401) response.cookies.delete("anan_session");
    return response;
  } catch { return NextResponse.json({ message: "Seller service unavailable." }, { status: 503 }); }
}
