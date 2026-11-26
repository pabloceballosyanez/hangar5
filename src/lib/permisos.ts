/**
 * Quién puede hacer qué.
 *
 * ── El problema que resuelve ────────────────────────────────────────
 * Había dos sistemas que no se hablaban: la contraseña maestra del
 * admin y el PIN del personal. Cheny (gerente) necesitaba las dos, y un
 * mesero con PIN podía tocar endpoints de admin porque el proxy
 * aceptaba cualquiera de las dos cookies.
 *
 * Ahora hay un solo login (nombre + PIN) y el ROL decide qué se abre.
 * La contraseña maestra queda solo como llave de emergencia para
 * recuperar el acceso si se olvidan los PIN.
 *
 * ── La regla de oro ─────────────────────────────────────────────────
 * Los permisos NO se escriben en cada pantalla. Se declaran aquí, una
 * vez, y el proxy y la interfaz leen de esta tabla. Si mañana hay que
 * abrirle algo a Nina, se cambia esta línea y no veinte archivos.
 */

export type Rol = "SUPER_ADMIN" | "GERENTE" | "CAJA" | "MESERO" | "COCINERO" | "BAR";

/** Las zonas de la app. Cada quien ve las que su rol abre. */
export type Zona =
  | "operacion" // órdenes, mesas, clientes, cuentas
  | "preparacion" // KDS, barra del Despegue
  | "menu" // menú, categorías, tipos, modificadores
  | "inventario" // insumos, conteo, compras, recetas
  | "reportes" // reportes, gastos, auditoría
  | "configuracion" // ubicaciones, mesas, staff
  | "admin"; // el panel completo

const ZONAS: Record<Rol, Zona[]> = {
  /* Tú. Todo, incluido borrar y crear usuarios. */
  SUPER_ADMIN: ["operacion", "preparacion", "menu", "inventario", "reportes", "configuracion", "admin"],

  /* Cheny. Lleva el restaurante, pero no reparte accesos ni borra. */
  GERENTE: ["operacion", "preparacion", "menu", "inventario", "reportes", "admin"],

  /* Caja: cobra y cuadra. No cambia el menú ni el personal. */
  CAJA: ["operacion", "reportes", "admin"],

  /* Mesero: toma y sirve. Nada de precios ni configuración. */
  MESERO: ["operacion", "preparacion"],

  /* Cocina y barra: preparan, pero también toman pedidos.
     Pablo: "hay momentos donde se quedan solos y deben poder tomar
     pedidos. No deben poder tocar la configuración pero sí la operación.
     No son roles tan estrictos." Por eso llevan "operacion": con eso
     entran al Modo Solo y a la pantalla de Mesero. Sigue cerrado el menú,
     los precios, los reportes y la configuración. */
  COCINERO: ["preparacion", "inventario", "operacion"],
  BAR: ["preparacion", "inventario", "operacion"],
};

/** ¿Este rol entra a esta zona? */
export function puede(rol: string | null | undefined, zona: Zona): boolean {
  if (!rol) return false;
  const zonas = ZONAS[rol as Rol];
  return Array.isArray(zonas) && zonas.includes(zona);
}

/** A dónde se manda a cada rol al entrar. */
const INICIO: Record<Rol, string> = {
  SUPER_ADMIN: "/admin/restaurant",
  GERENTE: "/admin/restaurant",
  CAJA: "/admin/restaurant/orders",
  MESERO: "/waiter",
  /* Cocina y barra caen en el Modo Solo: es la pantalla que sirve para
     todo lo del turno. Desde ahí, un botón los lleva al KDS cuando hay
     más trabajo. Antes caían en el KDS y para cobrar tenían que buscar
     la otra pantalla. */
  COCINERO: "/solo",
  BAR: "/solo",
};

export function inicioDe(rol: string | null | undefined): string {
  if (!rol) return "/login";
  return INICIO[rol as Rol] ?? "/login";
}

/** Todos los roles, para los desplegables del admin. */
export const ROLES: Array<{ valor: Rol; nombre: string; descripcion: string }> = [
  { valor: "SUPER_ADMIN", nombre: "Super admin", descripcion: "Todo, incluidos usuarios y accesos" },
  { valor: "GERENTE", nombre: "Gerente", descripcion: "El restaurante completo, sin repartir accesos" },
  { valor: "CAJA", nombre: "Caja", descripcion: "Cobros, órdenes y reportes" },
  { valor: "MESERO", nombre: "Mesero", descripcion: "Órdenes, mesas y cuentas" },
  { valor: "COCINERO", nombre: "Cocinero", descripcion: "KDS e inventario del día" },
  { valor: "BAR", nombre: "Barra", descripcion: "KDS e inventario del día" },
];

/**
 * Prefijos de ruta por zona. El proxy lo usa para decidir sin listar
 * cada pantalla una por una.
 */
export const RUTAS: Array<{ zona: Zona; prefijos: string[] }> = [
  { zona: "configuracion", prefijos: ["/admin/restaurant/staff", "/admin/restaurant/ubicaciones", "/admin/restaurant/tables"] },
  { zona: "reportes", prefijos: ["/admin/restaurant/reports", "/admin/restaurant/fixed-expenses", "/admin/restaurant/audit"] },
  { zona: "inventario", prefijos: ["/admin/restaurant/ingredients", "/admin/restaurant/inventory", "/admin/restaurant/recipes", "/admin/restaurant/compras", "/admin/restaurant/proveedores"] },
  { zona: "menu", prefijos: ["/admin/restaurant/menu-items", "/admin/restaurant/categories", "/admin/restaurant/tipos", "/admin/restaurant/modifier-groups"] },
  { zona: "operacion", prefijos: ["/admin/restaurant/orders", "/admin/restaurant/customers", "/admin/restaurant/sessions", "/waiter"] },
  { zona: "preparacion", prefijos: ["/kds", "/cafe"] },
];

/** Dada una ruta, qué zona necesita. `null` = solo estar identificado. */
export function zonaDeRuta(pathname: string): Zona | null {
  // La raíz del admin deja pasar a cualquiera con acceso al panel
  if (pathname === "/admin" || pathname === "/admin/restaurant") return "admin";

  for (const { zona, prefijos } of RUTAS) {
    if (prefijos.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return zona;
    }
  }
  return null;
}
