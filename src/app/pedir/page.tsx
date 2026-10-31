import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * /pedir — entrada al menú de pedidos en línea.
 *
 * Antes esto redirigía siempre a /menu/t1, con la mesa escrita a mano.
 * Eso ataba el portal a que existiera una mesa llamada "t1" con su QR
 * activo: si se desactivaba o se borraba, el portal moría en un 404 y
 * no había forma de pedir.
 *
 * Ahora se busca una mesa activa que tenga código QR. Se prefiere la
 * marcada como "para llevar" si existe, y si no, cualquiera activa.
 * Si no hay ninguna, se muestra un aviso claro en lugar de un error.
 */
export default async function PedirPage() {
  // Preferimos la mesa de "para llevar": el portal en línea no debe
  // sentar al cliente en una mesa física que quizá está ocupada.
  const mesaParaLlevar = await prisma.table.findFirst({
    where: {
      isActive: true,
      qrToken: { not: "" },
      OR: [
        { name: { contains: "llevar" } },
        { location: { contains: "llevar" } },
      ],
    },
    orderBy: { number: "asc" },
  });

  if (mesaParaLlevar?.qrToken) {
    redirect(`/menu/${mesaParaLlevar.qrToken}`);
  }

  // Si no hay mesa de para llevar, cualquier mesa activa con QR sirve.
  const mesaActiva = await prisma.table.findFirst({
    where: { isActive: true, qrToken: { not: "" } },
    orderBy: { number: "asc" },
  });

  if (mesaActiva?.qrToken) {
    redirect(`/menu/${mesaActiva.qrToken}`);
  }

  // Ninguna mesa disponible: mensaje claro en lugar de un 404.
  return (
    <main className="min-h-screen bg-ink text-snow flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl mb-4">Pedidos en línea</h1>
        <p className="text-ash leading-relaxed">
          En este momento no hay servicio de pedidos abierto. Pasa al
          restaurante y con gusto te atendemos.
        </p>
      </div>
    </main>
  );
}
