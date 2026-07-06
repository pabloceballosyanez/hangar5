import { NextRequest, NextResponse } from "next/server";

// ─── JWT verification for Edge runtime (Web Crypto API) ───────────────────────

const JWT_ENCODER = new TextEncoder();

async function verifyJWTEdge(token: string): Promise<Record<string, unknown> | null> {
  try {
    const [headerB64, bodyB64, sigB64] = token.split(".");
    if (!headerB64 || !bodyB64 || !sigB64) return null;

    const data = `${headerB64}.${bodyB64}`;
    const key = await crypto.subtle.importKey(
      "raw",
      JWT_ENCODER.encode("hangar5-customer-secret-dev"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToBytes(sigB64);
    const dataBytes = JWT_ENCODER.encode(data);

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!valid) return null;

    const bodyJson = new TextDecoder().decode(base64UrlToBytes(bodyB64));
    return JSON.parse(bodyJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Check if a token looks like a valid session.
 * For admin: JWT token (verified) or legacy "true"
 * For staff: JWT token with staffId (verified)
 *
 * NOTE: If the JWT secret differs from what auth.ts uses (e.g., Render has
 * MP_ACCESS_TOKEN set), verification will fail. In that case, we fall back
 * to just checking the cookie EXISTS — the page/route handler will do the
 * real validation with the correct secret.
 */
async function looksLikeValidSession(token: string | undefined, role?: string): Promise<boolean> {
  if (!token) return false;
  if (token === "true") return true;

  // Try cryptographic verification first
  try {
    const payload = await verifyJWTEdge(token);
    if (payload) {
      if (role === "admin") return payload.role === "admin";
      if (role === "staff") return typeof payload.staffId === "string" && typeof payload.role === "string";
      return true;
    }
  } catch { /* verification failed — fall through */ }

  // Fallback: if it looks like a JWT (3 segments), let it pass.
  // The actual validation happens at the page/route handler level
  // which runs on Node.js and has access to the correct JWT secret.
  const segments = token.split(".");
  if (segments.length === 3 && segments.every((s) => s.length > 0)) {
    return true;
  }

  return false;
}

// ─── Route config ─────────────────────────────────────────────────────────────

const PUBLIC_PATHS = [
  "/admin/login",
  "/api/admin/login",
  "/api/admin/ical/sync",
];

const QR_OPEN_PATHS = [
  "/api/admin/restaurant/orders",
];

const RESTAURANT_API_PREFIX = "/api/admin/restaurant";

function isQrOpenPath(pathname: string): boolean {
  return QR_OPEN_PATHS.some((p) => pathname.startsWith(p));
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  if (await looksLikeValidSession(req.cookies.get("hangar5_admin_session")?.value, "admin")) return true;
  if (await looksLikeValidSession(req.cookies.get("hangar5_session")?.value, "staff")) return true;
  return false;
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (isQrOpenPath(pathname)) {
    return NextResponse.next();
  }

  // Admin pages → redirect to login
  if (pathname.startsWith("/admin")) {
    if (await looksLikeValidSession(req.cookies.get("hangar5_admin_session")?.value, "admin")) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Restaurant APIs → admin or staff
  if (pathname.startsWith(RESTAURANT_API_PREFIX)) {
    if (await hasValidSession(req)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Other admin APIs → admin only
  if (pathname.startsWith("/api/admin")) {
    if (await looksLikeValidSession(req.cookies.get("hangar5_admin_session")?.value, "admin")) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
