import { NextRequest } from "next/server";

export type StaffRole = "SUPER_ADMIN" | "GERENTE" | "GERENTE_TURNO" | "MESERO" | "COCINERO" | "BAR" | "RECEPCION" | "CAJA";

export interface StaffSession {
  staffId: string;
  name: string;
  role: StaffRole;
}

// Leer sesión desde cookie
export function getSession(req: NextRequest): StaffSession | null {
  try {
    const cookie = req.cookies.get("hangar5_session")?.value;
    if (!cookie) return null;
    return JSON.parse(Buffer.from(cookie, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

// Verificar si un rol tiene acceso a cierta área
const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  SUPER_ADMIN: ["admin", "restaurant", "waiter", "kds", "recetario", "carta", "staff"],
  GERENTE: ["admin", "restaurant", "waiter", "kds", "recetario", "carta", "staff"],
  GERENTE_TURNO: ["restaurant", "waiter", "kds", "recetario", "carta"],
  MESERO: ["waiter"],
  COCINERO: ["kds"],
  BAR: ["kds"],
  RECEPCION: ["admin"],
  CAJA: ["admin"],
};

export function canAccess(role: StaffRole, area: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(area) ?? false;
}

// Roles que pueden administrar (crear/editar) otros usuarios
export const ADMIN_ROLES: StaffRole[] = ["SUPER_ADMIN"];

// Roles que pueden ver/modificar menú y precios
export const MENU_ROLES: StaffRole[] = ["SUPER_ADMIN", "GERENTE"];

// Roles que pueden ver reportes
export const REPORT_ROLES: StaffRole[] = ["SUPER_ADMIN", "GERENTE", "GERENTE_TURNO", "CAJA"];
