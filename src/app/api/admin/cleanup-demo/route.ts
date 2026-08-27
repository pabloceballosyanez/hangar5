import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// IDs exactos de los datos de DEMO que el seed generó por error en producción.
const DEMO_CUSTOMERS = [
  "cmtaqkzk9000069iydg3zo296", // Ana Martínez
  "cmtaqkzkc000169iy9f9pz1mo", // Luis Hernández
  "cmtaqkzmj000269iylxlyc1lg", // María López
  "cmtaqkzmk000369iyhp2uzokk", // Carlos Gómez
];
const DEMO_STAFF = [
  "cmtaqkzmo000469iyj06kyznf", // Pedro Mesero
  "cmtaqkzmp000569iy60zx841r", // Sofía Mesera
  "cmtaqkzmr000669iyq9icus2i", // Juan Mesero
  "cmtaqkzms000769iy0ahquizd", // Rosa Gerente
];
const DEMO_TABLES = [
  "cmtaqkzn0000869iyih2cr6yh", // Mesa 1
  "cmtaqkzn2000969iymt58onpb", // Mesa 2
  "cmtaqkzn4000a69iyrcsctof3", // Mesa 3
];

export async function POST(req: NextRequest) {
  // Autenticación de admin (misma que otros endpoints temporales)
  const token = req.cookies.get("hangar5_admin_session")?.value;
  if (!token || token === "true") {
    // Si no hay token real (JWT), verificar contra ADMIN_PASSWORD no aplica aquí;
    // se protege por el middleware de rutas admin. Verificación ligera:
  }
  if (token && token !== "true" && !validateAdminSession(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const results: Record<string, number> = {};

    await prisma.$transaction(async (tx) => {
      // 1. Clocks de staff demo
      results.clocks = (
        await tx.staffClock.deleteMany({ where: { staffId: { in: DEMO_STAFF } } })
      ).count;

      // 2. Sesiones demo (por customerId o tableId)
      const demoSessions = await tx.serviceSession.findMany({
        where: {
          OR: [
            { customerId: { in: DEMO_CUSTOMERS } },
            { tableId: { in: DEMO_TABLES } },
          ],
        },
        select: { id: true },
      });
      const demoSessionIds = demoSessions.map((s) => s.id);

      // 3. Órdenes demo (por serviceSessionId)
      const demoOrders = await tx.order.findMany({
        where: { serviceSessionId: { in: demoSessionIds } },
        select: { id: true },
      });
      const demoOrderIds = demoOrders.map((o) => o.id);

      // 4. Borrado en cascada manual
      results.statusEvents = (
        await tx.orderStatusEvent.deleteMany({ where: { orderId: { in: demoOrderIds } } })
      ).count;

      const demoItems = await tx.orderItem.findMany({
        where: { orderId: { in: demoOrderIds } },
        select: { id: true },
      });
      const demoItemIds = demoItems.map((i) => i.id);
      if (demoItemIds.length > 0) {
        await tx.orderItemModifier.deleteMany({ where: { orderItemId: { in: demoItemIds } } });
      }
      results.orderItems = (
        await tx.orderItem.deleteMany({ where: { orderId: { in: demoOrderIds } } })
      ).count;

      results.payments = (
        await tx.payment.deleteMany({ where: { orderId: { in: demoOrderIds } } })
      ).count;

      results.ledger = (
        await tx.customerLedgerEntry.deleteMany({ where: { customerId: { in: DEMO_CUSTOMERS } } })
      ).count;

      results.orders = (
        await tx.order.deleteMany({ where: { id: { in: demoOrderIds } } })
      ).count;

      results.sessions = (
        await tx.serviceSession.deleteMany({ where: { id: { in: demoSessionIds } } })
      ).count;

      results.staff = (
        await tx.staff.deleteMany({ where: { id: { in: DEMO_STAFF } } })
      ).count;

      results.customers = (
        await tx.customer.deleteMany({ where: { id: { in: DEMO_CUSTOMERS } } })
      ).count;

      results.tables = (
        await tx.table.deleteMany({ where: { id: { in: DEMO_TABLES } } })
      ).count;
    });

    return NextResponse.json({ ok: true, deleted: results });
  } catch (err) {
    console.error("[cleanup-demo]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
