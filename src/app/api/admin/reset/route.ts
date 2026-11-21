import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/reset
 *
 * Deja la operación en cero para probar el sistema desde limpio:
 *   - borra órdenes, pagos, cuentas y sus bitácoras
 *   - borra clientes y sus libros
 *   - borra reservas
 *   - pone el inventario en 0 en todos los almacenes
 *
 * NO TOCA la configuración: menú, platillos, precios, variantes,
 * modificadores, categorías, tipos, recetas, ingredientes (sus nombres y
 * costos), mesas, ubicaciones, almacenes ni staff.
 *
 * Es irreversible salvo por el respaldo. Se exige una frase exacta en el
 * cuerpo para que no se dispare por accidente ni por un clic de más.
 */

const FRASE = "BORRAR TODO";

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("hangar5_admin_session")?.value;
  if (!token || token === "true") return false;
  return validateAdminSession(token);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (body?.confirmar !== FRASE) {
    return NextResponse.json(
      { error: `Falta la confirmación. Manda {"confirmar":"${FRASE}"}.` },
      { status: 400 },
    );
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const antes = {
        ordenes: await tx.order.count(),
        platillosVendidos: await tx.orderItem.count(),
        pagos: await tx.payment.count(),
        cuentas: await tx.serviceSession.count(),
        clientes: await tx.customer.count(),
        reservas: await tx.booking.count(),
        stock: await tx.stockAlmacen.count(),
        movimientos: await tx.stockMovement.count(),
      };

      // 1. Lo que cuelga de una orden.
      await tx.orderItemModifier.deleteMany();
      await tx.orderStatusEvent.deleteMany();
      await tx.payment.deleteMany();
      await tx.orderItem.deleteMany();
      await tx.order.deleteMany();

      // 2. Libros de cliente y cuentas.
      await tx.customerLedgerEntry.deleteMany();
      await tx.serviceSession.deleteMany();

      // 3. Reservas, y después los clientes (las reservas los referencian).
      await tx.booking.deleteMany();
      await tx.customer.deleteMany();

      // 4. Inventario: se borran los movimientos y se deja el stock en 0
      //    en cada almacén. Los ingredientes, sus costos y sus recetas
      //    se conservan intactos.
      await tx.stockMovement.deleteMany();
      await tx.traspaso.deleteMany().catch(() => undefined);

      /* El stock vive en DOS lugares y hay que vaciar los dos:
           - StockAlmacen.cantidad  → lo que se lee por almacén
           - Ingredient.currentStock → el total del insumo, que es el que
             descuenta la receta y el que pinta el aviso de stock bajo.
         Poner solo el primero dejaba 24 insumos en negativo. */
      await tx.stockAlmacen.updateMany({ data: { cantidad: 0 } });
      await tx.ingredient.updateMany({ data: { currentStock: 0 } });

      const despues = {
        ordenes: await tx.order.count(),
        platillosVendidos: await tx.orderItem.count(),
        pagos: await tx.payment.count(),
        cuentas: await tx.serviceSession.count(),
        clientes: await tx.customer.count(),
        reservas: await tx.booking.count(),
        stockEnCero: await tx.stockAlmacen.count({ where: { cantidad: 0 } }),
        insumosEnCero: await tx.ingredient.count({ where: { currentStock: 0 } }),
        stockTotal: await tx.stockAlmacen.count(),
        insumosTotal: await tx.ingredient.count(),
        /* Desglose por almacén: con dos almacenes independientes hay que
           poder ver que AMBOS quedaron en cero, no solo el total. */
        porAlmacen: await Promise.all(
          (await tx.almacen.findMany({ select: { clave: true, nombre: true } })).map(async (a) => {
            const filas = await tx.stockAlmacen.findMany({
              where: { almacen: { clave: a.clave } },
              select: { cantidad: true },
            });
            return {
              almacen: a.nombre,
              filas: filas.length,
              enCero: filas.filter(f => f.cantidad === 0).length,
              suma: filas.reduce((s, f) => s + f.cantidad, 0),
            };
          }),
        ),
        movimientos: await tx.stockMovement.count(),
      };

      // 5. Lo que quedó vivo, para comprobar que la configuración no sufrió.
      const config = {
        platillos: await tx.menuItem.count(),
        ingredientes: await tx.ingredient.count(),
        recetas: await tx.recipe.count(),
        modificadores: await tx.modifier.count(),
        categorias: await tx.category.count(),
        mesas: await tx.table.count(),
        almacenes: await tx.almacen.count(),
        staff: await tx.staff.count(),
      };

      return { antes, despues, config };
    });

    return NextResponse.json({ ok: true, ...resultado });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al borrar" },
      { status: 500 },
    );
  }
}
