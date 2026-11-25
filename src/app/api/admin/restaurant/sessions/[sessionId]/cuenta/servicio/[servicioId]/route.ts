import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permisos";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/restaurant/sessions/[sessionId]/cuenta/servicio/[servicioId]
 *
 * Quita un servicio (vuelo, moto, bici) de una cuenta abierta.
 *
 * Pide autorización de SUPERVISOR igual que cancelar una orden o ajustar
 * inventario: es dinero que sale de una cuenta que el cliente va a pagar,
 * y alguien del piso no debe poder quitarlo por su cuenta.
 *
 * La llave puede ser la contraseña maestra o el PIN de 4 dígitos de alguien
 * con permiso de administración.
 */
const schema = z.object({
  supervisorPin: z.string().min(1),
  motivo: z.string().optional(),
});

async function autorizarSupervisor(clave: string): Promise<{ ok: boolean; nombre?: string }> {
  const maestra = process.env.ADMIN_PASSWORD;
  if (maestra && clave === maestra) return { ok: true, nombre: "llave maestra" };

  if (!/^\d{4}$/.test(clave)) return { ok: false };

  const candidatos = await prisma.staff.findMany({
    where: { isActive: true, pin: { not: null } },
    select: { name: true, role: true, pin: true },
  });

  for (const c of candidatos) {
    if (!puede(c.role, "admin")) continue;
    const coincide =
      c.pin!.includes(":") ? await verifyPassword(clave, c.pin!) : c.pin === clave;
    if (coincide) return { ok: true, nombre: c.name };
  }
  return { ok: false };
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string; servicioId: string }> }
) {
  if (!getAdminSession(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { sessionId, servicioId } = await ctx.params;

  const cuerpo = await req.json().catch(() => null);
  const parseo = schema.safeParse(cuerpo);
  if (!parseo.success) {
    return NextResponse.json(
      { error: "Falta el PIN de supervisor para quitar el servicio" },
      { status: 400 }
    );
  }

  const autorizado = await autorizarSupervisor(parseo.data.supervisorPin);
  if (!autorizado.ok) {
    return NextResponse.json(
      { error: "PIN incorrecto o sin permiso de supervisor" },
      { status: 403 }
    );
  }

  const servicio = await prisma.servicioCuenta.findFirst({
    where: { id: servicioId, serviceSessionId: sessionId },
    select: { id: true, descripcion: true, total: true, cantidad: true },
  });

  if (!servicio) {
    return NextResponse.json(
      { error: "Ese servicio no está en esta cuenta" },
      { status: 404 }
    );
  }

  await prisma.servicioCuenta.delete({ where: { id: servicioId } });

  console.log(
    `[servicios] quitado "${servicio.descripcion}" ×${servicio.cantidad} ` +
      `($${servicio.total / 100}) de la cuenta ${sessionId} · ` +
      `autorizó ${autorizado.nombre} · motivo: ${parseo.data.motivo ?? "—"}`
  );

  return NextResponse.json({
    ok: true,
    quitado: {
      descripcion: servicio.descripcion,
      cantidad: servicio.cantidad,
      total: servicio.total / 100,
    },
    autorizo: autorizado.nombre,
  });
}
