import { NextRequest, NextResponse } from "next/server";

type Context = { params: Promise<{ path: string[] }> };
const apiBase = () => process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1";

async function forward(request: NextRequest, context: Context, method: "GET" | "POST" | "PATCH") {
  const { path } = await context.params;
  let upstreamPath: string | null = null;
  if (path.length === 1 && path[0] === "dashboard" && method === "GET") upstreamPath = "/sellers/me/dashboard";
  if (path.length === 1 && path[0] === "returns" && method === "GET") upstreamPath = "/sellers/me/returns";
  if (path.length === 2 && path[0] === "returns" && /^[a-zA-Z0-9_-]{1,64}$/.test(path[1]) && method === "PATCH") upstreamPath = `/sellers/me/returns/${path[1]}`;
  if (path.length === 3 && path[0] === "orders" && /^[a-zA-Z0-9_-]{1,64}$/.test(path[1]) && ["accept", "reject"].includes(path[2]) && method === "POST") {
    upstreamPath = `/sellers/me/orders/${path[1]}/${path[2]}`;
  }
  if (!upstreamPath) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const token = request.cookies.get("anan_session")?.value;
  if (!token) return NextResponse.json({ message: "Please sign in as a seller." }, { status: 401 });
  try {
    const upstream = await fetch(`${apiBase()}${upstreamPath}`, { method, headers: { authorization: `Bearer ${token}`, ...(method === "PATCH" ? { "content-type": "application/json" } : {}) }, ...(method === "PATCH" ? { body: JSON.stringify(await request.json()) } : {}), cache: "no-store" });
    const payload = await upstream.json().catch(() => ({}));
    const response = NextResponse.json(payload, { status: upstream.status });
    if (upstream.status === 401) response.cookies.delete("anan_session");
    return response;
  } catch {
    return NextResponse.json({ message: "The seller service is temporarily unavailable." }, { status: 503 });
  }
}
export const GET = (request: NextRequest, context: Context) => forward(request, context, "GET");
export const POST = (request: NextRequest, context: Context) => forward(request, context, "POST");
export const PATCH = (request: NextRequest, context: Context) => forward(request, context, "PATCH");
