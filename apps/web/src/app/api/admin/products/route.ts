import { NextRequest, NextResponse } from "next/server";

const apiBase = () => process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1";
const statuses = new Set(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "ARCHIVED"]);

export async function GET(request: NextRequest) {
  const token = request.cookies.get("anan_session")?.value;
  if (!token) return NextResponse.json({ message: "Administrator sign-in required." }, { status: 401 });
  const status = request.nextUrl.searchParams.get("status");
  if (status && !statuses.has(status)) return NextResponse.json({ message: "Invalid product status." }, { status: 400 });
  const search = request.nextUrl.searchParams.get("search");
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const query = params.toString();
  try {
    const upstream = await fetch(`${apiBase()}/admin/products${query ? `?${query}` : ""}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({}));
    const response = NextResponse.json(payload, { status: upstream.status });
    if (upstream.status === 401) response.cookies.delete("anan_session");
    return response;
  } catch {
    return NextResponse.json({ message: "Admin service unavailable." }, { status: 503 });
  }
}
