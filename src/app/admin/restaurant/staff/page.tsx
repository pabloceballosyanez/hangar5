import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BotonPin } from "./BotonPin";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const staff = await prisma.staff.findMany({
    orderBy: { name: "asc" },
  });

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "Admin",
    GERENTE: "Gerente",
    GERENTE_TURNO: "Gte Turno",
    MESERO: "Mesero",
    COCINERO: "Cocinero",
    BAR: "Bar",
    RECEPCION: "Recepción",
    CAJA: "Caja",
  };

  const roleColor: Record<string, string> = {
    SUPER_ADMIN: "bg-[var(--color-adp-pino)] text-white",
    GERENTE: "bg-[var(--color-adp-pino)] text-white",
    GERENTE_TURNO: "bg-[var(--color-adp-pino)] text-white",
    MESERO: "bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)]",
    COCINERO: "bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)]",
    BAR: "bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)]",
    RECEPCION: "bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)]",
    CAJA: "bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)]",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)]">Staff</h1>
        <Link
          href="/admin/restaurant/staff/nuevo"
          className="px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] transition-colors"
        >
          + Nuevo staff
        </Link>
      </div>

      {staff.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-8 text-center">
          <p className="text-[var(--color-adp-tinta-2)] text-lg">No hay personal registrado</p>
          <Link
            href="/admin/restaurant/staff/nuevo"
            className="inline-block mt-4 text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)] text-sm font-medium"
          >
            + Agregar primer miembro →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((person) => (
            /* El botón de PIN va fuera del Link: un botón dentro de un
               enlace se dispara al navegar y no deja confirmar nada. */
            <div
              key={person.id}
              className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-5 hover:shadow-md transition-shadow"
            >
              <Link href={`/admin/restaurant/staff/${person.id}`} className="block group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-adp-pino)] to-[var(--color-adp-pino)] flex items-center justify-center text-white font-bold text-lg">
                    {person.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-adp-tinta)] group-hover:text-[var(--color-adp-pino)] transition-colors">
                      {person.name}
                    </p>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${roleColor[person.role] || "bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)]"}`}>
                      {roleLabel[person.role] || person.role}
                    </span>
                  </div>
                  <div className="ml-auto text-[var(--color-adp-tinta-2)] group-hover:text-[var(--color-adp-tinta-2)] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-[var(--color-adp-tinta-2)]">
                  {person.phone && <p>{person.phone}</p>}
                  {person.email && <p>{person.email}</p>}
                  <p>${(person.hourlyRate / 100).toFixed(2)}/hora</p>
                  <p className={person.isActive ? "text-[var(--color-adp-pino)]" : "text-[var(--color-adp-urgente)]"}>
                    {person.isActive ? "Activo" : "Inactivo"}
                  </p>
                  {person.debeCambiarPin && (
                    <p className="text-[11px] text-[var(--color-adp-pino)]">PIN temporal — sin elegir</p>
                  )}
                </div>
              </Link>

              <BotonPin staffId={person.id} nombre={person.name} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
