import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const staff = await prisma.staff.findMany({
    orderBy: { name: "asc" },
  });

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "👑 Admin",
    GERENTE: "💼 Gerente",
    GERENTE_TURNO: "🕐 Gte Turno",
    MESERO: "🤵 Mesero",
    COCINERO: "👨‍🍳 Cocinero",
    BAR: "🍸 Bar",
    RECEPCION: "🛎️ Recepción",
    CAJA: "💰 Caja",
  };

  const roleColor: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
    GERENTE: "bg-blue-100 text-blue-700",
    GERENTE_TURNO: "bg-indigo-100 text-indigo-700",
    MESERO: "bg-green-100 text-green-700",
    COCINERO: "bg-orange-100 text-orange-700",
    BAR: "bg-emerald-100 text-emerald-700",
    RECEPCION: "bg-yellow-100 text-yellow-700",
    CAJA: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
        <Link
          href="/admin/restaurant/staff/nuevo"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo staff
        </Link>
      </div>

      {staff.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-lg">No hay personal registrado</p>
          <Link
            href="/admin/restaurant/staff/nuevo"
            className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Agregar primer miembro →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((person) => (
            <Link
              key={person.id}
              href={`/admin/restaurant/staff/${person.id}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b88364] to-[#1b4235] flex items-center justify-center text-white font-bold text-lg">
                  {person.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-[#b88364] transition-colors">
                    {person.name}
                  </p>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${roleColor[person.role] || "bg-gray-100"}`}>
                    {roleLabel[person.role] || person.role}
                  </span>
                </div>
                <div className="ml-auto text-gray-300 group-hover:text-gray-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                {person.phone && <p>📞 {person.phone}</p>}
                {person.email && <p>✉️ {person.email}</p>}
                <p>💰 ${(person.hourlyRate / 100).toFixed(2)}/hora</p>
                <p className={person.isActive ? "text-green-600" : "text-red-400"}>
                  {person.isActive ? "Activo" : "Inactivo"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
