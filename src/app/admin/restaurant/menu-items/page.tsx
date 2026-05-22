import { apiUrl } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Variant = {
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
};

type Category = {
  id: string;
  name: string;
  kind: string;
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  imageUrl: string | null;
  isActive: boolean;
  prepStation: string;
  sortOrder: number;
  sku: string | null;
  categoryId: string;
  category: Category;
  variants: Variant[];
};

async function fetchMenuItems(categoryId?: string): Promise<MenuItem[]> {
  try {
    const params = new URLSearchParams();
    if (categoryId) params.set("categoryId", categoryId);
    const qs = params.toString();
    const res = await fetch(
      apiUrl(`/api/admin/restaurant/menu-items${qs ? `?${qs}` : ""}`),
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("Error fetching menu items:", err);
    return [];
  }
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(apiUrl("/api/admin/restaurant/categories"), {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
}

function formatPrice(price: number): string {
  return price.toLocaleString("es-MX", {
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
  const categoryFilter = typeof resolvedParams.categoryId === "string" ? resolvedParams.categoryId : undefined;

  const [items, categories] = await Promise.all([
    fetchMenuItems(categoryFilter),
    fetchCategories(),
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

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Filtrar por categoría:</label>
        <select
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          defaultValue={categoryFilter || ""}
          onChange={(e) => {
            const val = e.target.value;
            const url = val
              ? `/admin/restaurant/menu-items?categoryId=${encodeURIComponent(val)}`
              : "/admin/restaurant/menu-items";
            window.location.href = url;
          }}
        >
          <option value="">Todas</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
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
                          <p className="font-medium text-gray-900">{item.name}</p>
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
