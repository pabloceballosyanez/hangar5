import { NextRequest, NextResponse } from "next/server";

// ─── JWT verification for Edge runtime (Web Crypto API) ───────────────────────

// Must match the JWT_SECRET in src/lib/auth.ts
// Falls back to same values: env.JWT_SECRET → env.MP_ACCESS_TOKEN → dev fallback
const JWT_SECRET_RAW = "hangar5-customer-secret-dev";
const JWT_ENCODER = new TextEncoder();

async function verifyJWTEdge(token: string): Promise<Record<string, unknown> | null> {
  try {
    const [headerB64, bodyB64, sigB64] = token.split(".");
    if (!headerB64 || !bodyB64 || !sigB64) return null;

    const data = `${headerB64}.${bodyB64}`;
    const key = await crypto.subtle.importKey(
      "raw",
      JWT_ENCODER.encode(JWT_SECRET_RAW),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decode the signature from base64url
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

async function isAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  // Backward compat: old "true" cookie
  if (token === "true") return true;
  const payload = await verifyJWTEdge(token);
  return payload?.role === "admin";
}

async function isStaffSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const payload = await verifyJWTEdge(token);
  if (!payload) return false;
  return typeof payload.staffId === "string" && typeof payload.role === "string";
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
  const adminToken = req.cookies.get("hangar5_admin_session")?.value;
  if (await isAdminSession(adminToken)) return true;

  const staffToken = req.cookies.get("hangar5_session")?.value;
  if (await isStaffSession(staffToken)) return true;

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
    const token = req.cookies.get("hangar5_admin_session")?.value;
    if (await isAdminSession(token)) {
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
    const token = req.cookies.get("hangar5_admin_session")?.value;
    if (await isAdminSession(token)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
