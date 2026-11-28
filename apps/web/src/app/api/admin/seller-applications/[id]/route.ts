import { NextRequest, NextResponse } from "next/server";

const apiBase = () => process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get("anan_session")?.value;
  if (!token) return NextResponse.json({ message: "Administrator sign-in required." }, { status: 401 });
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) return NextResponse.json({ message: "Invalid application id." }, { status: 400 });
  try {
    const body = await request.json();
    const upstream = await fetch(`${apiBase()}/admin/seller-applications/${id}/review`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body), cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({}));
    const response = NextResponse.json(payload, { status: upstream.status });
    if (upstream.status === 401) response.cookies.delete("anan_session");
    return response;
  } catch {
    return NextResponse.json({ message: "Admin service unavailable." }, { status: 503 });
  }
}
