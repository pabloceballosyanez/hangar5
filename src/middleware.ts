import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession, getStaffSession } from "@/lib/auth";

// Rutas públicas (no requieren auth)
const PUBLIC_PATHS = [
  "/admin/login",
  "/api/admin/login",
  "/api/admin/ical/sync",                // sincronización iCal externa
];

// Rutas de restaurante abiertas para clientes QR (sin sesión)
// La validación se hace en el route handler (tableId, qrToken, etc.)
const QR_OPEN_PATHS = [
  "/api/admin/restaurant/orders",       // crear/leer órdenes desde QR
];

// Rutas de restaurante que aceptan staff (meseros, cocina, bar)
const RESTAURANT_API_PREFIX = "/api/admin/restaurant";

function isQrOpenPath(pathname: string): boolean {
  return QR_OPEN_PATHS.some((p) => pathname.startsWith(p));
}

function hasValidSession(req: NextRequest): boolean {
  // Admin session
  const adminToken = req.cookies.get("hangar5_admin_session")?.value;
  if (adminToken === "true" || (adminToken && validateAdminSession(adminToken))) {
    return true;
  }

  // Staff session (meseros, cocineros, bartenders)
  const staffToken = req.cookies.get("hangar5_session")?.value;
  if (staffToken) {
    const session = getStaffSession(req);
    if (session) return true;
  }

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir rutas públicas
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Permitir rutas abiertas para QR (sin sesión)
  if (isQrOpenPath(pathname)) {
    return NextResponse.next();
  }

  // Proteger páginas admin (solo admin — redirigir a login)
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("hangar5_admin_session")?.value;
    if (token === "true" || (token && validateAdminSession(token))) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Proteger APIs del restaurante (admin o staff)
  if (pathname.startsWith(RESTAURANT_API_PREFIX)) {
    if (hasValidSession(req)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Proteger otras APIs admin (solo admin)
  if (pathname.startsWith("/api/admin")) {
    const token = req.cookies.get("hangar5_admin_session")?.value;
    if (token === "true" || (token && validateAdminSession(token))) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
