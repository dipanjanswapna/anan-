import { NextRequest, NextResponse } from "next/server";

type Context = { params: Promise<{ path: string[] }> };
const apiBase = () => process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1";

async function forward(request: NextRequest, context: Context, method: "GET" | "POST" | "PATCH") {
  const { path } = await context.params;
  const key = path.join("/");
  const safeId = (value: string) => /^[a-zA-Z0-9_-]{1,64}$/.test(value);
  let upstreamPath: string | null = null;
  let protectedRoute = false;
  if (key === "posts" && method === "GET") upstreamPath = "/social/posts";
  if (path.length === 2 && path[0] === "posts" && safeId(path[1]) && method === "POST") { upstreamPath = "/social/posts/" + path[1] + "/report"; protectedRoute = true; }
  if (path.length === 2 && path[0] === "creators" && safeId(path[1]) && method === "POST") { upstreamPath = "/creators/" + path[1] + "/block"; protectedRoute = true; }
  if (path.length === 2 && path[0] === "creators" && safeId(path[1]) && method === "PATCH") { upstreamPath = "/creators/" + path[1] + "/unblock"; protectedRoute = true; }
  if (key === "me/profile" && ["GET", "POST"].includes(method)) { upstreamPath = "/creators/me/profile"; protectedRoute = true; }
  if (key === "me/posts" && ["GET", "POST"].includes(method)) { upstreamPath = "/creators/me/posts"; protectedRoute = true; }
  if (path.length === 2 && path[0] === "creators" && safeId(path[1]) && method === "GET") upstreamPath = "/creators/" + path[1];
  if (path.length === 3 && path[0] === "me" && path[1] === "posts" && safeId(path[2]) && method === "POST") { upstreamPath = "/creators/me/posts/" + path[2] + "/submit"; protectedRoute = true; }
  if (path.length === 2 && path[0] === "admin" && path[1] === "posts" && method === "GET") { upstreamPath = "/admin/social/posts"; protectedRoute = true; }
  if (path.length === 2 && path[0] === "admin" && path[1] === "reports" && method === "GET") { upstreamPath = "/admin/social/reports"; protectedRoute = true; }
  if (path.length === 3 && path[0] === "admin" && path[1] === "reports" && safeId(path[2]) && method === "PATCH") { upstreamPath = "/admin/social/reports/" + path[2] + "/review"; protectedRoute = true; }
  if (path.length === 3 && path[0] === "admin" && path[1] === "posts" && safeId(path[2]) && method === "PATCH") { upstreamPath = "/admin/social/posts/" + path[2] + "/review"; protectedRoute = true; }
  if (!upstreamPath) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const token = request.cookies.get("anan_session")?.value;
  if (protectedRoute && !token) return NextResponse.json({ message: "Please sign in to continue." }, { status: 401 });
  try {
    const hasBody = (method === "PATCH" && !(path[0] === "creators" && path[1] !== "me")) || (method === "POST" && (key === "me/profile" || key === "me/posts" || (path[0] === "admin" && path[1] === "posts" && path.length === 3) || (path[0] === "posts" && path.length === 2)));
    const body = hasBody ? await request.json() : undefined;
    const url = new URL(apiBase() + upstreamPath);
    if (method === "GET") request.nextUrl.searchParams.forEach((value, name) => url.searchParams.set(name, value));
    const upstream = await fetch(url, {
      method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}), cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({}));
    const response = NextResponse.json(payload, { status: upstream.status });
    if (upstream.status === 401) response.cookies.delete("anan_session");
    return response;
  } catch {
    return NextResponse.json({ message: "Social Studio is temporarily unavailable." }, { status: 503 });
  }
}
export const GET = (request: NextRequest, context: Context) => forward(request, context, "GET");
export const POST = (request: NextRequest, context: Context) => forward(request, context, "POST");
export const PATCH = (request: NextRequest, context: Context) => forward(request, context, "PATCH");
