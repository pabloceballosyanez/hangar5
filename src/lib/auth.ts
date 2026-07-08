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

const JWT_SECRET = process.env.JWT_SECRET || "hangar5-jwt-secret-prod-CHANGE-ME";
const CUSTOMER_COOKIE = "hangar5_customer_session";

const JWT_EXPIRY_SECONDS = 86400; // 24 hours

function signJWT(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + JWT_EXPIRY_SECONDS };
  const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyJWT(token: string): object | null {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    // Check expiration
    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
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
  return signJWT({ type: "customer", payload: customer });
}

export function getCustomerSession(req: NextRequest): CustomerSession | null {
  try {
    const cookie = req.cookies.get(CUSTOMER_COOKIE)?.value;
    if (!cookie) return null;
    const payload = verifyJWT(cookie);
    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    if (p.type !== "customer") return null;
    const data = p.payload as Record<string, unknown>;
    if (typeof data?.customerId !== "string" || typeof data?.name !== "string" || typeof data?.email !== "string") return null;
    return { customerId: data.customerId, name: data.name, email: data.email };
  } catch {
    return null;
  }
}

export { CUSTOMER_COOKIE };

// ─── Admin auth ─────────────────────────────────────────────────────────────

const ADMIN_COOKIE = "hangar5_admin_session";

export function signAdminSession(): string {
  return signJWT({ type: "admin", role: "admin" });
}

export function validateAdminSession(token: string): boolean {
  const payload = verifyJWT(token);
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return p.type === "admin" && p.role === "admin";
}

export function getAdminSession(req: NextRequest): { role: string } | null {
  try {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return null;
    const payload = verifyJWT(token);
    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    if (p.type !== "admin" || p.role !== "admin") return null;
    return { role: "admin" };
  } catch {
    return null;
  }
}

export { ADMIN_COOKIE };

// ─── Staff auth ─────────────────────────────────────────────────────────────

export const STAFF_COOKIE = "hangar5_session";

export function signStaffSession(staff: StaffSession): string {
  return signJWT({ type: "staff", payload: staff });
}

export function getStaffSession(req: NextRequest): StaffSession | null {
  try {
    const token = req.cookies.get(STAFF_COOKIE)?.value;
    if (!token) return null;
    const payload = verifyJWT(token);
    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    if (p.type !== "staff") return null;
    const data = p.payload as Record<string, unknown>;
    if (
      typeof data?.staffId !== "string" ||
      typeof data?.name !== "string" ||
      typeof data?.role !== "string"
    )
      return null;
    return { staffId: data.staffId, name: data.name, role: data.role as StaffRole };
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
        if (p.type === "staff") {
          const data = p.payload as Record<string, unknown>;
          if (
            typeof data?.staffId === "string" &&
            typeof data?.name === "string" &&
            typeof data?.role === "string"
          ) {
            return { staffId: data.staffId, name: data.name, role: data.role as StaffRole };
          }
        }
      }
    } catch { /* fall through to legacy format */ }
    // Legacy base64 format
    return JSON.parse(Buffer.from(cookie, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

// Verify staff session in route handlers (used by staff API routes)
export function verifyStaffSession(token: string): StaffSession | null {
  const payload = verifyJWT(token);
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (p.type !== "staff") return null;
  const data = p.payload as Record<string, unknown>;
  if (
    typeof data?.staffId !== "string" ||
    typeof data?.name !== "string" ||
    typeof data?.role !== "string"
  )
    return null;
  return { staffId: data.staffId, name: data.name, role: data.role as StaffRole };
}

// ─── Role-based permissions ─────────────────────────────────────────────────

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

// Roles que pueden gestionar el restaurante (menú, órdenes, sesiones)
export const RESTAURANT_ROLES: StaffRole[] = ["SUPER_ADMIN", "GERENTE", "GERENTE_TURNO"];
