import { NextRequest, NextResponse } from "next/server";

// ─── Edge-compatible JWT helpers ─────────────────────────────────────────────
// Middleware runs on Edge runtime where Node.js crypto isn't available.
// We do structural checks + base64 payload decode here.
// Full cryptographic validation happens at the route-handler level (Node.js).

const ADMIN_COOKIE = "hangar5_admin_session";
const STAFF_COOKIE = "hangar5_session";

function looksLikeJWT(token: string): boolean {
  const segments = token.split(".");
  return segments.length === 3 && segments.every((s) => s.length > 0);
}

/** Decode JWT payload (base64url) in Edge runtime — structural only, no crypto validation */
function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    const parsed = JSON.parse(payload);
    if (parsed && typeof parsed === "object") return parsed;
    return null;
  } catch {
    return null;
  }
}

function isAdminCookie(token: string | undefined): boolean {
  if (!token) return false;
  return looksLikeJWT(token);
}

function isStaffCookie(token: string | undefined): boolean {
  if (!token) return false;
  return looksLikeJWT(token);
}

/**
 * Extract staff role from JWT payload (Edge-safe, no crypto).
 * Returns null if token is invalid, expired, or not a staff token.
 */
function getStaffRole(token: string | undefined): string | null {
  if (!token) return null;
  const payload = decodeJWTPayload(token);
  if (!payload) return null;

  // Check expiration
  if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  // New format: { type: "staff", payload: { staffId, name, role } }
  if (payload.type === "staff") {
    const data = payload.payload as Record<string, unknown> | undefined;
    return (data?.role as string) || null;
  }

  // Legacy format: { staffId, name, role } directly in payload
  if (typeof payload.role === "string") return payload.role;

  return null;
}

// ─── Role permissions (must match auth.ts) ───────────────────────────────────

/** Roles that can manage restaurant (menu, orders, sessions, etc.) */
const RESTAURANT_ROLES = ["SUPER_ADMIN", "GERENTE", "GERENTE_TURNO"];

/** Admin-level roles (can access all /api/admin routes) */
const ADMIN_ROLES = ["SUPER_ADMIN", "GERENTE"];

function staffCanManageRestaurant(role: string | null): boolean {
  if (!role) return false;
  return RESTAURANT_ROLES.includes(role);
}

function staffIsAdmin(role: string | null): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role);
}

// ─── Route config ─────────────────────────────────────────────────────────────

const PUBLIC_PATHS = [
  "/admin/login",
  "/api/admin/login",
  "/api/admin/ical/sync",
];

const RESTAURANT_API_PREFIX = "/api/admin/restaurant";

/**
 * Restaurant management endpoints that require restaurant-level permissions.
 * Staff with MESERO/COCINERO/BAR roles cannot access these.
 */
const RESTAURANT_MANAGEMENT_PATHS = [
  /^\/api\/admin\/restaurant\/menu-items/,
  /^\/api\/admin\/restaurant\/categories/,
  /^\/api\/admin\/restaurant\/modifier-groups/,
  /^\/api\/admin\/restaurant\/staff/,
  /^\/api\/admin\/restaurant\/customers/,
  /^\/api\/admin\/restaurant\/recipes/,
  /^\/api\/admin\/restaurant\/ingredients/,
  /^\/api\/admin\/restaurant\/inventory/,
  /^\/api\/admin\/restaurant\/reports/,
  /^\/api\/admin\/restaurant\/fixed-expenses/,
  /^\/api\/admin\/restaurant\/stock-movements/,
  /^\/api\/admin\/restaurant\/tables/,       // table CRUD
  /^\/api\/admin\/restaurant\/sessions/,      // session CRUD
];

function isRestaurantManagementPath(pathname: string): boolean {
  return RESTAURANT_MANAGEMENT_PATHS.some((r) => r.test(pathname));
}

/**
 * QR ordering: allow public order creation & single-order fetch.
 * These go through the checkout/payment flow.
 */
function isQrOpenPath(pathname: string, method: string): boolean {
  // POST to create a new order (checkout flow)
  if (method === "POST" && pathname === "/api/admin/restaurant/orders") {
    return true;
  }
  // GET a specific order by ID (payment page / tracker)
  if (method === "GET" && /^\/api\/admin\/restaurant\/orders\/[^/]+$/.test(pathname)) {
    return true;
  }
  return false;
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Public paths: always allow
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // QR ordering: allow specific public order operations
  if (isQrOpenPath(pathname, method)) {
    return NextResponse.next();
  }

  // ── Admin pages → redirect to login ────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (isAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value)) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Restaurant APIs ────────────────────────────────────────────────────
  if (pathname.startsWith(RESTAURANT_API_PREFIX)) {
    const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;
    const staffToken = req.cookies.get(STAFF_COOKIE)?.value;

    // Admin session → full access
    if (isAdminCookie(adminToken)) {
      return NextResponse.next();
    }

    // Staff session → role-based access
    if (isStaffCookie(staffToken)) {
      const role = getStaffRole(staffToken);

      // Restaurant management endpoints → only restaurant-level roles
      if (isRestaurantManagementPath(pathname)) {
        if (staffCanManageRestaurant(role)) {
          return NextResponse.next();
        }
        return NextResponse.json(
          { error: "No autorizado — permiso insuficiente" },
          { status: 403 }
        );
      }

      // Order/session operational endpoints → any valid staff role
      if (role) {
        return NextResponse.next();
      }

      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // ── Other admin APIs → admin or admin-level staff only ─────────────────
  if (pathname.startsWith("/api/admin")) {
    if (isAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value)) {
      return NextResponse.next();
    }
    // Staff with admin-level role can also access other admin APIs
    const staffToken = req.cookies.get(STAFF_COOKIE)?.value;
    if (isStaffCookie(staffToken)) {
      const role = getStaffRole(staffToken);
      if (staffIsAdmin(role)) {
        return NextResponse.next();
      }
      return NextResponse.json(
        { error: "No autorizado — permiso insuficiente" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
