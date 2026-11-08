import { NextRequest, NextResponse } from "next/server";
import { puede, zonaDeRuta, inicioDe } from "@/lib/permisos";

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
/* La tabla de roles vive en src/lib/permisos.ts. Aquí se borró a
   propósito: tener los roles definidos en dos lados fue justo lo que
   dejó entrar a un mesero a endpoints de admin. */

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
/* Antes había aquí una lista de regex con los endpoints "de gestión".
   Duplicaba la tabla de permisos y se desincronizó: Cheny no veía la
   pantalla de Staff pero sí podía llamar a su API. Ahora se traduce la
   ruta de API a la de pantalla y se pregunta a la misma tabla.

   Solo se listan las excepciones que no tienen pantalla propia. */
function zonaDeApiRestaurant(pathname: string) {
  return zonaDeRuta(pathname.replace("/api/admin/restaurant", "/admin/restaurant"));
}

/** ¿Este endpoint toca gestión (menú, personal, inventario, dinero)? */
function isRestaurantManagementPath(pathname: string): boolean {
  const zona = zonaDeApiRestaurant(pathname);
  // Operación diaria no es gestión: mesero y caja la necesitan
  return zona !== null && zona !== "operacion" && zona !== "preparacion";
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

  // Lista de personal para la pantalla de acceso.
  //
  // La tablet abre la app instalada y cae en /waiter/login → /login.
  // Ahí tiene que mostrar QUIÉN puede entrar (nombre y rol), y esa
  // lista vive en /api/admin/restaurant/staff, que estaba detrás del
  // middleware: pedirla sin sesión devolvía 401, así que el selector
  // salía vacío y NADIE podía entrar. Un círculo cerrado: para ver
  // la lista hacía falta haber entrado ya.
  //
  // Solo se libera la LECTURA (GET) de la lista. El endpoint en sí
  // devuelve únicamente id, nombre y rol — nunca el PIN ni datos
  // personales. Crear o editar personal (POST) sigue protegido, y
  // el PIN se valida aparte en /api/auth/login.
  if (pathname === "/api/admin/restaurant/staff" && method === "GET") {
    return NextResponse.next();
  }

  // ── Café del Despegue → login del personal ─────────────────────────────
  //
  // El Despegue lo opera el barista, que entra con su PIN como cualquier
  // otro. No usa el login de admin porque esa gente no tiene por qué ver
  // reportes ni menús: solo su barra.
  //
  // Se reescribe la ruta /api/admin/restaurant/* como /api/cafe/* antes
  // de que caiga en el bloque de abajo. Así el barista puede usar las
  // MISMAS operaciones que el mesero (abrir cuenta, agregar platillos,
  // cobrar) sin darle permiso de gestión: no toca menú, ni personal, ni
  // inventario. Es el mismo criterio que ya usa el Modo Solo, pero con
  // el rol del barista en vez del admin.
  if (pathname.startsWith("/cafe") || pathname.startsWith("/api/cafe")) {
    const staffToken = req.cookies.get(STAFF_COOKIE)?.value;
    if (isStaffCookie(staffToken)) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/cafe")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    /* Se guarda el destino para que, al entrar con el PIN, el barista
       vuelva a la barra en vez de caer en /admin. */
    const loginCafe = new URL("/login", req.url);
    loginCafe.searchParams.set("from", pathname);
    return NextResponse.redirect(loginCafe);
  }

  /* Operaciones de piso desde el Despegue.
     El barista necesita abrir cuentas, consultar mesas y cobrar — lo
     mismo que el mesero. Se permite SOLO lectura de mesas y el ciclo de
     sesiones; nada de gestión (menú, personal, inventario). */
  const esOperacionDePiso =
    /^\/api\/admin\/restaurant\/tables(\/[^/]+)?$/.test(pathname) ||
    /^\/api\/admin\/restaurant\/sessions(\/[^/]+)?(\/(cuenta|servicios|alojamiento|vincular))?$/.test(pathname);

  if (esOperacionDePiso && req.headers.get("x-despegue") === "1") {
    const staffToken = req.cookies.get(STAFF_COOKIE)?.value;
    if (isStaffCookie(staffToken)) {
      return NextResponse.next();
    }
  }

  /* ── KDS y Mesero: mismo trato que el Despegue ──────────────────────
     Antes no estaban en el matcher: cualquiera con la URL entraba a ver
     los pedidos sin identificarse. Ahora piden PIN como el resto, y
     respetan ?from= para volver a donde ibas. */
  if (
    pathname.startsWith("/kds") ||
    pathname.startsWith("/waiter") ||
    pathname.startsWith("/solo")
  ) {
    const staffToken = req.cookies.get(STAFF_COOKIE)?.value;
    if (isStaffCookie(staffToken)) {
      return NextResponse.next();
    }
    // /waiter/login ya redirige solo; se deja pasar para no hacer bucle
    if (pathname === "/waiter/login") {
      return NextResponse.next();
    }
    const loginStaff = new URL("/login", req.url);
    loginStaff.searchParams.set("from", pathname);
    return NextResponse.redirect(loginStaff);
  }

  // ── Panel de admin: entra quien tenga sesión y permiso ─────────────────
      /* Antes /admin exigía la contraseña maestra, así que Cheny (gerente)
         tenía que teclear dos cosas para la misma puerta. Ahora entra con
         su PIN como todo el mundo y el ROL decide qué ve. La contraseña
         maestra sigue funcionando solo como llave de emergencia. */
      if (pathname.startsWith("/admin")) {
        if (isAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value)) {
          return NextResponse.next();
        }

        const staffToken = req.cookies.get(STAFF_COOKIE)?.value;
        const rol = isStaffCookie(staffToken) ? getStaffRole(staffToken) : null;

        if (rol && puede(rol, "admin")) {
          const zona = zonaDeRuta(pathname);
          if (!zona || puede(rol, zona)) {
            return NextResponse.next();
          }
          /* Tiene sesión pero no permiso para ESTA pantalla. Se le manda a
             su inicio en vez de un 403 muerto. Si el inicio es la misma
             ruta que pidió, se deja pasar: si no, el proxy redirige a sí
             mismo en bucle y el navegador acaba en el login. */
          const inicio = inicioDe(rol);
          if (inicio === pathname || pathname === "/admin" || pathname === "/admin/restaurant") {
            return NextResponse.next();
          }
          return NextResponse.redirect(new URL(inicio, req.url));
        }

        /* Personal sin acceso al panel (mesero, cocina). No se le manda al
           login a teclear el PIN otra vez: ya sabemos quién es. Se le
           regresa a su pantalla, que es donde tiene que estar. */
        if (rol) {
          return NextResponse.redirect(new URL(inicioDe(rol), req.url));
        }

        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }

  // ── Restaurant APIs ────────────────────────────────────────────────────
      if (pathname.startsWith(RESTAURANT_API_PREFIX)) {
        const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;
        const staffToken = req.cookies.get(STAFF_COOKIE)?.value;

        // Llave de emergencia → acceso completo
        if (isAdminCookie(adminToken)) {
          return NextResponse.next();
        }

        /* Personal con PIN. Antes bastaba con tener sesión válida para
           tocar los endpoints operativos, así que un mesero podía llegar a
           datos de más. Ahora se mira el ROL contra la misma tabla de
           permisos que usan las pantallas. */
        if (isStaffCookie(staffToken)) {
          const rol = getStaffRole(staffToken);
          if (!rol) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
          }

          /* Los endpoints de gestión del restaurante piden la zona de menú
             o configuración según lo que toquen; los de operación, la zona
             de operación. */
          if (isRestaurantManagementPath(pathname)) {
            const zona = zonaDeRuta(pathname.replace("/api/admin/restaurant", "/admin/restaurant"));
            const permitido = zona ? puede(rol, zona) : puede(rol, "menu");
            if (permitido) return NextResponse.next();
            return NextResponse.json(
              { error: "No autorizado — permiso insuficiente" },
              { status: 403 }
            );
          }

          // Operación diaria: cualquier rol con acceso a operación o preparación
          if (puede(rol, "operacion") || puede(rol, "preparacion")) {
            return NextResponse.next();
          }

          return NextResponse.json(
            { error: "No autorizado — permiso insuficiente" },
            { status: 403 }
          );
        }

        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }

      // ── Other admin APIs → admin or admin-level staff only ─────────────────
      if (pathname.startsWith("/api/admin")) {
        if (isAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value)) {
          return NextResponse.next();
        }
        // Staff con acceso al panel también entra a las APIs de admin
        const staffToken = req.cookies.get(STAFF_COOKIE)?.value;
        if (isStaffCookie(staffToken)) {
          const rol = getStaffRole(staffToken);
          if (rol && puede(rol, "admin")) {
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
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/cafe/:path*",
    "/cafe",
    "/api/cafe/:path*",
    "/kds/:path*",
    "/kds",
    "/waiter/:path*",
    "/waiter",
    "/solo/:path*",
    "/solo",
  ],
};
