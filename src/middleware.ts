import { NextRequest, NextResponse } from "next/server";

// ─── Simple session checks for Edge middleware ────────────────────────────────
//
// The middleware runs on Edge runtime where Node.js crypto isn't available.
// We do a lightweight structural check here. Full cryptographic JWT validation
// happens at the page/route-handler level (Node.js runtime).

function looksLikeJWT(token: string): boolean {
  const segments = token.split(".");
  return segments.length === 3 && segments.every((s) => s.length > 0);
}

function isAdminCookie(token: string | undefined): boolean {
  if (!token) return false;
  if (token === "true") return true; // legacy
  return looksLikeJWT(token);
}

function isStaffCookie(token: string | undefined): boolean {
  if (!token) return false;
  return looksLikeJWT(token);
}

// ─── Route config ─────────────────────────────────────────────────────────────

const PUBLIC_PATHS = [
  "/admin/login",
  "/api/admin/login",
  "/api/admin/ical/sync",
];

const RESTAURANT_API_PREFIX = "/api/admin/restaurant";

function hasValidSession(req: NextRequest): boolean {
  if (isAdminCookie(req.cookies.get("hangar5_admin_session")?.value)) return true;
  if (isStaffCookie(req.cookies.get("hangar5_session")?.value)) return true;
  return false;
}

/**
 * Online ordering (QR): allow public order creation & single-order fetch.
 * - POST /api/admin/restaurant/orders → create order (checkout)
 * - GET  /api/admin/restaurant/orders/:id → fetch order (payment page)
 *
 * Other operations (list all orders, PUT, DELETE) remain admin/staff only.
 */
function isQrOpenPath(pathname: string, method: string): boolean {
  // POST to create a new order (checkout flow)
  if (method === "POST" && pathname === "/api/admin/restaurant/orders") {
    return true;
  }
  // GET a specific order by ID (payment page)
  if (method === "GET" && /^\/api\/admin\/restaurant\/orders\/[^/]+$/.test(pathname)) {
    return true;
  }
  return false;
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Online ordering: allow specific public order operations
  if (isQrOpenPath(pathname, method)) {
    return NextResponse.next();
  }

  // Admin pages → redirect to login
  if (pathname.startsWith("/admin")) {
    if (isAdminCookie(req.cookies.get("hangar5_admin_session")?.value)) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Restaurant APIs → admin or staff
  if (pathname.startsWith(RESTAURANT_API_PREFIX)) {
    if (hasValidSession(req)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Other admin APIs → admin only
  if (pathname.startsWith("/api/admin")) {
    if (isAdminCookie(req.cookies.get("hangar5_admin_session")?.value)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
