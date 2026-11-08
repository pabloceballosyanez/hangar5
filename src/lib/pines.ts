/**
 * PINs del personal.
 *
 * ── Reglas ──────────────────────────────────────────────────────────
 *  · Cuatro dígitos, nunca 0000, 1111 ni secuencias (1234, 4321).
 *  · Nunca el mismo PIN para dos personas: si dos comparten PIN, el
 *    registro de quién hizo qué deja de servir.
 *  · Se guardan hasheados. El PIN en claro solo existe en el momento en
 *    que se genera y se muestra una vez.
 *
 * ── Por qué se generan y no se eligen ───────────────────────────────
 * Cuando la gente elige su PIN pone su año de nacimiento o 1234. Al
 * generarlo, el sistema garantiza que no se repita y que no sea de los
 * que cualquiera adivina.
 */

import { hashPassword, verifyPassword } from "@/lib/auth";

/** Los que nunca deben usarse: obvios o secuencia. */
const PROHIBIDOS = new Set([
  "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999",
  "1234", "4321", "1212", "2121", "1010", "0101", "1122", "6969", "1990", "2020",
  "2021", "2022", "2023", "2024", "2025", "2026", "1999", "1980", "1970",
]);

export function pinEsValido(pin: string): { ok: boolean; motivo?: string } {
  if (!/^\d{4}$/.test(pin)) return { ok: false, motivo: "Deben ser exactamente 4 dígitos" };
  if (PROHIBIDOS.has(pin)) return { ok: false, motivo: "Ese PIN es demasiado fácil de adivinar" };
  return { ok: true };
}

/**
 * Genera un PIN de 4 dígitos que no esté en uso.
 * `enUso` recibe los hashes existentes y compara uno por uno.
 */
export function generarPin(hashesEnUso: string[]): string {
  for (let intento = 0; intento < 200; intento++) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    if (!pinEsValido(pin).ok) continue;
    if (hashesEnUso.some((h) => verifyPassword(pin, h))) continue;
    return pin;
  }
  // Con 9000 combinaciones y ~10 personas esto no debería pasar nunca
  throw new Error("No se pudo generar un PIN libre");
}

export function hashearPin(pin: string): string {
  return hashPassword(pin);
}
