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

function verifyJWT(token: string): object | null {
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

// Leer sesión desde cookie (staff)
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
