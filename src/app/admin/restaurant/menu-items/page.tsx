import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CategoryFilter from "./CategoryFilter";

export const dynamic = "force-dynamic";

function formatPrice(price: number): string {
  return (price / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

const stationLabel: Record<string, string> = {
  KITCHEN: "Cocina",
  BAR: "Bar",
  COLD_STATION: "Estación fría",
};

export default async function MenuItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const categoryFilter =
    typeof resolvedParams.categoryId === "string" && resolvedParams.categoryId
      ? resolvedParams.categoryId
      : undefined;
  const statusFilter = typeof resolvedParams.status === "string"
    ? resolvedParams.status
    : "active";
  const searchFilter = typeof resolvedParams.search === "string" && resolvedParams.search
    ? resolvedParams.search
    : undefined;

  // Build isActive filter: "active" → true, "inactive" → false, "all" → undefined (no filter)
  const isActiveFilter =
    statusFilter === "active" ? true
    : statusFilter === "inactive" ? false
    : undefined;

  const [items, categories] = await Promise.all([
    prisma.menuItem.findMany({
      where: {
        ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
        ...(searchFilter ? { name: { contains: searchFilter } } : {}),
      },
      include: {
        category: true,
        variants: true,
        recipe: { select: { id: true } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)]">Menú</h1>
        <Link
          href="/admin/restaurant/menu-items/nuevo"
          className="px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] transition-colors"
        >
          + Nuevo item
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-[var(--color-adp-tinta-2)]">Filtrar por categoría:</label>
        <CategoryFilter categories={categories} currentCategoryId={categoryFilter} />
        <span className="text-[var(--color-adp-tinta-2)]">|</span>
        <span className="text-sm font-medium text-[var(--color-adp-tinta-2)]">Estado:</span>
        <div className="flex gap-1">
          {[
            { key: "active", label: "Activos" },
            { key: "inactive", label: "Inactivos" },
            { key: "all", label: "Todos" },
          ].map((f) => (
            <a
              key={f.key}
              href={`/admin/restaurant/menu-items?status=${f.key}${categoryFilter ? `&categoryId=${categoryFilter}` : ""}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                statusFilter === f.key
                  ? "bg-[var(--color-adp-pino)] text-white border-[var(--color-adp-info)]"
                  : "bg-white text-[var(--color-adp-tinta-2)] border-[var(--color-adp-borde-2)] hover:bg-[var(--color-adp-papel-3)]"
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {/* Search */}
      <div>
        <form method="GET" action="/admin/restaurant/menu-items">
          {statusFilter !== 'active' && <input type="hidden" name="status" value={statusFilter} />}
          {categoryFilter && <input type="hidden" name="categoryId" value={categoryFilter} />}
          <input
            type="search"
            name="search"
            placeholder="🔍 Buscar platillo..."
            defaultValue={searchFilter || ''}
            className="w-full max-w-md px-4 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
          />
        </form>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-8 text-center">
          <p className="text-[var(--color-adp-tinta-2)] text-lg mb-2">No hay items en el menú</p>
          <p className="text-[var(--color-adp-tinta-2)] text-sm">
            {categoryFilter
              ? "Esta categoría no tiene items todavía."
              : "Agrega tu primer platillo o bebida."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-adp-borde)] bg-[var(--color-adp-papel-3)]">
                  <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Nombre
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Categoría
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Precio
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Estación
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Variantes
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Activo
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-adp-borde)]">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--color-adp-papel-3)] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-[var(--color-adp-tinta)]">
                            {item.name}
                            {item.recipe && (
                              <span className="ml-1.5 text-[var(--color-adp-atencion)] text-xs" title="Tiene receta">📖</span>
                            )}
                          </p>
                          {item.description && (
                            <p className="text-xs text-[var(--color-adp-tinta-2)] line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {/* Hay platillos sin categoría y la pantalla reventaba
                          con "Cannot read properties of null". Se muestran
                          como "Sin categoría" para poder arreglarlos desde
                          aquí en vez de que la pantalla se caiga. */}
                      {item.category ? (
                        <>
                          <span className="text-[var(--color-adp-tinta-2)]">{item.category.name}</span>
                          <span className="text-xs text-[var(--color-adp-tinta-2)] ml-1">
                            ({item.category.kind === "FOOD" ? "Comida" : "Bebida"})
                          </span>
                        </>
                      ) : (
                        <span className="text-xs bg-[var(--color-adp-urgente)] text-white px-2 py-0.5 rounded">
                          Sin categoría
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[var(--color-adp-tinta)]">
                      {formatPrice(item.basePrice)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.prepStation === "KITCHEN"
                            ? "bg-[var(--color-adp-atencion)] text-white"
                            : item.prepStation === "BAR"
                              ? "bg-[var(--color-adp-info)] text-white"
                              : "bg-[var(--color-adp-info)] text-white"
                        }`}
                      >
                        {stationLabel[item.prepStation] || item.prepStation}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-[var(--color-adp-tinta-2)] text-xs">
                      {item.variants.length > 0
                        ? item.variants.map((v) => v.name).join(", ")
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          item.isActive ? "bg-[var(--color-adp-listo)]" : "bg-[var(--color-adp-borde)]"
                        } text-white`}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/restaurant/menu-items/${item.id}`}
                        className="text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)] text-sm font-medium"
                      >
                        Editar →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
