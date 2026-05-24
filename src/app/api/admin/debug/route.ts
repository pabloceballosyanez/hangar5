import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  if (cookieStore.get("hangar5_admin_session")?.value !== "true") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // All payments
  const allPayments = await prisma.payment.findMany({
    orderBy: { paidAt: "desc" },
    include: { order: { select: { id: true, status: true, total: true } } },
    take: 50,
  });

  const completedPayments = await prisma.payment.findMany({
    where: { status: "COMPLETED" },
    orderBy: { paidAt: "desc" },
    take: 50,
  });

  // Month range for May 2026
  const start = new Date(2026, 4, 1); // May 1
  const end = new Date(2026, 5, 1);   // Jun 1

  const monthPayments = await prisma.payment.findMany({
    where: { status: "COMPLETED", paidAt: { gte: start, lt: end } },
    orderBy: { paidAt: "desc" },
    take: 50,
  });

  // All orders
  const allOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return Response.json({
    serverTime: now.toString(),
    allPayments: allPayments.map(p => ({
      id: p.id.slice(-6),
      status: p.status,
      amount: p.amount,
      method: p.method,
      paidAt: p.paidAt?.toISOString(),
      orderId: p.orderId?.slice(-6),
      orderStatus: p.order?.status,
    })),
    completedPayments: completedPayments.map(p => ({
      id: p.id.slice(-6),
      amount: p.amount,
      paidAt: p.paidAt?.toISOString(),
    })),
    monthRange: { start: start.toISOString(), end: end.toISOString() },
    monthPaymentsCount: monthPayments.length,
    monthPaymentsTotal: monthPayments.reduce((s, p) => s + p.amount, 0),
    monthPayments: monthPayments.map(p => ({
      id: p.id.slice(-6),
      amount: p.amount,
      paidAt: p.paidAt?.toISOString(),
    })),
    allOrders: allOrders.map(o => ({
      id: o.id.slice(-6),
      status: o.status,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
    })),
    totalOrders: await prisma.order.count(),
    totalPayments: await prisma.payment.count(),
  });
}
