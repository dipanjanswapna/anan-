import { NextRequest, NextResponse } from "next/server";

const apiBase = () => process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1";
const statuses = new Set(["PENDING_SELLER_ACCEPTANCE", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]);

export async function GET(request: NextRequest) {
  const token = request.cookies.get("anan_session")?.value;
  if (!token) return NextResponse.json({ message: "Administrator sign-in required." }, { status: 401 });
  const status = request.nextUrl.searchParams.get("status");
  if (status && !statuses.has(status)) return NextResponse.json({ message: "Invalid order status." }, { status: 400 });
  try {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const upstream = await fetch(`${apiBase()}/admin/orders${query}`, {
      headers: { authorization: `Bearer ${token}` }, cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({}));
    const response = NextResponse.json(payload, { status: upstream.status });
    if (upstream.status === 401) response.cookies.delete("anan_session");
    return response;
  } catch {
    return NextResponse.json({ message: "Admin service unavailable." }, { status: 503 });
  }
}
