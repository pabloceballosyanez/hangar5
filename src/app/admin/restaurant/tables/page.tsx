import { apiUrl } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type OrderBrief = {
  id: string;
  status: string;
  total: number;
};

type TableSession = {
  id: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  orders: OrderBrief[];
};

type Table = {
  id: string;
  number: string;
  name: string | null;
  qrToken: string;
  capacity: number;
  location: string | null;
  isActive: boolean;
  sessions: TableSession[];
};

async function fetchTables(): Promise<Table[]> {
  try {
    const res = await fetch(apiUrl("/api/admin/restaurant/tables"), {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("Error fetching tables:", err);
    return [];
  }
}

export default async function TablesPage() {
  const tables = await fetchTables();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mesas</h1>
        <Link
          href="/admin/restaurant/tables/nueva"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nueva mesa
        </Link>
      </div>

      {tables.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-lg mb-2">No hay mesas registradas</p>
          <p className="text-gray-400 text-sm">
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
                  isOccupied ? "border-amber-400" : "border-gray-200"
                }`}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-900">
                        {table.number}
                      </span>
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          isOccupied ? "bg-amber-500" : "bg-green-500"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isOccupied
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {isOccupied ? "Ocupada" : "Libre"}
                    </span>
                  </div>

                  {/* Name & location */}
                  <div className="space-y-1 mb-4">
                    {table.name && (
                      <p className="text-sm text-gray-600">{table.name}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {table.location && (
                        <span>{table.location}</span>
                      )}
                      <span>{table.capacity} persona{table.capacity !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Active session info */}
                  {isOccupied && activeSession && (
                    <div className="bg-amber-50 rounded-lg p-3 text-xs space-y-1">
                      <div className="flex justify-between text-amber-800">
                        <span>Abierta:</span>
                        <span className="font-medium">
                          {new Date(activeSession.openedAt).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {sessionMinutes !== null && (
                        <div className="flex justify-between text-amber-800">
                          <span>Tiempo:</span>
                          <span className="font-medium">{sessionMinutes} min</span>
                        </div>
                      )}
                      <div className="flex justify-between text-amber-800">
                        <span>Órdenes:</span>
                        <span className="font-medium">{orderCount}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/admin/restaurant/orders?table=${encodeURIComponent(table.number)}`}
                      className="flex-1 text-center px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {isOccupied ? "Ver órdenes" : "Nueva orden"}
                    </Link>
                    <Link
                      href={`/admin/restaurant/tables/${table.id}`}
                      className="px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
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
