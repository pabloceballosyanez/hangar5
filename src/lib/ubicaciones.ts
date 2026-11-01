import { prisma } from "@/lib/prisma";

/**
 * Ubicaciones del Hangar 5.
 *
 * Son los puntos de venta del mismo negocio. Hoy dos: el restaurante
 * de siempre y el Café del Despegue.
 *
 * ── La regla que hace que esto no rompa nada ─────────────────────────
 * Un platillo sin fila en MenuItemUbicacion se considera del
 * RESTAURANTE. Así los 63 platillos que ya existen siguen vendiéndose
 * igual, sin tener que marcarlos uno por uno. Solo lo que se venda en
 * el café necesita fila.
 */

export const CLAVE_RESTAURANTE = "restaurante";
export const CLAVE_CAFE = "cafe";

export interface UbicacionBasica {
  id: string;
  clave: string;
  nombre: string;
}

/**
 * Devuelve las ubicaciones activas, creándolas si es la primera vez.
 *
 * Se llama "asegurar" porque no importa cuántas veces corra: si ya
 * existen, solo las lee. Es seguro ejecutarlo al arrancar.
 */
export async function asegurarUbicaciones(): Promise<UbicacionBasica[]> {
  const base = [
    { clave: CLAVE_RESTAURANTE, nombre: "Restaurante", orden: 0 },
    { clave: CLAVE_CAFE, nombre: "Café del Despegue", orden: 1 },
  ];

  for (const u of base) {
    await prisma.ubicacion.upsert({
      where: { clave: u.clave },
      update: { nombre: u.nombre, orden: u.orden, activa: true },
      create: u,
    });
  }

  return prisma.ubicacion.findMany({
    where: { activa: true },
    select: { id: true, clave: true, nombre: true },
    orderBy: { orden: "asc" },
  });
}

/** Todas las ubicaciones activas, sin escribir nada. */
export async function listarUbicaciones(): Promise<UbicacionBasica[]> {
  return prisma.ubicacion.findMany({
    where: { activa: true },
    select: { id: true, clave: true, nombre: true },
    orderBy: { orden: "asc" },
  });
}

export async function ubicacionPorClave(clave: string): Promise<UbicacionBasica | null> {
  return prisma.ubicacion.findUnique({
    where: { clave },
    select: { id: true, clave: true, nombre: true },
  });
}

/**
 * Ids de los platillos que se venden en una ubicación.
 *
 * Para el restaurante devuelve null, que significa "todos salvo los
 * que estén marcados como exclusivos de otra ubicación". Es la forma
 * de no tener que mantener 63 filas para que el restaurante siga
 * funcionando como siempre.
 */
export async function platillosDeUbicacion(
  ubicacionId: string,
  claveUbicacion: string
): Promise<string[] | null> {
  if (claveUbicacion === CLAVE_RESTAURANTE) {
    // Todos los activos, menos los que estén desmarcados para acá.
    const desmarcados = await prisma.menuItemUbicacion.findMany({
      where: { ubicacionId, disponible: false },
      select: { menuItemId: true },
    });
    const excluidos = new Set(desmarcados.map((d) => d.menuItemId));
    const todos = await prisma.menuItem.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    return todos.map((t) => t.id).filter((id) => !excluidos.has(id));
  }

  // Para el café: solo lo marcado explícitamente.
  const marcados = await prisma.menuItemUbicacion.findMany({
    where: { ubicacionId, disponible: true },
    select: { menuItemId: true },
  });
  return marcados.map((m) => m.menuItemId);
}
