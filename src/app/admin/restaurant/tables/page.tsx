import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const tables = await prisma.table.findMany({
    where: { isActive: true },
    orderBy: { number: "asc" },
    include: {
      sessions: {
        where: { status: "OPEN" },
        take: 1,
        include: {
          orders: {
            select: { id: true, status: true, total: true },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)]">Mesas</h1>
        <Link
          href="/admin/restaurant/tables/nueva"
          className="px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] transition-colors"
        >
          + Nueva mesa
        </Link>
      </div>

      {tables.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-8 text-center">
          <p className="text-[var(--color-adp-tinta-2)] text-lg mb-2">No hay mesas registradas</p>
          <p className="text-[var(--color-adp-tinta-2)] text-sm">
            Agrega las mesas del restaurante para empezar a tomar órdenes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => {
            const activeSession = table.sessions[0] ?? null;
            const isOccupied = activeSession !== null;
            const orderCount = activeSession?.orders.length ?? 0;
            const sessionMinutes = activeSession
              ? Math.floor(
                  (Date.now() - new Date(activeSession.openedAt).getTime()) / 60000
                )
              : null;

            return (
              <div
                key={table.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-shadow hover:shadow-md ${
                  isOccupied ? "border-[var(--color-adp-atencion)]" : "border-[var(--color-adp-borde)]"
                }`}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-[var(--color-adp-tinta)]">
                        {table.number}
                      </span>
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          isOccupied ? "bg-[var(--color-adp-atencion)]" : "bg-[var(--color-adp-listo)]"
                        } text-white`}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isOccupied
                          ? "bg-[var(--color-adp-atencion)] text-white"
                          : "bg-[var(--color-adp-listo)] text-white"
                      }`}
                    >
                      {isOccupied ? "Ocupada" : "Libre"}
                    </span>
                  </div>

                  {/* Name & location */}
                  <div className="space-y-1 mb-4">
                    {table.name && (
                      <p className="text-sm text-[var(--color-adp-tinta-2)]">{table.name}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-[var(--color-adp-tinta-2)]">
                      {table.location && (
                        <span>{table.location}</span>
                      )}
                      <span>{table.capacity} persona{table.capacity !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Active session info */}
                  {isOccupied && activeSession && (
                    <div className="bg-[var(--color-adp-atencion)] rounded-lg p-3 text-xs space-y-1 text-white">
                      <div className="flex justify-between text-[var(--color-adp-atencion)]">
                        <span>Abierta:</span>
                        <span className="font-medium">
                          {new Date(activeSession.openedAt).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {sessionMinutes !== null && (
                        <div className="flex justify-between text-[var(--color-adp-atencion)]">
                          <span>Tiempo:</span>
                          <span className="font-medium">{sessionMinutes} min</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[var(--color-adp-atencion)]">
                        <span>Órdenes:</span>
                        <span className="font-medium">{orderCount}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/admin/restaurant/orders?table=${encodeURIComponent(table.number)}`}
                      className="flex-1 text-center px-3 py-2 text-xs font-medium bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta)] rounded-lg hover:bg-[var(--color-adp-borde)] transition-colors"
                    >
                      {isOccupied ? "Ver órdenes" : "Nueva orden"}
                    </Link>
                    <Link
                      href={`/admin/restaurant/tables/${table.id}`}
                      className="px-3 py-2 text-xs font-medium text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)] transition-colors"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
