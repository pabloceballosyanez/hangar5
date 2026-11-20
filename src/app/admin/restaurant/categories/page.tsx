import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { menuItems: true } },
    },
  });

  const kindLabel: Record<string, string> = {
    FOOD: "Comida",
    DRINK: "Bebida",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)]">Categorías</h1>
        <Link
          href="/admin/restaurant/categories/nueva"
          className="px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] transition-colors"
        >
          + Nueva categoría
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-8 text-center">
          <p className="text-[var(--color-adp-tinta-2)] text-lg mb-2">No hay categorías</p>
          <p className="text-[var(--color-adp-tinta-2)] text-sm">
            Crea tu primera categoría para empezar a organizar el menú.
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
                    Tipo
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Items activos
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Orden
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Estado
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-adp-borde)]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[var(--color-adp-papel-3)] transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--color-adp-tinta)]">
                      <div className="flex items-center gap-3">
                        {cat.imageUrl && (
                          <img
                            src={cat.imageUrl}
                            alt=""
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          cat.kind === "FOOD"
                            ? "bg-[var(--color-adp-atencion)] text-white"
                            : "bg-[var(--color-adp-info)] text-white"
                        }`}
                      >
                        {kindLabel[cat.kind] || cat.kind}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-[var(--color-adp-tinta)]">
                      {cat._count.menuItems}
                    </td>
                    <td className="py-3 px-4 text-center text-[var(--color-adp-tinta)]">
                      {cat.sortOrder}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          cat.isActive
                            ? "bg-[var(--color-adp-listo)] text-white"
                            : "bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)]"
                        }`}
                      >
                        {cat.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/restaurant/categories/${cat.id}`}
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
