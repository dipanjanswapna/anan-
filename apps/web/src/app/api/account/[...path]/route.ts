import { NextRequest, NextResponse } from "next/server";

type Context = { params: Promise<{ path: string[] }> };
const apiBase = () => process.env.ANAN_API_URL ?? "http://localhost:4000/api/v1";

async function forward(request: NextRequest, context: Context, method: "GET" | "POST" | "PATCH" | "DELETE") {
  const { path } = await context.params;
  const key = path.join("/");
  const routes: Record<string, string> = {
    me: "/customers/me",
    "me/addresses": "/customers/me/addresses",
  };
  const addressId = path.length === 3 && path[0] === "me" && path[1] === "addresses" ? path[2] : null;
  const addressRoute = addressId && /^[a-zA-Z0-9_-]{1,64}$/.test(addressId) ? `/customers/me/addresses/${addressId}` : null;
  const cartProductId = path.length === 4 && path[0] === "me" && path[1] === "cart" && path[2] === "items" ? path[3] : null;
  const cartItemRoute = cartProductId && /^[a-zA-Z0-9_-]{1,64}$/.test(cartProductId) ? `/customers/me/cart/items/${cartProductId}` : null;
  const wishlistProductId = path.length === 3 && path[0] === "me" && path[1] === "wishlist" ? path[2] : null;
  const wishlistItemRoute = wishlistProductId && /^[a-zA-Z0-9_-]{1,64}$/.test(wishlistProductId) ? `/customers/me/wishlist/${wishlistProductId}` : null;
  const commerceCollectionRoutes: Record<string, string> = {
    "me/cart": "/customers/me/cart",
    "me/wishlist": "/customers/me/wishlist",
  };
  const allowed =
    (key === "me" && ["GET", "PATCH"].includes(method)) ||
    (key === "me/addresses" && ["GET", "POST"].includes(method)) ||
    (addressRoute !== null && ["PATCH", "DELETE"].includes(method)) ||
    (key === "me/cart" && method === "GET") ||
    (cartItemRoute !== null && ["POST", "PATCH", "DELETE"].includes(method)) ||
    (key === "me/wishlist" && method === "GET") ||
    (wishlistItemRoute !== null && ["POST", "DELETE"].includes(method));
  const upstreamPath = routes[key] ?? addressRoute ?? commerceCollectionRoutes[key] ?? cartItemRoute ?? wishlistItemRoute;
  if (!allowed || !upstreamPath) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const token = request.cookies.get("anan_session")?.value;
  if (!token) return NextResponse.json({ message: "Please sign in to continue." }, { status: 401 });
  try {
    const hasBody = method === "PATCH" || (method === "POST" && (key === "me/addresses" || cartItemRoute !== null));
    const body = hasBody ? await request.json() : undefined;
    const upstream = await fetch(`${apiBase()}${upstreamPath}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({}));
    const response = NextResponse.json(payload, { status: upstream.status });
    if (upstream.status === 401) response.cookies.delete("anan_session");
    return response;
  } catch {
    return NextResponse.json({ message: "The account service is temporarily unavailable." }, { status: 503 });
  }
}

export const GET = (request: NextRequest, context: Context) => forward(request, context, "GET");
export const POST = (request: NextRequest, context: Context) => forward(request, context, "POST");
export const PATCH = (request: NextRequest, context: Context) => forward(request, context, "PATCH");
export const DELETE = (request: NextRequest, context: Context) => forward(request, context, "DELETE");
