import { NextRequest } from "next/server";
import crypto from "crypto";

export type StaffRole = "SUPER_ADMIN" | "GERENTE" | "GERENTE_TURNO" | "MESERO" | "COCINERO" | "BAR" | "RECEPCION" | "CAJA";

export interface StaffSession {
  staffId: string;
  name: string;
  role: StaffRole;
}

// ─── Customer auth ──────────────────────────────────────────────────────────

export interface CustomerSession {
  customerId: string;
  name: string;
  email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.MP_ACCESS_TOKEN || "hangar5-customer-secret-dev";
const CUSTOMER_COOKIE = "hangar5_customer_session";

function signJWT(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyJWT(token: string): object | null {
  try {
    const [header, body, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const computed = crypto.pbkdf2Sync(password, salt!, 100000, 64, "sha512").toString("hex");
  return computed === hash;
}

export function signCustomerSession(customer: CustomerSession): string {
  return signJWT(customer as object);
}

export function getCustomerSession(req: NextRequest): CustomerSession | null {
  try {
    const cookie = req.cookies.get(CUSTOMER_COOKIE)?.value;
    if (!cookie) return null;
    const payload = verifyJWT(cookie);
    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    if (typeof p.customerId !== "string" || typeof p.name !== "string" || typeof p.email !== "string") return null;
    return { customerId: p.customerId, name: p.name, email: p.email };
  } catch {
    return null;
  }
}

export { CUSTOMER_COOKIE };

// ─── Admin auth ─────────────────────────────────────────────────────────────

const ADMIN_COOKIE = "hangar5_admin_session";

export function signAdminSession(): string {
  return signJWT({ role: "admin" });
}

export function validateAdminSession(token: string): boolean {
  const payload = verifyJWT(token);
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return p.role === "admin";
}

export function getAdminSession(req: NextRequest): { role: string } | null {
  try {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return null;
    const payload = verifyJWT(token);
    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    if (p.role !== "admin") return null;
    return { role: "admin" };
  } catch {
    return null;
  }
}

export { ADMIN_COOKIE };

// ─── Staff auth ─────────────────────────────────────────────────────────────

export const STAFF_COOKIE = "hangar5_session";

export function signStaffSession(staff: StaffSession): string {
  return signJWT(staff as object);
}

export function getStaffSession(req: NextRequest): StaffSession | null {
  try {
    const token = req.cookies.get(STAFF_COOKIE)?.value;
    if (!token) return null;
    const payload = verifyJWT(token);
    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    if (
      typeof p.staffId !== "string" ||
      typeof p.name !== "string" ||
      typeof p.role !== "string"
    )
      return null;
    return { staffId: p.staffId, name: p.name, role: p.role as StaffRole };
  } catch {
    return null;
  }
}

// Legacy: leer sesión desde cookie (staff) — mantiene compatibilidad con sesiones base64 viejas
export function getSession(req: NextRequest): StaffSession | null {
  try {
    const cookie = req.cookies.get("hangar5_session")?.value;
    if (!cookie) return null;
    // Try JWT first (new format)
    try {
      const payload = verifyJWT(cookie);
      if (payload && typeof payload === "object") {
        const p = payload as Record<string, unknown>;
        if (
          typeof p.staffId === "string" &&
          typeof p.name === "string" &&
          typeof p.role === "string"
        ) {
          return { staffId: p.staffId, name: p.name, role: p.role as StaffRole };
        }
      }
    } catch { /* fall through to legacy format */ }
    // Legacy base64 format
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
