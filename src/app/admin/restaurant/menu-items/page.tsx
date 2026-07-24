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
        <h1 className="text-2xl font-bold text-gray-900">Menú</h1>
        <Link
          href="/admin/restaurant/menu-items/nuevo"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo item
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-gray-600">Filtrar por categoría:</label>
        <CategoryFilter categories={categories} currentCategoryId={categoryFilter} />
        <span className="text-gray-300">|</span>
        <span className="text-sm font-medium text-gray-600">Estado:</span>
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
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-lg mb-2">No hay items en el menú</p>
          <p className="text-gray-400 text-sm">
            {categoryFilter
              ? "Esta categoría no tiene items todavía."
              : "Agrega tu primer platillo o bebida."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Nombre
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Categoría
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Precio
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Estación
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Variantes
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Activo
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
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
                          <p className="font-medium text-gray-900">
                            {item.name}
                            {item.recipe && (
                              <span className="ml-1.5 text-amber-500 text-xs" title="Tiene receta">📖</span>
                            )}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-400 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">{item.category.name}</span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({item.category.kind === "FOOD" ? "Comida" : "Bebida"})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatPrice(item.basePrice)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.prepStation === "KITCHEN"
                            ? "bg-orange-100 text-orange-700"
                            : item.prepStation === "BAR"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {stationLabel[item.prepStation] || item.prepStation}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600 text-xs">
                      {item.variants.length > 0
                        ? item.variants.map((v) => v.name).join(", ")
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          item.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/restaurant/menu-items/${item.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
