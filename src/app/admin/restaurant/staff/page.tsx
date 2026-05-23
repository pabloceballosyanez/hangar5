import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const staff = await prisma.staff.findMany({
    orderBy: { name: "asc" },
  });

  const roleLabel: Record<string, string> = {
    ADMIN: "Admin",
    WAITER: "Mesero",
    COOK: "Cocinero",
    BARTENDER: "Bartender",
    MANAGER: "Gerente",
  };

  const roleColor: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    WAITER: "bg-blue-100 text-blue-700",
    COOK: "bg-orange-100 text-orange-700",
    BARTENDER: "bg-emerald-100 text-emerald-700",
    MANAGER: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
      </div>

      {staff.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-lg">No hay personal registrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((person) => (
            <div
              key={person.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b88364] to-[#1b4235] flex items-center justify-center text-white font-bold text-lg">
                  {person.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{person.name}</p>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${roleColor[person.role] || "bg-gray-100"}`}>
                    {roleLabel[person.role] || person.role}
                  </span>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
