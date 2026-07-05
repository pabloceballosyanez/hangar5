import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth";

// Rutas públicas (no requieren auth)
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/api/admin/login", "/api/admin/ical/sync"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir rutas públicas
  if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Proteger páginas admin (redirigir a login)
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("hangar5_admin_session")?.value;
    // Aceptar tanto JWT nuevo como cookie "true" vieja (transición)
    if (token === "true" || (token && validateAdminSession(token))) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Proteger APIs admin (retornar 401)
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
