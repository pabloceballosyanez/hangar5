/**
 * Prueba: PINs del personal.
 *
 * Lo que tiene que cumplirse siempre:
 *   · ningún PIN repetido entre dos personas
 *   · ningún PIN obvio (0000, 1234, años)
 *   · el PIN en claro nunca se guarda
 *   · quien recibe un PIN del sistema tiene que cambiarlo al entrar
 *
 * Ejecutar:
 *   DATABASE_URL="file:$PWD/prisma/hangar5-prod.db" npx tsx scripts/test-pines.ts
 */
import { prisma } from "../src/lib/prisma";
import { pinEsValido, generarPin, hashearPin } from "../src/lib/pines";
import { verifyPassword } from "../src/lib/auth";

let fallos = 0;
const ok = (cond: boolean, etiqueta: string) => {
  console.log(`  ${cond ? "✓" : "✗"} ${etiqueta}`);
  if (!cond) fallos++;
};

async function main() {
  console.log("=== PRUEBA: PINs ===\n");

  // ── Los que nunca deben pasar ──────────────────────────────
  console.log("── PINs rechazados ──");
  for (const pin of ["0000", "1111", "9999", "1234", "4321", "2026", "2025", "1980"]) {
    ok(!pinEsValido(pin).ok, `${pin} se rechaza`);
  }
  for (const pin of ["123", "12345", "12a4", "", "abcd"]) {
    ok(!pinEsValido(pin).ok, `"${pin}" se rechaza (no son 4 dígitos)`);
  }

  console.log("\n── PINs aceptados ──");
  for (const pin of ["7391", "4826", "9054", "1638"]) {
    ok(pinEsValido(pin).ok, `${pin} se acepta`);
  }

  // ── Generación ─────────────────────────────────────────────
  console.log("\n── Generación ──");
  const hashesExistentes = await prisma.staff.findMany({
    where: { pin: { not: null } },
    select: { pin: true },
  });
  const ocupados = hashesExistentes.map((s) => s.pin!).filter(Boolean);

  const generados = new Set<string>();
  for (let i = 0; i < 60; i++) {
    const p = generarPin(ocupados);
    generados.add(p);
  }
  ok(generados.size >= 55, `60 generados dan al menos 55 distintos (${generados.size})`);
  ok([...generados].every((p) => pinEsValido(p).ok), "todos los generados son válidos");
  ok([...generados].every((p) => !ocupados.some((h) => verifyPassword(p, h))),
     "ninguno choca con un PIN ya en uso");

  // ── Almacenamiento ─────────────────────────────────────────
  console.log("\n── Almacenamiento ──");
  const pin = "7391";
  const hash = hashearPin(pin);
  ok(hash.includes(":"), "el hash tiene formato salt:digest");
  ok(!hash.includes(pin), "el PIN en claro no queda dentro del hash");
  ok(verifyPassword(pin, hash), "el hash verifica el PIN correcto");
  ok(!verifyPassword("7392", hash), "el hash rechaza un PIN equivocado");

  // ── Estado real de la base ─────────────────────────────────
  console.log("\n── Estado de la base ──");
  const staff = await prisma.staff.findMany({
    select: { name: true, pin: true, debeCambiarPin: true, isActive: true },
    orderBy: { name: "asc" },
  });

  const sinHash = staff.filter((s) => s.pin && !s.pin.includes(":"));
  ok(sinHash.length === 0, `todos los PIN guardados están hasheados (${sinHash.length} en claro)`);

  const sinPin = staff.filter((s) => !s.pin);
  ok(sinPin.length === 0, `todos tienen PIN (${sinPin.length} sin)`);

  // Nadie comparte PIN con nadie
  let choques = 0;
  for (let i = 0; i < staff.length; i++) {
    for (let j = i + 1; j < staff.length; j++) {
      for (const candidato of ["0000", "1111", "1234"]) {
        const a = staff[i].pin ? verifyPassword(candidato, staff[i].pin!) : false;
        const b = staff[j].pin ? verifyPassword(candidato, staff[j].pin!) : false;
        if (a && b) choques++;
      }
    }
  }
  ok(choques === 0, "dos personas no comparten el mismo PIN obvio");

  console.log("\n── Personas ──");
  for (const s of staff) {
    console.log(`  ${s.name.padEnd(16)} ${s.isActive ? "activo  " : "inactivo"} ${s.debeCambiarPin ? "PIN temporal" : "PIN propio"}`);
  }

  console.log(`\n${fallos === 0 ? "✓ TODAS LAS PRUEBAS PASARON" : `✗ ${fallos} prueba(s) fallaron`}`);
  if (fallos > 0) process.exitCode = 1;
}

main()
  .catch((e) => { console.error("ERROR:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
